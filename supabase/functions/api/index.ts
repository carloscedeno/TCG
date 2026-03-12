import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from "npm:nodemailer";

// Force redeploy - 2026-02-12 19:05
interface RequestParams {
  q?: string
  game?: string
  set?: string
  rarity?: string
  color?: string
  limit?: string
  offset?: string
  sort?: string
  [key: string]: any
}

type ApiHandler = (supabase: SupabaseClient, path: string, method: string, params: RequestParams, authToken?: string) => Promise<any>

// UTILS
function sanitizeSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    let path = url.pathname
    const method = req.method

    // Remove only the function name prefix if present
    const functionPrefixes = ['/functions/v1/api', '/tcg-api', '/api'];
    for (const prefix of functionPrefixes) {
      if (path.startsWith(prefix)) {
        const nextChar = path[prefix.length];
        if (!nextChar || nextChar === '/') {
          path = path.slice(prefix.length);
          break;
        }
      }
    }

    // Standardize path: remove trailing slash and ensure it starts with /api/
    path = path.replace(/\/$/, '');
    if (!path) path = '/';

    if (path !== '/' && !path.startsWith('/api/')) {
      path = '/api' + (path.startsWith('/') ? '' : '/') + path;
    }

    // Extract auth token from request
    const authHeader = req.headers.get('Authorization')
    const authToken = authHeader?.replace('Bearer ', '') || undefined

    // Parse parameters based on method
    let params: RequestParams = {}
    if (method === 'GET') {
      // For GET requests, get parameters from query string
      params = Object.fromEntries(url.searchParams.entries())
    } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      // For other methods, get parameters from request body + URL search params
      const queryParams = Object.fromEntries(url.searchParams.entries())
      try {
        const bodyParams = await req.json()
        params = { ...queryParams, ...bodyParams }
      } catch {
        params = { ...queryParams }
      }
    }

    let response

    if (path === '/' || path === '/api' || path === '/api/') {
      response = {
        message: 'TCG API - Trading Card Game Price Aggregation System',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        available_endpoints: [
          '/api/games',
          '/api/sets',
          '/api/cards',
          '/api/prices',
          '/api/search',
          '/api/collections',
          '/api/cart',
          '/api/analytics',
          '/api/products',
          '/api/stats'
        ],
        documentation: 'Use the endpoints above to access TCG data and functionality'
      }
    }
    else if (path.startsWith('/api/games')) {
      response = await handleGamesEndpoint(supabase, path, method, params)
    }
    else if (path.startsWith('/api/sets')) {
      response = await handleSetsEndpoint(supabase, path, method, params)
    }
    else if (path.startsWith('/api/cards')) {
      response = await handleCardsEndpoint(supabase, path, method, params)
    }
    else if (path.startsWith('/api/prices')) {
      response = await handlePricesEndpoint(supabase, path, method, params)
    }
    else if (path.startsWith('/api/search')) {
      response = await handleSearchEndpoint(supabase, path, method, params)
    }
    else if (path.startsWith('/api/collections/import')) {
      response = await handleImportEndpoint(supabase, path, method, params, authToken)
    }
    else if (path.startsWith('/api/collections')) {
      response = await handleCollectionsEndpoint(supabase, path, method, params, authToken)
    }
    else if (path.startsWith('/api/cart')) {
      response = await handleCartEndpoint(supabase, path, method, params)
    }
    else if (path.startsWith('/api/analytics')) {
      response = await handleAnalyticsEndpoint(supabase, path, method, params)
    }
    else if (path.startsWith('/api/products')) {
      response = await handleProductsEndpoint(supabase, path, method, params)
    }
    else if (path.startsWith('/api/debug-products')) {
      response = { status: 'ok', message: 'Deployment confirmed - 2026-02-12 19:10' }
    }
    else if (path.startsWith('/api/stats')) {
      response = await handleStatsEndpoint(supabase, path, method, params)
    }
    else if (path.startsWith('/api/notifications/checkout')) {
      response = await handleNotificationsEndpoint(supabase, path, method, params)
    }
    else if (path.startsWith('/api/admin')) {
      response = await handleAdminEndpoint(supabase, path, method, params, authToken)
    }
    else {
      response = {
        error: 'Endpoint not found',
        available_endpoints: [
          '/api/games',
          '/api/sets',
          '/api/cards',
          '/api/prices',
          '/api/search',
          '/api/collections',
          '/api/watchlists',
          '/api/stats'
        ]
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: (response as any).error ? 400 : 200,
      },
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function handleGamesEndpoint(supabase: SupabaseClient, path: string, method: string, params: RequestParams) {
  if (method === 'GET') {
    if (path === '/api/games') {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)

      if (error) throw error
      return { games: data }
    }

    const gameCode = path.split('/').pop()
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('game_code', gameCode)
      .single()

    if (error) throw error
    return { game: data }
  }

  if (method === 'POST') {
    const { data, error } = await supabase
      .from('games')
      .insert(params)
      .select()
      .single()

    if (error) throw error
    return { game: data }
  }

  throw new Error('Method not allowed')
}

