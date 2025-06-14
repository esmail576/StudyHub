-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    course_code TEXT,
    file_type TEXT NOT NULL,
    telegram_message_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    likes_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0
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

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some default subjects
INSERT INTO public.subjects (name, description) VALUES
    ('Mathematics', 'Mathematics and related courses'),
    ('Physics', 'Physics and related courses'),
    ('Computer Science', 'Computer Science and related courses')
ON CONFLICT (name) DO NOTHING; 
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    course_code TEXT,
    file_type TEXT NOT NULL,
    telegram_message_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    likes_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0
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

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some default subjects
INSERT INTO public.subjects (name, description) VALUES
    ('Mathematics', 'Mathematics and related courses'),
    ('Physics', 'Physics and related courses'),
    ('Computer Science', 'Computer Science and related courses')
ON CONFLICT (name) DO NOTHING; 