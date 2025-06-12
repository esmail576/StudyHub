-- Add hearts count to notes table
ALTER TABLE public.notes ADD COLUMN hearts_count INTEGER DEFAULT 0;

-- Create note_hearts table
CREATE TABLE public.note_hearts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(note_id, user_id)
);

-- Enable RLS
ALTER TABLE public.note_hearts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for note_hearts
CREATE POLICY "Anyone can view note hearts" ON public.note_hearts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can heart notes" ON public.note_hearts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unheart notes" ON public.note_hearts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Function to update hearts count
CREATE OR REPLACE FUNCTION public.update_note_hearts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.notes SET hearts_count = hearts_count + 1 WHERE id = NEW.note_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.notes SET hearts_count = hearts_count - 1 WHERE id = OLD.note_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update hearts count
CREATE TRIGGER update_note_hearts_count
  AFTER INSERT OR DELETE ON public.note_hearts
  FOR EACH ROW EXECUTE FUNCTION public.update_note_hearts_count(); 