async function handleSetsEndpoint(supabase: SupabaseClient, path: string, method: string, params: RequestParams) {
  if (method === 'GET') {
    if (path === '/api/sets') {
      const { game_code = 'MTG' } = params

      // Use !inner join to filter by game_code
      const { data, error } = await supabase
        .from('sets')
        .select('*, games!inner(game_name, game_code)')
        .eq('is_digital', false)
        .eq('games.game_code', game_code)
        .order('release_date', { ascending: false })

      if (error) throw error
      return { sets: data }
    }

    const setId = path.split('/').pop()
    const { data, error } = await supabase
      .from('sets')
      .select('*, games(game_name, game_code)')
      .eq('set_id', setId)
      .single()

    if (error) throw error
    return { set: data }
  }

  if (method === 'POST') {
    const { data, error } = await supabase
      .from('sets')
      .insert(params)
      .select()
      .single()

    if (error) throw error
    return { set: data }
  }

  throw new Error('Method not allowed')
}

async function handleCardsEndpoint(supabase: SupabaseClient, path: string, method: string, params: RequestParams) {
  if (method === 'GET') {
    if (path === '/api/cards') {
      const { q, game, set, rarity, color, type, year_from, year_to, limit = 50, offset = 0, sort = 'release_date' } = params

      // Parse parameters for SQL function
      const limitVal = parseInt(limit as string);
      const offsetVal = parseInt(offset as string);

      // Parse game IDs
      let gameIds = null;
      if (game) {
        const gameNames = (game as string).split(',').map((g: string) => g.trim());
        const gameMap: Record<string, number> = { 'Magic: The Gathering': 22, 'Pokémon': 23, 'Lorcana': 24, 'Yu-Gi-Oh!': 26 };
        gameIds = gameNames.map((gn: string) => gameMap[gn]).filter((id?: number) => id !== undefined);
      }

      // Parse rarities (lowercase for case-insensitive matching)
      let rarities = null;
      if (rarity) {
        rarities = (rarity as string).split(',').map((r: string) => r.trim().toLowerCase());
      }

      // Parse sets
      let setNames = null;
      if (set) {
        setNames = (set as string).split(',').map((s: string) => s.trim());
      }

      // Parse colors
      let colorCodes = null;
      if (color) {
        const colorNames = (color as string).split(',').map((c: string) => c.trim());
        const colorMap: Record<string, string> = { 'White': 'W', 'Blue': 'U', 'Black': 'B', 'Red': 'R', 'Green': 'G', 'Colorless': 'C' };
        colorCodes = colorNames.map((cn: string) => colorMap[cn]).filter((code?: string) => code !== undefined);
      }

      // Parse types
      let typeFilter = null;
      if (type) {
        typeFilter = (type as string).split(',').map((t: string) => t.trim());
      }

      // Parse year range
      const yearFrom = year_from ? parseInt(year_from as string) : null;
      const yearTo = year_to ? parseInt(year_to as string) : null;

      // Call optimized SQL function
      const { data, error } = await supabase.rpc('get_unique_cards_optimized', {
        search_query: q || null,
        game_ids: gameIds,
        rarity_filter: rarities,
        set_names: setNames,
        color_codes: colorCodes,
        type_filter: typeFilter,
        year_from: yearFrom,
        year_to: yearTo,
        limit_count: limitVal,
        offset_count: offsetVal,
        sort_by: sort as string
      });

      if (error) throw error;

      // Map to frontend format
      const mappedCards = (data || []).map((row: any) => {
        // Business rule: CK NM is the single source of truth for pricing
        // Fallback logic: Use foil price if non-foil is missing
        const mPriceNormal = row.avg_market_price_usd || 0;
        const mPriceFoil = row.avg_market_price_foil_usd || 0;

        const finalPrice = mPriceNormal > 0 ? mPriceNormal : mPriceFoil;
        const vAvg = finalPrice;

        return {
          card_id: row.printing_id,
          name: row.card_name,
          set: row.set_name,
          set_code: row.set_code,
          image_url: row.image_url,
          price: finalPrice,
          rarity: row.rarity,
          type: row.type_line,
          cmc: row.cmc,
          game_id: row.game_id,
          colors: row.colors,
          release_date: row.release_date,
          valuation: {
            market_price: mPriceNormal,
            market_price_foil: mPriceFoil,
            store_price: row.store_price || 0,
            valuation_avg: vAvg,
            market_url: `https://www.cardkingdom.com/mtg/${sanitizeSlug(row.set_name)}/${sanitizeSlug(row.card_name)}`
          }
        };
      });

      // Get total count (estimate for performance)
      // TODO: Implement proper count in SQL function if exact count is needed
      const estimatedTotal = mappedCards.length < limitVal ? offsetVal + mappedCards.length : offsetVal + limitVal + 1;

      return {
        cards: mappedCards,
        total_count: estimatedTotal,
        offset: offsetVal,
        limit: limitVal
      }
    }

    if (path.startsWith('/api/cards/')) {
      const printingId = path.split('/').pop()

      // Fetch the main card printing with all related data
      const { data: printing, error: printingError } = await supabase
        .from('card_printings')
        .select(`
          *,
          cards(*),
          sets(*)
        `)
        .eq('printing_id', printingId)
        .single();

      if (printingError) throw printingError;
      if (!printing) throw new Error('Card not found');

      const cardData = printing.cards || {};
      const setData = printing.sets || {};

      // Fetch all versions of this card
      const { data: allVersions } = await supabase
        .from('card_printings')
        .select(`
          printing_id,
          image_url,
          collector_number,
          is_foil,
          finishes,
          prices,
          avg_market_price_usd,
          avg_market_price_foil_usd,
          cards(rarity, card_name),
          sets(set_name, set_code, release_date)
        `)
        .eq('card_id', cardData.card_id)
        .order('sets(release_date)', { ascending: false });

      // Fetch all products for all versions to get store prices/stock
      const versionPids = allVersions?.map((v: any) => v.printing_id) || [];
      const { data: allVersionProducts } = await supabase
        .from('products')
        .select('printing_id, price, stock, id')
        .in('printing_id', versionPids);

      // Fetch latest price from price_history (Card Kingdom NM) - both foil and non-foil
      const { data: marketPriceData } = await supabase
        .rpc('get_latest_ck_price', { p_printing_id: printingId, p_is_foil: false });

      const { data: marketPriceFoilData } = await supabase
        .rpc('get_latest_ck_price', { p_printing_id: printingId, p_is_foil: true });

      // Fetch store price from products table
      const { data: productData } = await supabase
        .from('products')
        .select('price, stock, id')
        .eq('printing_id', printingId)
        .maybeSingle();

      const marketPrice = marketPriceData || 0;
      const marketPriceFoil = marketPriceFoilData || 0;

      // Business rule: CK NM is the single source of truth. Fallback to foil if non-foil missing.
      const finalPrice = marketPrice > 0 ? marketPrice : marketPriceFoil;
      const valuationAvg = finalPrice;

      return {
        card_id: printing.printing_id,
        name: cardData.card_name,
        mana_cost: cardData.mana_cost || '',
        type: cardData.type_line || '',
        oracle_text: cardData.oracle_text || '',
        flavor_text: printing.flavor_text || '',
        artist: printing.artist || '',
        rarity: cardData.rarity || 'common',
        set: setData.set_name || '',
        set_code: setData.set_code || '',
        collector_number: printing.collector_number || '',
        image_url: printing.image_url || '',
        price: finalPrice,
        is_foil: printing.is_foil || false,
        finish: printing.is_foil ? 'foil' : 'nonfoil',
        stock: productData?.stock || 0,
        product_id: productData?.id,
        valuation: {
          store_price: productData?.price || 0,
          market_price: marketPrice,
          market_price_foil: marketPriceFoil,
          market_url: `https://www.cardkingdom.com/mtg/${sanitizeSlug(setData.set_name)}/${sanitizeSlug(cardData.card_name)}`,
          valuation_avg: valuationAvg
        },
        legalities: cardData.legalities || {},
        colors: cardData.colors || [],
        card_faces: cardData.card_faces || null,
        all_versions: (allVersions || []).flatMap((v: any) => {
          const vProd = allVersionProducts?.find((p: any) => p.printing_id === v.printing_id);
          const vStorePrice = vProd?.price || 0;
          const vMarketPrice = v.avg_market_price_usd || 0;
          const vMarketPriceFoil = v.avg_market_price_foil_usd || 0;

          const vFinalMarket = vMarketPrice > 0 ? vMarketPrice : vMarketPriceFoil;
          const vFinalPrice = vStorePrice > 0 ? vStorePrice : vFinalMarket;
          const vValAvg = (vStorePrice > 0 && vFinalMarket > 0)
            ? (vStorePrice + vFinalMarket) / 2
            : (vStorePrice || vFinalMarket || 0);

          const baseEntry = {
            printing_id: v.printing_id,
            set_name: v.sets?.set_name || '',
            set_code: v.sets?.set_code || '',
            collector_number: v.collector_number || '',
            rarity: v.cards?.rarity || 'common',
            price: vFinalPrice,
            market_price: vMarketPrice,
            market_price_foil: vMarketPriceFoil,
            store_price: vStorePrice,
            valuation_avg: vValAvg,
            image_url: v.image_url || '',
            prices: v.prices || {},
            stock: vProd?.stock || 0
          };

          const finishes = v.finishes || (v.is_foil ? ['foil'] : ['nonfoil']);

          const entries: any[] = [];

          const pushesNonFoil = finishes.includes('nonfoil') || (!finishes.includes('foil'));
          const pushesFoil = finishes.includes('foil');
          const pushesEtched = finishes.includes('etched');

          const baseIsFoil = !!v.is_foil || v.finish === 'foil';

          if (pushesNonFoil) {
            const isSynthetic = baseIsFoil && (pushesFoil || pushesEtched);
            entries.push({
              ...baseEntry,
              printing_id: isSynthetic ? `${v.printing_id}-nonfoil` : v.printing_id,
              finish: 'nonfoil',
              is_foil: false
            });
          }

          if (pushesFoil) {
            const isSynthetic = !baseIsFoil && (pushesNonFoil || pushesEtched);
            entries.push({
              ...baseEntry,
              printing_id: isSynthetic ? `${v.printing_id}-foil` : v.printing_id,
              finish: 'foil',
              is_foil: true
            });
          }

          if (pushesEtched) {
            const isSynthetic = (v.finish !== 'etched') && (pushesNonFoil || pushesFoil);
            entries.push({
              ...baseEntry,
              printing_id: isSynthetic ? `${v.printing_id}-etched` : v.printing_id,
              finish: 'etched',
              is_foil: true
            });
          }

          // Fallback just in case nothing was pushed
          if (entries.length === 0) {
            entries.push({
              ...baseEntry,
              finish: v.is_foil ? 'foil' : 'nonfoil',
              is_foil: !!v.is_foil
            });
          }

          return entries;
        })
      };
    }
    // Handle the case where someone calls /cards/:id without /api prefix
    else if (path.startsWith('/cards/')) {
      const printingId = path.split('/').pop();
      // Redirect or handle same as above - for simplicity, let's just make the main handler smarter
      // But since we are already inside handleCardsEndpoint, it means path started with /api/cards
      // unless we changed the caller logic.
    }
  }

  throw new Error('Method not allowed')
}

