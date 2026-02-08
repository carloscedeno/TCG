import { supabase } from './supabaseClient';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// Compatibilidad con nombres antiguos
export type Card = CardApi;

export interface CardApi {
  card_id: string;
  name: string;
  type: string;
  set: string;
  price: number;
  image_url: string;
  rarity: string;
}

export interface CardDetails extends Card {
  oracle_id: string;
  mana_cost?: string;
  oracle_text?: string;
  flavor_text?: string;
  artist?: string;
  set_code: string;
  collector_number: string;
  valuation?: {
    store_price: number;
    market_price: number;
    market_url: string;
    valuation_avg: number;
  };
  legalities?: any;
  colors: string[];
  total_stock: number;
  card_faces?: any[];
  all_versions: {
    printing_id: string;
    set_name: string;
    set_code: string;
    collector_number: string;
    rarity: string;
    price: number;
    image_url: string;
  }[];
}

export const fetchCards = async (filters: any): Promise<{ cards: Card[]; total_count: number }> => {
  try {
    console.log('Fetching cards with filters:', filters);

    // Resolve Game IDs if necessary
    let gameIds: number[] | null = null;
    if (filters.game && filters.game !== 'All') {
      const { data: gamesData } = await supabase
        .from('games')
        .select('game_id')
        .in('game_name', filters.game.split(',')); // Assuming filters.game is comma-separated string from URL params or logic

      if (gamesData && gamesData.length > 0) {
        gameIds = gamesData.map((g: { game_id: number }) => g.game_id);
      }
    }

    const { data, error } = await supabase.rpc('get_unique_cards_optimized', {
      search_query: filters.q || null,
      game_ids: gameIds,
      rarity_filter: filters.rarity && filters.rarity !== 'All'
        ? (Array.isArray(filters.rarity) ? filters.rarity : filters.rarity.split(','))
        : null,
      set_names: filters.set && filters.set !== 'All'
        ? (Array.isArray(filters.set) ? filters.set : filters.set.split(','))
        : null,
      color_codes: filters.color && filters.color !== 'All'
        ? (Array.isArray(filters.color) ? filters.color : filters.color.split(','))
        : null,
      type_filter: filters.type
        ? (Array.isArray(filters.type) ? filters.type : filters.type.split(','))
        : null,
      year_from: filters.year_from,
      year_to: filters.year_to,
      limit_count: filters.limit || 50,
      offset_count: filters.offset || 0,
      sort_by: filters.sort || 'release_date'
    });

    if (error) {
      console.error('RPC Error:', error);
      throw error;
    }

    // Map RPC result to Frontend Card format
    const cards = (data || []).map((row: any) => ({
      card_id: row.printing_id, // Use printing_id as the unique ID for the frontend
      name: row.card_name,
      set: row.set_name,
      set_code: row.set_code,
      image_url: row.image_url,
      price: row.avg_market_price_usd || row.store_price || 0,
      rarity: row.rarity,
      type: row.type_line,
      cmc: row.cmc, // Now included!
      game_id: row.game_id,
      colors: row.colors || [],
      release_date: row.release_date,
      total_stock: row.total_stock || 0,
      valuation: {
        market_price: row.avg_market_price_usd || 0,
        store_price: row.store_price || 0,
        market_url: `https://www.cardkingdom.com/mtg/${row.set_name?.replace(/\s+/g, '-').toLowerCase()}/${row.card_name?.replace(/\s+/g, '-').toLowerCase()}`
      }
    }));

    // Estimate total count (RPC doesn't return total count for performance)
    // We assume there are more pages if we got a full page back
    const total_count = cards.length < (filters.limit || 50)
      ? (filters.offset || 0) + cards.length
      : (filters.offset || 0) + (filters.limit || 50) + 1; // Show "next page" available

    return { cards, total_count };

  } catch (error) {
    console.error('Fetch Cards Failed:', error);
    // Fallback to empty to prevent UI crash
    return { cards: [], total_count: 0 };
  }
};

