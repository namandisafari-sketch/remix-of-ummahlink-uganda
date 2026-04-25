ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS constituency text,
  ADD COLUMN IF NOT EXISTS street_address text;