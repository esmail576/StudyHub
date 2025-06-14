-- Add hearts_count column to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS hearts_count INTEGER DEFAULT 0;

-- Add note_hearts table for tracking user hearts
CREATE TABLE IF NOT EXISTS note_hearts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(note_id, user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS note_hearts_note_id_idx ON note_hearts(note_id);
CREATE INDEX IF NOT EXISTS note_hearts_user_id_idx ON note_hearts(user_id); 
ALTER TABLE notes ADD COLUMN IF NOT EXISTS hearts_count INTEGER DEFAULT 0;

-- Add note_hearts table for tracking user hearts
CREATE TABLE IF NOT EXISTS note_hearts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(note_id, user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS note_hearts_note_id_idx ON note_hearts(note_id);
CREATE INDEX IF NOT EXISTS note_hearts_user_id_idx ON note_hearts(user_id); 