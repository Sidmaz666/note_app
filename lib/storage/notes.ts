import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalNote } from '../types/note';

const GUEST_ID_KEY = '@guest_id';
const NOTES_KEY = '@notes';
const SYNC_QUEUE_KEY = '@sync_queue';

// Generate or get guest ID
export const getGuestId = async (): Promise<string> => {
  let guestId = await AsyncStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
};

// Get all notes (local)
export const getLocalNotes = async (): Promise<LocalNote[]> => {
  try {
    const notesJson = await AsyncStorage.getItem(NOTES_KEY);
    if (!notesJson) {
      console.log('No notes found in storage, returning empty array');
      return [];
    }
    const parsed = JSON.parse(notesJson);
    console.log(`Loaded ${parsed.length} notes from storage`);
    return parsed;
  } catch (error) {
    console.error('Error getting local notes:', error);
    return [];
  }
};

// Save notes locally
export const saveLocalNotes = async (notes: LocalNote[]): Promise<void> => {
  try {
    const jsonString = JSON.stringify(notes);
    await AsyncStorage.setItem(NOTES_KEY, jsonString);
    console.log(`Saved ${notes.length} notes to storage`);
  } catch (error: any) {
    console.error('Error saving local notes:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      notesCount: notes.length,
    });
    throw new Error(`Failed to save notes: ${error?.message || 'Unknown error'}`);
  }
};

// Get sync queue
export const getSyncQueue = async (): Promise<string[]> => {
  try {
    const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch {
    return [];
  }
};

// Add to sync queue
export const addToSyncQueue = async (noteId: string): Promise<void> => {
  const queue = await getSyncQueue();
  if (!queue.includes(noteId)) {
    queue.push(noteId);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  }
};

// Remove from sync queue
export const removeFromSyncQueue = async (noteId: string): Promise<void> => {
  const queue = await getSyncQueue();
  const filtered = queue.filter(id => id !== noteId);
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
};
