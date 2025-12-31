export interface CardApi {
  name: string;
  set: string;
  imageUrl?: string;
  image_url?: string;
  price: number;
  card_id: string;
  rarity?: string;
  type?: string;
  card_printings?: { image_url?: string }[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function fetchCards(query = ''): Promise<{ cards: CardApi[], total_count: number }> {
  const url = `${API_BASE}/api/cards${query ? `?${query}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al obtener cartas');
  const data = await res.json();
  return { cards: data.cards, total_count: data.total_count };
}

export async function fetchSets(game_code?: string): Promise<{ set_id: number, set_name: string, set_code: string, games: { game_name: string, game_code: string } }[]> {
  const url = `${API_BASE}/api/sets${game_code ? `?game_code=${game_code}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al obtener sets');
  const data = await res.json();
  return data.sets;
}