async function handlePricesEndpoint(supabase: SupabaseClient, path: string, method: string, params: RequestParams) {
  if (method === 'GET') {
    const { printing_id, condition_id, days = 30 } = params

    let query = supabase
      .from('price_history')
      .select(`
        *,
        conditions(condition_name),
        sources(source_name)
      `)
      .order('timestamp', { ascending: false })

    if (printing_id) {
      query = query.eq('printing_id', printing_id)
    }

    if (condition_id) {
      query = query.eq('condition_id', condition_id)
    }

    if (days) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days))
      query = query.gte('timestamp', cutoffDate.toISOString())
    }

    const { data, error } = await query
    if (error) throw error
    return { prices: data }
  }

  if (method === 'POST') {
    const { data, error } = await supabase
      .from('price_history')
      .insert(params)
      .select()
      .single()

    if (error) throw error
    return { price: data }
  }

  throw new Error('Method not allowed')
}

async function handleSearchEndpoint(supabase: SupabaseClient, path: string, method: string, params: RequestParams) {
  if (method === 'POST') {
    const { query, game_code, limit = 20 } = params

    if (!query) {
      throw new Error('Search query is required')
    }

    const { data, error } = await supabase
      .rpc('search_cards_with_prices', {
        search_query: query,
        game_code_filter: game_code,
        limit_count: typeof limit === 'string' ? parseInt(limit) : limit
      })

    if (error) throw error
    return { results: data }
  }

  throw new Error('Method not allowed')
}

