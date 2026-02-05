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
  colors?: string[];
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
    if (API_BASE) {
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.game && filters.game !== 'All') params.append('game', filters.game);
      if (filters.set && filters.set !== 'All') params.append('set', filters.set);
      if (filters.rarity && filters.rarity !== 'All') params.append('rarity', filters.rarity);
      if (filters.color && filters.color !== 'All') params.append('color', filters.color);
      if (filters.sort) params.append('sort', filters.sort);
      params.append('limit', filters.limit?.toString() || '50');
      params.append('offset', filters.offset?.toString() || '0');

      const response = await fetch(`${API_BASE}/api/cards?${params.toString()}`);
      if (response.ok) {
        return (await response.json()) as { cards: CardApi[]; total_count: number };
      }
      console.warn(`API responded with ${response.status} for cards`);
    }
    throw new Error('API unavailable or returned error');
  } catch (error) {
    console.warn('Local API failed, falling back to direct Supabase fetch:', error);

    // Simplified fallback to avoid Timeout 500
    // We remove the join with sets and products in the fallback if it's too heavy
    let query = supabase
      .from('card_printings')
      .select(`
        printing_id,
        image_url,
        cards!inner(card_name, type_line, rarity)
      `, { count: 'estimated' });

    if (filters.q) query = query.ilike('cards.card_name', `%${filters.q}%`);
    if (filters.rarity && filters.rarity !== 'All') query = query.eq('cards.rarity', filters.rarity.toLowerCase());

    const { data, count } = await query
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

    return {
      cards: (data || []).map((item: any) => ({
        card_id: item.printing_id,
        name: item.cards?.card_name || 'Unknown',
        type: item.cards?.type_line || 'Unknown',
        set: 'Reference',
        price: 0,
        image_url: item.image_url,
        rarity: item.cards?.rarity || 'common'
      })) as CardApi[],
      total_count: count || 0
    };
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
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${API_BASE}/api/products?${queryParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return await response.json();
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
      const { data: sbData, error: sbError } = await supabase
        .from('card_printings')
        .select('*, cards(*), sets(*)')
        .eq('printing_id', printingId)
        .single();

      if (sbError) throw sbError;
      data = sbData;
    }

    if (data) {
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

export const fetchCart = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/api/cart`);
    if (!response.ok) throw new Error('Failed to fetch cart');
    return await response.json();
  } catch (error) {
    console.error('Error fetching cart:', error);
    return { items: [] };
  }
};

export const addToCart = async (printingId: string, quantity: number = 1): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/api/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${API_BASE}/api/cart/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Checkout failed');
    return await response.json();
  } catch (error) {
    console.error('Error during checkout:', error);
    return { success: false };
  }
};