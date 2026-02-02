import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Force redeploy - 2026-02-01 20:45
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

type ApiHandler = (supabase: SupabaseClient, path: string, method: string, params: RequestParams) => Promise<any>

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

    // Parse parameters based on method
    let params = {}
    if (method === 'GET') {
      // For GET requests, get parameters from query string
      params = Object.fromEntries(url.searchParams.entries())
    } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      // For other methods, get parameters from request body
      try {
        params = await req.json()
      } catch {
        params = {}
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
    else if (path.startsWith('/api/collections')) {
      response = await handleCollectionsEndpoint(supabase, path, method, params)
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
      const { game_code } = params
      let query = supabase
        .from('sets')
        .select('*, games(game_name, game_code)')
        .eq('is_digital', false)

      if (game_code) {
        query = query.eq('games.game_code', game_code)
      }

      const { data, error } = await query
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
      const { q, game, set, rarity, color, limit = 50, offset = 0 } = params

      // Determine if we need to force inner joins for filtering
      const cardsJoin = (q || rarity || game || color) ? "cards!inner" : "cards"
      const setsJoin = set ? "sets!inner" : "sets"

      let query = supabase.from('card_printings').select(`
        printing_id, 
        image_url,
        ${cardsJoin}(card_id, card_name, type_line, rarity, game_id, colors),
        ${setsJoin}(set_name, released_at),
        aggregated_prices(avg_market_price_usd)
      `, { count: 'exact' })

      // Apply search filter
      if (q) {
        query = query.ilike('cards.card_name', `%${q}%`)
      }

      // Apply rarity filter
      if (rarity) {
        const rarities = rarity.split(',').map((r: string) => r.trim().toLowerCase())
        query = query.in('cards.rarity', rarities)
      }

      // Apply game filter
      if (game) {
        const gameNames = game.split(',').map((g: string) => g.trim())
        const gameMap: Record<string, number> = { 'Magic: The Gathering': 22, 'Pokémon': 23, 'Lorcana': 24, 'Yu-Gi-Oh!': 26 }
        const gameIds = gameNames.map((gn: string) => gameMap[gn]).filter((id?: number) => id !== undefined)
        if (gameIds.length > 0) {
          query = query.in('cards.game_id', gameIds)
        }
      }

      // Apply set filter
      if (set) {
        const setNames = set.split(',').map((s: string) => s.trim())
        query = query.in('sets.set_name', setNames)
      }

      // Apply color filter
      if (color) {
        const colorNames = color.split(',').map((c: string) => c.trim())
        const colorMap: Record<string, string> = { 'White': 'W', 'Blue': 'U', 'Black': 'B', 'Red': 'R', 'Green': 'G', 'Colorless': 'C' }
        const colorCodes = colorNames.map((cn: string) => colorMap[cn]).filter((code?: string) => code !== undefined)
        if (colorCodes.length > 0) {
          query = query.overlap('cards.colors', colorCodes)
        }
      }

      // Calculate limits first
      const unique = params.unique === 'true' || params.unique === undefined; // Default to unique for primary grid
      const limitVal = parseInt(params.limit || '50');
      const offsetVal = parseInt(params.offset || '0');
      const fetchLimit = unique ? limitVal * 3 : limitVal;

      // Apply sorting - simplified to avoid timeout
      // Note: PostgREST doesn't support ordering by nested relations efficiently
      // We'll sort by printing_id (which is indexed) and let the frontend handle additional sorting if needed
      const sortField = params.sort || 'release_date';
      query = query.order('printing_id', { ascending: false });

      // Apply range after sorting
      query = query.range(offsetVal, offsetVal + fetchLimit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      // Deduplicate and Map to frontend format
      const seenCards = new Set();
      const mappedCards = [];

      for (const item of (data || [])) {
        const cardData = item.cards || {};
        const cardId = cardData.card_id;

        if (unique && seenCards.has(cardId)) continue;
        if (unique) seenCards.add(cardId);

        const setData = item.sets || {};
        const marketPrice = item.aggregated_prices?.[0]?.avg_market_price_usd || 0;

        mappedCards.push({
          card_id: item.printing_id,
          name: cardData.card_name,
          set: setData.set_name,
          set_code: setData.set_code,
          image_url: item.image_url,
          price: marketPrice, // Prioritize market price
          rarity: cardData.rarity,
          type: cardData.type_line,
          game_id: cardData.game_id,
          colors: cardData.colors,
          release_date: setData.released_at,
          valuation: {
            market_price: marketPrice,
            market_url: `https://www.cardkingdom.com/mtg/${sanitizeSlug(setData.set_name)}/${sanitizeSlug(cardData.card_name)}`
          }
        });

        if (mappedCards.length >= limitVal) break;
      }

      return {
        cards: mappedCards,
        total_count: count,
        offset: offsetVal,
        limit: limitVal
      }
    }

    if (path.startsWith('/api/cards/')) {
      const printingId = path.split('/').pop()


      // 1. Get current printing with card and set details
      const { data: printing, error: prError } = await supabase
        .from('card_printings')
        .select(`
        *,
        cards(*),
        sets(*)
      `)
        .eq('printing_id', printingId)
        .single()

      if (prError) throw prError
      if (!printing) throw new Error('Card not found')

      // 2. Get all versions of this card
      const { data: allPrintings, error: versionsError } = await supabase
        .from('card_printings')
        .select(`
        printing_id,
        collector_number,
        rarity,
        image_url,
        sets(set_name, set_code),
        aggregated_prices(avg_market_price_usd)
      `)
        .eq('card_id', printing.card_id)
        .order('collector_number', { ascending: true })

      if (versionsError) throw versionsError

      // 3. Get valuation (store price from products table)
      const { data: product } = await supabase
        .from('products')
        .select('price, stock')
        .eq('printing_id', printingId)
        .limit(1)
        .maybeSingle()

      // 4. Map versions
      const all_versions = allPrintings.map((p: any) => ({
        printing_id: p.printing_id,
        set_name: p.sets.set_name,
        set_code: p.sets.set_code,
        collector_number: p.collector_number,
        rarity: p.rarity,
        price: p.aggregated_prices?.[0]?.avg_market_price_usd || 0,
        image_url: p.image_url
      }))

      // 5. Build final flattened response
      const cardData = printing.cards
      const setData = printing.sets
      const currentPrintingData = allPrintings.find((p: any) => p.printing_id === printingId)
      // Try to find NM condition (usually id 1) or just the first available
      const marketPriceObj = currentPrintingData?.aggregated_prices?.find((ap: any) => ap.condition_id === 1) || currentPrintingData?.aggregated_prices?.[0]
      const marketPrice = marketPriceObj?.avg_market_price_usd || 0

      return {
        card_id: printing.printing_id,
        oracle_id: printing.card_id,
        name: cardData.card_name,
        mana_cost: cardData.mana_cost,
        type: cardData.type_line,
        oracle_text: cardData.oracle_text,
        flavor_text: printing.flavor_text,
        artist: printing.artist,
        rarity: printing.rarity,
        set: setData.set_name,
        set_code: setData.set_code,
        collector_number: printing.collector_number,
        image_url: printing.image_url,
        price: marketPrice || product?.price || 0,
        valuation: {
          store_price: product?.price || 0,
          market_price: marketPrice,
          market_url: `https://www.cardkingdom.com/mtg/${sanitizeSlug(setData.set_name)}/${sanitizeSlug(cardData.card_name)}`,
          valuation_avg: (marketPrice || product?.price) || 0
        },
        legalities: cardData.legalities,
        colors: cardData.colors,
        card_faces: printing.card_faces,
        all_versions: all_versions
      }
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

async function handleCollectionsEndpoint(supabase: SupabaseClient, path: string, method: string, params: RequestParams) {
  if (method === 'GET') {
    const { data: { user } } = await supabase.auth.getUser()
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
    const { data: { user } } = await supabase.auth.getUser()
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
    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single()
    if (!cart) throw new Error('No cart found')

    const { data: items } = await supabase.from('cart_items').select('*, products(*)').eq('cart_id', cart.id)
    if (!items?.length) throw new Error('Cart is empty')

    const total = items.reduce((sum: number, i: any) => sum + ((i.products?.price || 0) * i.quantity), 0)

    const { data: order } = await supabase.from('orders').insert({
      user_id: user.id,
      total_amount: total,
      status: 'completed'
    }).select().single()

    // Clear cart
    await supabase.from('cart_items').delete().eq('cart_id', cart.id)

    return { success: true, order_id: order.id, total }
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

    let query = supabase.from('products').select('*', { count: 'planned' })

    if (q) {
      query = query.ilike('name', `%${q}%`)
    }

    if (game) {
      query = query.eq('game', game)
    }

    if (in_stock === 'true') {
      query = query.gt('stock', 0)
    }

    // Sorting
    if (sort === "price_asc") {
      query = query.order('price', { ascending: true })
    } else if (sort === "price_desc") {
      query = query.order('price', { ascending: false })
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

    return {
      products: data,
      total_count: count || 0
    }
  }

  throw new Error('Method not allowed')
}