async function handleImportEndpoint(supabase: SupabaseClient, path: string, method: string, params: RequestParams, authToken?: string) {
  if (method !== 'POST') throw new Error('Method not allowed')

  // Authenticate user
  if (!authToken) throw new Error('Unauthorized: No auth token provided')
  const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
  if (authError || !user) throw new Error('Unauthorized: Invalid token')

  const importType = params.import_type || 'collection'
  const importData = params.data as any[]
  const mapping = params.mapping as Record<string, string>

  if (!importData || !Array.isArray(importData) || importData.length === 0) {
    throw new Error('No data provided for import')
  }

  if (importType === 'inventory') {
    // Optimized bulk import for inventory using RPC v3 (Robust Restoration)
    const mappedData = importData.map((row) => {
      const name = row[mapping?.name] || row['Name'] || row['name'] || row['Card Name'] || row['card_name'];
      const setCode = row[mapping?.set] || row['Set code'] || row['set'] || row['set_code'] || row['Expansion'] || row['Set'];
      const collectorNumber = row[mapping?.collector_number] || row['Collector number'] || row['collector_number'] || row['Number'] || row['collectorNum'];
      const scryfallId = row[mapping?.scryfall_id] || row['Scryfall ID'] || row['scryfall_id'];

      const quantityRaw = row[mapping?.quantity] || row['Quantity'] || row['quantity'] || row['Amount'] || row['qty'] || '1';
      const quantity = parseInt(String(quantityRaw)) || 1;

      const priceRaw = row[mapping?.price] || row['Purchase price'] || row['price'] || row['Value'] || row['USD'] || '0';
      const price = parseFloat(String(priceRaw)) || 0;

      const condition = normalizeCondition(row[mapping?.condition] || row['Condition'] || row['condition']);

      let finish = row[mapping?.finish] || row['Foil'] || row['finish'] || row['Finish'] || 'nonfoil';
      finish = String(finish).toLowerCase().includes('foil') ? 'foil' : 'nonfoil';

      return {
        name: name || '',
        set_code: setCode || '',
        collector_number: collectorNumber || '',
        quantity,
        price,
        condition,
        finish,
        scryfall_id: scryfallId || ''
      }
    })

    const { data: result, error: rpcError } = await supabase.rpc('bulk_import_inventory', {
      p_items: mappedData,
      p_user_id: user.id
    })

    if (rpcError) throw rpcError
    return result
  }

  // Collection import
  const errors: string[] = []
  const failedIndices: number[] = []
  let importedCount = 0

  for (let i = 0; i < importData.length; i++) {
    const row = importData[i]
    try {
      const name = row[mapping?.name] || row['Name'] || row['name'] || row['Card Name'] || row['card_name'];
      const setCode = row[mapping?.set] || row['Set code'] || row['set'] || row['set_code'] || row['Expansion'] || row['Set'];
      const collectorNum = row[mapping?.collector_number] || row['Collector number'] || row['collector_number'] || row['Number'] || row['collectorNum'];
      const scryfallId = row[mapping?.scryfall_id] || row['Scryfall ID'] || row['scryfall_id'];

      const qtyRaw = row[mapping?.quantity] || row['Quantity'] || row['quantity'] || row['Amount'] || row['qty'] || '1';
      const quantity = parseInt(String(qtyRaw)) || 1;

      const priceRaw = row[mapping?.price] || row['Purchase price'] || row['price'] || row['Value'] || row['USD'] || '0';
      const price = parseFloat(String(priceRaw)) || 0;

      const condition = normalizeCondition(row[mapping?.condition] || row['Condition'] || row['condition']);

      if (!name && !scryfallId) {
        errors.push(`Row ${i + 1}: Missing card name or Scryfall ID`)
        failedIndices.push(i)
        continue
      }

      // Look up card_printing
      let query = supabase
        .from('card_printings')
        .select('printing_id, cards(card_name), sets(set_code)')

      if (scryfallId && String(scryfallId).trim().length > 0) {
        query = query.eq('scryfall_id', String(scryfallId).trim())
      } else {
        query = query.ilike('cards.card_name', String(name).trim())
        if (setCode) query = query.ilike('sets.set_code', String(setCode).trim())
        if (collectorNum) query = query.eq('collector_number', String(collectorNum).trim())
      }

      const { data: printings, error: lookupError } = await query.limit(1)

      if (lookupError) {
        errors.push(`Row ${i + 1} (${name}): Lookup error - ${lookupError.message}`)
        failedIndices.push(i)
        continue
      }

      if (!printings || printings.length === 0) {
        errors.push(`Row ${i + 1} (${name} [${setCode || '?'}] #${collectorNum || '?'}): Card not found`)
        failedIndices.push(i)
        continue
      }

      const printingId = printings[0].printing_id

      const { error: insertError } = await supabase
        .from('user_collections')
        .upsert({
          user_id: user.id,
          printing_id: printingId,
          quantity: quantity,
          purchase_price: price,
          condition_id: null
        }, { onConflict: 'user_id,printing_id' })

      if (insertError) {
        errors.push(`Row ${i + 1} (${name}): Insert error - ${insertError.message}`)
        failedIndices.push(i)
        continue
      }

      importedCount++
    } catch (rowErr: any) {
      errors.push(`Row ${i + 1}: Unexpected error - ${rowErr.message}`)
      failedIndices.push(i)
    }
  }

  return {
    imported_count: importedCount,
    total_rows: importData.length,
    errors: errors,
    failed_indices: failedIndices
  }
}

