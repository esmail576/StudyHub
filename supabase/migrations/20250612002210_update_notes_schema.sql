-- Drop the notes table if it exists
DROP TABLE IF EXISTS public.notes;

-- Recreate the notes table with the correct schema
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  major TEXT NOT NULL,
  linktree_url TEXT NOT NULL DEFAULT 'https://linktr.ee/',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploader_name TEXT
);

-- Update RLS policies to allow public access
DROP POLICY IF EXISTS "Enable read access for all users" ON notes;
DROP POLICY IF EXISTS "Enable insert for all users" ON notes;
DROP POLICY IF EXISTS "Enable update for all users" ON notes;
DROP POLICY IF EXISTS "Enable delete for all users" ON notes;

CREATE POLICY "Enable read access for all users" ON notes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON notes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON notes
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON notes
    FOR DELETE USING (true); 