CREATE TABLE public.hero_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  badge TEXT,
  cta_label TEXT,
  cta_link TEXT,
  image_url TEXT,
  variant TEXT NOT NULL DEFAULT 'emerald',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active banners viewable by everyone"
ON public.hero_banners FOR SELECT
USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert banners"
ON public.hero_banners FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update banners"
ON public.hero_banners FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete banners"
ON public.hero_banners FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_hero_banners_updated_at
BEFORE UPDATE ON public.hero_banners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.hero_banners (title, subtitle, badge, cta_label, cta_link, variant, sort_order) VALUES
('Strengthening the Ummah in Uganda', 'Real-time alerts, transparent giving, and shared Islamic knowledge.', 'Welcome', 'View Alerts', '/alerts', 'emerald', 1),
('Ramadan Iftar Drive 2026', 'Help us serve 5,000 iftar meals across mosques in Kampala this Ramadan.', 'New', 'Donate Now', '/donations', 'gold', 2),
('Janaza Notifications, Instantly', 'Never miss a funeral prayer — get real-time janaza alerts in your area.', 'Update', 'Enable Alerts', '/alerts', 'urgent', 3);