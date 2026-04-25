-- Allow shared_resources to store external embeds (e.g. TikTok) in addition to uploaded files
ALTER TABLE public.shared_resources
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS embed_provider text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- file_path is required for uploaded files but optional for external embeds.
ALTER TABLE public.shared_resources ALTER COLUMN file_path DROP NOT NULL;

-- Ensure each row has either an uploaded file or an external URL
ALTER TABLE public.shared_resources DROP CONSTRAINT IF EXISTS shared_resources_source_check;
ALTER TABLE public.shared_resources
  ADD CONSTRAINT shared_resources_source_check
  CHECK (file_path IS NOT NULL OR external_url IS NOT NULL);

-- Restrict uploads/inserts to admins only (resources are admin-curated)
DROP POLICY IF EXISTS "Authenticated users can upload resources" ON public.shared_resources;
DROP POLICY IF EXISTS "Admins can insert resources" ON public.shared_resources;
CREATE POLICY "Admins can insert resources"
  ON public.shared_resources
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update own resources" ON public.shared_resources;
DROP POLICY IF EXISTS "Admins can update resources" ON public.shared_resources;
CREATE POLICY "Admins can update resources"
  ON public.shared_resources
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete own resources" ON public.shared_resources;
DROP POLICY IF EXISTS "Admins can delete resources" ON public.shared_resources;
CREATE POLICY "Admins can delete resources"
  ON public.shared_resources
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));