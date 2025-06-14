-- Drop existing tables and constraints in the correct order
DO $$ 
BEGIN
    -- Drop foreign key constraints first
    ALTER TABLE IF EXISTS notes DROP CONSTRAINT IF EXISTS notes_folder_id_fkey;
    ALTER TABLE IF EXISTS notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;
    ALTER TABLE IF EXISTS folders DROP CONSTRAINT IF EXISTS folders_parent_id_fkey;
    ALTER TABLE IF EXISTS folders DROP CONSTRAINT IF EXISTS folders_user_id_fkey;
    ALTER TABLE IF EXISTS folders DROP CONSTRAINT IF EXISTS folders_folder_type_id_fkey;
    
    -- Drop indexes
    DROP INDEX IF EXISTS idx_notes_folder_id;
    DROP INDEX IF EXISTS idx_folders_parent_id;
    DROP INDEX IF EXISTS idx_folders_user_id;
    DROP INDEX IF EXISTS idx_folders_type_id;
    
    -- Drop tables in the correct order
    DROP TABLE IF EXISTS notes;
    DROP TABLE IF EXISTS folders;
    DROP TABLE IF EXISTS folder_types;
END $$;

-- Create folder_types table for predefined folder types
CREATE TABLE folder_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default folder types
INSERT INTO folder_types (name, description) VALUES
    ('Department', 'Academic department (e.g., IT, Engineering)'),
    ('Program', 'Study program (e.g., ITCS, ITCE)'),
    ('Level', 'Academic level (e.g., Level 1, Level 2)'),
    ('Course', 'Specific course (e.g., ITCS113)'),
    ('Category', 'Content category (e.g., Notes, Assignments)');

-- Create folders table with type support
CREATE TABLE folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES folders(id),
    folder_type_id UUID REFERENCES folder_types(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    UNIQUE(name, parent_id, user_id)
);

-- Create notes table with folder support
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_type TEXT,
    telegram_message_id TEXT,
    file_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    uploader_name TEXT,
    folder_id UUID REFERENCES folders(id)
);

-- Create index for faster folder lookups
CREATE INDEX idx_notes_folder_id ON notes(folder_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_type_id ON folders(folder_type_id);

-- Insert root folder for each user
INSERT INTO folders (name, parent_id, user_id, created_by, folder_type_id)
SELECT 'Root', NULL, id, email, (SELECT id FROM folder_types WHERE name = 'Department')
FROM auth.users;

-- Insert default department folders for each user
INSERT INTO folders (name, parent_id, user_id, created_by, folder_type_id)
SELECT 
    dept.name,
    root.id,
    root.user_id,
    root.created_by,
    ft.id
FROM (
    VALUES 
        ('IT'),
        ('Engineering'),
        ('Business'),
        ('Science')
) AS dept(name)
CROSS JOIN folders root
CROSS JOIN folder_types ft
WHERE root.name = 'Root' 
AND ft.name = 'Department';

-- Insert default program folders for IT
INSERT INTO folders (name, parent_id, user_id, created_by, folder_type_id)
SELECT 
    prog.name,
    dept.id,
    dept.user_id,
    dept.created_by,
    ft.id
FROM (
    VALUES 
        ('ITCS'),
        ('ITCE'),
        ('ITSE'),
        ('ITIS')
) AS prog(name)
CROSS JOIN folders dept
CROSS JOIN folder_types ft
WHERE dept.name = 'IT' 
AND ft.name = 'Program';

-- Insert default level folders for ITCS
INSERT INTO folders (name, parent_id, user_id, created_by, folder_type_id)
SELECT 
    'Level ' || level,
    prog.id,
    prog.user_id,
    prog.created_by,
    ft.id
FROM generate_series(1, 4) AS level
CROSS JOIN folders prog
CROSS JOIN folder_types ft
WHERE prog.name = 'ITCS' 
AND ft.name = 'Level';

-- Insert default courses for each level
INSERT INTO folders (name, parent_id, user_id, created_by, folder_type_id)
SELECT 
    course.name,
    level.id,
    level.user_id,
    level.created_by,
    ft.id
FROM (
    VALUES 
        ('ITCS101', 'Level 1'),
        ('ITCS102', 'Level 1'),
        ('ITCS103', 'Level 1'),
        ('ITCS201', 'Level 2'),
        ('ITCS202', 'Level 2'),
        ('ITCS203', 'Level 2'),
        ('ITCS301', 'Level 3'),
        ('ITCS302', 'Level 3'),
        ('ITCS303', 'Level 3'),
        ('ITCS401', 'Level 4'),
        ('ITCS402', 'Level 4'),
        ('ITCS403', 'Level 4')
) AS course(name, level_name)
CROSS JOIN folders level
CROSS JOIN folder_types ft
WHERE level.name = course.level_name
AND ft.name = 'Course';

-- Insert default category folders
INSERT INTO folders (name, parent_id, user_id, created_by, folder_type_id)
SELECT 
    cat.name,
    course.id,
    course.user_id,
    course.created_by,
    ft.id
FROM (
    VALUES 
        ('Notes'),
        ('Assignments'),
        ('Projects'),
        ('Chapter Slides'),
        ('Other')
) AS cat(name)
CROSS JOIN folders course
CROSS JOIN folder_types ft
WHERE course.name LIKE 'ITCS%'
AND ft.name = 'Category'; 