async function handleCollectionsEndpoint(supabase: SupabaseClient, path: string, method: string, params: RequestParams, authToken?: string) {
  if (method === 'GET') {
    const { data: { user } } = await supabase.auth.getUser(authToken)
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('user_collections')
      .select(`
        id, printing_id, quantity, condition_id, purchase_price,
        card_printings(
          *,
          cards(card_name),
          sets(set_name)
        )
      `)
      .eq('user_id', user.id)

    if (error) throw error
    return { collection: data }
  }

  if (method === 'POST') {
    const { data: { user } } = await supabase.auth.getUser(authToken)
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('user_collections')
      .insert({
        ...params,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return { collection_item: data }
  }

  if (method === 'PATCH' || method === 'PUT') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const itemId = path.split('/').pop()
    const { data, error } = await supabase
      .from('user_collections')
      .update(params)
      .eq('id', itemId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return { collection_item: data }
  }

  if (method === 'DELETE') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const itemId = path.split('/').pop()
    if (!itemId || itemId === 'collections') throw new Error('Missing ID')

    const { error } = await supabase
      .from('user_collections')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id)

    if (error) throw error
    return { message: 'Collection item deleted' }
  }

  throw new Error('Method not allowed')
}

async function handleCartEndpoint(supabase: any, path: string, method: string, params: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (method === 'GET') {
    // Get or create cart
    let { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle()
    if (!cart) {
      const { data: newCart, error: cErr } = await supabase.from('carts').insert({ user_id: user.id }).select().single()
      if (cErr) throw cErr
      cart = newCart
    }

    const { data: items } = await supabase.from('cart_items').select('*, products(*)').eq('cart_id', cart.id)
    return { cart_id: cart.id, items: items || [] }
  }

  if (method === 'POST' && path.endsWith('/add')) {
    const { printing_id, product_id, quantity = 1 } = params
    let { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle()
    if (!cart) {
      const { data: newCart } = await supabase.from('carts').insert({ user_id: user.id }).select().single()
      cart = newCart
    }

    let target_prod_id = product_id
    if (!target_prod_id && printing_id) {
      const { data: prod } = await supabase.from('products').select('id').eq('printing_id', printing_id).maybeSingle()
      target_prod_id = prod?.id
    }

    if (!target_prod_id) throw new Error('Product not found in marketplace inventory')

    const { data, error } = await supabase.from('cart_items').upsert({
      cart_id: cart.id,
      product_id: target_prod_id,
      quantity: parseInt(quantity)
    }, { onConflict: 'cart_id,product_id' }).select().single()

    if (error) throw error
    return { item: data }
  }

  if (method === 'POST' && path.endsWith('/checkout')) {
    const { shipping_address } = params

    // Get cart items
    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single()
    if (!cart) throw new Error('No cart found')

    const { data: cartItems } = await supabase.from('cart_items').select('*, products(*)').eq('cart_id', cart.id)
    if (!cartItems?.length) throw new Error('Cart is empty')

    const total = cartItems.reduce((sum: number, i: any) => sum + ((i.products?.price || 0) * i.quantity), 0)

    const simplifiedItems = cartItems.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.products?.price || 0
    }))

    // Use the atomic RPC for consistent logic
    const { data, error } = await supabase.rpc('create_order_atomic', {
      p_user_id: user.id,
      p_items: simplifiedItems,
      p_shipping_address: shipping_address || {},
      p_total_amount: total
    })

    if (error) throw error
    return data
  }

  throw new Error('Method not allowed')
}

