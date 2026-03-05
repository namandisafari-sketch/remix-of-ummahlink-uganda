
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: admins can see all roles, users can see their own
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin policies for mosque_projects (CRUD for admins)
CREATE POLICY "Admins can insert projects"
  ON public.mosque_projects FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update projects"
  ON public.mosque_projects FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete projects"
  ON public.mosque_projects FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for alerts (update/delete any)
CREATE POLICY "Admins can update any alert"
  ON public.alerts_janaza FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any alert"
  ON public.alerts_janaza FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all donations
CREATE POLICY "Admins can view all donations"
  ON public.donations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update donations (for status changes)
CREATE POLICY "Admins can update donations"
  ON public.donations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
