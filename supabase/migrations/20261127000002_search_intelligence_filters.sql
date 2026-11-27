-- Migration: Advanced Admin Filters & Card Metadata Enrichment for Search Intelligence
-- 1. Store optional rarity/type/set filters captured during search
-- 2. Upgrade log_search_intent without signature ambiguity
-- 3. Upgrade get_search_intelligence with date range, game, card type, rarity, resolution, tab, and text filters

ALTER TABLE public.internal_search_events
    ADD COLUMN IF NOT EXISTS rarity_filter text,
    ADD COLUMN IF NOT EXISTS type_filter text,
    ADD COLUMN IF NOT EXISTS set_filter text;

DROP FUNCTION IF EXISTS public.log_search_intent(uuid, text, text, text, integer, text, text, text);

CREATE OR REPLACE FUNCTION public.log_search_intent(
    p_search_session_id uuid,
    p_query text,
    p_game_filter text DEFAULT NULL,
    p_tab text DEFAULT 'marketplace',
    p_results_count integer DEFAULT 0,
    p_resolution_type text DEFAULT 'idle_settle',
    p_resolved_card_id text DEFAULT NULL,
    p_resolved_name text DEFAULT NULL,
    p_rarity_filter text DEFAULT NULL,
    p_type_filter text DEFAULT NULL,
    p_set_filter text DEFAULT NULL
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
    v_rarity text := NULLIF(LEFT(TRIM(COALESCE(p_rarity_filter, '')), 80), '');
    v_type text := NULLIF(LEFT(TRIM(COALESCE(p_type_filter, '')), 80), '');
    v_set text := NULLIF(LEFT(TRIM(COALESCE(p_set_filter, '')), 80), '');
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
        rarity_filter,
        type_filter,
        set_filter,
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
        v_rarity,
        v_type,
        v_set,
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
        rarity_filter = COALESCE(EXCLUDED.rarity_filter, internal_search_events.rarity_filter),
        type_filter = COALESCE(EXCLUDED.type_filter, internal_search_events.type_filter),
        set_filter = COALESCE(EXCLUDED.set_filter, internal_search_events.set_filter),
        user_id = COALESCE(internal_search_events.user_id, EXCLUDED.user_id),
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.log_search_intent(uuid, text, text, text, integer, text, text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.log_search_intent(uuid, text, text, text, integer, text, text, text, text, text, text) TO anon, authenticated;

-- ============================================================================
-- ADMIN INTELLIGENCE RPC WITH MULTI-FACET FILTERS
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_search_intelligence(integer);

CREATE OR REPLACE FUNCTION public.get_search_intelligence(
    p_days integer DEFAULT 30,
    p_date_from timestamptz DEFAULT NULL,
    p_date_to timestamptz DEFAULT NULL,
    p_game text DEFAULT NULL,
    p_card_type text DEFAULT NULL,
    p_rarity text DEFAULT NULL,
    p_resolution_type text DEFAULT NULL,
    p_tab text DEFAULT NULL,
    p_search_text text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_days integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 365);
    v_from timestamptz := COALESCE(p_date_from, now() - make_interval(days => v_days));
    v_to timestamptz := COALESCE(p_date_to, now() + interval '1 day');
    v_game text := NULLIF(TRIM(COALESCE(p_game, '')), '');
    v_type text := NULLIF(TRIM(COALESCE(p_card_type, '')), '');
    v_rarity text := NULLIF(TRIM(COALESCE(p_rarity, '')), '');
    v_res text := NULLIF(TRIM(COALESCE(p_resolution_type, '')), '');
    v_tab text := NULLIF(TRIM(COALESCE(p_tab, '')), '');
    v_text text := NULLIF(TRIM(COALESCE(p_search_text, '')), '');
    v_result jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: admin access required';
    END IF;

    WITH enriched AS (
        SELECT
            e.*,
            COALESCE(NULLIF(e.game_filter, ''), pm.game, cm.game_code) AS eff_game,
            COALESCE(NULLIF(e.rarity_filter, ''), pm.rarity, cm.rarity) AS eff_rarity,
            COALESCE(NULLIF(e.type_filter, ''), pm.type_line, cm.type_line) AS eff_type,
            COALESCE(NULLIF(e.set_filter, ''), pm.set_code) AS eff_set,
            COALESCE(pm.total_stock, 0) AS current_stock
        FROM public.internal_search_events e
        LEFT JOIN LATERAL (
            SELECT
                p.game,
                p.rarity,
                p.type_line,
                p.set_code,
                SUM(p.stock) OVER ()::integer AS total_stock
            FROM public.products p
            WHERE (
                e.resolved_card_id IS NOT NULL
                AND p.printing_id::text = regexp_replace(e.resolved_card_id, '-(foil|nonfoil|etched)$', '')
            ) OR (
                LOWER(p.name) = LOWER(COALESCE(NULLIF(e.resolved_name, ''), e.normalized_query))
            )
            ORDER BY
                CASE WHEN e.resolved_card_id IS NOT NULL AND p.printing_id::text = regexp_replace(e.resolved_card_id, '-(foil|nonfoil|etched)$', '') THEN 0 ELSE 1 END,
                p.stock DESC
            LIMIT 1
        ) pm ON true
        LEFT JOIN LATERAL (
            SELECT
                g.game_code,
                c.rarity,
                c.type_line
            FROM public.cards c
            LEFT JOIN public.games g ON g.game_id = c.game_id
            WHERE LOWER(c.card_name) = LOWER(COALESCE(NULLIF(e.resolved_name, ''), e.normalized_query))
            LIMIT 1
        ) cm ON true
        WHERE e.created_at >= v_from
          AND e.created_at <= v_to
    ),
    scoped AS (
        SELECT *
        FROM enriched en
        WHERE (v_game IS NULL OR UPPER(COALESCE(en.eff_game, '')) = UPPER(v_game))
          AND (v_type IS NULL OR COALESCE(en.eff_type, '') ILIKE '%' || v_type || '%')
          AND (v_rarity IS NULL OR LOWER(COALESCE(en.eff_rarity, '')) = LOWER(v_rarity))
          AND (v_res IS NULL OR en.resolution_type = v_res)
          AND (v_tab IS NULL OR en.tab = v_tab)
          AND (
              v_text IS NULL
              OR en.raw_query ILIKE '%' || v_text || '%'
              OR COALESCE(en.resolved_name, '') ILIKE '%' || v_text || '%'
          )
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
            MAX(eff_game) AS game,
            MAX(eff_rarity) AS rarity,
            MAX(eff_type) AS type_line,
            MAX(eff_set) AS set_code,
            MAX(current_stock)::integer AS current_stock,
            COUNT(*)::integer AS searches,
            COUNT(*) FILTER (WHERE resolution_type IN ('suggestion_click', 'card_click', 'cart_add'))::integer AS clicks,
            COUNT(*) FILTER (WHERE resolution_type = 'cart_add')::integer AS cart_adds,
            ROUND(AVG(results_count))::integer AS avg_results,
            MAX(updated_at) AS last_seen
        FROM scoped
        WHERE resolved_name IS NOT NULL OR results_count > 0
        GROUP BY COALESCE(NULLIF(resolved_name, ''), normalized_query)
        ORDER BY searches DESC, clicks DESC, last_seen DESC
        LIMIT 30
    ),
    zero_queries AS (
        SELECT
            normalized_query AS term,
            COUNT(*)::integer AS searches,
            ARRAY_REMOVE(ARRAY_AGG(DISTINCT eff_game), NULL) AS games,
            MAX(eff_rarity) AS rarity,
            MAX(eff_type) AS type_line,
            MAX(updated_at) AS last_seen
        FROM scoped
        WHERE (resolution_type = 'zero_results' OR results_count = 0)
          AND resolved_name IS NULL
        GROUP BY normalized_query
        ORDER BY searches DESC, last_seen DESC
        LIMIT 25
    ),
    partial_queries AS (
        SELECT
            normalized_query AS term,
            COUNT(*)::integer AS searches,
            MAX(resolution_type) AS last_resolution,
            MAX(eff_game) AS game,
            ROUND(AVG(results_count))::integer AS avg_results,
            MAX(updated_at) AS last_seen
        FROM scoped
        WHERE resolution_type IN ('idle_settle', 'abandon', 'submit')
          AND resolved_name IS NULL
          AND results_count > 0
        GROUP BY normalized_query
        ORDER BY searches DESC, last_seen DESC
        LIMIT 25
    ),
    recent_events AS (
        SELECT
            raw_query,
            resolved_name,
            eff_game AS game_filter,
            eff_rarity AS rarity,
            eff_type AS type_line,
            results_count,
            resolution_type,
            updated_at
        FROM scoped
        ORDER BY updated_at DESC
        LIMIT 30
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

REVOKE ALL ON FUNCTION public.get_search_intelligence(integer, timestamptz, timestamptz, text, text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_search_intelligence(integer, timestamptz, timestamptz, text, text, text, text, text, text) TO authenticated;
