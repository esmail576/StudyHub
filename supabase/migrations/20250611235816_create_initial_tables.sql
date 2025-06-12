
-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  professor TEXT,
  semester TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course sections table
CREATE TABLE public.course_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  section_number TEXT NOT NULL,
  whatsapp_link TEXT NOT NULL,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for courses (everyone can read)
CREATE POLICY "Anyone can view courses" ON public.courses
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for course sections
CREATE POLICY "Anyone can view course sections" ON public.course_sections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can add course sections" ON public.course_sections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = added_by);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample courses
INSERT INTO public.courses (code, name, professor, semester, category) VALUES
  ('CS101', 'Introduction to Computer Science', 'Dr. Smith', 'Fall 2024', 'Computer Science'),
  ('MATH201', 'Calculus II', 'Prof. Johnson', 'Fall 2024', 'Mathematics'),
  ('PHYS150', 'General Physics', 'Dr. Wilson', 'Fall 2024', 'Physics'),
  ('ENG102', 'English Composition', 'Prof. Davis', 'Fall 2024', 'English'),
  ('CHEM101', 'General Chemistry', 'Dr. Brown', 'Fall 2024', 'Chemistry'),
  ('BIO201', 'Cell Biology', 'Prof. Garcia', 'Fall 2024', 'Biology');
