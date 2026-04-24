-- ============================================
-- Admin Portal: Sheikhs, App Settings, Prayer Defaults
-- ============================================

-- 1) Sheikhs (Dawah Spreaders) — admin managed
CREATE TABLE IF NOT EXISTS public.sheikhs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  country TEXT,
  description TEXT,
  image_url TEXT,
  channel_name TEXT,
  channel_url TEXT NOT NULL,
  subscribers TEXT,
  rank INTEGER NOT NULL DEFAULT 100,
  verified BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sheikhs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active sheikhs viewable by everyone"
ON public.sheikhs FOR SELECT
USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert sheikhs"
ON public.sheikhs FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sheikhs"
ON public.sheikhs FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sheikhs"
ON public.sheikhs FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_sheikhs_updated_at
BEFORE UPDATE ON public.sheikhs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) App Settings (key/value JSON store) — admin managed
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App settings viewable by everyone"
ON public.app_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can insert app settings"
ON public.app_settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update app settings"
ON public.app_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete app settings"
ON public.app_settings FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults
INSERT INTO public.app_settings (key, value, description) VALUES
  ('app_info', '{"name":"UmmahLink Uganda","tagline":"Connecting the Ummah","contact_email":"info@ummahlink.ug","contact_phone":"+256700000000"}'::jsonb, 'General app information'),
  ('prayer_defaults', '{"fajr":"05:15","dhuhr":"12:45","asr":"16:00","maghrib":"18:30","isha":"19:45"}'::jsonb, 'Default daily prayer times'),
  ('feature_flags', '{"prayer_prompt":true,"donations":true,"alerts":true,"resources":true,"dawah":true}'::jsonb, 'Toggle major app features')
ON CONFLICT (key) DO NOTHING;

-- 3) Helper function: assign/revoke admin role (admin-only execution via RLS on user_roles)
-- Already covered by existing user_roles RLS policies.
