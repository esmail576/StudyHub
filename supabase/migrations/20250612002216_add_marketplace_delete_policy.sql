-- Drop existing policies for marketplace items if they exist
DROP POLICY IF EXISTS "Anyone can view marketplace items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Users can create marketplace items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Users can update their own marketplace items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Users can delete their own marketplace items" ON public.marketplace_items;

-- Create comprehensive policies for marketplace items
-- View policy: Anyone can view marketplace items
CREATE POLICY "Anyone can view marketplace items" ON public.marketplace_items
  FOR SELECT TO authenticated USING (true);

-- Insert policy: Users can create their own marketplace items
CREATE POLICY "Users can create marketplace items" ON public.marketplace_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Update policy: Users can update their own marketplace items
CREATE POLICY "Users can update their own marketplace items" ON public.marketplace_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Delete policy: Users can delete their own marketplace items
CREATE POLICY "Users can delete their own marketplace items" ON public.marketplace_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id); 