async function handleAnalyticsEndpoint(supabase: any, path: string, method: string, params: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: col } = await supabase.from('user_collections').select('quantity, printing_id, purchase_price').eq('user_id', user.id)
  if (!col?.length) return { total_market_value: 0, total_store_value: 0 }

  const pids = col.map((i: any) => i.printing_id)
  const { data: prices } = await supabase.from('aggregated_prices').select('printing_id, avg_market_price_usd').in('printing_id', pids)
  const { data: prods } = await supabase.from('products').select('printing_id, price').in('printing_id', pids)

  const m_map = Object.fromEntries(prices?.map((p: any) => [p.printing_id, p.avg_market_price_usd]) || [])
  const s_map = Object.fromEntries(prods?.map((p: any) => [p.printing_id, p.price]) || [])

  let total_market = 0
  let total_store = 0

  col.forEach((i: any) => {
    total_market += (m_map[i.printing_id] || 0) * i.quantity
    total_store += (s_map[i.printing_id] || 0) * i.quantity
  })

  return {
    total_market_value: total_market,
    total_store_value: total_store
  }
}

async function handleWatchlistsEndpoint(supabase: SupabaseClient, path: string, method: string, params: RequestParams) {
  if (method === 'GET') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('user_watchlists')
      .select(`
        *,
        card_printings(
          *,
          cards(card_name),
          sets(set_name)
        )
      `)
      .eq('user_id', user.id)

    if (error) throw error
    return { watchlist: data }
  }

  if (method === 'POST') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('user_watchlists')
      .insert({
        ...params,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return { watchlist_item: data }
  }

  if (method === 'DELETE') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const watchlistId = path.split('/').pop()
    const { error } = await supabase
      .from('user_watchlists')
      .delete()
      .eq('watchlist_id', watchlistId)
      .eq('user_id', user.id)

    if (error) throw error
    return { message: 'Watchlist item deleted' }
  }

  throw new Error('Method not allowed')
}

