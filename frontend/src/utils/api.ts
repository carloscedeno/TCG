export interface CardApi {
  card_id: string;
  name: string;
  type: string;
  set: string;
  price: number;
  image_url: string;
  rarity: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjUyNzUsImV4cCI6MjA4MjcwMTI3NX0.0qL7dIEnwg22RyORGX06G97VjdH4C8_l4Qgm2oPEYTY';

export const fetchCards = async (params: {
  q?: string,
  game?: string,
  set?: string,
  rarity?: string,
  color?: string,
  limit?: number,
  offset?: number
}): Promise<{ cards: CardApi[], total_count: number }> => {
  const queryParams = new URLSearchParams();
  if (params.q) queryParams.append('q', params.q);
  if (params.game) queryParams.append('game', params.game);
  if (params.set) queryParams.append('set', params.set);
  if (params.rarity) queryParams.append('rarity', params.rarity);
  if (params.color) queryParams.append('color', params.color);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  try {
    const response = await fetch(`${API_BASE}/api/cards?${queryParams.toString()}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      cards: data.cards || [],
      total_count: data.total_count || 0
    };
  } catch (error) {
    console.error('Error fetching cards:', error);
    return { cards: [], total_count: 0 };
  }
};

export const fetchSets = async (game_code?: string): Promise<any[]> => {
  const url = `${API_BASE}/api/sets${game_code ? `?game_code=${game_code}` : ''}`;
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const data = await response.json();
    return data.sets || [];
  } catch (error) {
    console.error('Error fetching sets:', error);
    return [];
  }
};