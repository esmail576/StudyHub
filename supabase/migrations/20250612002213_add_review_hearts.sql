-- Add is_hearted column to reviews table
ALTER TABLE public.reviews ADD COLUMN is_hearted BOOLEAN DEFAULT false;

-- Create review_hearts table
CREATE TABLE public.review_hearts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE public.review_hearts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_hearts
CREATE POLICY "Anyone can view review hearts" ON public.review_hearts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can heart reviews" ON public.review_hearts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unheart reviews" ON public.review_hearts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Function to update hearts count
CREATE OR REPLACE FUNCTION public.update_review_hearts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews SET hearts_count = hearts_count + 1 WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews SET hearts_count = hearts_count - 1 WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update hearts count
CREATE TRIGGER update_review_hearts_count
  AFTER INSERT OR DELETE ON public.review_hearts
  FOR EACH ROW EXECUTE FUNCTION public.update_review_hearts_count(); 