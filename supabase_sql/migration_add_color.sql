-- ============================================
-- MIGRATION: Add color column to notes table
-- ============================================
-- This migration adds the color field to support note color customization
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD COLOR COLUMN TO NOTES TABLE
-- ============================================
-- Only add if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notes' 
    AND column_name = 'color'
  ) THEN
    ALTER TABLE notes ADD COLUMN color TEXT;
    RAISE NOTICE 'Added color column to notes table';
  ELSE
    RAISE NOTICE 'Color column already exists, skipping';
  END IF;
END $$;

-- ============================================
-- 2. UPDATE search_notes FUNCTION
-- ============================================
-- Drop existing function first (if it exists) to change return type
-- Must specify exact signature to drop
DROP FUNCTION IF EXISTS public.search_notes(text, uuid) CASCADE;

-- Recreate with color in return
CREATE FUNCTION search_notes(search_query TEXT, user_uuid UUID)
RETURNS TABLE (
  id TEXT,
  user_id UUID,
  guest_id TEXT,
  title TEXT,
  content TEXT,
  color TEXT,
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
-- Must specify exact signature to drop (old version had 5 params without color)
DROP FUNCTION IF EXISTS public.sync_note(text, uuid, text, text, timestamp with time zone) CASCADE;

-- Recreate with color parameter
CREATE FUNCTION sync_note(
  note_id TEXT,
  note_user_id UUID,
  note_title TEXT,
  note_content TEXT,
  note_color TEXT,
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
      updated_at = GREATEST(note_updated_at, existing_note.updated_at),
      synced_at = NOW()
    WHERE id = note_id AND user_id = note_user_id
    RETURNING * INTO existing_note;

    RETURN existing_note;
  ELSE
    -- New note - insert
    INSERT INTO notes (id, user_id, title, content, color, updated_at, synced_at)
    VALUES (note_id, note_user_id, note_title, note_content, note_color, note_updated_at, NOW())
    RETURNING * INTO existing_note;

    RETURN existing_note;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- The color column has been added and functions updated
-- Existing notes will have NULL color values (default)
