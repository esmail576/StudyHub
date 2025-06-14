-- Add image_url column to lost_items table
ALTER TABLE public.lost_items 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for lost items images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lost-items', 'lost-items', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for lost items images
CREATE POLICY "Anyone can view lost item images" ON storage.objects
  FOR SELECT USING (bucket_id = 'lost-items');

CREATE POLICY "Authenticated users can upload lost item images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'lost-items' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own lost item images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'lost-items' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own lost item images" ON storage.objects
  FOR DELETE USING (bucket_id = 'lost-items' AND auth.uid()::text = (storage.foldername(name))[1]); 