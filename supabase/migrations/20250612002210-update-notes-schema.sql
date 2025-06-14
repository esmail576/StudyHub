-- Add original_filename and file_type columns to notes table
ALTER TABLE notes
ADD COLUMN original_filename TEXT,
ADD COLUMN file_type TEXT;

-- Update existing records to have default values
UPDATE notes
SET original_filename = 'note_' || id,
    file_type = 'application/octet-stream'
WHERE original_filename IS NULL OR file_type IS NULL; 
ALTER TABLE notes
ADD COLUMN original_filename TEXT,
ADD COLUMN file_type TEXT;

-- Update existing records to have default values
UPDATE notes
SET original_filename = 'note_' || id,
    file_type = 'application/octet-stream'
WHERE original_filename IS NULL OR file_type IS NULL; 