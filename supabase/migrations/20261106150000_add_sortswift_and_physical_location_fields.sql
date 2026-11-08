-- Migration: Add SortSwift and Physical Store Location fields to products table
-- Timestamp: 20261106150000
-- Target: DEV / PROD (Fully idempotent with IF NOT EXISTS)

DO $$ 
BEGIN
    -- 1. physical_location: 4-level store coordinate (e.g. E1-N04-F01-MTG-R)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'products' 
          AND column_name = 'physical_location'
    ) THEN
        ALTER TABLE public.products ADD COLUMN physical_location TEXT;
    END IF;

    -- 2. sortswift_id: Unique RAW Card ID in SortSwift (e.g. ss_raw_b9c7594cb67ffdccc97a394b)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'products' 
          AND column_name = 'sortswift_id'
    ) THEN
        ALTER TABLE public.products ADD COLUMN sortswift_id TEXT;
    END IF;

    -- 3. cost: Acquisition cost of the unit from SortSwift / Intake
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'products' 
          AND column_name = 'cost'
    ) THEN
        ALTER TABLE public.products ADD COLUMN cost NUMERIC(10,2);
    END IF;

    -- 4. barcode: Unit barcode for physical barcode scanner guns in store
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'products' 
          AND column_name = 'barcode'
    ) THEN
        ALTER TABLE public.products ADD COLUMN barcode TEXT;
    END IF;

    -- 5. language: Card language code (defaults to 'EN')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'products' 
          AND column_name = 'language'
    ) THEN
        ALTER TABLE public.products ADD COLUMN language TEXT DEFAULT 'EN';
    END IF;
END $$;

-- Indexes for high-performance lookup
CREATE INDEX IF NOT EXISTS idx_products_sortswift_id ON public.products(sortswift_id);
CREATE INDEX IF NOT EXISTS idx_products_physical_location ON public.products(physical_location);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);

COMMENT ON COLUMN public.products.physical_location IS 'Coordenada fisica en estanteria de tienda (ej: E1-N04-F01-MTG-R)';
COMMENT ON COLUMN public.products.sortswift_id IS 'Identificador unico RAW card en SortSwift (ss_raw_...)';
COMMENT ON COLUMN public.products.cost IS 'Costo de adquisicion de la carta para calculo de margen y sync con Odoo';
COMMENT ON COLUMN public.products.barcode IS 'Codigo de barras unitario para pistola lectora en tienda';
COMMENT ON COLUMN public.products.language IS 'Idioma de la carta singular (EN, ES, JA, etc.)';
