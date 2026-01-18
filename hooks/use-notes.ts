import { useState, useEffect, useCallback, useRef } from 'react';
import { LocalNote } from '@/lib/types/note';
import { getLocalNotes } from '@/lib/storage/notes';
import { createNote, updateNote, deleteNote, syncFromSupabase, searchNotes, reorderNotes } from '@/lib/services/notes';
import { useAuth } from './use-auth';

export function useNotes() {
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isInitialLoad = useRef(true);

  const userIdRef = useRef<string | null>(user?.id || null);
  userIdRef.current = user?.id || null;

  const loadNotes = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // If logged in, sync from Supabase first
      if (userIdRef.current) {
        await syncFromSupabase();
      }
      
      const localNotes = await getLocalNotes();
      console.log('loadNotes: Setting notes to', localNotes.length, 'items');
      // Sort by sort_order, then by updated_at
      const sortedNotes = localNotes.sort((a, b) => {
        const aOrder = a.sort_order ?? 0;
        const bOrder = b.sort_order ?? 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
      setNotes(sortedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load only
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      loadNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when user ID changes (but not on initial mount)
  const prevUserIdRef = useRef<string | null>(user?.id || null);
  useEffect(() => {
    // Only reload if user ID actually changed
    if (!isInitialLoad.current) {
      const currentUserId = user?.id || null;
      const userIdChanged = prevUserIdRef.current !== currentUserId;
      if (userIdChanged) {
        prevUserIdRef.current = currentUserId;
        loadNotes();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user.id, not the whole user object

  const addNote = useCallback(async (title: string, content: string, color?: string | null) => {
    // Optimistic update - add note immediately
      const tempNote: LocalNote = {
      id: `temp_${Date.now()}`,
      user_id: null,
      guest_id: null,
      title: title.trim() || 'Untitled Note',
      content,
      color: color || null,
      sort_order: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced_at: null,
      isDirty: true,
    };
    
    // Add optimistically
    setNotes(prev => {
      console.log('Optimistic update: Adding temp note, current count:', prev.length);
      return [tempNote, ...prev];
    });

    try {
      // Actually create the note
      const newNote = await createNote(title, content, color);
      console.log('Note created, replacing temp note with real note:', newNote.id);
      
      // Replace temp note with real note
      setNotes(prev => {
        const filtered = prev.filter(n => n.id !== tempNote.id);
        return [newNote, ...filtered];
      });
      
      return newNote;
    } catch (error) {
      // Remove temp note on error
      console.error('Error creating note, removing temp note:', error);
      setNotes(prev => prev.filter(n => n.id !== tempNote.id));
      throw error;
    }
  }, []);

  const editNote = useCallback(async (id: string, title?: string, content?: string, color?: string | null) => {
    // Optimistic update
    setNotes(prev => prev.map(n => {
      if (n.id === id) {
        return {
          ...n,
          title: title !== undefined ? title : n.title,
          content: content !== undefined ? content : n.content,
          color: color !== undefined ? color : n.color,
          updated_at: new Date().toISOString(),
        };
      }
      return n;
    }));

    try {
      const updated = await updateNote(id, title, content, color);
      // Replace with actual updated note
      setNotes(prev => prev.map(n => n.id === id ? updated : n));
      return updated;
    } catch (error) {
      // Reload on error to get correct state
      loadNotes(true);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeNote = useCallback(async (id: string) => {
    // Optimistic update
    setNotes(prev => prev.filter(n => n.id !== id));
    
    try {
      await deleteNote(id);
    } catch (error) {
      // Reload on error to get correct state
      loadNotes(true);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = useCallback(async (query: string) => {
    return await searchNotes(query);
  }, []);

  const refresh = useCallback(async () => {
    await loadNotes(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reorder = useCallback(async (reorderedNotes: LocalNote[]) => {
    // Optimistic update
    setNotes(reorderedNotes);

    try {
      await reorderNotes(reorderedNotes);
    } catch (error) {
      // Revert on error
      await loadNotes(true);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    notes,
    loading,
    addNote,
    editNote,
    removeNote,
    search,
    refresh,
    reorder,
  };
}
