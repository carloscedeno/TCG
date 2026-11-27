-- Migration: Search Trigram Optimization & Internal Search Intent Analytics (Bloque A)
-- 1. Enable pg_trgm and add GIN trigram index on public.products(name)
-- 2. Upgrade search_card_names to support substring/fuzzy matching with in-stock priority
-- 3. Upgrade get_products_filtered to support typo-tolerant trigram fallback & year bounds
-- 4. Create internal_search_events table + RLS + SECURITY DEFINER log_search_intent & get_search_intelligence RPCs

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_name_trgm
    ON public.products USING gin (name gin_trgm_ops);

-- ============================================================================
-- 1. AUTOCOMPLETE: Substring + Fuzzy + In-Stock Priority
-- ============================================================================
CREATE OR REPLACE FUNCTION public.search_card_names(
    query_text text,
    limit_count integer DEFAULT 10
)
RETURNS TABLE(card_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_q text := TRIM(COALESCE(query_text, ''));
    v_limit integer := LEAST(GREATEST(COALESCE(limit_count, 10), 1), 25);
BEGIN
    IF length(v_q) < 2 THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH raw_candidates AS (
        SELECT
            p.name AS candidate_name,
            0 AS out_of_stock_rank
        FROM public.products p
        WHERE p.stock > 0
          AND (
              p.name ILIKE '%' || v_q || '%'
              OR (length(v_q) >= 3 AND p.name % v_q)
          )
        UNION ALL
        SELECT
            c.card_name AS candidate_name,
            1 AS out_of_stock_rank
        FROM public.cards c
        WHERE
            c.card_name ILIKE '%' || v_q || '%'
            OR (length(v_q) >= 3 AND c.card_name % v_q)
    ),
    deduped AS (
        SELECT
            MIN(rc.candidate_name) AS display_name,
            MIN(rc.out_of_stock_rank) AS stock_rank,
            MIN(
                CASE
                    WHEN LOWER(rc.candidate_name) = LOWER(v_q) THEN 0
                    WHEN rc.candidate_name ILIKE v_q || '%' THEN 1
                    WHEN rc.candidate_name ILIKE '% ' || v_q || '%' THEN 2
                    WHEN rc.candidate_name ILIKE '%' || v_q || '%' THEN 3
                    ELSE 4
                END
            ) AS match_tier,
            MAX(similarity(LOWER(rc.candidate_name), LOWER(v_q))) AS sim_score
        FROM raw_candidates rc
        GROUP BY LOWER(TRIM(rc.candidate_name))
    )
    SELECT d.display_name::text AS card_name
    FROM deduped d
    ORDER BY
        d.stock_rank ASC,
        d.match_tier ASC,
        d.sim_score DESC,
        length(d.display_name) ASC,
        d.display_name ASC
    LIMIT v_limit;
END;
$$;

-- ============================================================================
-- 2. CATALOG SEARCH: Substring + Trigram Typo Fallback + Relevance Order
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_products_filtered(
    search_query text DEFAULT NULL::text,
    game_filter text DEFAULT NULL::text,
    set_filter text[] DEFAULT NULL::text[],
    rarity_filter text[] DEFAULT NULL::text[],
    type_filter text[] DEFAULT NULL::text[],
    color_filter text[] DEFAULT NULL::text[],
    year_from integer DEFAULT NULL::integer,
    year_to integer DEFAULT NULL::integer,
    price_min numeric DEFAULT NULL::numeric,
    price_max numeric DEFAULT NULL::numeric,
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0,
    p_only_new boolean DEFAULT false,
    p_only_discount boolean DEFAULT false,
    p_only_presale boolean DEFAULT false,
    sort_by text DEFAULT 'newest'::text
)
RETURNS TABLE(
    id uuid,
    name text,
    game text,
    set_code text,
    price numeric,
    image_url text,
    rarity text,
    printing_id text,
    stock integer,
    set_name text,
    finish text,
    updated_at timestamp with time zone,
    original_price numeric,
    discount_percentage numeric,
    discount_end_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_game_code TEXT;
  v_sort_by TEXT := COALESCE(sort_by, 'newest');
  v_mapped_colors text[] := NULL;
  v_search TEXT := NULLIF(TRIM(search_query), '');
BEGIN
  IF game_filter ILIKE 'Magic%' OR game_filter = 'MTG' THEN
    v_game_code := 'MTG';
  ELSIF game_filter ILIKE 'Poke%' OR game_filter = 'PKM' OR game_filter = 'POKEMON' THEN
    v_game_code := 'PKM';
  ELSIF game_filter ILIKE 'One%' OR game_filter = 'OPC' OR game_filter = 'ONEPIECE' THEN
    v_game_code := 'OPC';
  ELSIF game_filter ILIKE 'Digi%' OR game_filter = 'DGM' OR game_filter = 'DIGIMON' THEN
    v_game_code := 'DGM';
  ELSE
    v_game_code := game_filter;
  END IF;

  IF color_filter IS NOT NULL THEN
     v_mapped_colors := ARRAY(
         SELECT CASE
            WHEN c = 'White' THEN 'W'
            WHEN c = 'Blue' THEN 'U'
            WHEN c = 'Black' THEN 'B'
            WHEN c = 'Red' THEN 'R'
            WHEN c = 'Green' THEN 'G'
            ELSE c
         END FROM unnest(color_filter) c
     );
  END IF;

  RETURN QUERY
  WITH matching_products AS (
    SELECT
      p.id,
      p.name,
      p.game,
      p.set_code,
      CASE WHEN p.discount_percentage > 0 AND (p.discount_end_date IS NULL OR p.discount_end_date > now())
           THEN ROUND(p.price * (1 - p.discount_percentage / 100.0), 2)
           ELSE p.price
      END as eff_price,
      p.image_url,
      p.rarity,
      p.printing_id::text as printing_id_text,
      p.stock,
      p.set_name,
      p.finish,
      p.updated_at,
      p.release_date,
      p.price as orig_price,
      p.discount_percentage,
      p.discount_end_date
    FROM public.products p
    WHERE
      p.stock > 0
      AND (
        v_search IS NULL
        OR p.name ILIKE '%' || v_search || '%'
        OR p.set_code ILIKE v_search
        OR (length(v_search) >= 4 AND similarity(LOWER(p.name), LOWER(v_search)) >= 0.30)
      )
      AND (
        v_game_code IS NULL
        OR (v_game_code = 'OTHERS' AND COALESCE(p.game, '') NOT IN ('MTG', 'PKM', 'YGO', 'RFB', 'OPC', 'DGM', 'GND', 'FAB', 'Magic', '22', 'Pokemon', 'One Piece', 'Digimon', 'Yu-Gi-Oh', 'Flesh and Blood', 'Riftbound', 'Gundam'))
        OR p.game = v_game_code
        OR (v_game_code = 'MTG' AND p.game IN ('Magic', '22'))
      )
      AND (set_filter IS NULL OR LOWER(p.set_code) = ANY(SELECT LOWER(s) FROM unnest(set_filter) s) OR p.set_name = ANY(set_filter) OR UPPER(p.set_code) = ANY(set_filter))
      AND (rarity_filter IS NULL OR LOWER(p.rarity) = ANY(rarity_filter))
      AND (price_min IS NULL OR p.price >= price_min)
      AND (price_max IS NULL OR p.price <= price_max)
      AND (
        ((year_from IS NULL OR year_from <= 1993) AND (year_to IS NULL OR year_to >= 2026))
        OR (
          p.release_date IS NOT NULL
          AND (year_from IS NULL OR year_from <= 1993 OR EXTRACT(YEAR FROM p.release_date) >= year_from)
          AND (year_to IS NULL OR year_to >= 2026 OR EXTRACT(YEAR FROM p.release_date) <= year_to)
        )
      )
      AND (NOT p_only_new OR p.updated_at >= NOW() - INTERVAL '14 days')
      AND (NOT p_only_discount OR (p.discount_percentage > 0 AND (p.discount_end_date IS NULL OR p.discount_end_date > now())))
      AND (NOT p_only_presale OR p.name ILIKE '%(preventa)%')
      AND (
        type_filter IS NULL
        OR EXISTS (
            SELECT 1 FROM unnest(type_filter) tf WHERE p.type_line ILIKE '%' || tf || '%'
        )
      )
      AND (
        color_filter IS NULL
        OR ('Colorless' = ANY(color_filter) AND (p.colors IS NULL OR array_length(p.colors, 1) IS NULL))
        OR ('Multicolor' = ANY(color_filter) AND array_length(p.colors, 1) > 1)
        OR p.colors && v_mapped_colors
      )
  ),
  grouped_cards AS (
    SELECT DISTINCT ON (LOWER(TRIM(mp.name)), COALESCE(mp.game, 'MTG'))
      mp.id,
      mp.name,
      mp.game,
      mp.set_code,
      mp.eff_price as price,
      mp.image_url,
      mp.rarity,
      mp.printing_id_text as printing_id,
      (SUM(mp.stock) OVER (PARTITION BY LOWER(TRIM(mp.name)), COALESCE(mp.game, 'MTG')))::integer as stock,
      mp.set_name,
      mp.finish,
      (MAX(mp.updated_at) OVER (PARTITION BY LOWER(TRIM(mp.name)), COALESCE(mp.game, 'MTG'))) as updated_at,
      mp.release_date,
      mp.orig_price as original_price,
      mp.discount_percentage,
      mp.discount_end_date
    FROM matching_products mp
    ORDER BY
      LOWER(TRIM(mp.name)),
      COALESCE(mp.game, 'MTG'),
      CASE WHEN v_sort_by = 'price_asc' THEN mp.eff_price END ASC,
      CASE WHEN v_sort_by = 'price_desc' THEN mp.eff_price END DESC,
      CASE WHEN COALESCE(mp.finish, 'nonfoil') = 'nonfoil' THEN 0 ELSE 1 END ASC,
      mp.updated_at DESC,
      mp.id ASC
  )
  SELECT
    gc.id,
    gc.name,
    gc.game,
    gc.set_code,
    gc.price,
    gc.image_url,
    gc.rarity,
    gc.printing_id,
    gc.stock,
    gc.set_name,
    gc.finish,
    gc.updated_at,
    gc.original_price,
    gc.discount_percentage,
    gc.discount_end_date
  FROM grouped_cards gc
  ORDER BY
    CASE
        WHEN v_search IS NOT NULL AND LOWER(gc.name) = LOWER(v_search) THEN 0
        WHEN v_search IS NOT NULL AND gc.name ILIKE v_search || '%' THEN 1
        WHEN v_search IS NOT NULL AND gc.name ILIKE '% ' || v_search || '%' THEN 2
        WHEN v_search IS NOT NULL AND gc.name ILIKE '%' || v_search || '%' THEN 3
        WHEN v_search IS NOT NULL THEN 4
        ELSE 5 END ASC,
    CASE WHEN v_sort_by = 'newest' THEN gc.updated_at END DESC,
    CASE WHEN v_sort_by = 'price_asc' THEN gc.price END ASC,
    CASE WHEN v_sort_by = 'price_desc' THEN gc.price END DESC,
    CASE WHEN v_sort_by = 'name' THEN gc.name END ASC,
    CASE WHEN v_sort_by = 'name_desc' THEN gc.name END DESC,
    CASE WHEN v_sort_by = 'release_date' THEN gc.release_date END DESC NULLS LAST,
    CASE WHEN v_sort_by = 'release_date_asc' THEN gc.release_date END ASC NULLS LAST,
    gc.updated_at DESC,
    gc.name ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

-- ============================================================================
-- 3. INTERNAL SEARCH INTENT EVENTS (Telemetry with Session Folding)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.internal_search_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    search_session_id uuid NOT NULL UNIQUE,
    raw_query text NOT NULL,
    normalized_query text NOT NULL,
    game_filter text,
    tab text NOT NULL DEFAULT 'marketplace',
    results_count integer NOT NULL DEFAULT 0,
    resolution_type text NOT NULL DEFAULT 'idle_settle'
        CHECK (resolution_type IN ('idle_settle', 'suggestion_click', 'card_click', 'cart_add', 'submit', 'abandon', 'zero_results')),
    resolved_card_id text,
    resolved_name text,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_search_events_created_at
    ON public.internal_search_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_internal_search_events_normalized_query
    ON public.internal_search_events (normalized_query);
CREATE INDEX IF NOT EXISTS idx_internal_search_events_resolution_type
    ON public.internal_search_events (resolution_type);

ALTER TABLE public.internal_search_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.internal_search_events FROM anon, public;
GRANT SELECT ON public.internal_search_events TO authenticated;

DROP POLICY IF EXISTS "Admins can view internal search events" ON public.internal_search_events;
CREATE POLICY "Admins can view internal search events"
    ON public.internal_search_events
    FOR SELECT
    USING (public.is_admin());

CREATE OR REPLACE FUNCTION public._search_resolution_rank(p_type text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE p_type
        WHEN 'cart_add' THEN 6
        WHEN 'card_click' THEN 5
        WHEN 'suggestion_click' THEN 4
        WHEN 'submit' THEN 3
        WHEN 'idle_settle' THEN 2
        WHEN 'zero_results' THEN 1
        WHEN 'abandon' THEN 0
        ELSE 1
    END;
$$;

CREATE OR REPLACE FUNCTION public.log_search_intent(
    p_search_session_id uuid,
    p_query text,
    p_game_filter text DEFAULT NULL,
    p_tab text DEFAULT 'marketplace',
    p_results_count integer DEFAULT 0,
    p_resolution_type text DEFAULT 'idle_settle',
    p_resolved_card_id text DEFAULT NULL,
    p_resolved_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_raw text := LEFT(TRIM(COALESCE(p_query, '')), 120);
    v_norm text;
    v_res_type text := COALESCE(NULLIF(TRIM(p_resolution_type), ''), 'idle_settle');
    v_count integer := GREATEST(COALESCE(p_results_count, 0), 0);
    v_game text := NULLIF(LEFT(TRIM(COALESCE(p_game_filter, '')), 20), '');
    v_tab text := CASE WHEN p_tab = 'catalog' THEN 'catalog' ELSE 'marketplace' END;
    v_card_id text := NULLIF(LEFT(TRIM(COALESCE(p_resolved_card_id, '')), 100), '');
    v_card_name text := NULLIF(LEFT(TRIM(COALESCE(p_resolved_name, '')), 160), '');
    v_uid uuid := auth.uid();
BEGIN
    IF p_search_session_id IS NULL OR length(v_raw) < 2 THEN
        RETURN;
    END IF;

    IF v_res_type NOT IN ('idle_settle', 'suggestion_click', 'card_click', 'cart_add', 'submit', 'abandon', 'zero_results') THEN
        v_res_type := 'idle_settle';
    END IF;

    IF v_count = 0 AND v_res_type IN ('idle_settle', 'submit', 'abandon') THEN
        v_res_type := 'zero_results';
    END IF;

    v_norm := regexp_replace(LOWER(v_raw), '\s+', ' ', 'g');

    INSERT INTO public.internal_search_events (
        search_session_id,
        raw_query,
        normalized_query,
        game_filter,
        tab,
        results_count,
        resolution_type,
        resolved_card_id,
        resolved_name,
        user_id
    ) VALUES (
        p_search_session_id,
        v_raw,
        v_norm,
        v_game,
        v_tab,
        v_count,
        v_res_type,
        v_card_id,
        v_card_name,
        v_uid
    )
    ON CONFLICT (search_session_id) DO UPDATE SET
        raw_query = CASE
            WHEN length(EXCLUDED.raw_query) >= length(internal_search_events.raw_query)
              OR public._search_resolution_rank(EXCLUDED.resolution_type) >= public._search_resolution_rank(internal_search_events.resolution_type)
            THEN EXCLUDED.raw_query
            ELSE internal_search_events.raw_query
        END,
        normalized_query = CASE
            WHEN length(EXCLUDED.raw_query) >= length(internal_search_events.raw_query)
              OR public._search_resolution_rank(EXCLUDED.resolution_type) >= public._search_resolution_rank(internal_search_events.resolution_type)
            THEN EXCLUDED.normalized_query
            ELSE internal_search_events.normalized_query
        END,
        game_filter = COALESCE(EXCLUDED.game_filter, internal_search_events.game_filter),
        tab = EXCLUDED.tab,
        results_count = CASE
            WHEN EXCLUDED.results_count > 0 THEN EXCLUDED.results_count
            ELSE internal_search_events.results_count
        END,
        resolution_type = CASE
            WHEN public._search_resolution_rank(EXCLUDED.resolution_type) >= public._search_resolution_rank(internal_search_events.resolution_type)
            THEN EXCLUDED.resolution_type
            ELSE internal_search_events.resolution_type
        END,
        resolved_card_id = COALESCE(EXCLUDED.resolved_card_id, internal_search_events.resolved_card_id),
        resolved_name = COALESCE(EXCLUDED.resolved_name, internal_search_events.resolved_name),
        user_id = COALESCE(internal_search_events.user_id, EXCLUDED.user_id),
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.log_search_intent(uuid, text, text, text, integer, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.log_search_intent(uuid, text, text, text, integer, text, text, text) TO anon, authenticated;

-- ============================================================================
-- 4. ADMIN INTELLIGENCE RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_search_intelligence(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_days integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 365);
    v_cutoff timestamptz := now() - make_interval(days => v_days);
    v_result jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: admin access required';
    END IF;

    WITH scoped AS (
        SELECT *
        FROM public.internal_search_events
        WHERE created_at >= v_cutoff
    ),
    summary AS (
        SELECT
            COUNT(*)::integer AS total_sessions,
            COUNT(*) FILTER (WHERE resolution_type IN ('suggestion_click', 'card_click', 'cart_add'))::integer AS resolved_sessions,
            COUNT(*) FILTER (WHERE resolution_type = 'cart_add')::integer AS cart_conversions,
            COUNT(*) FILTER (WHERE resolution_type = 'zero_results' OR (results_count = 0 AND resolved_name IS NULL))::integer AS zero_result_sessions,
            COUNT(*) FILTER (WHERE resolution_type = 'abandon')::integer AS abandoned_sessions
        FROM scoped
    ),
    top_cards AS (
        SELECT
            COALESCE(NULLIF(resolved_name, ''), normalized_query) AS term,
            MAX(resolved_card_id) AS card_id,
            COUNT(*)::integer AS searches,
            COUNT(*) FILTER (WHERE resolution_type IN ('suggestion_click', 'card_click', 'cart_add'))::integer AS clicks,
            COUNT(*) FILTER (WHERE resolution_type = 'cart_add')::integer AS cart_adds,
            ROUND(AVG(results_count))::integer AS avg_results,
            MAX(updated_at) AS last_seen
        FROM scoped
        WHERE resolved_name IS NOT NULL OR results_count > 0
        GROUP BY COALESCE(NULLIF(resolved_name, ''), normalized_query)
        ORDER BY searches DESC, clicks DESC, last_seen DESC
        LIMIT 15
    ),
    zero_queries AS (
        SELECT
            normalized_query AS term,
            COUNT(*)::integer AS searches,
            ARRAY_REMOVE(ARRAY_AGG(DISTINCT game_filter), NULL) AS games,
            MAX(updated_at) AS last_seen
        FROM scoped
        WHERE (resolution_type = 'zero_results' OR results_count = 0)
          AND resolved_name IS NULL
        GROUP BY normalized_query
        ORDER BY searches DESC, last_seen DESC
        LIMIT 15
    ),
    partial_queries AS (
        SELECT
            normalized_query AS term,
            COUNT(*)::integer AS searches,
            MAX(resolution_type) AS last_resolution,
            ROUND(AVG(results_count))::integer AS avg_results,
            MAX(updated_at) AS last_seen
        FROM scoped
        WHERE resolution_type IN ('idle_settle', 'abandon', 'submit')
          AND resolved_name IS NULL
          AND results_count > 0
        GROUP BY normalized_query
        ORDER BY searches DESC, last_seen DESC
        LIMIT 15
    ),
    recent_events AS (
        SELECT
            raw_query,
            resolved_name,
            game_filter,
            results_count,
            resolution_type,
            updated_at
        FROM scoped
        ORDER BY updated_at DESC
        LIMIT 20
    )
    SELECT jsonb_build_object(
        'days', v_days,
        'summary', (SELECT row_to_json(summary)::jsonb FROM summary),
        'top_cards', COALESCE((SELECT jsonb_agg(row_to_json(top_cards)::jsonb) FROM top_cards), '[]'::jsonb),
        'zero_results', COALESCE((SELECT jsonb_agg(row_to_json(zero_queries)::jsonb) FROM zero_queries), '[]'::jsonb),
        'partial_unresolved', COALESCE((SELECT jsonb_agg(row_to_json(partial_queries)::jsonb) FROM partial_queries), '[]'::jsonb),
        'recent', COALESCE((SELECT jsonb_agg(row_to_json(recent_events)::jsonb) FROM recent_events), '[]'::jsonb)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_search_intelligence(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.get_search_intelligence(integer) TO authenticated;
