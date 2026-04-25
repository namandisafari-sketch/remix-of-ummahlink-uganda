-- Likes table
CREATE TABLE public.resource_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.shared_resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (resource_id, user_id)
);

CREATE INDEX idx_resource_likes_resource ON public.resource_likes(resource_id);

ALTER TABLE public.resource_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes viewable by everyone"
  ON public.resource_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like"
  ON public.resource_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own"
  ON public.resource_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Comments table
CREATE TABLE public.resource_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.shared_resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_resource_comments_resource ON public.resource_comments(resource_id, created_at DESC);

ALTER TABLE public.resource_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by everyone"
  ON public.resource_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment"
  ON public.resource_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.resource_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.resource_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
  ON public.resource_comments FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_resource_comments_updated_at
BEFORE UPDATE ON public.resource_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.resource_likes REPLICA IDENTITY FULL;
ALTER TABLE public.resource_comments REPLICA IDENTITY FULL;
ALTER TABLE public.shared_resources REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_resources;