-- Create lost items table
CREATE TABLE public.lost_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'claimed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for lost items
CREATE POLICY "Anyone can view lost items" ON public.lost_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create lost items" ON public.lost_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lost items" ON public.lost_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lost items" ON public.lost_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

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
CREATE TABLE public.lost_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'claimed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for lost items
CREATE POLICY "Anyone can view lost items" ON public.lost_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create lost items" ON public.lost_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lost items" ON public.lost_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lost items" ON public.lost_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

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