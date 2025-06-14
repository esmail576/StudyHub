-- Add missing columns to notes table
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS original_filename TEXT,
ADD COLUMN IF NOT EXISTS telegram_file_id TEXT;

-- Update existing records to use telegram_file_id if file_id exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notes' 
        AND column_name = 'file_id'
    ) THEN
        UPDATE notes
        SET telegram_file_id = file_id
        WHERE telegram_file_id IS NULL AND file_id IS NOT NULL;

        ALTER TABLE notes DROP COLUMN file_id;
    END IF;
END $$; 
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS original_filename TEXT,
ADD COLUMN IF NOT EXISTS telegram_file_id TEXT;

-- Update existing records to use telegram_file_id if file_id exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notes' 
        AND column_name = 'file_id'
    ) THEN
        UPDATE notes
        SET telegram_file_id = file_id
        WHERE telegram_file_id IS NULL AND file_id IS NOT NULL;

        ALTER TABLE notes DROP COLUMN file_id;
    END IF;
END $$; 