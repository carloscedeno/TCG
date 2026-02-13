import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Remove the function name prefix (e.g., '/tcg-api') if present
    if (path.startsWith('/tcg-api')) {
      path = path.replace('/tcg-api', '')
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

    if (path === '/' || path === '/tcg-api' || path === '/tcg-api/') {
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
      const mappedCards = (data || []).map((row: any) => ({
        card_id: row.printing_id,
        name: row.card_name,
        set: row.set_name,
        set_code: row.set_code,
        image_url: row.image_url,
        price: row.avg_market_price_usd || row.store_price || 0,
        rarity: row.rarity,
        type: row.type_line,
        cmc: row.cmc,
        game_id: row.game_id,
        colors: row.colors,
        release_date: row.release_date,
        valuation: {
          market_price: row.avg_market_price_usd || 0,
          store_price: row.store_price || 0,
          market_url: `https://www.cardkingdom.com/mtg/${sanitizeSlug(row.set_name)}/${sanitizeSlug(row.card_name)}`
        }
      }));

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
          sets(set_name, set_code, release_date),
          cards(rarity),
          aggregated_prices(avg_market_price_usd),
          products(price)
        `)
        .eq('card_id', cardData.card_id)
        .order('sets(release_date)', { ascending: false });

      // Fetch latest price for this specific printing
      const { data: priceData } = await supabase
        .from('aggregated_prices')
        .select('avg_market_price_usd')
        .eq('printing_id', printingId)
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      // Fetch store price from products table
      const { data: productData } = await supabase
        .from('products')
        .select('price')
        .eq('printing_id', printingId)
        .limit(1)
        .single();

      const marketPrice = priceData?.avg_market_price_usd || 0;
      const storePrice = productData?.price || 0;

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
        price: storePrice || marketPrice,
        valuation: {
          store_price: storePrice,
          market_price: marketPrice,
          market_url: `https://www.cardkingdom.com/mtg/${sanitizeSlug(setData.set_name)}/${sanitizeSlug(cardData.card_name)}`,
          valuation_avg: (storePrice + marketPrice) / 2
        },
        legalities: cardData.legalities || {},
        colors: cardData.colors || [],
        card_faces: cardData.card_faces || null,
        all_versions: (allVersions || []).map((v: any) => {
          // aggregated_prices and products are arrays, get first element
          const marketPrice = v.aggregated_prices?.[0]?.avg_market_price_usd || 0;
          const storePrice = v.products?.[0]?.price || 0;
          const displayPrice = storePrice || marketPrice;

          return {
            printing_id: v.printing_id,
            set_name: v.sets?.set_name || '',
            set_code: v.sets?.set_code || '',
            collector_number: v.collector_number || '',
            rarity: v.cards?.rarity || 'common',
            price: displayPrice,
            image_url: v.image_url || ''
          };
        })
      };
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
    // Optimized bulk import for inventory using RPC
    const mappedData = importData.map((row) => ({
      name: row[mapping?.name || 'name'] || row['name'],
      set: row[mapping?.set || 'set'] || row['set'],
      collector_number: row[mapping?.collector_number || 'collector_number'] || row['collector_number'],
      quantity: row[mapping?.quantity || 'quantity'] || row['quantity'] || '1',
      price: row[mapping?.price || 'price'] || row['price'] || '0',
      condition: row[mapping?.condition || 'condition'] || row['condition'] || 'NM'
    }))

    const { data: result, error: rpcError } = await supabase.rpc('bulk_import_inventory', {
      p_items: mappedData
    })

    if (rpcError) throw rpcError
    return result
  }

  const errors: string[] = []
  const failedIndices: number[] = []
  let importedCount = 0

  // Fallback for collection import - keep current row-by-row logic for now
  for (let i = 0; i < importData.length; i++) {
    const row = importData[i]
    try {
      const cardName = row[mapping?.name || 'name'] || row['name']
      const setCode = row[mapping?.set || 'set'] || row['set']
      const collectorNum = row[mapping?.collector_number || 'collector_number'] || row['collector_number']
      const quantity = parseInt(row[mapping?.quantity || 'quantity'] || row['quantity'] || '1')
      const price = parseFloat(row[mapping?.price || 'price'] || row['price'] || '0')
      const condition = row[mapping?.condition || 'condition'] || row['condition'] || 'NM'

      if (!cardName) {
        errors.push(`Row ${i + 1}: Missing card name`)
        failedIndices.push(i)
        continue
      }

      // Look up card_printing by card name + set_code + collector_number
      let query = supabase
        .from('card_printings')
        .select('printing_id, cards!inner(card_name), sets!inner(set_code)')
        .ilike('cards.card_name', cardName.trim())

      if (setCode) {
        query = query.ilike('sets.set_code', setCode.trim())
      }

      if (collectorNum) {
        query = query.eq('collector_number', collectorNum.trim())
      }

      const { data: printings, error: lookupError } = await query.limit(1)

      if (lookupError) {
        errors.push(`Row ${i + 1} (${cardName}): Lookup error - ${lookupError.message}`)
        failedIndices.push(i)
        continue
      }

      if (!printings || printings.length === 0) {
        errors.push(`Row ${i + 1} (${cardName} [${setCode || '?'}] #${collectorNum || '?'}): Card not found in database`)
        failedIndices.push(i)
        continue
      }

      const printingId = printings[0].printing_id

      // Collection import - add to user_collections
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
        errors.push(`Row ${i + 1} (${cardName}): Insert error - ${insertError.message}`)
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
