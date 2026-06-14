import { supabase } from './supabaseClient';
import { getCardKingdomUrl } from './urlUtils';

const API_BASE = import.meta.env.VITE_API_BASE || '';

/**
 * Checks if a discount is still valid based on Caracas time (UTC-4).
 * Since dates are saved with the explicit Caracas timezone offset (e.g. -04:00),
 * we can simply compare the instantiations directly without manual hours offset shifting.
 */
export const isDiscountActive = (discountUntil: string | null | undefined): boolean => {
    if (!discountUntil) return true; // Null date means permanent discount
    return new Date() < new Date(discountUntil);
};

/**
 * Helper to construct API URLs from API_BASE correctly handling paths and trailing slashes.
 * Ensures consistent use of the '/api' segment if not already in base.
 */
const getApiUrl = (path: string): string => {
  if (!API_BASE) return '';

  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;

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

export const fetchGames = async () => {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('is_active', true)
    .order('game_name');
  if (error) throw error;
  return data || [];
};

// Compatibilidad con nombres antiguos
export type Card = CardApi;

export interface CardApi {
  card_id: string;
  name: string;
  type: string;
  set: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
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
    original_price?: number;
    discount_percentage?: number;
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
        .in('game_code', filters.game.split(',')); // Use game_code instead of game_name

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
  } catch {
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
      price_min: params.price_min !== undefined ? params.price_min : null,
      price_max: params.price_max !== undefined ? params.price_max : null,
      limit_count: params.limit || 50,
      offset_count: params.offset || 0,
      p_only_new: params.only_new || false,
      p_only_discount: params.only_discount || false,
      p_only_presale: params.only_presale || false,
      sort_by: params.sort || 'newest'
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

    const products = (data || []).map((row: any) => {
      const finalPrice = Number(row.price || 0);
      const originalPrice = Number(row.original_price || row.price || 0);
      const discountPct = Number(row.discount_percentage || 0);

      return {
        ...row,
        finish: row.finish || (row.is_foil ? 'foil' : 'nonfoil'),
        is_foil: !!row.is_foil || (row.finish === 'foil'),
        price: finalPrice,
        original_price: originalPrice,
        discount_percentage: discountPct,
        valuation: {
          market_price: row.avg_market_price_usd || row.store_price || 0,
          store_price: row.store_price || 0
        }
      };
    });

    return {
      products,
      total_count
    };

  } catch (error: any) {
    if (error?.name !== 'AbortError') {
      console.error('Fetch Products Failed:', error);
    }
    // Fallback: try old endpoint if RPC fails? No, simpler to fail gracefully or empty.
    return { products: [], total_count: 0 };
  }
};



