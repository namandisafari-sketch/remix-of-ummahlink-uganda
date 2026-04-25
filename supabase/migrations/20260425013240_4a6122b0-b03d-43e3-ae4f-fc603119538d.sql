ALTER TABLE public.shared_resources
  ADD COLUMN IF NOT EXISTS reciter_scope TEXT CHECK (reciter_scope IN ('local','international'));

CREATE INDEX IF NOT EXISTS idx_shared_resources_reciter_scope ON public.shared_resources(reciter_scope);
CREATE INDEX IF NOT EXISTS idx_shared_resources_type ON public.shared_resources(type);
CREATE INDEX IF NOT EXISTS idx_shared_resources_author ON public.shared_resources(author);