export const fetchUserCollections = async (): Promise<any[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const response = await fetch(`${API_BASE}/api/collections`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });
    if (response.ok) {
      const { collection } = await response.json();
      return collection;
    }
  } catch (error) {
    console.warn('API Collection fetch failed, falling back to Supabase');
  }

  const { data } = await supabase
    .from('user_collections')
    .select(`
      *,
      card_printings(*, cards(*), sets(*))
    `)
    .eq('user_id', user.id);

  return data || [];
};

export const fetchProducts = async (params: any = {}): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('get_products_filtered', {
      search_query: params.q || null,
      game_filter: params.game ? (Array.isArray(params.game) ? params.game[0] : params.game.split(',')[0]) : null,
      set_filter: params.set ? (Array.isArray(params.set) ? params.set : params.set.split(',')) : null,
      rarity_filter: params.rarity && params.rarity !== 'All'
        ? (Array.isArray(params.rarity) ? params.rarity : params.rarity.split(',')).map((r: string) => r.toLowerCase())
        : null,
      type_filter: params.type ? (Array.isArray(params.type) ? params.type : params.type.split(',')) : null,
      color_filter: params.color ? (Array.isArray(params.color) ? params.color : params.color.split(',')) : null,
      sort_by: params.sort || 'newest',
      limit_count: params.limit || 50,
      offset_count: params.offset || 0
    });

    if (error) throw error;

    // Estimate count (RPC doesn't return total)
    // For pagination UIs that need total_count, we might need a separate count query or an estimate.
    // Home.tsx uses total_count to show "Load More" button (if cards.length < total_count).
    // If we return a large number (e.g. offset + limit + 1) when we have full page, it allows next page.
    const returnedCount = data ? data.length : 0;
    const requestedLimit = params.limit || 50;
    const currentOffset = params.offset || 0;

    // Simple heuristic: if we got full page, assume there's more.
    const total_count = returnedCount < requestedLimit
      ? currentOffset + returnedCount
      : currentOffset + requestedLimit + 1;

    return {
      products: data || [],
      total_count
    };

  } catch (error) {
    console.error('Fetch Products Failed:', error);
    // Fallback: try old endpoint if RPC fails? No, simpler to fail gracefully or empty.
    return { products: [], total_count: 0 };
  }
};

const detailsCache = new Map<string, any>();

export const fetchCardDetails = async (printingId: string): Promise<any> => {
  if (detailsCache.has(printingId)) {
    return detailsCache.get(printingId);
  }

  try {
    let data;
    if (API_BASE) {
      const response = await fetch(`${API_BASE}/api/cards/${printingId}`);
      if (response.ok) {
        const json = await response.json();
        data = json.card || json;
      }
    }

    if (!data) {
      console.warn('Local API failed for details, falling back to direct Supabase fetch');
      // Fetch the printing
      const { data: sbData, error: sbError } = await supabase
        .from('card_printings')
        .select('*, cards(*), sets(*)')
        .eq('printing_id', printingId)
        .single();

      if (sbError) throw sbError;

      // Fetch all versions for this card
      const { data: versionsData } = await supabase
        .from('card_printings')
        .select('*, sets(*), aggregated_prices(avg_market_price_usd)')
        .eq('card_id', sbData.card_id);

      data = {
        ...sbData,
        all_versions: (versionsData || []).map((v: any) => ({
          printing_id: v.printing_id,
          set_name: v.sets?.set_name,
          set_code: v.sets?.set_code,
          collector_number: v.collector_number,
          rarity: v.rarity,
          price: v.aggregated_prices?.[0]?.avg_market_price_usd || 0,
          image_url: v.image_url
        }))
      };
    }

    if (data) {
      // Ensure data has all_versions if it's missing from API
      if (!data.all_versions && data.cards?.card_id) {
        const { data: versionsData } = await supabase
          .from('card_printings')
          .select('*, sets(*), aggregated_prices(avg_market_price_usd)')
          .eq('card_id', data.cards.card_id);

        data.all_versions = (versionsData || []).map((v: any) => ({
          printing_id: v.printing_id,
          set_name: v.sets?.set_name,
          set_code: v.sets?.set_code,
          collector_number: v.collector_number,
          rarity: v.rarity,
          price: v.aggregated_prices?.[0]?.avg_market_price_usd || 0,
          image_url: v.image_url
        }));
      }

      detailsCache.set(printingId, data);
    }
    return data;
  } catch (error) {
    console.error('Error fetching card details:', error);
    throw error;
  }
};

