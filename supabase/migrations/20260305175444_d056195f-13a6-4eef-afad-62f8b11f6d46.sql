
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Janaza & SOS Alerts
CREATE TABLE public.alerts_janaza (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('janaza', 'sos')),
  title TEXT NOT NULL,
  description TEXT,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  maps_link TEXT,
  contact TEXT NOT NULL,
  urgent BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts_janaza ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Alerts viewable by everyone" ON public.alerts_janaza FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create alerts" ON public.alerts_janaza FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.alerts_janaza FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.alerts_janaza FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts_janaza FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mosque Projects
CREATE TABLE public.mosque_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mosque TEXT NOT NULL,
  description TEXT,
  goal BIGINT NOT NULL DEFAULT 0,
  raised BIGINT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mosque_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects viewable by everyone" ON public.mosque_projects FOR SELECT USING (true);
CREATE TRIGGER update_mosque_projects_updated_at BEFORE UPDATE ON public.mosque_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Donations
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES public.mosque_projects(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  pesapal_order_tracking_id TEXT,
  pesapal_transaction_id TEXT,
  phone TEXT,
  donor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own donations" ON public.donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view completed donations count" ON public.donations FOR SELECT USING (status = 'completed');
CREATE POLICY "Authenticated users can create donations" ON public.donations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Shared Resources
CREATE TABLE public.shared_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'audio', 'guide')),
  category TEXT NOT NULL,
  author TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size TEXT,
  downloads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shared_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resources viewable by everyone" ON public.shared_resources FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload resources" ON public.shared_resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resources" ON public.shared_resources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resources" ON public.shared_resources FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.shared_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for resources
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);
CREATE POLICY "Resources are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'resources');
CREATE POLICY "Authenticated users can upload resources" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own resources" ON storage.objects FOR DELETE USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to increment download count
CREATE OR REPLACE FUNCTION public.increment_download_count(resource_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.shared_resources SET downloads = downloads + 1 WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update project raised amount on completed donation
CREATE OR REPLACE FUNCTION public.update_project_raised()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.mosque_projects
    SET raised = raised + NEW.amount
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_donation_completed
  AFTER INSERT OR UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.update_project_raised();
