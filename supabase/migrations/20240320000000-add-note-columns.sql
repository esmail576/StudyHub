-- Add missing columns to notes table
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS course_code TEXT,
ADD COLUMN IF NOT EXISTS major TEXT,
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS uploader_name TEXT,
ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_file_id TEXT;

-- Check if file_id column exists before trying to migrate data
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notes' 
        AND column_name = 'file_id'
    ) THEN
        -- Update existing records to use telegram_file_id if file_id exists
        UPDATE notes
        SET telegram_file_id = file_id
        WHERE telegram_file_id IS NULL AND file_id IS NOT NULL;

        -- Drop the old file_id column
        ALTER TABLE notes DROP COLUMN file_id;
    END IF;
END $$; 