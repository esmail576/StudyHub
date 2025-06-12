-- Remove user_id column from courses table (if it exists and was added previously)
ALTER TABLE public.courses DROP COLUMN IF EXISTS user_id;

-- Add RLS policy for course creation allowing any user
CREATE POLICY "Anyone can create courses" ON public.courses
  FOR INSERT WITH CHECK (true);

-- Add RLS policy for course updates allowing any user
CREATE POLICY "Anyone can update courses" ON public.courses
  FOR UPDATE USING (true);

-- Add RLS policy for course deletion allowing any user
CREATE POLICY "Anyone can delete courses" ON public.courses
  FOR DELETE USING (true);

-- Add RLS policies for courses
CREATE POLICY "Enable read access for all users" ON courses
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON courses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON courses
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON courses
    FOR DELETE USING (true);

-- Update notes table schema
ALTER TABLE notes
    DROP COLUMN IF EXISTS file_path,
    DROP COLUMN IF EXISTS file_size,
    DROP COLUMN IF EXISTS file_url,
    DROP COLUMN IF EXISTS downloads,
    DROP COLUMN IF EXISTS year,
    DROP COLUMN IF EXISTS folder_type;

ALTER TABLE notes
    ADD COLUMN IF NOT EXISTS linktree_url TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'study_materials';

-- Add RLS policies for notes
CREATE POLICY "Enable read access for all users" ON notes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON notes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON notes
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON notes
    FOR DELETE USING (true); 