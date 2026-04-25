
-- 1. Extend role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operator';

-- 2. tour_operators
CREATE TABLE public.tour_operators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  logo_url TEXT,
  hero_url TEXT,
  city TEXT,
  district TEXT,
  country TEXT DEFAULT 'Uganda',
  license_no TEXT,
  license_authority TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  contact_phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tour_operators_owner ON public.tour_operators(owner_user_id);
CREATE INDEX idx_tour_operators_district ON public.tour_operators(district);

ALTER TABLE public.tour_operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active operators viewable by everyone" ON public.tour_operators
  FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner can view own operator" ON public.tour_operators
  FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Authenticated users can create their operator" ON public.tour_operators
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Owner can update own operator" ON public.tour_operators
  FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Admins can update any operator" ON public.tour_operators
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner can delete own operator" ON public.tour_operators
  FOR DELETE USING (auth.uid() = owner_user_id);
CREATE POLICY "Admins can delete any operator" ON public.tour_operators
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tour_operators_updated
BEFORE UPDATE ON public.tour_operators
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. tour_packages
CREATE TABLE public.tour_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES public.tour_operators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hajj','umrah')),
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('economy','standard','vip','family')),
  price_ugx BIGINT NOT NULL DEFAULT 0,
  duration_days INTEGER,
  departure_month TEXT,
  departure_date DATE,
  hotel_makkah TEXT,
  hotel_madinah TEXT,
  includes TEXT[] DEFAULT '{}'::TEXT[],
  seats_available INTEGER,
  description TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tour_packages_operator ON public.tour_packages(operator_id);
CREATE INDEX idx_tour_packages_type ON public.tour_packages(type);
CREATE INDEX idx_tour_packages_price ON public.tour_packages(price_ugx);

ALTER TABLE public.tour_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active packages viewable by everyone" ON public.tour_packages
  FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Operator owner can view own packages" ON public.tour_packages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.tour_operators o
    WHERE o.id = operator_id AND o.owner_user_id = auth.uid()
  ));
CREATE POLICY "Operator owner can insert packages" ON public.tour_packages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.tour_operators o
    WHERE o.id = operator_id AND o.owner_user_id = auth.uid()
  ));
CREATE POLICY "Operator owner can update packages" ON public.tour_packages
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.tour_operators o
    WHERE o.id = operator_id AND o.owner_user_id = auth.uid()
  ));
CREATE POLICY "Operator owner can delete packages" ON public.tour_packages
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.tour_operators o
    WHERE o.id = operator_id AND o.owner_user_id = auth.uid()
  ));
CREATE POLICY "Admins can manage packages" ON public.tour_packages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tour_packages_updated
BEFORE UPDATE ON public.tour_packages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. tour_reviews
CREATE TABLE public.tour_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES public.tour_operators(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (operator_id, user_id)
);
CREATE INDEX idx_tour_reviews_operator ON public.tour_reviews(operator_id);

ALTER TABLE public.tour_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews viewable by everyone" ON public.tour_reviews
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.tour_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.tour_reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.tour_reviews
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any tour review" ON public.tour_reviews
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tour_reviews_updated
BEFORE UPDATE ON public.tour_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. tour_inquiries
CREATE TABLE public.tour_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES public.tour_operators(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.tour_packages(id) ON DELETE SET NULL,
  user_id UUID,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','closed','spam')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tour_inquiries_operator ON public.tour_inquiries(operator_id);
CREATE INDEX idx_tour_inquiries_status ON public.tour_inquiries(status);

ALTER TABLE public.tour_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an inquiry" ON public.tour_inquiries
  FOR INSERT WITH CHECK (true);
CREATE POLICY "User can view own inquiries" ON public.tour_inquiries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Operator owner can view inquiries" ON public.tour_inquiries
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.tour_operators o
    WHERE o.id = operator_id AND o.owner_user_id = auth.uid()
  ));
CREATE POLICY "Operator owner can update inquiries" ON public.tour_inquiries
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.tour_operators o
    WHERE o.id = operator_id AND o.owner_user_id = auth.uid()
  ));
CREATE POLICY "Admins can view all inquiries" ON public.tour_inquiries
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update any inquiry" ON public.tour_inquiries
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete inquiries" ON public.tour_inquiries
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tour_inquiries_updated
BEFORE UPDATE ON public.tour_inquiries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-media', 'tour-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Tour media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tour-media');

CREATE POLICY "Authenticated can upload tour media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tour-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update own tour media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'tour-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can delete own tour media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'tour-media' AND auth.uid()::text = (storage.foldername(name))[1]);