async function handleStatsEndpoint(supabase: SupabaseClient, path: string, method: string, params: RequestParams) {
  if (method === 'GET') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    if (path === '/api/stats/collection') {
      const { data, error } = await supabase
        .rpc('get_user_collection_stats', { user_uuid: user.id })

      if (error) throw error
      return { stats: data }
    }

    if (path === '/api/stats/prices') {
      const { printing_id, days = 30 } = params

      if (!printing_id) {
        throw new Error('printing_id is required for price stats')
      }

      const { data, error } = await supabase
        .rpc('calculate_price_trends', {
          printing_uuid: printing_id,
          days_back: parseInt(days)
        })

      if (error) throw error
      return { price_trends: data }
    }
  }

  throw new Error('Method not allowed')
}

async function handleProductsEndpoint(supabase: SupabaseClient, path: string, method: string, params: RequestParams) {
  if (method === 'GET') {
    const { q, game, in_stock = 'true', limit = 50, offset = 0, sort = 'newest' } = params

    let query = supabase.from('products_with_prices').select('*', { count: 'planned' })

    if (q) {
      query = query.ilike('name', `%${q}%`)
    }

    if (game) {
      query = query.eq('game', game)
    }

    if (in_stock === 'true') {
      query = query.gt('stock', 0)
    }

    // Sorting - Now uses effective_price from the view for correct ordering
    if (sort === "price_asc") {
      query = query.order('effective_price', { ascending: true })
    } else if (sort === "price_desc") {
      query = query.order('effective_price', { ascending: false })
    } else if (sort === "newest") {
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('name', { ascending: true })
    }

    const limitVal = typeof limit === 'string' ? parseInt(limit) : limit
    const offsetVal = typeof offset === 'string' ? parseInt(offset) : offset
    query = query.range(offsetVal, offsetVal + limitVal - 1)

    const { data, error, count } = await query

    if (error) throw error

    // Map effective_price to price for frontend compatibility
    const processedProducts = (data || []).map((p: any) => ({
      ...p,
      price: p.effective_price
    }));

    return {
      products: processedProducts,
      total_count: count || 0
    }
  }

  throw new Error('Method not allowed')
}

async function handleAdminEndpoint(supabase: SupabaseClient, path: string, method: string, params: RequestParams, authToken?: string) {
  // Basic Auth Check
  if (!authToken) throw new Error('Unauthorized: No auth token');
  const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
  if (authError || !user) throw new Error('Unauthorized: Invalid token');

  // GET /api/admin/tasks
  if (method === 'GET' && path === '/api/admin/tasks') {
    // Return empty array to verify connectivity and fix 400 error
    return [];
  }

  // POST /api/admin/scraper/run/:source
  if (method === 'POST' && path.startsWith('/api/admin/scraper/run/')) {
    const source = path.split('/').pop();
    return { message: `Scraper '${source}' triggered successfully (Mock)`, status: 'queued' };
  }

  // POST /api/admin/catalog/sync/:gameCode
  if (method === 'POST' && path.startsWith('/api/admin/catalog/sync/')) {
    const gameCode = path.split('/').pop();
    return { message: `Catalog sync for '${gameCode}' triggered successfully (Mock)`, status: 'queued' };
  }

  // GET /api/admin/tasks/:id/logs
  if (method === 'GET' && path.includes('/logs')) {
    return { logs: "Logs system initializing... No logs currently available." };
  }

  throw new Error('Admin endpoint not found');
}

/**
 * Normalizes card condition strings from various sources (ManaBox, Cardmarket, etc.)
 * into the internal database format (NM, LP, MP, HP, D)
 */
function normalizeCondition(cond: string): string {
  if (!cond) return 'NM';
  const c = String(cond).toLowerCase().trim();
  if (c === 'near_mint' || c === 'mint' || c === 'nm' || c === 'm') return 'NM';
  if (c === 'lightly_played' || c === 'lp' || c === 'excellent' || c === 'ex') return 'LP';
  if (c === 'moderately_played' || c === 'mp' || c === 'good' || c === 'gd' || c === 'fine') return 'MP';
  if (c === 'heavily_played' || c === 'hp' || c === 'played') return 'HP';
  if (c === 'damaged' || c === 'd' || c === 'poor') return 'D';
  return 'NM'; // Default to Near Mint
}

