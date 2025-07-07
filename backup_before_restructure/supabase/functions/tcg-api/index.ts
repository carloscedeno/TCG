import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
          '/api/watchlists',
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
    else if (path.startsWith('/api/watchlists')) {
      response = await handleWatchlistsEndpoint(supabase, path, method, params)
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
        status: response.error ? 400 : 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function handleGamesEndpoint(supabase, path, method, params) {
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

async function handleSetsEndpoint(supabase, path, method, params) {
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

async function handleCardsEndpoint(supabase, path, method, params) {
  if (method === 'GET') {
    if (path === '/api/cards') {
      const { game_code, set_id, limit = 50 } = params
      let query = supabase
        .from('cards')
        .select(`
          *,
          games(game_name, game_code),
          card_printings(
            *,
            sets(set_name, set_code)
          )
        `)
      
      if (game_code) {
        query = query.eq('games.game_code', game_code)
      }
      
      if (set_id) {
        query = query.eq('card_printings.set_id', set_id)
      }
      
      const { data, error } = await query.limit(parseInt(limit))
      if (error) throw error
      return { cards: data }
    }
    
    const cardId = path.split('/').pop()
    const { data, error } = await supabase
      .from('cards')
      .select(`
        *,
        games(game_name, game_code),
        card_printings(
          *,
          sets(set_name, set_code),
          aggregated_prices(*)
        )
      `)
      .eq('card_id', cardId)
      .single()
    
    if (error) throw error
    return { card: data }
  }
  
  if (method === 'POST') {
    const { data, error } = await supabase
      .from('cards')
      .insert(params)
      .select()
      .single()
    
    if (error) throw error
    return { card: data }
  }
  
  throw new Error('Method not allowed')
}

async function handlePricesEndpoint(supabase, path, method, params) {
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

async function handleSearchEndpoint(supabase, path, method, params) {
  if (method === 'POST') {
    const { query, game_code, limit = 20 } = params
    
    if (!query) {
      throw new Error('Search query is required')
    }
    
    const { data, error } = await supabase
      .rpc('search_cards_with_prices', {
        search_query: query,
        game_code_filter: game_code,
        limit_count: parseInt(limit)
      })
    
    if (error) throw error
    return { results: data }
  }
  
  throw new Error('Method not allowed')
}

async function handleCollectionsEndpoint(supabase, path, method, params) {
  if (method === 'GET') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data, error } = await supabase
      .from('user_collections')
      .select(`
        *,
        card_printings(
          *,
          cards(card_name),
          sets(set_name)
        ),
        conditions(condition_name)
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
  
  if (method === 'PUT') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const collectionId = path.split('/').pop()
    const { data, error } = await supabase
      .from('user_collections')
      .update(params)
      .eq('collection_id', collectionId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) throw error
    return { collection_item: data }
  }
  
  if (method === 'DELETE') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const collectionId = path.split('/').pop()
    const { error } = await supabase
      .from('user_collections')
      .delete()
      .eq('collection_id', collectionId)
      .eq('user_id', user.id)
    
    if (error) throw error
    return { message: 'Collection item deleted' }
  }
  
  throw new Error('Method not allowed')
}

async function handleWatchlistsEndpoint(supabase, path, method, params) {
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

async function handleStatsEndpoint(supabase, path, method, params) {
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