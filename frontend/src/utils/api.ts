import { supabase } from './supabaseClient';
import { getCardKingdomUrl } from './urlUtils';

const API_BASE = import.meta.env.VITE_API_BASE || '';

/**
 * Helper to construct API URLs from API_BASE correctly handling paths and trailing slashes.
 * Ensures consistent use of the '/api' segment if not already in base.
 */
const getApiUrl = (path: string): string => {
  if (!API_BASE) return '';

  let base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;

  // We want to ensure it ends with /api if it doesn't already.
  // We check for /api and /tcg-api (for backward compatibility during migration)
  const hasApiPrefix = base.endsWith('/api') || base.endsWith('/tcg-api');

  if (hasApiPrefix) {
    // If it already has the prefix, just append the path (ensuring one slash)
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  } else {
    // Inject /api prefix
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}/api${cleanPath}`;
  }
};

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
  finish?: string; // Added for Foil handling
  is_foil?: boolean; // Added for Foil handling
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

export const fetchCards = async (filters: any, signal?: AbortSignal): Promise<{ cards: Card[]; total_count: number }> => {
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
    }).abortSignal(signal);

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
      finish: row.finish || (row.is_foil ? 'foil' : 'nonfoil'),
      is_foil: !!row.is_foil || (row.finish === 'foil'),
      valuation: {
        market_price: row.avg_market_price_usd || row.store_price || 0,
        store_price: row.store_price || 0,
        market_url: getCardKingdomUrl(row.card_name, !!row.is_foil || (row.finish === 'foil'))
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
    throw error;
  }
};

export const fetchUserCollections = async (): Promise<any[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const apiUrl = getApiUrl('/collections');
    if (!apiUrl) throw new Error('API_BASE not configured');

    const response = await fetch(apiUrl, {
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

export const fetchProducts = async (params: any = {}, signal?: AbortSignal): Promise<any> => {
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
      year_from: params.year_from || null,
      year_to: params.year_to || null,
      sort_by: params.sort || 'newest',
      limit_count: params.limit || 50,
      offset_count: params.offset || 0,
      price_min: params.price_min || null,
      price_max: params.price_max || null,
      p_only_new: params.only_new || false
    }).abortSignal(signal);

    if (error) throw error;

    // Estimate count (RPC doesn't return total)
    const returnedCount = data ? data.length : 0;
    const requestedLimit = params.limit || 50;
    const currentOffset = params.offset || 0;

    // Simple heuristic: if we got full page, assume there's more.
    const total_count = returnedCount < requestedLimit
      ? currentOffset + returnedCount
      : currentOffset + requestedLimit + 1;

    const products = (data || []).map((row: any) => ({
      ...row,
      finish: row.finish || (row.is_foil ? 'foil' : 'nonfoil'),
      is_foil: !!row.is_foil || (row.finish === 'foil'),
      price: Number(row.price || row.avg_market_price_usd || row.store_price || 0),
      valuation: {
        market_price: row.avg_market_price_usd || row.store_price || 0,
        store_price: row.store_price || 0
      }
    }));

    return {
      products,
      total_count
    };

  } catch (error) {
    console.error('Fetch Products Failed:', error);
    // Fallback: try old endpoint if RPC fails? No, simpler to fail gracefully or empty.
    return { products: [], total_count: 0 };
  }
};



export const fetchCardDetails = async (printingId: string): Promise<any> => {
  try {
    let data: any = null;
    const dbPrintingId = printingId.replace('-foil', '').replace('-nonfoil', '');

    // 1. Try fetching from API first
    const apiUrl = getApiUrl(`/cards/${dbPrintingId}`);
    if (apiUrl) {
      try {
        const response = await fetch(apiUrl);
        if (response.ok) {
          const json = await response.json();
          data = json.card || json;
        }
      } catch (e) {
        console.warn('[API] Detail fetch failed:', e);
      }
    }

    // 2. If API fails, returns insufficient data, OR all_versions lack foil/finish data (FastAPI shortcut), fallback to Supabase
    const apiVersionsLackFinishData = data?.all_versions?.length > 0 &&
      !data.all_versions[0]?.finishes && !data.all_versions[0]?.avg_market_price_foil_usd;
    if (!data || !data.name || (!data.all_versions || data.all_versions.length === 0) || apiVersionsLackFinishData) {
      console.log('[Supabase] Falling back for details or missing versions');
      const { data: sbData, error: sbError } = await supabase
        .from('card_printings')
        .select('*, cards(*), sets(*)')
        .eq('printing_id', dbPrintingId)
        .single();

      if (sbError) {
        // If even Supabase fails, but we have partial data from API, keep it
        if (!data) throw sbError;
      } else {
        // Build or supplement data
        const marketPrice = 0; // Fallback to 0, backend should provide this

        // Basic card info
        const baseData = {
          printing_id: sbData.printing_id,
          card_id: sbData.card_id,
          name: sbData.cards?.card_name || sbData.name || 'Unknown Card',
          mana_cost: sbData.cards?.mana_cost,
          type: sbData.cards?.type_line,
          oracle_text: sbData.cards?.oracle_text,
          flavor_text: sbData.flavor_text || sbData.cards?.flavor_text,
          artist: sbData.artist,
          rarity: sbData.rarity,
          set: sbData.sets?.set_name || '',
          set_code: sbData.sets?.set_code || '',
          collector_number: sbData.collector_number,
          image_url: sbData.image_url,
          price: marketPrice,
          finish: sbData.finish || (sbData.is_foil ? 'foil' : 'nonfoil'),
          is_foil: !!sbData.is_foil || (sbData.finish === 'foil'),
          total_stock: 0,
          valuation: {
            store_price: 0,
            market_price: marketPrice,
            valuation_avg: marketPrice
          },
          legalities: sbData.cards?.legalities,
          colors: sbData.cards?.colors,
          card_faces: sbData.card_faces || sbData.cards?.card_faces,
          all_versions: []
        };

        // Merge API data with Supabase data if both exist
        data = { ...baseData, ...data };

        // If the API provided incomplete version data (missing foil prices/finishes), discard it 
        // to force the subsequent Supabase fetch to retrieve the complete data.
        if (apiVersionsLackFinishData) {
          data.all_versions = [];
        }

        // Fetch versions if missing
        if (!data.all_versions || data.all_versions.length === 0) {
          const cardIdForVersions = sbData.card_id || data.oracle_id;
          if (cardIdForVersions) {
            const { data: versionsData } = await supabase
              .from('card_printings')
              .select('*, sets(*)')
              .eq('card_id', cardIdForVersions);

            if (versionsData) {
              const expandedVersions: any[] = [];
              const printingIds = versionsData.map((v: any) => v.printing_id);

              // Fetch stock for all these printings from products
              const { data: productsData } = await supabase
                .from('products')
                .select('printing_id, finish, stock')
                .in('printing_id', printingIds);

              const stockMap = new Map();
              if (productsData) {
                for (const p of productsData) {
                  const safeFinish = (p.finish || 'nonfoil').toLowerCase();
                  const key = `${p.printing_id}-${safeFinish}`;
                  stockMap.set(key, (stockMap.get(key) || 0) + (p.stock || 0));
                }
              }

              versionsData.forEach((v: any) => {
                const baseVersion = {
                  printing_id: v.printing_id,
                  set_name: v.sets?.set_name || 'Unknown Set',
                  set_code: v.sets?.set_code || '??',
                  collector_number: v.collector_number,
                  rarity: v.rarity,
                  image_url: v.image_url,
                  prices: v.prices
                };

                const finishes = v.finishes || (v.is_foil ? ['foil'] : ['nonfoil']);

                // If the record has specific finish flags or both prices, expand it
                const hasNormalPrice = v.prices?.usd || v.prices?.eur;
                const hasFoilPrice = v.prices?.usd_foil || v.prices?.eur_foil;
                const hasEtchedPrice = v.prices?.usd_etched;

                const pushesNonFoil = finishes.includes('nonfoil') || (hasNormalPrice && !finishes.includes('foil'));
                const pushesFoil = finishes.includes('foil') || hasFoilPrice;
                const pushesEtched = finishes.includes('etched') || hasEtchedPrice;

                const baseIsFoil = !!v.is_foil || v.finish === 'foil';

                if (pushesNonFoil) {
                  const isSynthetic = baseIsFoil && (pushesFoil || pushesEtched);
                  // Only use CK price (avg_market_price_usd) — no Scryfall fallback
                  const priceToUse = Number(v.avg_market_price_usd || 0);
                  expandedVersions.push({
                    ...baseVersion,
                    printing_id: isSynthetic ? `${v.printing_id}-nonfoil` : v.printing_id,
                    price: priceToUse,
                    market_price: priceToUse,
                    finish: 'nonfoil',
                    is_foil: false,
                    stock: stockMap.get(`${v.printing_id}-nonfoil`) || 0
                  });
                }

                if (pushesFoil) {
                  const isSynthetic = !baseIsFoil && (pushesNonFoil || pushesEtched);
                  // Only use CK foil price (avg_market_price_foil_usd) — no Scryfall fallback
                  const priceToUseFoil = Number(v.avg_market_price_foil_usd || 0);

                  console.log(`[Price Trace API] Expanded foil ${v.printing_id} (synthetic=${isSynthetic}): avg_market_price_foil_usd=${v.avg_market_price_foil_usd}, mappedToPrice=${priceToUseFoil}`);

                  expandedVersions.push({
                    ...baseVersion,
                    printing_id: isSynthetic ? `${v.printing_id}-foil` : v.printing_id,
                    price: priceToUseFoil,
                    market_price: priceToUseFoil,
                    finish: 'foil',
                    is_foil: true,
                    stock: stockMap.get(`${v.printing_id}-foil`) || 0
                  });
                }

                if (pushesEtched) {
                  const isSynthetic = v.finish !== 'etched' && (pushesNonFoil || pushesFoil);
                  const priceToUseEtched = Number(v.prices?.usd_etched || 0);
                  expandedVersions.push({
                    ...baseVersion,
                    printing_id: isSynthetic ? `${v.printing_id}-etched` : v.printing_id,
                    price: priceToUseEtched,
                    market_price: priceToUseEtched,
                    finish: 'etched',
                    is_foil: true,
                    stock: stockMap.get(`${v.printing_id}-etched`) || 0
                  });
                }
              });
              data.all_versions = expandedVersions;
            }
          }
        }
      }
    }

    // 3. Post-processing: Ensure stock, final fallbacks and FIX FINISHES
    if (data) {
      // Ensure all_versions exists
      if (!data.all_versions) data.all_versions = [];

      // DEDUPLICATE AND FIX FINISHES: 
      // If we have two printings for the same set+number and both are 'nonfoil', 
      // one is likely the foil version that wasn't correctly flagged during import.
      const versionGroups = new Map<string, any[]>();
      data.all_versions.forEach((v: any) => {
        const key = `${v.set_code}-${v.collector_number}`;
        if (!versionGroups.has(key)) versionGroups.set(key, []);
        versionGroups.get(key)!.push(v);
      });

      versionGroups.forEach((group) => {
        if (group.length > 1) {
          const allNonFoil = group.every(v => !(v.finish === 'foil' || v.is_foil));

          if (allNonFoil) {
            // Mark the second one as foil
            group[1].finish = 'foil';
            group[1].is_foil = true;

            // Sync with main data if that's the one currently active
            if (data.printing_id === group[1].printing_id) {
              data.finish = 'foil';
              data.is_foil = true;
            }
          }
        }
      });

      // If still empty, add current
      if (data.all_versions.length === 0) {
        data.all_versions = [{
          printing_id: data.printing_id || data.card_id || printingId,
          set_name: data.set || 'Unknown Set',
          set_code: data.set_code || '??',
          collector_number: data.collector_number || '',
          rarity: data.rarity || '',
          price: data.price || 0,
          image_url: data.image_url,
          stock: data.total_stock || 0,
          finish: data.finish || (data.is_foil ? 'foil' : 'nonfoil'),
          is_foil: !!data.is_foil || (data.finish === 'foil')
        }];
      }

      // Enrich all versions with stock from products table
      // Filter pIds to only include valid UUIDs to avoid 400 errors from Supabase
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const pIds = data.all_versions
        .map((v: any) => v.printing_id)
        .filter((id: string) => id && uuidRegex.test(id));

      if (pIds.length > 0) {
        const { data: pData } = await supabase
          .rpc('get_products_stock_by_printing_ids', { p_printing_ids: pIds });

        if (pData) {
          data.all_versions = data.all_versions.map((v: any) => {
            const baseVId = v.printing_id.replace(/-foil$/, '').replace(/-nonfoil$/, '').replace(/-etched$/, '');
            const vFinish = (v.finish || (v.is_foil ? 'foil' : 'nonfoil')).toLowerCase();
            const matches = pData.filter((p: any) => p.printing_id === baseVId);
            const finishMatches = matches.filter((p: any) => (p.finish || 'nonfoil').toLowerCase() === vFinish);
            const totalStockForFinish = finishMatches.reduce((acc: number, curr: any) => acc + (curr.stock || 0), 0);
            const exactProd = finishMatches[0];
            const finalPrice = (exactProd?.price && Number(exactProd.price) > 0) ? Number(exactProd.price) : v.price;

            return {
              ...v,
              product_id: exactProd?.id,
              stock: totalStockForFinish,
              price: finalPrice
            };
          });
        } else {
          data.all_versions.forEach((v: any) => v.stock = 0);
        }

        // Filter out versions with NO stock
        data.all_versions = data.all_versions.filter((v: any) => (v.stock || 0) > 0);

        // Update main price/stock for the current printingId
        const baseId = printingId.replace(/-foil$/, '').replace(/-nonfoil$/, '').replace(/-etched$/, '');
        const requestedFinish = (data.finish || (data.is_foil ? 'foil' : 'nonfoil')).toLowerCase();

        const requestedVersionInStock = data.all_versions.find((v: any) =>
          v.printing_id.replace(/-foil$/, '').replace(/-nonfoil$/, '').replace(/-etched$/, '') === baseId &&
          v.finish.toLowerCase() === requestedFinish
        );

        const targetVersion = requestedVersionInStock || data.all_versions[0];

        if (targetVersion) {
          data.product_id = targetVersion.product_id;
          data.total_stock = targetVersion.stock || 0;
          data.price = targetVersion.price;
          data.finish = targetVersion.finish;
          data.is_foil = targetVersion.is_foil;
          if (data.valuation) data.valuation.store_price = targetVersion.price;
        }
      }
    }

    return data;
  } catch (error) {
    console.error('Fatal error in fetchCardDetails:', error);
    throw error;
  }
};

export const fetchSets = async (gameCode?: string): Promise<any[]> => {
  try {
    const path = gameCode ? `/sets?game_code=${gameCode}` : `/sets`;
    const apiUrl = getApiUrl(path);
    if (!apiUrl) throw new Error('API_BASE not configured');

    const response = await fetch(apiUrl);
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

    // If logged in, fetch from API
    if (session.data.session?.user) {
      // Use RPC for logged-in user cart
      const { data, error } = await supabase.rpc('get_user_cart', {
        p_user_id: session.data.session.user.id
      });

      if (error) {
        console.warn("RPC get_user_cart failed", error);
        throw error;
      }

      // Master Pass-through [v40]
      if (!data || data.length === 0) return { items: [], id: null, name: 'Carrito Principal', is_pos: false };

      // The RPC returns { id: ..., name: ..., is_pos: ..., items: [...] }
      const cartData = Array.isArray(data) ? data[0] : data;
      const rawItems = cartData?.items || [];
      
      const items = rawItems.map((item: any) => {
        // Universal ID Mapper: collapse different IDs into product_id for compatibility
        const universalId = item.product_id || item.accessory_id;
        
        return {
          id: item.cart_item_id || item.id,
          product_id: universalId, // The "Auto-engaño" for map() keys
          accessory_id: item.accessory_id,
          quantity: Number(item.quantity || 1),
          type: item.type || (item.accessory_id ? 'accessory' : 'product'),
          products: {
            id: universalId,
            name: item.name || '',
            price: Number(item.price || 0),
            image_url: item.image_url || '',
            set_code: item.set_code || '',
            stock: item.stock || 0,
            finish: item.finish || ''
          }
        };
      });
      
      return { 
        items, 
        id: cartData?.id || cartData?.cart_id, 
        name: cartData?.name || cartData?.cart_name, 
        is_pos: cartData?.is_pos || false
      };
    }

    // Guest Cart Logic Optimized [v44]
    const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    if (guestCart.length === 0) return { items: [] };

    // Group items by base printing ID for batch fetching
    const guestItemMappings = guestCart.map((item: any) => {
      const baseId = item.printing_id.replace(/-foil$/, '').replace(/-nonfoil$/, '').replace(/-etched$/, '');
      const explicitFinish = item.printing_id.includes('-foil') ? 'foil' : (item.printing_id.includes('-etched') ? 'etched' : 'nonfoil');
      return { ...item, baseId, explicitFinish };
    });

    const uniqueBaseIds = Array.from(new Set(guestItemMappings.map((m: any) => m.baseId)));

    try {
      // 1. Batch fetch Card metadata (Name, Image, Sets)
      const { data: printingsData, error: pError } = await supabase
        .from('card_printings')
        .select('*, cards(*), sets(*)')
        .in('printing_id', uniqueBaseIds);

      if (pError) throw pError;

      // 2. Batch fetch Product live data (Price, Stock, Actual Product IDs)
      const { data: productsData, error: prError } = await supabase
        .rpc('get_products_stock_by_printing_ids', { p_printing_ids: uniqueBaseIds });

      if (prError) console.warn("Guest cart products fetch failed, using printings fallback", prError);

      // 3. Batch fetch Accessories for guest cart
      const accessoryIds = guestCart.filter((i: any) => i.accessory_id).map((i: any) => i.accessory_id);
      let accessoriesData: any[] = [];
      if (accessoryIds.length > 0) {
        const { data: aData } = await supabase.from('accessories').select('*').in('id', accessoryIds);
        accessoriesData = aData || [];
      }

      const items = guestItemMappings.map((itemMapping: any) => {
        // Handle Accessories
        if (itemMapping.accessory_id) {
          const acc = accessoriesData.find(a => a.id === itemMapping.accessory_id);
          if (!acc) return null;
          return {
            id: `guest-acc-${acc.id}`,
            product_id: acc.id, // Universal ID
            accessory_id: acc.id,
            quantity: itemMapping.quantity,
            type: 'accessory',
            products: {
              id: acc.id,
              name: acc.name,
              price: Number(acc.price || 0),
              image_url: acc.image_url,
              stock: acc.stock || 0,
              type: 'accessory'
            }
          };
        }

        // Handle Singles (Original logic)
        const printing = (printingsData || []).find((p: any) => p.printing_id === itemMapping.baseId);
        if (!printing) return null;

        const matches = (productsData || []).filter((p: any) => p.printing_id === itemMapping.baseId);
        const exactProduct = matches.find((p: any) => (p.finish || 'nonfoil').toLowerCase() === itemMapping.explicitFinish.toLowerCase());
        const product = exactProduct || matches[0];

        const priceFallback = (itemMapping.explicitFinish === 'foil' || itemMapping.explicitFinish === 'etched')
          ? (printing.avg_market_price_foil_usd || 0)
          : (printing.avg_market_price_usd || 0);

        return {
          id: `guest-${itemMapping.printing_id}`,
          product_id: product?.id || itemMapping.baseId,
          quantity: itemMapping.quantity,
          type: 'product',
          products: {
            id: product?.id || itemMapping.baseId,
            name: printing.cards?.card_name || printing.name || 'Unknown Card',
            price: Number(product?.price ?? priceFallback),
            image_url: printing.image_url,
            set_code: printing.sets?.set_code || '',
            stock: product?.stock || 0,
            finish: product?.finish || itemMapping.explicitFinish,
            type: 'product'
          }
        };
      }).filter(Boolean);

      return { items };
    } catch (batchError) {
      console.error('Batch guest cart fetch failed, falling back to manual loop', batchError);
      // Last resort fallback to original slow logic if batch fetch fails for some reason
      const items = await Promise.all(guestCart.map(async (item: any) => {
        try {
          const details = await fetchCardDetails(item.printing_id);
          return {
            id: `guest-${item.printing_id}`,
            product_id: details.product_id || item.printing_id,
            quantity: item.quantity,
            products: {
              id: details.product_id || details.card_id,
              name: details.name,
              price: Number(details.price || details.market_price || details.valuation?.market_price || 0),
              image_url: details.image_url,
              set_code: details.set_code,
              stock: details.total_stock || 0
            }
          };
        } catch (e) {
          return null;
        }
      }));
      return { items: items.filter((i: any) => i !== null) };
    }

  } catch (error) {
    console.error('Error fetching cart:', error);
    return { items: [] };
  }
};

export const addToCart = async (printingId: string, quantity: number = 1, finish: string = 'nonfoil'): Promise<any> => {
  try {
    const session = await supabase.auth.getSession();

    // If logged in, use Master RPC v2 [v43]
    if (session.data.session?.user) {
      const { data, error } = await supabase.rpc('add_to_cart_v2', {
        p_identifier: printingId, // The master RPC now handles both product_id and printing_id
        p_quantity: quantity,
        p_finish: (finish || 'nonfoil').toLowerCase()
      });

      if (error) {
        console.error("RPC add_to_cart_v2 failed:", error);
        throw error;
      }

      // Check if RPC returned an internal logic error
      if (data && data.success === false) {
        console.warn("RPC add_to_cart_v2 internal error:", data.error);
        return data;
      }

      // Dispatch event to update cart drawer
      window.dispatchEvent(new Event('cart-updated'));

      return data || { success: true };
    }

    // Guest Cart Logic
    const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    const existingItemIndex = guestCart.findIndex((item: any) => item.printing_id === printingId);

    if (existingItemIndex >= 0) {
      guestCart[existingItemIndex].quantity += quantity;
    } else {
      guestCart.push({ printing_id: printingId, quantity });
    }

    localStorage.setItem('guest_cart', JSON.stringify(guestCart));
    // Dispatch event to update cart drawer if open
    window.dispatchEvent(new Event('cart-updated'));

    return { success: true, message: "Added to guest cart" };

  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const addProductToCart = async (productId: string, quantity: number = 1): Promise<any> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error("Authentication required");

    const { data, error } = await supabase.rpc('add_to_cart', {
      p_product_id: productId,
      p_quantity: quantity
    });

    if (error) throw error;

    window.dispatchEvent(new Event('cart-updated'));
    return { success: true, data };
  } catch (error) {
    console.error('Error adding product to cart:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const checkoutCart = async (): Promise<any> => {
  try {
    // const session = await supabase.auth.getSession(); // Unused
    // Checkout Logic should create an ORDER.
    // If we want a separate endpoint for "checkout session" (like Stripe), we need Backend.
    // If just creating an order from Cart?
    // Usually Frontend calls createOrder() directly at final step.
    // checkoutCart() might be redundant or just a validation step.
    // Assuming it's validation/preparation.
    // For now, return success to proceed to Checkout Page.
    return { success: true };
  } catch (error) {
    console.error('Error during checkout:', error);
    return { success: false };
  }
};

export const createOrder = async (orderData: {
  userId: string | null;
  items: { product_id: string; quantity: number; price: number; finish?: string; is_on_demand?: boolean }[];
  shippingAddress: any;
  totalAmount: number;
  guestInfo?: { email: string; phone: string };
  cartId?: string;
}): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('create_order_atomic', {
      p_user_id: orderData.userId,
      p_items: orderData.items,
      p_shipping_address: orderData.shippingAddress,
      p_total_amount: orderData.totalAmount,
      p_guest_info: orderData.guestInfo || null,
      p_cart_id: orderData.cartId || null
    });

    if (error) throw error;

    // Clear guest cart if successful
    if (!orderData.userId) {
      localStorage.removeItem('guest_cart');
      window.dispatchEvent(new Event('cart-updated'));
    }

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

// Cart Management Functions

export const sendCheckoutEmailNotification = async (notificationData: {
  order_id: string;
  user_email?: string;
  admin_email?: string;
  order_total: number;
  items: any[];
  current_user_id?: string;
}): Promise<any> => {
  try {
    const apiUrl = getApiUrl('/notifications/checkout');
    if (!apiUrl) throw new Error('API_BASE not configured');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificationData)
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to send checkout email notification:', error);
    return { success: false, error };
  }
};

export const updateCartItemQuantity = async (cartItemId: string, quantity: number): Promise<any> => {
  try {
    const session = await supabase.auth.getSession();

    // If logged in AND NOT a guest item, use RPC
    if (session.data.session?.user && !cartItemId.startsWith('guest-')) {
      const { data, error } = await supabase.rpc('update_cart_item_quantity', {
        p_cart_item_id: cartItemId,
        p_new_quantity: quantity
      });

      if (error) throw error;

      // Trigger cart update event
      window.dispatchEvent(new Event('cart-updated'));

      return data;
    }

    // Guest Cart Logic
    const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    const itemIndex = guestCart.findIndex((item: any) => `guest-${item.printing_id}` === cartItemId);

    if (itemIndex >= 0) {
      if (quantity > 0) {
        guestCart[itemIndex].quantity = quantity;
      } else {
        guestCart.splice(itemIndex, 1);
      }
      localStorage.setItem('guest_cart', JSON.stringify(guestCart));
      window.dispatchEvent(new Event('cart-updated'));
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

export const removeFromCart = async (cartItemId: string): Promise<any> => {
  try {
    const session = await supabase.auth.getSession();

    // If logged in AND NOT a guest item, use RPC
    if (session.data.session?.user && !cartItemId.startsWith('guest-')) {
      const { data, error } = await supabase.rpc('remove_from_cart', {
        p_cart_item_id: cartItemId
      });

      if (error) throw error;

      // Trigger cart update event
      window.dispatchEvent(new Event('cart-updated'));

      return data;
    }

    // Guest Cart Logic
    const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    const filteredCart = guestCart.filter((item: any) => `guest-${item.printing_id}` !== cartItemId);

    localStorage.setItem('guest_cart', JSON.stringify(filteredCart));
    window.dispatchEvent(new Event('cart-updated'));

    return { success: true };
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};
/**
 * Multi-Cart Management (Store Employees)
 */

export const listUserCarts = async (is_pos: boolean = false): Promise<any[]> => {
  try {
    console.log(`DEBUG: api.ts calling list_user_carts RPC (is_pos=${is_pos})`);
    const { data, error } = await supabase.rpc('list_user_carts', {
      p_is_pos: is_pos
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error listing user carts:', error);
    return [];
  }
};

export const createNamedCart = async (name: string, is_pos: boolean = false): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('create_named_cart', {
      p_name: name,
      p_is_pos: is_pos
    });

    if (error) throw error;
    
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { isPos: is_pos } }));
    return data;
  } catch (error) {
    console.error('Error creating named cart:', error);
    throw error;
  }
};

export const deleteCart = async (cartId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('delete_cart', {
      p_cart_id: cartId
    });

    if (error) throw error;
    
    window.dispatchEvent(new CustomEvent('cart-updated'));
  } catch (error) {
    console.error('Error deleting cart:', error);
    throw error;
  }
};

export const switchActiveCart = async (cartId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('switch_active_cart', {
      p_cart_id: cartId
    });

    if (error) throw error;
    
    window.dispatchEvent(new CustomEvent('cart-updated'));
  } catch (error) {
    console.error('Error switching active cart:', error);
    throw error;
  }
};export const clearActiveCart = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('clear_active_cart');
    if (error) throw error;
    window.dispatchEvent(new CustomEvent('cart-updated'));
  } catch (error) {
    console.error('Error clearing active cart:', error);
    throw error;
  }
};

/**
 * Accessories & Assets Management
 */

export const addAccessoryToCart = async (accessoryId: string, quantity: number = 1): Promise<any> => {
  try {
    const session = await supabase.auth.getSession();
    if (session.data.session?.user) {
      const { data, error } = await supabase.rpc('add_accessory_to_cart_v1', {
        p_accessory_id: accessoryId,
        p_quantity: quantity
      });
      if (error) throw error;
      window.dispatchEvent(new Event('cart-updated'));
      return { success: true, data };
    }
    
    // Guest logic for accessories
    const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    const existing = guestCart.find((i: any) => i.accessory_id === accessoryId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      guestCart.push({ accessory_id: accessoryId, quantity, type: 'accessory' });
    }
    localStorage.setItem('guest_cart', JSON.stringify(guestCart));
    window.dispatchEvent(new Event('cart-updated'));
    return { success: true };
  } catch (error) {
    console.error('Error adding accessory to cart:', error);
    return { success: false, error };
  }
};

export const fetchAccessories = async (filters: any = {}) => {
  let query = supabase.from('accessories').select('*');
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active);
  
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data || [];
};

export const upsertAccessory = async (accessory: any) => {
  const { data, error } = await supabase.from('accessories').upsert(accessory).select().single();
  if (error) throw error;
  return data;
};

export const uploadAsset = async (file: File, path: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('public_assets')
    .upload(`${path}/${Date.now()}_${file.name}`, file);
  
  if (error) throw error;
  
  const { data: publicUrl } = supabase.storage.from('public_assets').getPublicUrl(data.path);
  return publicUrl.publicUrl;
};

export const fetchBanners = async (category: string = 'main_hero') => {
  const { data, error } = await supabase
    .from('hero_banners')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('display_order');
  
  if (error) throw error;
  return data || [];
};
