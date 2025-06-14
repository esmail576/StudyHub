-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

-- Add delete policy for reviews
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id); 
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

-- Add delete policy for reviews
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id); 