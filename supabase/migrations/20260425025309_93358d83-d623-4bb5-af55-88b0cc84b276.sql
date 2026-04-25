-- 1) Imam applications
CREATE TABLE public.imam_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  mosque_name TEXT NOT NULL,
  masjid_id UUID,
  region TEXT,
  district TEXT,
  constituency TEXT,
  subcounty TEXT,
  parish TEXT,
  village TEXT,
  bio TEXT,
  credentials TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.imam_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users submit own imam application"
  ON public.imam_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own imam application"
  ON public.imam_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all imam applications"
  ON public.imam_applications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update imam applications"
  ON public.imam_applications FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete imam applications"
  ON public.imam_applications FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_imam_apps_updated
  BEFORE UPDATE ON public.imam_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Imam profiles (created on approval)
CREATE TABLE public.imam_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  mosque_name TEXT NOT NULL,
  masjid_id UUID,
  region TEXT,
  district TEXT,
  constituency TEXT,
  subcounty TEXT,
  parish TEXT,
  village TEXT,
  contact_phone TEXT,
  whatsapp TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.imam_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Imam profiles viewable by everyone"
  ON public.imam_profiles FOR SELECT USING (true);

CREATE POLICY "Owner updates own imam profile"
  ON public.imam_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage imam profiles"
  ON public.imam_profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_imam_profiles_updated
  BEFORE UPDATE ON public.imam_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Mosque notifications
CREATE TABLE public.mosque_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imam_user_id UUID NOT NULL,
  mosque_name TEXT NOT NULL,
  masjid_id UUID,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'meeting',
  urgent BOOLEAN NOT NULL DEFAULT false,
  poster_url TEXT,
  event_time TEXT,
  event_at TIMESTAMPTZ,
  location_text TEXT,
  maps_link TEXT,
  scope TEXT NOT NULL DEFAULT 'parish',
  target_region TEXT,
  target_district TEXT,
  target_constituency TEXT,
  target_subcounty TEXT,
  target_parish TEXT,
  target_village TEXT,
  allow_rsvp BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mn_active_created ON public.mosque_notifications(active, created_at DESC);
CREATE INDEX idx_mn_scope_target ON public.mosque_notifications(scope, target_district, target_parish);
CREATE INDEX idx_mn_imam ON public.mosque_notifications(imam_user_id);

ALTER TABLE public.mosque_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active notifications viewable"
  ON public.mosque_notifications FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin') OR auth.uid() = imam_user_id);

CREATE POLICY "Imams insert own notifications"
  ON public.mosque_notifications FOR INSERT
  WITH CHECK (
    auth.uid() = imam_user_id
    AND public.has_role(auth.uid(), 'imam')
  );

CREATE POLICY "Imams update own notifications"
  ON public.mosque_notifications FOR UPDATE
  USING (auth.uid() = imam_user_id);

CREATE POLICY "Imams delete own notifications"
  ON public.mosque_notifications FOR DELETE
  USING (auth.uid() = imam_user_id);

CREATE POLICY "Admins manage all notifications"
  ON public.mosque_notifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_mn_updated
  BEFORE UPDATE ON public.mosque_notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) RSVPs
CREATE TABLE public.notification_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.mosque_notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

ALTER TABLE public.notification_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RSVPs viewable by everyone"
  ON public.notification_rsvps FOR SELECT USING (true);

CREATE POLICY "Users add own RSVP"
  ON public.notification_rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove own RSVP"
  ON public.notification_rsvps FOR DELETE
  USING (auth.uid() = user_id);

-- 5) Read tracking
CREATE TABLE public.notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.mosque_notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reads"
  ON public.notification_reads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users mark own read"
  ON public.notification_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6) Storage bucket for notification posters (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('notification-posters', 'notification-posters', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Notification posters publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notification-posters');

CREATE POLICY "Imams upload notification posters"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'notification-posters'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Imams update own notification posters"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'notification-posters'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Imams delete own notification posters"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'notification-posters'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );