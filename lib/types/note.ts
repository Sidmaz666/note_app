export interface Note {
  id: string;
  user_id: string | null;
  guest_id: string | null;
  title: string;
  content: string;
  color: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export interface LocalNote extends Omit<Note, 'synced_at'> {
  synced_at: string | null;
  isDirty: boolean; // true if needs to be synced
}
