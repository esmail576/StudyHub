-- Drop existing table
DROP TABLE IF EXISTS public.notes CASCADE;

-- Recreate notes table with updated schema
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    course_code TEXT,
    file_type TEXT NOT NULL,
    telegram_message_id TEXT NOT NULL,
    file_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    major TEXT NOT NULL,
    uploader_name TEXT NOT NULL,
    hearts_count INTEGER DEFAULT 0,
    linktree_url TEXT,
    preview_image TEXT,
    link_type TEXT
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all notes"
ON public.notes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own notes"
ON public.notes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.notes FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 