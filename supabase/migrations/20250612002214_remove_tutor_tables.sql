-- Drop tutor-related tables if they exist
DROP TABLE IF EXISTS public.tutors;
DROP TABLE IF EXISTS public.tutor_reviews;
DROP TABLE IF EXISTS public.tutor_availability;
DROP TABLE IF EXISTS public.tutor_subjects;

-- Remove any tutor-related policies
DROP POLICY IF EXISTS "Anyone can view tutors" ON public.tutors;
DROP POLICY IF EXISTS "Users can create tutor profiles" ON public.tutors;
DROP POLICY IF EXISTS "Users can update their tutor profiles" ON public.tutors;
DROP POLICY IF EXISTS "Anyone can view tutor reviews" ON public.tutor_reviews;
DROP POLICY IF EXISTS "Users can create tutor reviews" ON public.tutor_reviews;
DROP POLICY IF EXISTS "Users can update their tutor reviews" ON public.tutor_reviews; 