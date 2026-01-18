import { supabase } from '../supabase/client';
import { Note, LocalNote } from '../types/note';
import { getLocalNotes, saveLocalNotes, getGuestId, addToSyncQueue } from '../storage/notes';
import { getCurrentUser } from '../supabase/auth';

// Create a new note
export const createNote = async (title: string, content: string, color?: string | null): Promise<LocalNote> => {
  try {
    console.log('Creating note:', { title: title.substring(0, 20), contentLength: content.length });
    const user = await getCurrentUser();
    console.log('Current user:', user ? user.id : 'guest');
    const guestId = user ? null : await getGuestId();
    console.log('Guest ID:', guestId);
    
    // Get max sort_order to add new note at the top
    const existingNotes = await getLocalNotes();
    const maxSortOrder = existingNotes.reduce((max, n) => 
      Math.max(max, n.sort_order ?? 0), 0
    );
    
    const newNote: LocalNote = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user?.id || null,
      guest_id: guestId,
      title,
      content,
      color: color || null,
      sort_order: maxSortOrder + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced_at: user ? null : null, // Will be null for guests
      isDirty: !user, // Only dirty if guest (no sync)
    };

    console.log('New note created:', newNote.id);
    const notes = await getLocalNotes();
    notes.push(newNote);
    console.log('Saving notes array with length:', notes.length);
    await saveLocalNotes(notes);
    console.log('Note saved successfully');

    // If logged in, sync immediately
    if (user) {
      try {
        await syncNoteToSupabase(newNote);
      } catch (error) {
        console.error('Error syncing new note:', error);
        // Mark as dirty if sync fails
        newNote.isDirty = true;
        const updatedNotes = await getLocalNotes();
        const index = updatedNotes.findIndex(n => n.id === newNote.id);
        if (index !== -1) {
          updatedNotes[index] = newNote;
          await saveLocalNotes(updatedNotes);
        }
      }
    }

    return newNote;
  } catch (error: any) {
    console.error('Error in createNote:', error);
    throw new Error(`Failed to create note: ${error?.message || 'Unknown error'}`);
  }
};

// Update a note (normal edit - replace content)
export const updateNote = async (id: string, title?: string, content?: string, color?: string | null): Promise<LocalNote> => {
  const notes = await getLocalNotes();
  const noteIndex = notes.findIndex(n => n.id === id);
  
  if (noteIndex === -1) throw new Error('Note not found');

  const existingNote = notes[noteIndex];
  const user = await getCurrentUser();

  // Normal edit - replace content (append only happens during sync conflicts)
  const updatedNote: LocalNote = {
    ...existingNote,
    title: title !== undefined ? title : existingNote.title,
    content: content !== undefined ? content : existingNote.content,
    color: color !== undefined ? color : existingNote.color,
    updated_at: new Date().toISOString(),
    isDirty: !user || existingNote.isDirty,
  };

  notes[noteIndex] = updatedNote;
  await saveLocalNotes(notes);

  // If logged in, sync
  if (user) {
    try {
      await syncNoteToSupabase(updatedNote);
    } catch (error) {
      console.error('Error syncing updated note:', error);
      updatedNote.isDirty = true;
      notes[noteIndex] = updatedNote;
      await saveLocalNotes(notes);
    }
  } else {
    await addToSyncQueue(id);
  }

  return updatedNote;
};

// Delete a note
export const deleteNote = async (id: string): Promise<void> => {
  const notes = await getLocalNotes();
  const filtered = notes.filter(n => n.id !== id);
  await saveLocalNotes(filtered);

  const user = await getCurrentUser();
  if (user) {
    try {
      await supabase.from('notes').delete().eq('id', id).eq('user_id', user.id);
    } catch (error) {
      console.error('Error deleting note from Supabase:', error);
    }
  }
};

