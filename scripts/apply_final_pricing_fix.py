
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def apply_sql_fix():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL not found")
        return

    sql_commands = """
    -- 1. Ensure columns exist
    ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS avg_market_price_usd NUMERIC;
    ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS avg_market_price_foil_usd NUMERIC;

    -- 2. Update the helper function
    CREATE OR REPLACE FUNCTION public.get_latest_ck_price(p_printing_id UUID, p_is_foil BOOLEAN DEFAULT FALSE) 
    RETURNS NUMERIC AS $$
        SELECT price_usd 
        FROM public.price_history 
        WHERE printing_id = p_printing_id 
        AND source_id = (SELECT source_id FROM public.sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1)
        AND condition_id = (SELECT c.condition_id FROM public.conditions c WHERE UPPER(c.condition_code) = 'NM' LIMIT 1)
        AND is_foil = p_is_foil
        ORDER BY timestamp DESC 
        LIMIT 1;
    $$ LANGUAGE sql STABLE;

    -- 3. Drop and recreate the Materialized View
    DROP MATERIALIZED VIEW IF EXISTS public.mv_unique_cards CASCADE;

    CREATE MATERIALIZED VIEW public.mv_unique_cards AS
    SELECT DISTINCT ON (c.card_name)
        cp.printing_id,
        c.card_id,
        c.card_name::TEXT,
        cp.image_url::TEXT,
        s.set_name::TEXT,
        s.set_code::TEXT,
        c.rarity::TEXT,
        c.type_line::TEXT,
        c.colors,
        s.release_date,
        cp.avg_market_price_usd,
        cp.avg_market_price_foil_usd,
        p.price as store_price,
        c.game_id,
        c.cmc,
        cp.lang
    FROM public.card_printings cp
    INNER JOIN public.cards c ON cp.card_id = c.card_id
    INNER JOIN public.sets s ON cp.set_id = s.set_id
    LEFT JOIN public.products p ON cp.printing_id = p.printing_id
    WHERE (cp.lang = 'en' OR cp.lang IS NULL)
    ORDER BY 
        c.card_name,
        s.release_date DESC NULLS LAST,
        cp.is_foil ASC,
        cp.is_etched ASC;

    -- 4. Restore indices
    CREATE INDEX idx_mv_unique_cards_name ON public.mv_unique_cards(card_name);
    CREATE INDEX idx_mv_unique_cards_release_date ON public.mv_unique_cards(release_date DESC);
    CREATE INDEX idx_mv_unique_cards_game_id ON public.mv_unique_cards(game_id);
    CREATE INDEX idx_mv_unique_cards_trgm ON public.mv_unique_cards USING gin (card_name gin_trgm_ops);

    -- 5. Drop functions that return types that are changing
    DROP FUNCTION IF EXISTS public.get_unique_cards_optimized(text,integer[],text[],text[],text[],text[],integer,integer,integer,integer,text);
    DROP FUNCTION IF EXISTS public.search_cards_with_prices(text,text,integer);

    -- 6. Recreate Search RPCs
    CREATE OR REPLACE FUNCTION public.get_unique_cards_optimized(
      search_query TEXT DEFAULT NULL,
      game_ids INTEGER[] DEFAULT NULL,
      rarity_filter TEXT[] DEFAULT NULL,
      set_names TEXT[] DEFAULT NULL,
      color_codes TEXT[] DEFAULT NULL,
      type_filter TEXT[] DEFAULT NULL,
      year_from INTEGER DEFAULT NULL,
      year_to INTEGER DEFAULT NULL,
      limit_count INTEGER DEFAULT 50,
      offset_count INTEGER DEFAULT 0,
      sort_by TEXT DEFAULT 'release_date'
    )
    RETURNS TABLE (
      printing_id UUID,
      card_id UUID,
      card_name TEXT,
      image_url TEXT,
      set_name TEXT,
      set_code TEXT,
      rarity TEXT,
      type_line TEXT,
      colors TEXT[],
      release_date DATE,
      avg_market_price_usd NUMERIC,
      avg_market_price_foil_usd NUMERIC,
      store_price NUMERIC,
      game_id INTEGER,
      cmc NUMERIC
    ) 
    LANGUAGE plpgsql
    STABLE
    SECURITY DEFINER
    SET search_path = public, extensions
    AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        mv.printing_id,
        mv.card_id,
        mv.card_name,
        mv.image_url,
        mv.set_name,
        mv.set_code,
        mv.rarity,
        mv.type_line,
        mv.colors,
        mv.release_date,
        mv.avg_market_price_usd,
        mv.avg_market_price_foil_usd,
        mv.store_price,
        mv.game_id,
        mv.cmc
      FROM public.mv_unique_cards mv
      WHERE 
        (search_query IS NULL OR mv.card_name ILIKE '%' || search_query || '%')
        AND (game_ids IS NULL OR mv.game_id = ANY(game_ids))
        AND (rarity_filter IS NULL OR LOWER(mv.rarity) = ANY(rarity_filter))
        AND (set_names IS NULL OR mv.set_name = ANY(set_names))
        AND (color_codes IS NULL OR mv.colors && color_codes)
        AND (type_filter IS NULL OR EXISTS (
            SELECT 1 FROM unnest(type_filter) AS t WHERE mv.type_line ILIKE '%' || t || '%'
        ))
        AND (year_from IS NULL OR EXTRACT(YEAR FROM mv.release_date) >= year_from)
        AND (year_to IS NULL OR EXTRACT(YEAR FROM mv.release_date) <= year_to)
      ORDER BY 
        CASE 
          WHEN sort_by = 'name' THEN mv.card_name 
          ELSE NULL 
        END ASC,
        CASE 
          WHEN sort_by = 'newest' OR sort_by = 'release_date' THEN mv.release_date 
          ELSE NULL 
        END DESC NULLS LAST,
        CASE 
          WHEN sort_by = 'mana_asc' THEN mv.cmc 
          ELSE NULL 
        END ASC,
        CASE 
          WHEN sort_by = 'mana_desc' THEN mv.cmc 
          ELSE NULL 
        END DESC NULLS LAST,
        CASE 
          WHEN sort_by = 'price_asc' THEN COALESCE(mv.store_price, mv.avg_market_price_usd, mv.avg_market_price_foil_usd, 0) 
          ELSE NULL 
        END ASC,
        CASE 
          WHEN sort_by = 'price_desc' THEN COALESCE(mv.store_price, mv.avg_market_price_usd, mv.avg_market_price_foil_usd, 0) 
          ELSE NULL 
        END DESC NULLS LAST
      LIMIT limit_count
      OFFSET offset_count;
    END;
    $$;

    CREATE OR REPLACE FUNCTION public.search_cards_with_prices(
        search_query TEXT,
        game_code_filter TEXT DEFAULT NULL,
        limit_count INTEGER DEFAULT 50
    )
    RETURNS TABLE (
        card_id UUID,
        card_name TEXT,
        game_name TEXT,
        set_name TEXT,
        collector_number TEXT,
        rarity TEXT,
        avg_price_usd NUMERIC,
        low_price_usd NUMERIC,
        high_price_usd NUMERIC,
        price_count INTEGER,
        image_url TEXT
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            c.card_id,
            c.card_name,
            g.game_name,
            s.set_name,
            cp.collector_number,
            c.rarity,
            cp.avg_market_price_usd as avg_price_usd,
            cp.avg_market_price_usd as low_price_usd,
            cp.avg_market_price_usd as high_price_usd,
            1 as price_count,
            cp.image_url::TEXT
        FROM public.cards c
        JOIN public.games g ON c.game_id = g.game_id
        JOIN public.card_printings cp ON c.card_id = cp.card_id
        JOIN public.sets s ON cp.set_id = s.set_id
        WHERE 
            (search_query IS NULL OR c.card_name ILIKE '%' || search_query || '%')
            AND (game_code_filter IS NULL OR g.game_code = game_code_filter)
        ORDER BY c.card_name, s.release_date DESC
        LIMIT limit_count;
    END;
    $$ LANGUAGE plpgsql STABLE;

    -- 7. Refresh the MV
    REFRESH MATERIALIZED VIEW public.mv_unique_cards;
    """

    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cur = conn.cursor()
        print("Applying SQL updates to production...")
        cur.execute(sql_commands)
        print("SQL updates applied successfully.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error applying SQL: {e}")

if __name__ == "__main__":
    apply_sql_fix()
