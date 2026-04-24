-- Masjids (mosques) directory with geolocation
CREATE TABLE public.masjids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  district TEXT,
  country TEXT DEFAULT 'Uganda',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  imam_name TEXT,
  contact_phone TEXT,
  facilities TEXT[] DEFAULT '{}',
  description TEXT,
  image_url TEXT,
  prayer_times JSONB DEFAULT '{}'::jsonb,
  verified BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.masjids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active masjids viewable by everyone" ON public.masjids
  FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert masjids" ON public.masjids
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update masjids" ON public.masjids
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete masjids" ON public.masjids
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_masjids_updated_at BEFORE UPDATE ON public.masjids
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_masjids_location ON public.masjids (latitude, longitude) WHERE active = true;

-- Mosque reviews
CREATE TABLE public.mosque_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  masjid_id UUID NOT NULL REFERENCES public.masjids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (masjid_id, user_id)
);

ALTER TABLE public.mosque_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews viewable by everyone" ON public.mosque_reviews
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.mosque_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.mosque_reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.mosque_reviews
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any review" ON public.mosque_reviews
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_mosque_reviews_updated_at BEFORE UPDATE ON public.mosque_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_mosque_reviews_masjid ON public.mosque_reviews (masjid_id);

-- Realtime
ALTER TABLE public.mosque_reviews REPLICA IDENTITY FULL;
ALTER TABLE public.masjids REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mosque_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.masjids;

-- Seed a few well-known Kampala mosques
INSERT INTO public.masjids (name, address, city, district, latitude, longitude, description, verified) VALUES
  ('Gaddafi National Mosque', 'Old Kampala Hill', 'Kampala', 'Kampala', 0.3163, 32.5650, 'The largest mosque in Uganda, gifted by Libya.', true),
  ('Kibuli Mosque', 'Kibuli Hill', 'Kampala', 'Kampala', 0.3000, 32.5950, 'Historic mosque on Kibuli Hill.', true),
  ('William Street Mosque', 'William Street, CBD', 'Kampala', 'Kampala', 0.3136, 32.5811, 'Central business district mosque.', true),
  ('Nakasero Mosque', 'Nakasero', 'Kampala', 'Kampala', 0.3196, 32.5780, 'Serves Nakasero community.', true);
