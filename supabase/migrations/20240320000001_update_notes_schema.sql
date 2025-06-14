-- Add new columns to notes table
ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS major TEXT,
ADD COLUMN IF NOT EXISTS uploader_name TEXT,
ADD COLUMN IF NOT EXISTS hearts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS linktree_url TEXT,
ADD COLUMN IF NOT EXISTS preview_image TEXT,
ADD COLUMN IF NOT EXISTS link_type TEXT;

-- Update existing rows to have default values
UPDATE public.notes
SET 
    major = 'Unknown',
    uploader_name = 'Anonymous',
    hearts_count = 0
WHERE major IS NULL OR uploader_name IS NULL OR hearts_count IS NULL;

-- Make certain columns NOT NULL after setting defaults
ALTER TABLE public.notes
ALTER COLUMN major SET NOT NULL,
ALTER COLUMN uploader_name SET NOT NULL; 
ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS major TEXT,
ADD COLUMN IF NOT EXISTS uploader_name TEXT,
ADD COLUMN IF NOT EXISTS hearts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS linktree_url TEXT,
ADD COLUMN IF NOT EXISTS preview_image TEXT,
ADD COLUMN IF NOT EXISTS link_type TEXT;

-- Update existing rows to have default values
UPDATE public.notes
SET 
    major = 'Unknown',
    uploader_name = 'Anonymous',
    hearts_count = 0
WHERE major IS NULL OR uploader_name IS NULL OR hearts_count IS NULL;

-- Make certain columns NOT NULL after setting defaults
ALTER TABLE public.notes
ALTER COLUMN major SET NOT NULL,
ALTER COLUMN uploader_name SET NOT NULL; 