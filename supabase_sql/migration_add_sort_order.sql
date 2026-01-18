-- ============================================
-- MIGRATION: Add sort_order column to notes table
-- ============================================
-- This migration adds the sort_order field to support note reordering
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD SORT_ORDER COLUMN TO NOTES TABLE
-- ============================================
-- Only add if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notes' 
    AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE notes ADD COLUMN sort_order INTEGER;
    -- Initialize sort_order for existing notes based on updated_at
    UPDATE notes 
    SET sort_order = subquery.row_num - 1
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as row_num
      FROM notes
    ) AS subquery
    WHERE notes.id = subquery.id;
    RAISE NOTICE 'Added sort_order column to notes table';
  ELSE
    RAISE NOTICE 'Sort_order column already exists, skipping';
  END IF;
END $$;

-- ============================================
-- 2. UPDATE search_notes FUNCTION
-- ============================================
-- Drop existing function first (if it exists) to change return type
DROP FUNCTION IF EXISTS public.search_notes(text, uuid) CASCADE;

-- Recreate with sort_order in return
CREATE FUNCTION search_notes(search_query TEXT, user_uuid UUID)
RETURNS TABLE (
  id TEXT,
  user_id UUID,
  guest_id TEXT,
  title TEXT,
  content TEXT,
  color TEXT,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.user_id,
    n.guest_id,
    n.title,
    n.content,
    n.color,
    n.sort_order,
    n.created_at,
    n.updated_at,
    n.synced_at,
    ts_rank(
      to_tsvector('english', coalesce(n.title, '') || ' ' || coalesce(n.content, '')),
      plainto_tsquery('english', search_query)
    ) AS rank
  FROM notes n
  WHERE n.user_id = user_uuid
    AND (
      to_tsvector('english', coalesce(n.title, '') || ' ' || coalesce(n.content, ''))
      @@ plainto_tsquery('english', search_query)
      OR n.title ILIKE '%' || search_query || '%'
      OR n.content ILIKE '%' || search_query || '%'
    )
  ORDER BY rank DESC, n.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. UPDATE sync_note FUNCTION
-- ============================================
-- Drop existing function first (if it exists) to change parameters
DROP FUNCTION IF EXISTS public.sync_note(text, uuid, text, text, text, timestamp with time zone) CASCADE;

-- Recreate with sort_order parameter
CREATE FUNCTION sync_note(
  note_id TEXT,
  note_user_id UUID,
  note_title TEXT,
  note_content TEXT,
  note_color TEXT,
  note_sort_order INTEGER,
  note_updated_at TIMESTAMP WITH TIME ZONE
)
RETURNS notes AS $$
DECLARE
  existing_note notes;
  merged_content TEXT;
BEGIN
  -- Check if note exists
  SELECT * INTO existing_note
  FROM notes
  WHERE id = note_id AND user_id = note_user_id;

  IF existing_note IS NOT NULL THEN
    -- Note exists - merge content (append strategy)
    IF note_updated_at > existing_note.updated_at THEN
      -- Incoming note is newer - append to existing
      merged_content := existing_note.content || E'\n\n--- Synced ---\n\n' || note_content;
    ELSE
      -- Existing note is newer or same - keep existing, append new
      merged_content := note_content || E'\n\n--- Synced ---\n\n' || existing_note.content;
    END IF;

    -- Update the note
    UPDATE notes
    SET 
      title = note_title,
      content = merged_content,
      color = note_color,
      sort_order = note_sort_order,
      updated_at = GREATEST(note_updated_at, existing_note.updated_at),
      synced_at = NOW()
    WHERE id = note_id AND user_id = note_user_id
    RETURNING * INTO existing_note;

    RETURN existing_note;
  ELSE
    -- New note - insert
    INSERT INTO notes (id, user_id, title, content, color, sort_order, updated_at, synced_at)
    VALUES (note_id, note_user_id, note_title, note_content, note_color, note_sort_order, note_updated_at, NOW())
    RETURNING * INTO existing_note;

    RETURN existing_note;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- The sort_order column has been added and functions updated
-- Existing notes will have sort_order initialized based on updated_at