// Sync note to Supabase
export const syncNoteToSupabase = async (note: LocalNote): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) {
    console.log('No user, cannot sync note:', note.id);
    return;
  }

  // Ensure note has user_id set
  const noteToSync = {
    ...note,
    user_id: user.id,
  };

  console.log('Syncing note to Supabase:', noteToSync.id, 'for user:', user.id);

  // Use the sync_note function for conflict resolution
  const { error } = await supabase.rpc('sync_note', {
    note_id: noteToSync.id,
    note_user_id: user.id,
    note_title: noteToSync.title,
    note_content: noteToSync.content,
    note_color: noteToSync.color,
    note_sort_order: noteToSync.sort_order,
    note_updated_at: noteToSync.updated_at,
  });

  if (error) {
    console.log('sync_note RPC failed, using direct upsert:', error.message);
    // Fallback to direct upsert if function doesn't exist
    const { error: upsertError } = await supabase
      .from('notes')
      .upsert({
        id: noteToSync.id,
        user_id: user.id,
        title: noteToSync.title,
        content: noteToSync.content,
        color: noteToSync.color,
        sort_order: noteToSync.sort_order,
        updated_at: noteToSync.updated_at,
        synced_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (upsertError) {
      console.error('Sync error:', upsertError);
      throw upsertError;
    } else {
      console.log('Note synced successfully via upsert:', noteToSync.id);
    }
  } else {
    console.log('Note synced successfully via RPC:', noteToSync.id);
  }
};

// Sync all notes from Supabase (pull)
export const syncFromSupabase = async (): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) {
    console.log('No user, skipping sync');
    return;
  }

  console.log('Starting sync for user:', user.id);
  const localNotes = await getLocalNotes();
  console.log('Local notes before sync:', localNotes.length);

  // First, convert any guest notes to user notes and sync them
  const guestNotes = localNotes.filter(n => !n.user_id && n.guest_id);
  console.log('Found guest notes to convert:', guestNotes.length);
  
  for (const guestNote of guestNotes) {
    // Update the note to have user_id
    guestNote.user_id = user.id;
    guestNote.isDirty = true; // Mark as dirty so it gets synced
    
    console.log('Converting guest note to user note:', guestNote.id);
    
    // Sync this note to Supabase
    try {
      await syncNoteToSupabase(guestNote);
      console.log('Successfully synced converted note:', guestNote.id);
    } catch (error) {
      console.error('Error syncing converted note:', error);
    }
  }

  // Save the updated notes (with user_id added)
  if (guestNotes.length > 0) {
    await saveLocalNotes(localNotes);
  }

  // Now pull notes from Supabase
  const { data: cloudNotes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes from Supabase:', error);
    return;
  }

  console.log('Fetched notes from Supabase:', cloudNotes?.length || 0);

  // Reload local notes after conversion
  const updatedLocalNotes = await getLocalNotes();
  const localMap = new Map(updatedLocalNotes.map(n => [n.id, n]));

  // Merge strategy: last write wins (simple overwrite)
  for (const cloudNote of cloudNotes || []) {
    const localNote = localMap.get(cloudNote.id);
    
    if (!localNote) {
      // New note from cloud
      updatedLocalNotes.push({
        ...cloudNote,
        sort_order: cloudNote.sort_order ?? updatedLocalNotes.length,
        isDirty: false,
      });
      console.log('Added new note from cloud:', cloudNote.id);
    } else {
      // Compare timestamps - last write wins
      const cloudTime = new Date(cloudNote.updated_at).getTime();
      const localTime = new Date(localNote.updated_at).getTime();
      
      if (cloudTime > localTime) {
        // Cloud is newer - overwrite local
        const index = updatedLocalNotes.findIndex(n => n.id === cloudNote.id);
        if (index !== -1) {
          updatedLocalNotes[index] = {
            ...cloudNote,
            sort_order: cloudNote.sort_order ?? localNote.sort_order,
            isDirty: false,
            synced_at: cloudNote.synced_at,
          };
          console.log('Overwritten with cloud version (newer):', cloudNote.id);
        }
      } else if (localTime > cloudTime && localNote.isDirty) {
        // Local is newer and dirty - push to cloud
        console.log('Pushing local note to cloud:', localNote.id);
        await syncNoteToSupabase(localNote);
      } else {
        // Timestamps equal or local is newer but not dirty - just update synced_at
        const index = updatedLocalNotes.findIndex(n => n.id === cloudNote.id);
        if (index !== -1) {
          updatedLocalNotes[index] = {
            ...localNote,
            sort_order: cloudNote.sort_order ?? localNote.sort_order,
            isDirty: false,
            synced_at: cloudNote.synced_at,
          };
        }
      }
    }
  }

  await saveLocalNotes(updatedLocalNotes);
  console.log('Sync completed. Total notes:', updatedLocalNotes.length);
};

// Reorder notes
export const reorderNotes = async (reorderedNotes: LocalNote[]): Promise<void> => {
  // Update sort_order for all notes based on new order
  const notesWithOrder = reorderedNotes.map((note, index) => ({
    ...note,
    sort_order: index,
    updated_at: new Date().toISOString(),
  }));
  
  await saveLocalNotes(notesWithOrder);
  
  // Sync if logged in
  const user = await getCurrentUser();
  if (user) {
    // Sync all reordered notes
    for (const note of notesWithOrder) {
      try {
        await syncNoteToSupabase(note);
      } catch (error) {
        console.error('Error syncing reordered note:', error);
      }
    }
  }
};

// Search notes (advanced search with full-text)
export const searchNotes = async (query: string): Promise<LocalNote[]> => {
  const user = await getCurrentUser();
  const notes = await getLocalNotes();
  
  if (!query.trim()) {
    return notes;
  }

  const lowerQuery = query.toLowerCase();
  
  // Basic search
  let results = notes.filter(note => 
    note.title.toLowerCase().includes(lowerQuery) ||
    note.content.toLowerCase().includes(lowerQuery)
  );

  // If logged in, also search in Supabase using full-text search
  if (user) {
    try {
      const { data: cloudResults, error } = await supabase.rpc('search_notes', {
        search_query: query,
        user_uuid: user.id,
      });

      if (!error && cloudResults) {
        // Merge cloud results with local results
        const cloudIds = new Set(cloudResults.map((r: Note) => r.id));
        const localOnly = results.filter(n => !cloudIds.has(n.id));
        
        // Convert cloud results to LocalNote format
        const cloudNotes: LocalNote[] = cloudResults.map((r: Note) => ({
          ...r,
          isDirty: false,
        }));

        results = [...cloudNotes, ...localOnly];
      }
    } catch (error) {
      console.error('Error with full-text search:', error);
      // Fall back to basic search
    }
  }

  // Sort by relevance (title matches first, then content matches)
  results.sort((a, b) => {
    const aTitleMatch = a.title.toLowerCase().includes(lowerQuery);
    const bTitleMatch = b.title.toLowerCase().includes(lowerQuery);
    if (aTitleMatch && !bTitleMatch) return -1;
    if (!aTitleMatch && bTitleMatch) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return results;
};
