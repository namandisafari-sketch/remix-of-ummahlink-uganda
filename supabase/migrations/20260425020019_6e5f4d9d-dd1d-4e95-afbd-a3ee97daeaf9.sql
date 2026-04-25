
-- Replace broad public SELECT on tour-media with admin-only listing
-- (files remain accessible by direct public URL because the bucket is public)
DROP POLICY IF EXISTS "Tour media public read" ON storage.objects;

CREATE POLICY "Admins can list tour media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tour-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can list own tour media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tour-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Tighten inquiry insert: enforce reasonable input lengths
DROP POLICY IF EXISTS "Anyone can submit an inquiry" ON public.tour_inquiries;
CREATE POLICY "Anyone can submit a valid inquiry" ON public.tour_inquiries
  FOR INSERT WITH CHECK (
    char_length(name) BETWEEN 2 AND 100
    AND char_length(phone) BETWEEN 7 AND 20
    AND (message IS NULL OR char_length(message) <= 1000)
    AND (email IS NULL OR char_length(email) <= 255)
  );
