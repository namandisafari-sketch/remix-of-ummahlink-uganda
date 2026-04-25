-- Community Help bundle: mutual aid, lost & found, skill exchange

-- ============ MUTUAL AID ============
CREATE TABLE public.community_aid_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL DEFAULT 'request', -- request | offer
  category TEXT NOT NULL DEFAULT 'general', -- ride | meal | blood | medical | financial | childcare | general
  title TEXT NOT NULL,
  description TEXT,
  contact_phone TEXT,
  whatsapp TEXT,
  urgent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'open', -- open | fulfilled | closed
  -- targeting
  scope TEXT NOT NULL DEFAULT 'parish', -- village | parish | subcounty | district | region | nationwide
  region TEXT,
  district TEXT,
  constituency TEXT,
  subcounty TEXT,
  parish TEXT,
  village TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_aid_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aid posts viewable by everyone" ON public.community_aid_posts
  FOR SELECT USING (true);
CREATE POLICY "Users create own aid post" ON public.community_aid_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own aid post" ON public.community_aid_posts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own aid post" ON public.community_aid_posts
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage aid posts" ON public.community_aid_posts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_aid_posts_updated
  BEFORE UPDATE ON public.community_aid_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_aid_posts_parish ON public.community_aid_posts(parish);
CREATE INDEX idx_aid_posts_district ON public.community_aid_posts(district);
CREATE INDEX idx_aid_posts_status ON public.community_aid_posts(status);

-- Aid responses (people offering help on requests, or accepting offers)
CREATE TABLE public.community_aid_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_aid_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_aid_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aid responses viewable by everyone" ON public.community_aid_responses
  FOR SELECT USING (true);
CREATE POLICY "Users add own response" ON public.community_aid_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own response" ON public.community_aid_responses
  FOR DELETE USING (auth.uid() = user_id);

-- ============ LOST & FOUND ============
CREATE TABLE public.lost_found_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL DEFAULT 'lost', -- lost | found
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- phone | wallet | document | child | pet | clothing | other
  image_url TEXT,
  location_text TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open | resolved | closed
  -- parish-scoped by default
  region TEXT,
  district TEXT,
  constituency TEXT,
  subcounty TEXT,
  parish TEXT,
  village TEXT,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lost_found_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lost/found viewable by everyone" ON public.lost_found_items
  FOR SELECT USING (true);
CREATE POLICY "Users create own L&F" ON public.lost_found_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own L&F" ON public.lost_found_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own L&F" ON public.lost_found_items
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage L&F" ON public.lost_found_items
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_lf_updated
  BEFORE UPDATE ON public.lost_found_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_lf_parish ON public.lost_found_items(parish);
CREATE INDEX idx_lf_status ON public.lost_found_items(status);

-- ============ SKILL EXCHANGE ============
CREATE TABLE public.skill_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other', -- quran_tutor | tailor | carpenter | tutor | mechanic | medical | beauty | tech | other
  price_text TEXT, -- e.g. "Free", "UGX 20,000/hour", "Negotiable"
  contact_phone TEXT,
  whatsapp TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  -- targeting (default to parish for local discovery)
  region TEXT,
  district TEXT,
  constituency TEXT,
  subcounty TEXT,
  parish TEXT,
  village TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills viewable by everyone" ON public.skill_listings
  FOR SELECT USING (active = true OR auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Users create own skill" ON public.skill_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own skill" ON public.skill_listings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own skill" ON public.skill_listings
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage skills" ON public.skill_listings
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_skills_updated
  BEFORE UPDATE ON public.skill_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_skills_parish ON public.skill_listings(parish);
CREATE INDEX idx_skills_category ON public.skill_listings(category);

-- ============ STORAGE BUCKET FOR L&F + SKILL IMAGES ============
INSERT INTO storage.buckets (id, name, public) VALUES ('community', 'community', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Community images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'community');
CREATE POLICY "Auth users upload to own folder in community" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'community' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users update own community files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'community' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users delete own community files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'community' AND auth.uid()::text = (storage.foldername(name))[1]
  );