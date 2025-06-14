-- Create reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('course', 'professor')),
  subject TEXT NOT NULL,
  course TEXT,
  professor TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notes table
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  file_path TEXT,
  file_size TEXT,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create marketplace items table
CREATE TABLE public.marketplace_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('Excellent', 'Good', 'Fair', 'Poor')),
  location TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lost items table
CREATE TABLE public.lost_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  reward DECIMAL(10,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'claimed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for notes
CREATE POLICY "Anyone can view notes" ON public.notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create notes" ON public.notes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON public.notes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for marketplace items
CREATE POLICY "Anyone can view marketplace items" ON public.marketplace_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create marketplace items" ON public.marketplace_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marketplace items" ON public.marketplace_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for lost items
CREATE POLICY "Anyone can view lost items" ON public.lost_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create lost items" ON public.lost_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lost items" ON public.lost_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Insert sample data
INSERT INTO public.reviews (user_id, type, subject, professor, rating, content) 
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'course',
  'CS101 - Introduction to Computer Science',
  'Dr. Smith',
  4,
  'Great introductory course! Dr. Smith explains concepts clearly and the assignments are well-designed.'
WHERE EXISTS (SELECT 1 FROM auth.users);

INSERT INTO public.notes (user_id, title, course, file_size, downloads)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Data Structures - Arrays and Linked Lists',
  'CS101',
  '2.3 MB',
  45
WHERE EXISTS (SELECT 1 FROM auth.users);

INSERT INTO public.marketplace_items (user_id, title, description, price, original_price, category, condition, location)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Calculus Textbook - 8th Edition',
  'Lightly used calculus textbook with some highlighting. All pages intact.',
  80.00,
  150.00,
  'Textbooks',
  'Good',
  'North Campus'
WHERE EXISTS (SELECT 1 FROM auth.users);

INSERT INTO public.lost_items (user_id, type, title, description, category, location, contact_email, reward)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'lost',
  'Black Backpack with Laptop',
  'Lost my black Jansport backpack containing MacBook Pro and textbooks. Has a small NASA patch.',
  'Electronics',
  'Library 3rd Floor',
  'student@university.edu',
  50.00
WHERE EXISTS (SELECT 1 FROM auth.users);

WHERE EXISTS (SELECT 1 FROM auth.users);
