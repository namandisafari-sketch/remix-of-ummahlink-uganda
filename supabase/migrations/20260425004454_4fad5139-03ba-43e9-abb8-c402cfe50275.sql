ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS subcounty text,
  ADD COLUMN IF NOT EXISTS parish text,
  ADD COLUMN IF NOT EXISTS village text;

ALTER TABLE public.user_preferences
  DROP COLUMN IF EXISTS street_address;