-- ============================================
-- NOTE TAKING APP - SUPABASE SETUP
-- ============================================

-- ============================================
-- 1. CREATE NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  color TEXT,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS notes_guest_id_idx ON notes(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at DESC);

-- Full-text search index (for advanced search)
CREATE INDEX IF NOT EXISTS notes_search_idx ON notes USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

-- Policy: Users can view their own notes
CREATE POLICY "Users can view own notes" 
  ON notes FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own notes
CREATE POLICY "Users can insert own notes" 
  ON notes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notes
CREATE POLICY "Users can update own notes" 
  ON notes FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete own notes" 
  ON notes FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Full-text search helper
CREATE OR REPLACE FUNCTION search_notes(search_query TEXT, user_uuid UUID)
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

-- Function: Get notes count for a user
CREATE OR REPLACE FUNCTION get_user_notes_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notes
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Sync note (upsert with conflict resolution)
CREATE OR REPLACE FUNCTION sync_note(
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
-- 6. TRIGGERS
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;

-- Trigger: Automatically update updated_at on note updates
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON notes TO authenticated;

-- ============================================
-- 8. HELPER VIEWS (Optional - for analytics)
-- ============================================

-- View: User notes summary
CREATE OR REPLACE VIEW user_notes_summary AS
SELECT 
  user_id,
  COUNT(*) as total_notes,
  COUNT(*) FILTER (WHERE synced_at IS NOT NULL) as synced_notes,
  MAX(updated_at) as last_updated,
  SUM(LENGTH(content)) as total_content_length
FROM notes
WHERE user_id IS NOT NULL
GROUP BY user_id;

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Run this file in Supabase SQL Editor
-- Make sure to enable Google OAuth in Authentication > Providers
