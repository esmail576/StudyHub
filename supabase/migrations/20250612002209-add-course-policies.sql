-- Add user_id column to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Drop existing policies for courses
DROP POLICY IF EXISTS "Anyone can create courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can update courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can delete courses" ON public.courses;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.courses;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.courses;
DROP POLICY IF EXISTS "Enable update for all users" ON public.courses;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.courses;
DROP POLICY IF EXISTS "Users can create courses" ON public.courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can delete their own courses" ON public.courses;

-- Add RLS policy for course creation
CREATE POLICY "Anyone can create courses" ON public.courses
  FOR INSERT TO authenticated WITH CHECK (true);

-- Add RLS policy for course updates
CREATE POLICY "Anyone can update courses" ON public.courses
  FOR UPDATE TO authenticated USING (true);

-- Add RLS policy for course deletion
CREATE POLICY "Anyone can delete courses" ON public.courses
  FOR DELETE TO authenticated USING (true);

-- Add RLS policies for courses
CREATE POLICY "Anyone can view courses" ON public.courses
    FOR SELECT USING (true);

-- Drop existing policy for course sections deletion
DROP POLICY IF EXISTS "Users can delete their own course sections" ON public.course_sections;

-- Add RLS policy for course sections deletion
CREATE POLICY "Users can delete their own course sections" ON public.course_sections
    FOR DELETE TO authenticated USING (auth.uid() = added_by);

-- Add cascade delete trigger for course sections
CREATE OR REPLACE FUNCTION public.handle_course_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete all sections associated with the course
    DELETE FROM public.course_sections WHERE course_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for course deletion
DROP TRIGGER IF EXISTS on_course_deleted ON public.courses;
CREATE TRIGGER on_course_deleted
    BEFORE DELETE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_course_deletion();

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

-- Drop existing policies for notes
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notes;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.notes;
DROP POLICY IF EXISTS "Enable update for all users" ON public.notes;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.notes;

-- Add RLS policies for notes
CREATE POLICY "Enable read access for all users" ON public.notes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.notes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.notes
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.notes
    FOR DELETE USING (true); 