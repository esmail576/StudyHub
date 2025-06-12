-- Add reviewer name to reviews
ALTER TABLE public.reviews ADD COLUMN reviewer_name TEXT;
ALTER TABLE public.reviews ADD COLUMN is_anonymous BOOLEAN DEFAULT false;

-- Add folder structure to notes
ALTER TABLE public.notes ADD COLUMN year TEXT;
ALTER TABLE public.notes ADD COLUMN folder_type TEXT; -- 'notes', 'final_exams', 'labs', etc.
ALTER TABLE public.notes ADD COLUMN uploader_name TEXT;
ALTER TABLE public.notes ADD COLUMN file_url TEXT;

-- Add image support to marketplace and lost items
ALTER TABLE public.marketplace_items ADD COLUMN images TEXT[]; -- Array of image URLs
ALTER TABLE public.lost_items ADD COLUMN images TEXT[]; -- Array of image URLs

-- Update existing data with sample values
UPDATE public.reviews SET reviewer_name = 'Anonymous Student' WHERE reviewer_name IS NULL;
UPDATE public.notes SET 
  year = '2024',
  folder_type = 'notes',
  uploader_name = 'Student User'
WHERE year IS NULL;

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-files', 'student-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for student files
CREATE POLICY "Anyone can view files" ON storage.objects
  FOR SELECT USING (bucket_id = 'student-files');

CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'student-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'student-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (bucket_id = 'student-files' AND auth.uid()::text = (storage.foldername(name))[1]);