export const fetchCardDetails = async (printingId: string): Promise<any> => {
  try {
    let data: any = null;
    
    // 1. Sanitize the ID
    const sanitizedId = printingId.replace('-foil', '').replace('-nonfoil', '').replace('-etched', '');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // 2. Check Accessories FIRST if it's a UUID (Common for store-specific products)
    if (uuidRegex.test(sanitizedId)) {
        const { data: accData } = await supabase
          .from('accessories')
          .select('*')
          .eq('id', sanitizedId)
          .maybeSingle();
          
            if (accData) {
                console.log(`[Catalog] Found accessory in DB: ${sanitizedId}`);
                const originalPrice = Number(accData.price || 0);
                let finalPrice = originalPrice;
                let discountPct = Number(accData.discount_percentage || 0);

                if (discountPct > 0 && isDiscountActive(accData.discount_until)) {
                    finalPrice = originalPrice * (1 - discountPct / 100);
                } else if (accData.discount_until) {
                    discountPct = 0;
                }

                return {
                    id: accData.id,
                    card_id: accData.id,
                    printing_id: accData.id,
                    name: accData.name,
                    set: accData.category || 'Accesorio',
                    set_code: accData.category || 'ACC',
                    image_url: accData.image_url,
                    additional_images: accData.additional_images || [],
                    price: finalPrice,
                    original_price: originalPrice,
                    discount_percentage: discountPct,
                    total_stock: accData.stock,
                    is_accessory: true,
                    description: accData.description,
                    all_versions: [{
                        printing_id: accData.id,
                        set_name: accData.category || 'Accesorio',
                        set_code: accData.category || 'ACC',
                        collector_number: 'ACC',
                        rarity: 'Common',
                        image_url: accData.image_url,
                        price: finalPrice,
                        original_price: originalPrice,
                        discount_percentage: discountPct,
                        stock: accData.stock,
                        finish: 'nonfoil'
                    }]
                };
            } else {
            console.log(`[Catalog] UUID not found in accessories table: ${sanitizedId}. Falling back to Edge Function.`);
        }
    }

    // 3. Try Edge Function (Main Source for full card metadata and external fetch)
    try {
        const apiUrl = getApiUrl(`/cards/${sanitizedId}`);
        const response = await fetch(apiUrl);
        if (response.ok) {
            data = await response.json();
        }
    } catch (err) {
        console.warn("Edge function fetch failed, checking database...", err);
    }

    // 4. Enrich/Fallback with Supabase if Edge failed or has missing data
    const apiVersionsLackFinishData = data?.all_versions?.length > 0 && 
      !data.all_versions[0]?.finishes && !data.all_versions[0]?.avg_market_price_foil_usd;

    if (!data || !data.name || (!data.all_versions || data.all_versions.length === 0) || apiVersionsLackFinishData) {
      console.log('[Supabase] Falling back for details or missing versions');
      const { data: sbData } = await supabase
        .from('card_printings')
        .select('*, cards(*), sets(*)')
        .eq('printing_id', sanitizedId)
        .maybeSingle();

      if (sbData) {
        // Build or supplement data
        const marketPrice = 0; 
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
        data = { ...baseData, ...data };

        // If the API provided incomplete version data (missing foil prices/finishes), discard it 
        // to force the subsequent Supabase fetch to retrieve the complete data.
        if (apiVersionsLackFinishData) {
          data.all_versions = [];
        }

        // Fetch versions if missing
        if ((!data.all_versions || data.all_versions.length === 0) && sbData) {
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
                .select('printing_id, finish, stock, price, discount_percentage, discount_end_date')
                .in('printing_id', printingIds);

              const stockMap = new Map();
              const productMap = new Map();
              if (productsData) {
                for (const p of productsData) {
                  const safeFinish = (p.finish || 'nonfoil').toLowerCase();
                  const key = `${p.printing_id}-${safeFinish}`;
                  stockMap.set(key, (stockMap.get(key) || 0) + (p.stock || 0));
                  
                  if (!productMap.has(key) && p.price) {
                      productMap.set(key, { 
                          price: p.price, 
                          discount_percentage: p.discount_percentage, 
                          discount_end_date: p.discount_end_date 
                      });
                  }
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
                  const prodDataNormal = productMap.get(`${v.printing_id}-nonfoil`);
                  let finalPriceNormal = Number(v.avg_market_price_usd || 0);
                  let originalPriceNormal = finalPriceNormal;
                  let discountNormal = 0;
                  
                  if (prodDataNormal?.price) {
                      originalPriceNormal = prodDataNormal.price;
                      finalPriceNormal = prodDataNormal.price;
                      if (prodDataNormal.discount_percentage && isDiscountActive(prodDataNormal.discount_end_date)) {
                          finalPriceNormal = originalPriceNormal * (1 - prodDataNormal.discount_percentage / 100);
                          discountNormal = prodDataNormal.discount_percentage;
                      }
                  }

                  expandedVersions.push({
                    ...baseVersion,
                    printing_id: isSynthetic ? `${v.printing_id}-nonfoil` : v.printing_id,
                    price: finalPriceNormal,
                    original_price: originalPriceNormal,
                    discount_percentage: discountNormal,
                    market_price: Number(v.avg_market_price_usd || 0),
                    finish: 'nonfoil',
                    is_foil: false,
                    stock: stockMap.get(`${v.printing_id}-nonfoil`) || 0
                  });
                }

                if (pushesFoil) {
                  const isSynthetic = !baseIsFoil && (pushesNonFoil || pushesEtched);
                  const prodDataFoil = productMap.get(`${v.printing_id}-foil`);
                  let finalPriceFoil = Number(v.avg_market_price_foil_usd || 0);
                  let originalPriceFoil = finalPriceFoil;
                  let discountFoil = 0;
                  
                  if (prodDataFoil?.price) {
                      originalPriceFoil = prodDataFoil.price;
                      finalPriceFoil = prodDataFoil.price;
                      if (prodDataFoil.discount_percentage && isDiscountActive(prodDataFoil.discount_end_date)) {
                          finalPriceFoil = originalPriceFoil * (1 - prodDataFoil.discount_percentage / 100);
                          discountFoil = prodDataFoil.discount_percentage;
                      }
                  }

                  expandedVersions.push({
                    ...baseVersion,
                    printing_id: isSynthetic ? `${v.printing_id}-foil` : v.printing_id,
                    price: finalPriceFoil,
                    original_price: originalPriceFoil,
                    discount_percentage: discountFoil,
                    market_price: Number(v.avg_market_price_foil_usd || 0),
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
            const basePriceFromDB = (exactProd?.price && Number(exactProd.price) > 0) ? Number(exactProd.price) : v.price;
            const originalPrice = (exactProd?.original_price && Number(exactProd.original_price) > 0) ? Number(exactProd.original_price) : basePriceFromDB;
            const discountPct = Number(exactProd?.discount_percentage || 0);
            const discountActive = isDiscountActive(exactProd?.discount_end_date);
            
            // Calculate final price based on the visual label
            let finalPrice = basePriceFromDB;
            if (discountPct > 0 && discountActive) {
              finalPrice = basePriceFromDB * (1 - discountPct / 100);
            }

            return {
              ...v,
              product_id: exactProd?.id,
              stock: totalStockForFinish,
              price: finalPrice,
              original_price: originalPrice,
              discount_percentage: discountActive ? discountPct : 0
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
          data.original_price = targetVersion.original_price;
          data.discount_percentage = targetVersion.discount_percentage;
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
  // En dev, preferimos Supabase para juegos que no sean MTG ya que el API puede estar desactualizado
  const isDev = import.meta.env.DEV || window.location.hostname.includes('dev') || window.location.hostname.includes('localhost');
  const shouldPreferSupabase = isDev && gameCode && gameCode !== 'MTG';

  if (!shouldPreferSupabase) {
    try {
      const path = gameCode ? `/sets?game_code=${gameCode}` : `/sets`;
      const apiUrl = getApiUrl(path);
      if (apiUrl) {
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.sets && data.sets.length > 0) {
            return data.sets;
          }
        }
      }
    } catch (err) {
      console.warn("API Sets fetch failed, falling back to Supabase", err);
    }
  }

  try {
    let query = supabase
      .from('sets')
      .select('set_id, set_name, set_code, release_date');

    if (gameCode) {
      const { data: game } = await supabase.from('games').select('game_id').eq('game_code', gameCode).single();
      if (game) {
        query = query.eq('game_id', game.game_id);
      } else {
        // Fallback for PKM vs POKEMON mismatch in DB if any
        const altCode = gameCode === 'POKEMON' ? 'PKM' : (gameCode === 'PKM' ? 'POKEMON' : null);
        if (altCode) {
          const { data: altGame } = await supabase.from('games').select('game_id').eq('game_code', altCode).single();
          if (altGame) query = query.eq('game_id', altGame.game_id);
        }
      }
    }

    const { data } = await query.order('release_date', { ascending: false });
    return data || [];
  } catch (err) {
    console.error("Supabase Sets fetch failed", err);
    return [];
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
      // Depending on Supabase JS client version, data could be the object directly or an array containing it.
      const cartData = Array.isArray(data) ? data[0] : data;
      
      const rawItems = cartData?.items || [];
      
      // We will map and then enrich if needed
      // Trust the unified RPC result for authenticated users
      const items = rawItems.map((item: any) => {
        const isAcc = !!item.is_accessory;
        return {
          id: item.id,
          product_id: item.product_id,
          accessory_id: item.accessory_id,
          quantity: Number(item.quantity || 1),
          products: {
            id: item.product_id || item.accessory_id,
            name: item.name || '',
            price: Number(item.price || 0),
            original_price: Number(item.original_price || item.price || 0),
            discount_percentage: Number(item.discount_percentage || 0),
            image_url: item.image_url || '',
            set_code: item.set_code || '',
            stock: item.stock || 0,
            finish: item.finish || (isAcc ? 'standard' : 'nonfoil')
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

    const cardItems = guestCart.filter((i: any) => !i.is_accessory);
    const accessoryItems = guestCart.filter((i: any) => i.is_accessory);

    let processedItems: any[] = [];

    // Process Cards
    if (cardItems.length > 0) {
      const guestItemMappings = cardItems.map((item: any) => {
        const baseId = item.printing_id.replace(/-foil$/, '').replace(/-nonfoil$/, '').replace(/-etched$/, '');
        const explicitFinish = item.printing_id.includes('-foil') ? 'foil' : (item.printing_id.includes('-etched') ? 'etched' : 'nonfoil');
        return { ...item, baseId, explicitFinish };
      });
      const uniqueBaseIds = Array.from(new Set(guestItemMappings.map((m: any) => m.baseId)));

      try {
        const { data: printingsData } = await supabase
          .from('card_printings')
          .select('*, cards(*), sets(*)')
          .in('printing_id', uniqueBaseIds);

        const { data: productsData } = await supabase
          .rpc('get_products_stock_by_printing_ids', { p_printing_ids: uniqueBaseIds });

        const mappedCards = guestItemMappings.map((itemMapping: any) => {
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
            products: {
              id: product?.id || itemMapping.baseId,
              name: printing.cards?.card_name || printing.name || 'Unknown Card',
              price: Number(product?.price ?? priceFallback),
              original_price: Number(product?.original_price || product?.price || priceFallback),
              discount_percentage: Number(product?.discount_percentage || 0),
              image_url: printing.image_url,
              set_code: printing.sets?.set_code || '',
              stock: product?.stock || 0,
              finish: product?.finish || itemMapping.explicitFinish
            }
          };
        }).filter(Boolean);
        processedItems = [...processedItems, ...mappedCards];
      } catch (e) {
        console.error("Guest card batch fetch failed", e);
      }
    }

    // Process Accessories
    if (accessoryItems.length > 0) {
      try {
        const accIds = accessoryItems.map((i: any) => i.accessory_id);
        const { data: accData } = await supabase
          .from('accessories')
          .select('*')
          .in('id', accIds);

        const mappedAccs = accessoryItems.map((item: any) => {
          const acc = (accData || []).find((a: any) => a.id === item.accessory_id);
          if (!acc) return null;
          const originalPrice = Number(acc.price || 0);
          let finalPrice = originalPrice;
          let discountPct = Number(acc.discount_percentage || 0);

          if (discountPct > 0 && isDiscountActive(acc.discount_until)) {
            finalPrice = originalPrice * (1 - discountPct / 100);
          } else if (acc.discount_until) {
            discountPct = 0;
          }

          return {
            id: `guest-acc-${acc.id}`,
            accessory_id: acc.id,
            product_id: null,
            quantity: item.quantity,
            is_accessory: true,
            products: {
              id: acc.id,
              name: acc.name,
              price: Number(finalPrice.toFixed(2)),
              original_price: Number(finalPrice.toFixed(2)),
              discount_percentage: discountPct,
              image_url: acc.image_url,
              set_code: acc.category,
              stock: acc.stock,
              finish: 'standard'
            }
          };
        }).filter(Boolean);
        processedItems = [...processedItems, ...mappedAccs];
      } catch (e) {
        console.error("Guest accessory batch fetch failed", e);
      }
    }

    return { items: processedItems };

  } catch (error) {
    console.error('Error fetching cart:', error);
    return { items: [] };
  }
};

export const addToCart = async (printingId: string, quantity: number = 1, finish: string = 'nonfoil', isAccessory: boolean = false): Promise<any> => {
  try {
    const session = await supabase.auth.getSession();

    // If logged in, use Master RPC
    if (session.data.session?.user) {
      if (isAccessory) {
          const { data, error } = await supabase.rpc('add_accessory_to_cart_v1', {
              p_accessory_id: printingId,
              p_quantity: quantity
          });
          if (error) throw error;
          window.dispatchEvent(new Event('cart-updated'));
          
          if (typeof data === 'string') {
              return { success: true, cart_id: data };
          }
          return data || { success: true };
      }

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
    const existingItemIndex = guestCart.findIndex((item: any) => 
      item.printing_id === printingId && item.is_accessory === isAccessory
    );

    if (existingItemIndex >= 0) {
      guestCart[existingItemIndex].quantity += quantity;
    } else {
      guestCart.push({ 
        printing_id: printingId, 
        quantity, 
        is_accessory: isAccessory,
        accessory_id: isAccessory ? printingId : null
      });
    }

    localStorage.setItem('guest_cart', JSON.stringify(guestCart));
    // Dispatch event to update cart drawer if open
    window.dispatchEvent(new Event('cart-updated'));

    return { success: true, message: "Added to guest cart" };

  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return { success: false, error: error?.message || error?.details || String(error) || 'Unknown error' };
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
  items: { product_id?: string | null; accessory_id?: string | null; quantity: number; price: number; finish?: string; is_on_demand?: boolean }[];
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
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const saveUserAddress = async (address: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not logged in");

  // Remove system fields if present
  const { id, user_id, created_at, updated_at, ...insertData } = address;

  const { data, error } = await supabase
    .from('user_addresses')
    .insert({ ...insertData, user_id: user.id })
    .select();

  if (error) throw error;
  return data;
};

export const deleteUserAddress = async (addressId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not logged in");

  const { error } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', user.id);

  if (error) throw error;
  return true;
};

export const updateUserAddress = async (addressId: string, address: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not logged in");

  // Remove system fields if present
  const { id, user_id, created_at, updated_at, ...updateData } = address;

  const { data, error } = await supabase
    .from('user_addresses')
    .update(updateData)
    .eq('id', addressId)
    .eq('user_id', user.id)
    .select();

  if (error) throw error;
  return data;
};

export const updateUserPassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return true;
};

export const sendPasswordResetEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/update-password`,
  });
  if (error) throw error;
  return true;
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
    const itemIndex = guestCart.findIndex((item: any) => 
      (item.is_accessory ? `guest-acc-${item.accessory_id}` : `guest-${item.printing_id}`) === cartItemId
    );

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
    const filteredCart = guestCart.filter((item: any) => 
      (item.is_accessory ? `guest-acc-${item.accessory_id}` : `guest-${item.printing_id}`) !== cartItemId
    );

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
export const fetchAccessories = async (params: {
  q?: string;
  game?: string;
  category?: string;          // legacy free-text filter
  category_code?: string;     // normalized code filter (e.g. 'BOOSTER_BOX')
  parent_code?: string;       // parent group filter (e.g. 'SEALED')
  price_min?: number;
  price_max?: number;
  only_discount?: boolean;
  only_presale?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
}) => {
  const {
    q, game, category, category_code, parent_code,
    price_min, price_max, only_discount, only_presale, sort = 'newest', limit = 50, offset = 0
  } = params;
  
  // Clean 3-letter mapping
  let gameId: number | null = null;
  if (game && game !== 'OTHERS') {
    const normalizedCode = game;

    const { data: gameData } = await supabase
      .from('games')
      .select('game_id')
      .or(`game_name.eq.${normalizedCode},game_code.eq.${normalizedCode}`)
      .maybeSingle();
    if (gameData) gameId = gameData.game_id;
  }
  
  const { data, error } = await supabase.rpc('get_accessories_filtered', {
    p_game_id: gameId,
    p_game_code: game || null,
    p_category: category || null,
    p_category_code: category_code || null,
    p_parent_code: parent_code || null,
    p_search_query: q || null,
    p_price_min: price_min !== undefined ? price_min : null,
    p_price_max: price_max !== undefined ? price_max : null,
    p_only_discount: only_discount || false,
    p_only_presale: only_presale || false,
    p_sort: sort,
    p_limit: limit,
    p_offset: offset
  });

  if (error) throw error;
  
  const accessories = (data || []).map((item: any) => {
    const originalPrice = Number(item.price || 0);
    let finalPrice = originalPrice;
    let discountPct = Number(item.discount_percentage || 0);

    if (discountPct > 0 && isDiscountActive(item.discount_until)) {
      finalPrice = originalPrice * (1 - discountPct / 100);
    } else if (item.discount_until) {
      discountPct = 0;
    }

    return {
      ...item,
      price: finalPrice,
      original_price: originalPrice,
      discount_percentage: discountPct
    };
  });
  const total_count = accessories.length > 0 ? accessories[0].total_count : 0;

  return { 
    accessories, 
    total_count: Number(total_count)
  };
};

// Fetch the normalized category taxonomy for dropdowns/filters
export const fetchAccessoryCategories = async (parentCode?: string) => {
  const { data, error } = await supabase.rpc('get_accessory_categories', {
    p_parent_code: parentCode || null
  });
  if (error) {
    console.warn('fetchAccessoryCategories failed, falling back to table query', error);
    const { data: fallback } = await supabase
      .from('accessory_categories')
      .select('code, name, parent_code, sort_order, icon')
      .eq('is_active', true)
      .order('sort_order');
    return fallback || [];
  }
  return data || [];
};

// --- ACCESSORIES MANAGEMENT [ADMIN] ---



export const createAccessory = async (accessory: any) => {
  const { data, error } = await supabase
    .from('accessories')
    .insert([accessory])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAccessory = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('accessories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const upsertAccessory = async (id: string | any, updates?: any) => {
  // Support both (accessoryObj) and (id, updates) signatures
  if (typeof id === 'object') {
    const accessory = id;
    if (accessory.id) {
      return await updateAccessory(accessory.id, accessory);
    }
    return await createAccessory(accessory);
  }
  
  return await updateAccessory(id as string, updates);
};

export const deleteAccessory = async (id: string) => {
  const { error } = await supabase
    .from('accessories')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

export const matchAccessoryByName = async (name: string) => {
  const { data, error } = await supabase
    .from('accessories')
    .select('id, name, image_url')
    .ilike('name', name)
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const uploadAccessoryImage = async (file: File) => {
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const fileExt = file.name.split('.').pop();
  
  // Limpiar el nombre para que sea seguro en URLs (minúsculas, reemplazar espacios con guiones bajos)
  const sanitizedBaseName = baseName.toLowerCase().replace(/[^a-z0-9-_]/g, '_').replace(/_+/g, '_');
  
  const fileName = `${sanitizedBaseName}.${fileExt}`;
  const filePath = `accessories/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('public_assets')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('public_assets')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// --- BANNERS & ASSETS COMPATIBILITY ---

export const fetchBanners = async (category: string = 'main_hero', gameCode?: string) => {
  let query = supabase
    .from('hero_banners')
    .select('*')
    .eq('category', category)
    .eq('is_active', true);

  if (gameCode) {
    query = query.eq('game_code', gameCode);
  } else {
    query = query.is('game_code', null);
  }

  const { data, error } = await query.order('display_order');
  
  if (error) {
    console.error('fetchBanners failed:', error);
    return [];
  }

  // Fallback: If no game-specific banners, fetch global ones
  if (gameCode && (!data || data.length === 0)) {
    const { data: globalData } = await supabase
      .from('hero_banners')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .is('game_code', null)
      .order('display_order', { ascending: true });
    return globalData || [];
  }

  return data || [];
};

export const fetchPresales = async () => {
  const { data, error } = await supabase
    .from('presale_banners')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  
  if (error) {
    console.error('fetchPresales failed:', error);
    return [];
  }
  return data || [];
};


export const registerForEvent = async (registration: { event_id: string, full_name: string, email: string, phone: string, user_id?: string }) => {
  const { data, error } = await supabase
    .from('event_registrations')
    .insert([registration])
    .select();
  
  if (error) {
    console.error('registerForEvent failed:', error);
    throw error;
  }
  return data;
};

export const adminFetchRegistrations = async (eventId?: string) => {
  let query = supabase
    .from('event_registrations')
    .select('*, events(name)');
  
  if (eventId) {
    query = query.eq('event_id', eventId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('adminFetchRegistrations failed:', error);
    throw error;
  }
  return data || [];
};

export const fetchEvents = async (onlyActive: boolean = true) => {
  let query = supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });
  
  if (onlyActive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    console.error('fetchEvents failed:', error);
    return [];
  }
  return data || [];
};

export const fetchUserMissions = async (userId: string, email?: string) => {
  let query = supabase
    .from('event_registrations')
    .select('*, events(*)');
  
  if (email) {
    query = query.or(`user_id.eq.${userId},email.eq.${email}`);
  } else {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('fetchUserMissions failed:', error);
    return [];
  }
  return data || [];
};

// --- ADMIN CRUD FUNCTIONS ---

export const adminFetchBanners = async () => {
  const { data, error } = await supabase
    .from('hero_banners')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return data;
};

export const adminSaveBanner = async (banner: any) => {
  const { data, error } = await supabase
    .from('hero_banners')
    .upsert(banner)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const adminDeleteBanner = async (id: string) => {
  const { error } = await supabase
    .from('hero_banners')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// --- PRESALE BANNERS MANAGEMENT [ADMIN] ---

export const adminFetchPresales = async () => {
  const { data, error } = await supabase
    .from('presale_banners')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return data;
};

export const adminSavePresale = async (presale: any) => {
  const { data, error } = await supabase
    .from('presale_banners')
    .upsert(presale)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const adminDeletePresale = async (id: string) => {
  const { error } = await supabase
    .from('presale_banners')
    .delete()
    .eq('id', id);
  if (error) throw error;
};


export const adminFetchEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });
  if (error) throw error;
  return data;
};

export const adminSaveEvent = async (event: any) => {
  const { data, error } = await supabase
    .from('events')
    .upsert(event)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const adminDeleteEvent = async (id: string) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const uploadAsset = async (file: File, folder: string = 'banners') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('public_assets')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('public_assets')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
export const manageProductOffer = async (productId: string, discountPercentage: number, endDate: string) => {
  try {
    const { error } = await supabase.rpc('manage_product_offer', {
      p_product_id: productId,
      p_discount_percentage: discountPercentage,
      p_end_date: endDate
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error managing product offer:', err);
    return { success: false, message: err.message };
  }
};

export const fetchDiscountedSingles = async (gameCode?: string, limit = 10): Promise<any[]> => {
  try {
    let query = supabase
      .from('products')
      .select('*, card_printings!inner(printing_id, image_url, is_foil, finishes, cards(card_name, rarity), sets(set_name))')
      .gt('stock', 0)
      .gt('discount_percentage', 0)
      .order('discount_percentage', { ascending: false })
      .limit(limit);
      
    if (gameCode) {
      // Need to join through card_printings -> cards -> games, or if game is stored directly in products
      // We assume game is in products table as per previous code
      const code = gameCode;
      query = query.eq('game', code);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return (data || [])
      .filter((row: any) => isDiscountActive(row.discount_end_date))
      .map((row: any) => {
        const originalPrice = Number(row.price || 0);
        const discountPct = Number(row.discount_percentage || 0);
        const printing = row.card_printings;
        
        return {
          card_id: printing?.printing_id || row.printing_id,
          name: printing?.cards?.card_name || 'Unknown',
          set: printing?.sets?.set_name || 'Unknown Set',
          price: discountPct > 0 ? originalPrice * (1 - discountPct / 100) : originalPrice,
          original_price: originalPrice,
          discount_percentage: discountPct,
          image_url: printing?.image_url,
          rarity: printing?.cards?.rarity || 'Common',
          total_stock: row.stock || 0,
          is_accessory: false,
          is_foil: !!printing?.is_foil || (printing?.finishes || []).includes('foil'),
          updated_at: row.updated_at
        };
      });
  } catch (error) {
    console.error('Fetch Discounted Singles Failed:', error);
    return [];
  }
};

export const fetchDiscountedAccessories = async (gameCode?: string, limit = 10): Promise<any[]> => {
  try {
    let query = supabase
      .from('accessories')
      .select('*')
      .gt('stock', 0)
      .gt('discount_percentage', 0)
      .order('discount_percentage', { ascending: false })
      .limit(limit);

    if (gameCode) {
      const code = gameCode;
      const { data: gameData } = await supabase.from('games').select('game_id').eq('game_code', code).maybeSingle();
      if (gameData) {
        query = query.eq('game_id', gameData.game_id);
      }
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || [])
      .filter((row: any) => isDiscountActive(row.discount_until))
      .map((row: any) => {
        const originalPrice = Number(row.price || 0);
        const discountPct = Number(row.discount_percentage || 0);
        const finalPrice = discountPct > 0 ? originalPrice * (1 - discountPct / 100) : originalPrice;
        return {
          card_id: row.id,
          name: row.name,
          set: row.category,
          price: finalPrice,
          original_price: originalPrice,
          discount_percentage: discountPct,
          image_url: row.image_url,
          rarity: 'Common',
          total_stock: row.stock || 0,
          is_accessory: true,
          updated_at: row.updated_at
        };
      });
  } catch (error) {
    console.error('Fetch Discounted Accessories Failed:', error);
    return [];
  }
};

export const checkGameInventoryPresence = async (gameCode?: string): Promise<{ hasSingles: boolean, hasCatalog: boolean }> => {
  try {
    if (!gameCode) return { hasSingles: true, hasCatalog: true };
    
    const code = gameCode;
                   
    let hasSingles = false;
    let hasCatalog = false;

    if (code === 'OTHERS') {
      // OTHERS encompasses multiple games, just enable both tabs to let the user explore
      hasSingles = true;
      hasCatalog = true;
    } else {
      const [{ data: singles }, { data: gameData }] = await Promise.all([
        supabase.from('products').select('id').eq('game', code).gt('stock', 0).limit(1),
        supabase.from('games').select('game_id').eq('game_code', code).maybeSingle()
      ]);
      
      if (gameData) {
        const { data: catalog } = await supabase.from('accessories').select('id').eq('game_id', gameData.game_id).gt('stock', 0).limit(1);
        hasCatalog = (catalog && catalog.length > 0) || false;
      }
      
      hasSingles = !!(singles && singles.length > 0);
    }
    
    return {
      hasSingles,
      hasCatalog
    };
  } catch (error) {
    console.error('Check Inventory Presence Failed:', error);
    return { hasSingles: true, hasCatalog: true };
  }
};




export const fetchInventoryList = async (page = 0, pageSize = 50, search = '', game = null, condition = null) => {
  const { data, error } = await supabase.rpc('get_inventory_list', {
    p_page: page,
    p_page_size: pageSize,
    p_search: search || null,
    p_game: game || null,
    p_condition: condition || null,
    p_sort_by: 'name',
    p_sort_order: 'asc'
  });
  if (error) throw error;
  return { data: data || [] };
};

export const fetchAccessoriesAdmin = async (params: { 
  search?: string, 
  limit?: number,
  offset?: number,
  game_id?: number,
  category_code?: string,
  [key: string]: any
}) => {
  const { accessories, total_count } = await fetchAccessories({ 
    ...params,
    q: params.search || params.q
  });
  return { 
    data: accessories || [], 
    count: total_count || 0,
    accessories: accessories || [], 
    total_count: total_count || 0 
  };
};

// --- USER PROFILE AVATAR ---

export const uploadUserAvatar = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
