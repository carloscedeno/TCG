ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rarity text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_usd numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS release_date date;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS set_name text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colors text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS type_line text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percentage numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_end_date timestamp with time zone;
