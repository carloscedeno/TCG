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
    let query = supabase.from('card_printings').select(`
      printing_id, 
      image_url,
      card_faces,
      cards!inner(card_id, card_name, type_line, rarity, game_id, colors),
      sets!inner(set_name),
      aggregated_prices(avg_market_price_usd)
    `, { count: 'exact' });

    // Apply filters
    if (q) query = query.ilike('cards.card_name', `%${q}%`);
    if (rarity) query = query.in('cards.rarity', rarity.split(',').map(r => r.trim().toLowerCase()));

    if (game) {
      const gameMap: Record<string, number> = { 'Magic: The Gathering': 22, 'Pokémon': 23, 'Lorcana': 24, 'Yu-Gi-Oh!': 26 };
      const gameIds = game.split(',').map(g => gameMap[g.trim()]).filter(id => id !== undefined);
      if (gameIds.length > 0) query = query.in('cards.game_id', gameIds);
    }

    if (set) query = query.in('sets.set_name', set.split(',').map(s => s.trim()));

    if (color) {
      const colorMap: Record<string, string> = { 'White': 'W', 'Blue': 'U', 'Black': 'B', 'Red': 'R', 'Green': 'G', 'Colorless': 'C' };
      const colorCodes = color.split(',').map(c => colorMap[c.trim()]).filter(code => code !== undefined);
      if (colorCodes.length > 0) query = query.overlaps('cards.colors', colorCodes);
    }

    // Limit and Offset
    query = query.range(offset, offset + limit - 1);
    // Default sort by name for consistent paging
    query = query.order('card_name', { foreignTable: 'cards', ascending: true });

    const { data, error, count } = await query;
    if (error) throw error;

    const cards = (data || []).map(item => {
      const cardData = (item.cards as any) || {};
      const setData = (item.sets as any) || {};
      const priceData = item.aggregated_prices as any;
      const price = Array.isArray(priceData) && priceData.length > 0
        ? priceData[0].avg_market_price_usd
        : (priceData?.avg_market_price_usd || 0);

      return {
        card_id: item.printing_id,
        name: cardData.card_name,
        type: cardData.type_line,
        set: setData.set_name || '',
        price: price,
        image_url: item.image_url,
        rarity: cardData.rarity,
        card_faces: item.card_faces as any[]
      };
    });

    return { cards, total_count: count || 0 };
  } catch (error) {
    console.error('Error fetching cards:', error);
    return { cards: [], total_count: 0 };
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