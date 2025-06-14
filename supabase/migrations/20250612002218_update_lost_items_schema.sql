-- Drop existing columns and add new ones
ALTER TABLE public.lost_items 
  DROP COLUMN IF EXISTS reward,
  DROP COLUMN IF EXISTS contact_email,
  DROP COLUMN IF EXISTS images,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT NOT NULL DEFAULT '';

-- Update existing status values to match new constraint
UPDATE public.lost_items 
SET status = 'open' 
WHERE status = 'active';

-- Update status check constraint
ALTER TABLE public.lost_items 
  DROP CONSTRAINT IF EXISTS lost_items_status_check,
  ADD CONSTRAINT lost_items_status_check 
  CHECK (status IN ('open', 'claimed'));

-- Update RLS policies
DROP POLICY IF EXISTS "Anyone can view lost items" ON public.lost_items;
DROP POLICY IF EXISTS "Users can create lost items" ON public.lost_items;
DROP POLICY IF EXISTS "Users can update their own lost items" ON public.lost_items;
DROP POLICY IF EXISTS "Users can delete their own lost items" ON public.lost_items;

-- Create comprehensive policies for lost items
CREATE POLICY "Anyone can view lost items" ON public.lost_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create lost items" ON public.lost_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lost items" ON public.lost_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lost items" ON public.lost_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id); 