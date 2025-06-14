-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    course_code TEXT,
    file_type TEXT,
    telegram_message_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    major TEXT,
    uploader_name TEXT,
    linktree_url TEXT,
    hearts_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0
);

-- Create note_hearts table for tracking user hearts
CREATE TABLE IF NOT EXISTS note_hearts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(note_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at);
CREATE INDEX IF NOT EXISTS note_hearts_note_id_idx ON note_hearts(note_id);
CREATE INDEX IF NOT EXISTS note_hearts_user_id_idx ON note_hearts(user_id);

-- Add RLS policies
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_hearts ENABLE ROW LEVEL SECURITY;

-- Notes policies
CREATE POLICY "Notes are viewable by everyone" ON notes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
    FOR DELETE USING (auth.uid() = user_id);

-- Note hearts policies
CREATE POLICY "Note hearts are viewable by everyone" ON note_hearts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own hearts" ON note_hearts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hearts" ON note_hearts
    FOR DELETE USING (auth.uid() = user_id); 
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    course_code TEXT,
    file_type TEXT,
    telegram_message_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    major TEXT,
    uploader_name TEXT,
    linktree_url TEXT,
    hearts_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0
);

-- Create note_hearts table for tracking user hearts
CREATE TABLE IF NOT EXISTS note_hearts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(note_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at);
CREATE INDEX IF NOT EXISTS note_hearts_note_id_idx ON note_hearts(note_id);
CREATE INDEX IF NOT EXISTS note_hearts_user_id_idx ON note_hearts(user_id);

-- Add RLS policies
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_hearts ENABLE ROW LEVEL SECURITY;

-- Notes policies
CREATE POLICY "Notes are viewable by everyone" ON notes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
    FOR DELETE USING (auth.uid() = user_id);

-- Note hearts policies
CREATE POLICY "Note hearts are viewable by everyone" ON note_hearts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own hearts" ON note_hearts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hearts" ON note_hearts
    FOR DELETE USING (auth.uid() = user_id); 