export const fetchSets = async (gameCode?: string): Promise<any[]> => {
  try {
    const url = gameCode ? `${API_BASE}/api/sets?game_code=${gameCode}` : `${API_BASE}/api/sets`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch sets');
    const data = await response.json();
    return data.sets || [];
  } catch (err) {
    console.warn("API Sets failed, falling back to Supabase", err);

    let query = supabase
      .from('sets')
      .select('set_id, set_name, set_code, release_date');

    if (gameCode) {
      // Game codes are MTG, PKM, etc. linked via games table
      // We could join, but usually sets dropdown is for the current game
      // If we don't have game_id easily, we might just fetch all and filter in JS if needed
      // but let's try a simple join if we know the schema
      const { data: game } = await supabase.from('games').select('game_id').eq('game_code', gameCode).single();
      if (game) query = query.eq('game_id', game.game_id);
    }

    const { data } = await query.order('release_date', { ascending: false });
    return data || [];
  }
};

export const searchCardNames = async (query: string): Promise<string[]> => {
  if (!query || query.length < 2) return [];

  try {
    const { data, error } = await supabase.rpc('search_card_names', {
      query_text: query,
      limit_count: 10
    });

    if (error) {
      console.error('Autocomplete Error:', error);
      throw error;
    }

    // data is array of objects { card_name: "X" } due to TABLE return
    return (data || []).map((row: any) => row.card_name);
  } catch (error) {
    console.warn('Autocomplete request failed:', error);
    return [];
  }
};

export const fetchCart = async (): Promise<any> => {
  try {
    const session = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session.data.session?.access_token) {
      headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
    }

    const response = await fetch(`${API_BASE}/api/cart`, { headers });
    if (!response.ok) throw new Error('Failed to fetch cart');
    return await response.json();
  } catch (error) {
    console.error('Error fetching cart:', error);
    return { items: [] };
  }
};

export const addToCart = async (printingId: string, quantity: number = 1): Promise<any> => {
  try {
    const session = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session.data.session?.access_token) {
      headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
    }

    const response = await fetch(`${API_BASE}/api/cart/add`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ printing_id: printingId, quantity })
    });
    if (!response.ok) throw new Error('Failed to add to cart');
    return await response.json();
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false };
  }
};

export const checkoutCart = async (): Promise<any> => {
  try {
    const session = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session.data.session?.access_token) {
      headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
    }

    const response = await fetch(`${API_BASE}/api/cart/checkout`, {
      method: 'POST',
      headers
    });
    if (!response.ok) throw new Error('Checkout failed');
    return await response.json();
  } catch (error) {
    console.error('Error during checkout:', error);
    return { success: false };
  }
};

export const createOrder = async (orderData: {
  userId: string;
  items: { product_id: string; quantity: number; price: number }[];
  shippingAddress: any;
  totalAmount: number;
}): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('create_order_atomic', {
      p_user_id: orderData.userId,
      p_items: orderData.items,
      p_shipping_address: orderData.shippingAddress, // Currently unused in RPC logic but good for future
      p_total_amount: orderData.totalAmount
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
};

export const fetchUserAddresses = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;
  return data || [];
};

export const saveUserAddress = async (address: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not logged in");

  const { data, error } = await supabase
    .from('user_addresses')
    .insert({ ...address, user_id: user.id })
    .select();

  if (error) throw error;
  return data;
};