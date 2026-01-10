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

// Use local API for better performance and to avoid Supabase Postgrest timeouts on large queries
const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000';

export const fetchCards = async (params: {
  q?: string,
  game?: string,
  set?: string,
  rarity?: string,
  color?: string,
  limit?: number,
  offset?: number
}): Promise<{ cards: CardApi[], total_count: number }> => {
  const { q, game, set, rarity, color, limit = 50, offset = 0 } = params;

  try {
    // Construct URL with params
    const url = new URL(`${API_BASE}/api/cards`);
    if (q) url.searchParams.append('q', q);
    if (game) url.searchParams.append('game', game);
    if (set) url.searchParams.append('set', set);
    if (rarity) url.searchParams.append('rarity', rarity);
    if (color) url.searchParams.append('color', color);
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

      query = query.range(offset, offset + limit - 1);
      // Remove complex ordering if it causes timeout
      if (!q) query = query.order('id', { ascending: false });

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