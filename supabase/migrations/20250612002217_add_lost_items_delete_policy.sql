-- Drop existing policies for lost items if they exist
DROP POLICY IF EXISTS "Anyone can view lost items" ON public.lost_items;
DROP POLICY IF EXISTS "Users can create lost items" ON public.lost_items;
DROP POLICY IF EXISTS "Users can update their own lost items" ON public.lost_items;
DROP POLICY IF EXISTS "Users can delete their own lost items" ON public.lost_items;

-- Create comprehensive policies for lost items
-- View policy: Anyone can view lost items
CREATE POLICY "Anyone can view lost items" ON public.lost_items
  FOR SELECT TO authenticated USING (true);

-- Insert policy: Users can create their own lost items
CREATE POLICY "Users can create lost items" ON public.lost_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Update policy: Users can update their own lost items
CREATE POLICY "Users can update their own lost items" ON public.lost_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Delete policy: Users can delete their own lost items
CREATE POLICY "Users can delete their own lost items" ON public.lost_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id); 