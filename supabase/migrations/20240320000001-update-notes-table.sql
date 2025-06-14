-- Add file-related columns to notes table
alter table notes
add column file_path text,
add column file_url text;

-- Remove Telegram-related columns
alter table notes
drop column if exists telegram_message_id,
drop column if exists file_id; 
alter table notes
add column file_path text,
add column file_url text;

-- Remove Telegram-related columns
alter table notes
drop column if exists telegram_message_id,
drop column if exists file_id; 