-- Enrich mosque_projects
ALTER TABLE public.mosque_projects
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_links TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS beneficiaries INTEGER,
  ADD COLUMN IF NOT EXISTS deadline DATE,
  ADD COLUMN IF NOT EXISTS category TEXT;

-- Mosque submissions (community-submitted, admin approval)
CREATE TABLE public.masjid_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  district TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  imam_name TEXT,
  contact_phone TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.masjid_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions" ON public.masjid_submissions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all submissions" ON public.masjid_submissions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can submit" ON public.masjid_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update submissions" ON public.masjid_submissions
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete submissions" ON public.masjid_submissions
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_masjid_submissions_updated_at BEFORE UPDATE ON public.masjid_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for project media
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-media', 'project-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Project media public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-media');
CREATE POLICY "Admins upload project media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-media' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update project media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'project-media' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete project media" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-media' AND has_role(auth.uid(), 'admin'::app_role));