async function handleNotificationsEndpoint(supabase: SupabaseClient, path: string, method: string, params: RequestParams) {
  if (method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  const { order_id, user_email, admin_email, order_total, items, current_user_id } = params;

  if (!order_id || !order_total || !items) {
    return { error: 'Missing required parameters (order_id, order_total, items)' };
  }

  const SmtpUser = Deno.env.get('SMTP_USERNAME');
  const SmtpPass = Deno.env.get('SMTP_PASSWORD');
  const SmtpServer = Deno.env.get('SMTP_SERVER') || 'smtp.hostinger.com';

  console.log(`[Email Service] Attempting to send order email for ${order_id}. SMTP_USERNAME configured: ${!!SmtpUser}`);

  if (!SmtpUser || !SmtpPass) {
    console.warn("Email Service: SMTP credentials not configured (SMTP_USERNAME/SMTP_PASSWORD), skipping email.");
    return { success: true, message: "Emails skipped (not configured)" };
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: SmtpServer,
    port: 465,
    secure: true, // Use TLS
    auth: {
      user: SmtpUser,
      pass: SmtpPass,
    },
  });

  try {
    const itemsArray = Array.isArray(items) ? items : [];
    const items_html = itemsArray.map((item: any) => {
      const name = item?.products?.name || item?.name || 'Unknown Item';
      const finish = item?.products?.finish || item?.finish;
      const onDemand = item?.products?.is_on_demand || item?.is_on_demand;

      let variantLabel = '';
      if (finish === 'foil' || finish === 'etched') {
        variantLabel += ` [${finish.toUpperCase()}]`;
      }
      if (onDemand) {
        variantLabel += ` [POR ENCARGO]`;
      }

      return `<li style="margin-bottom: 8px;">
        <strong>${item?.quantity || 1}x ${name}${variantLabel}</strong> - $${Number(item?.products?.price || item?.price || 0).toFixed(2)}
      </li>`;
    }).join('');

    const trackingLink = `https://www.geekorium.shop/order/${order_id}`;

    const customerEmailPromise = user_email ? transporter.sendMail({
      from: `"Geekorium Shop" <${SmtpUser}>`,
      to: user_email,
      subject: `Confirmación de Pedido ${order_id} - Geekorium Shop`,
      html: `
        <html>
            <body>
                <h2>¡Gracias por tu compra en Geekorium Shop!</h2>
                <p>Tu pedido <strong>${order_id}</strong> ha sido confirmado.</p>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Resumen de la compra:</h3>
                    <ul style="padding-left: 20px;">
                        ${items_html}
                    </ul>
                    <h3 style="margin-bottom: 0;">Total: $${Number(order_total).toFixed(2)}</h3>
                </div>
                
                <div style="margin: 30px 0; text-align: center;">
                    <a href="${trackingLink}" style="background-color: #00AEB4; color: white; padding: 15px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
                        Rastrear mi Pedido
                    </a>
                </div>

                <p style="color: #666; font-size: 12px;">Si el botón no funciona, copia y pega este enlace: <br> ${trackingLink}</p>
                <p>Nos pondremos en contacto pronto para coordinar la entrega o pago final.</p>

            </body>
        </html>
      `,
    }) : Promise.resolve();

    const adminEmailOverride = admin_email || "geekorium.tcg@gmail.com";
    const adminEmailPromise = transporter.sendMail({
      from: `"System Notifications" <${SmtpUser}>`,
      to: adminEmailOverride,
      subject: `¡Nueva Venta! Pedido ${order_id}`,
      html: `
        <html>
            <body>
                <h2>¡Nueva Venta en Geekorium Shop!</h2>
                <p>Se ha registrado un nuevo pedido con el ID: <strong>${order_id}</strong>.</p>
                <p>ID del Usuario: ${current_user_id || 'Guest'}</p>
                <h3>Artículos comprados:</h3>
                <ul style="padding-left: 20px;">
                    ${items_html}
                </ul>
                <h3>Total: $${Number(order_total).toFixed(2)}</h3>

                <p>Por favor revisa el panel de administración para más detalles.</p>
            </body>
        </html>
      `,
    });

    await Promise.all([customerEmailPromise, adminEmailPromise]);
    console.log(`Emails sent successfully for order ${order_id}`);

    return { success: true, message: "Emails sent successfully" };
  } catch (error: any) {
    console.error("Failed to send emails:", error);
    // Return success: false but do not throw 500 error, so checkout completes gracefully
    return { success: false, error: `Failed to send emails: ${error.message}` };
  }
}

