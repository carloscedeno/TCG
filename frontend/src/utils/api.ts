import { supabase } from '../context/AuthContext';

export interface CardApi {
  card_id: string;
  name: string;
  type: string;
  set: string;
  price: number;
  image_url: string;
  rarity: string;
  card_faces?: any[];
}

// Detect if we are in a production environment (like GitHub Pages)
const SUPABASE_PROJECT_ID = 'sxuotvogwvmxuvwbsscv';
const API_BASE = (import.meta as any).env?.VITE_API_BASE || `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/tcg-api`;

export const fetchCards = async (params: {
  q?: string,
  game?: string,
  set?: string,
  rarity?: string,
  color?: string,
  type?: string,
  limit?: number,
  offset?: number,
  sort?: string
} = {}): Promise<{ cards: CardApi[], total_count: number }> => {
  const { q, game, set, rarity, color, type, limit = 50, offset = 0, sort = 'name' } = params;

  try {
    // Construct URL with params
    const url = new URL(`${API_BASE}/api/cards`);
    if (q) url.searchParams.append('q', q);
    if (game) url.searchParams.append('game', game);
    if (set) url.searchParams.append('set', set);
    if (rarity) url.searchParams.append('rarity', rarity);
    if (color) url.searchParams.append('color', color);
    if (type) url.searchParams.append('type', type);
    if (sort) url.searchParams.append('sort', sort);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', offset.toString());

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    return {
      cards: data.cards || [],
      total_count: data.total_count || 0
    };
  } catch (error) {
    console.warn('Local API failed or timed out, falling back to direct Supabase fetch:', error);

    // Fallback logic (optimized to avoid timeout)
    try {
      let query = supabase.from('card_printings').select(`
        printing_id, 
        image_url,
        card_faces,
        cards!inner(card_id, card_name, type_line, rarity, game_id, colors),
        sets!inner(set_name),
        aggregated_prices(avg_market_price_usd)
      `, { count: 'planned' }); // Use planned count for speed

      if (q) query = query.ilike('cards.card_name', `%${q}%`);
      if (rarity) query = query.in('cards.rarity', rarity.split(',').map(r => r.trim().toLowerCase()));
      if (game) {
        const gameMap: Record<string, number> = { 'Magic: The Gathering': 22, 'Pokémon': 23, 'Lorcana': 24, 'Yu-Gi-Oh!': 26 };
        const gameIds = game.split(',').map(g => gameMap[g.trim()]).filter(id => id !== undefined);
        if (gameIds.length > 0) query = query.in('cards.game_id', gameIds);
      }
      if (set) query = query.in('sets.set_name', set.split(',').map(s => s.trim()));
      if (type) query = query.ilike('cards.type_line', `%${type}%`);

      query = query.range(offset, offset + limit - 1);
      // Remove complex ordering if it causes timeout
      if (!q) query = query.order('printing_id', { ascending: false });

      const { data: sbData, error: sbError, count } = await query;
      if (sbError) throw sbError;

      const cards = (sbData || []).map(item => ({
        card_id: item.printing_id,
        name: (item.cards as any).card_name,
        type: (item.cards as any).type_line,
        set: (item.sets as any).set_name || '',
        price: (item.aggregated_prices as any)?.[0]?.avg_market_price_usd || 0,
        image_url: item.image_url,
        rarity: (item.cards as any).rarity,
        card_faces: item.card_faces as any[]
      }));

      return { cards, total_count: count || 0 };
    } catch (fallbackError) {
      console.error('Critical Failure: Both local API and Supabase fallback failed.', fallbackError);
      return { cards: [], total_count: 0 };
    }
  }
};

export const fetchUserCollection = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/collections`);
    if (!response.ok) throw new Error('Failed to fetch collection');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user collection:', error);
    return [];
  }
};

export const fetchProducts = async (params: {
  q?: string,
  game?: string,
  in_stock?: boolean,
  limit?: number,
  offset?: number,
  sort?: string
} = {}): Promise<{ products: any[], total_count: number }> => {
  const { q, game, in_stock = true, limit = 50, offset = 0, sort = 'newest' } = params;

  try {
    const url = new URL(`${API_BASE}/api/products`);
    if (q) url.searchParams.append('q', q);
    if (game) url.searchParams.append('game', game);
    url.searchParams.append('in_stock', in_stock.toString());
    url.searchParams.append('sort', sort);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', offset.toString());

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [], total_count: 0 };
  }
};

export const fetchCardDetails = async (printingId: string): Promise<any> => {
  try {
    if (API_BASE) {
      const response = await fetch(`${API_BASE}/api/cards/${printingId}`);
      if (response.ok) return await response.json();
    }
    throw new Error('API unavailable or returned error');
  } catch (error) {
    console.warn('Local API failed for details, falling back to direct Supabase fetch:', error);
    try {
      // Fallback for details
      const { data, error: sbError } = await supabase
        .from('card_printings')
        .select(`
          printing_id,
          card_id,
          image_url,
          artist,
          flavor_text,
          collector_number,
          rarity,
          card_faces,
          cards(card_name, type_line, oracle_text, mana_cost, power, toughness, legalities, colors),
          sets(set_name, set_code),
          aggregated_prices(avg_market_price_usd)
        `)
        .eq('printing_id', printingId)
        .single();

      if (sbError) throw sbError;
      if (!data) return null;

      const cardData = data.cards as any;
      const setData = data.sets as any;
      const price = (data.aggregated_prices as any)?.[0]?.avg_market_price_usd || 0;

      // Map to the same structure as the API
      return {
        card_id: data.printing_id,
        oracle_id: data.card_id,
        name: cardData.card_name,
        mana_cost: cardData.mana_cost,
        type: cardData.type_line,
        oracle_text: cardData.oracle_text,
        flavor_text: data.flavor_text,
        artist: data.artist,
        rarity: data.rarity,
        set: setData.set_name,
        set_code: setData.set_code,
        collector_number: data.collector_number,
        legalities: cardData.legalities,
        colors: cardData.colors,
        image_url: data.image_url,
        price: price,
        valuation: {
          store_price: price,
          market_price: price,
          valuation_avg: price
        },
        card_faces: data.card_faces,
        all_versions: [] // Version list fallback is complex, for now we show current
      };
    } catch (fallbackError) {
      console.error('Error fetching card details from Supabase:', fallbackError);
      return null;
    }
  }
};

export const fetchSets = async (game_code?: string): Promise<any[]> => {
  try {
    let query = supabase
      .from('sets')
      .select('*, games!inner(game_name, game_code)')
      .eq('is_digital', false);

    if (game_code) {
      query = query.eq('games.game_code', game_code);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching sets:', error);
    return [];
  }
};