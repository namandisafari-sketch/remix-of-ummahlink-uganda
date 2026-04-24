CREATE TABLE public.tv_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  type TEXT NOT NULL DEFAULT 'video',
  platform TEXT NOT NULL DEFAULT 'youtube',
  is_live BOOLEAN NOT NULL DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tv_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active TV content viewable by everyone"
ON public.tv_content FOR SELECT
USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert TV content"
ON public.tv_content FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update TV content"
ON public.tv_content FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete TV content"
ON public.tv_content FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_tv_content_updated_at
BEFORE UPDATE ON public.tv_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();