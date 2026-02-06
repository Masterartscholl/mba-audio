ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS artist_name text;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS image_url text;
