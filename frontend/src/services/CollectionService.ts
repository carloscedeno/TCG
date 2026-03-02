const SUPABASE_PROJECT_ID = 'sxuotvogwvmxuvwbsscv';
const API_BASE = import.meta.env.VITE_API_BASE || `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/tcg-api`;

export interface Valuation {
    store_price: number;
    market_price: number;
    market_url: string | null;
    valuation_avg: number;
}

export interface CollectionItem {
    id: string;
    printing_id: string;
    quantity: number;
    condition: string;
    purchase_price: number;
    card_printings: {
        printing_id: string;
        image_url: string;
        cards: {
            card_name: string;
            rarity: string;
            game_id: number;
        };
        sets: {
            set_name: string;
            set_code: string;
        };
    };
    valuation: Valuation;
}

export const CollectionService = {
    async getUserCollection(token: string): Promise<CollectionItem[]> {
        // Use normalized path without trailing slash
        const response = await fetch(`${API_BASE}/api/collections`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch collection');
        }

        const data = await response.json();
        // Backend returns { collection: [...] } based on index.ts
        return Array.isArray(data) ? data : (data.collection || []);
    }
};
