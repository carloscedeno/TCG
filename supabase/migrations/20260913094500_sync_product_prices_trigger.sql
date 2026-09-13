-- Migration: Ensure price and price_usd in products table are always synchronized
CREATE OR REPLACE FUNCTION sync_product_prices()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.price IS NULL OR NEW.price <= 0) AND (NEW.price_usd IS NOT NULL AND NEW.price_usd > 0) THEN
        NEW.price := NEW.price_usd;
    ELSIF (NEW.price_usd IS NULL OR NEW.price_usd <= 0) AND (NEW.price IS NOT NULL AND NEW.price > 0) THEN
        NEW.price_usd := NEW.price;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_product_prices ON public.products;
CREATE TRIGGER trg_sync_product_prices
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION sync_product_prices();
