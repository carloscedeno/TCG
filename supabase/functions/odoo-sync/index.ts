import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

import { reserveSortSwiftCard } from './sortswift.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function odooJsonRpc(url: string, method: string, params: any) {
  const payload = {
    jsonrpc: "2.0",
    method: method,
    params: params,
    id: Math.floor(Math.random() * 1000000)
  };

  const response = await fetch(`${url}/jsonrpc`, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 GeekoriumSync/1.0'
    },
    body: JSON.stringify(payload)
  });

  let text;
  try {
    text = await response.text();
    const json = JSON.parse(text);
    if (json.error) {
      throw new Error(`Odoo RPC Error: ${json.error.data?.message || json.error.message}`);
    }
    return json.result;
  } catch (err: any) {
    throw new Error(`Failed to parse Odoo response from ${url}/jsonrpc: ${err.message}. Response: ${text ? text.substring(0, 100) : ''}`);
  }
}

// Helper to download image and convert to Base64
async function imageToBase64(url: string) {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'GeekoriumSync/1.0' } });
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) return null;
    const arrayBuffer = await response.arrayBuffer();
    // Convert to base64 in Deno/Edge runtime
    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error("Error downloading image:", err);
    return null;
  }
}

// Ensure category exists and return its ID
async function ensureCategory(url: string, db: string, uid: number, apiKey: string, name: string, parentId?: number) {
  const domain: any[] = [['name', '=', name]];
  if (parentId) {
    domain.push(['parent_id', '=', parentId]);
  }
  
  const searchResult = await odooJsonRpc(url, 'call', {
    service: 'object',
    method: 'execute_kw',
    args: [db, uid, apiKey, 'product.category', 'search', [domain], { limit: 1 }]
  });

  if (searchResult && searchResult.length > 0) {
    return searchResult[0];
  }

  // Create
  const createData: any = { name: name };
  if (parentId) createData.parent_id = parentId;

  const newId = await odooJsonRpc(url, 'call', {
    service: 'object',
    method: 'execute_kw',
    args: [db, uid, apiKey, 'product.category', 'create', [createData]]
  });
  return newId;
}


// Fast check/enforcement that Odoo's default pricelist uses USD
async function ensureUsdPricelist(url: string, db: string, uid: number, apiKey: string): Promise<number | null> {
  try {
    const pricelists = await odooJsonRpc(url, 'call', {
      service: 'object',
      method: 'execute_kw',
      args: [db, uid, apiKey, 'product.pricelist', 'search_read', [[]], { fields: ['id', 'name', 'currency_id'] }]
    });

    if (Array.isArray(pricelists)) {
      for (const pl of pricelists) {
        const currName = Array.isArray(pl.currency_id) ? pl.currency_id[1] : '';
        if (currName === 'USD') {
          return pl.id;
        }
      }
    }

    const usdIds = await odooJsonRpc(url, 'call', {
      service: 'object',
      method: 'execute_kw',
      args: [db, uid, apiKey, 'res.currency', 'search', [[['name', '=', 'USD'], ['active', 'in', [true, false]]]], { limit: 1 }]
    });
    if (!usdIds || usdIds.length === 0) return null;
    const usdId = usdIds[0];

    await odooJsonRpc(url, 'call', {
      service: 'object',
      method: 'execute_kw',
      args: [db, uid, apiKey, 'res.currency', 'write', [[usdId], { active: true }]]
    });

    if (Array.isArray(pricelists) && pricelists.length > 0) {
      const targetPlId = pricelists[0].id;
      await odooJsonRpc(url, 'call', {
        service: 'object',
        method: 'execute_kw',
        args: [db, uid, apiKey, 'product.pricelist', 'write', [[targetPlId], { currency_id: usdId }]]
      });
      return targetPlId;
    }
    return null;
  } catch (err: any) {
    console.warn('[Odoo Sync] Could not enforce USD pricelist:', err.message);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const odooUrl = Deno.env.get('ODOO_URL');
    const odooDb = Deno.env.get('ODOO_DB');
    const odooUsername = Deno.env.get('ODOO_USERNAME');
    const odooApiKey = Deno.env.get('ODOO_API_KEY');

    if (!odooUrl || !odooDb || !odooUsername || !odooApiKey) {
      throw new Error("Missing Odoo credentials.");
    }

    const reqBody = await req.json();
    const action = reqBody.action;
    const payload = reqBody.payload;

    // Authenticate
    const uid = await odooJsonRpc(odooUrl, 'call', {
      service: 'common',
      method: 'authenticate',
      args: [odooDb, odooUsername, odooApiKey, {}]
    });

    if (!uid) throw new Error(`Authentication failed with Odoo. DB: ${odooDb}, User: ${odooUsername}, KeyLen: ${odooApiKey?.length}, URL: ${odooUrl}`);

    if (action === 'ping') {
      const usdPricelistId = await ensureUsdPricelist(odooUrl, odooDb, uid, odooApiKey);
      return new Response(JSON.stringify({ success: true, message: "Odoo Connection OK", usd_pricelist_id: usdPricelistId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'sync_inventory') {
      const { items } = payload; // Array of inventory items
      if (!items || !Array.isArray(items)) {
        throw new Error("Missing items in payload");
      }

      // Ensure Categories hierarchy: Juegos TCG > MTG > Singles
      const catJuegosId = await ensureCategory(odooUrl, odooDb, uid, odooApiKey, "Juegos TCG");
      const catMtgId = await ensureCategory(odooUrl, odooDb, uid, odooApiKey, "MTG", catJuegosId);
      const catSinglesId = await ensureCategory(odooUrl, odooDb, uid, odooApiKey, "Singles", catMtgId);

      const results = [];

      for (const item of items) {
        // Build product name: [SET] Name (Finish) - Condition
        const finishStr = item.finish === 'foil' ? ' (Foil)' : '';
        const name = `[${item.set_code}] ${item.name}${finishStr} - ${item.condition}`;
        
        // Search if product exists by default_code
        const searchResult = await odooJsonRpc(odooUrl, 'call', {
          service: 'object',
          method: 'execute_kw',
          args: [
            odooDb, uid, odooApiKey, 
            'product.product', 
            'search', 
            [[['default_code', '=', item.product_id]]], 
            { limit: 1 }
          ]
        });

        const listPrice = item.discount_percentage && item.discount_percentage > 0 
           ? item.price * (1 - item.discount_percentage / 100)
           : item.price;

        let base64Image = null;
        if (item.image_url) {
           base64Image = await imageToBase64(item.image_url);
        }

        let productId;
        if (searchResult && searchResult.length > 0) {
          // Update
          productId = searchResult[0];
          
          const updatePayload: any = {
            name: name,
            list_price: listPrice,
            categ_id: catSinglesId,
            type: 'consu',
            is_storable: true
          };
          if (base64Image) {
            updatePayload.image_512 = base64Image;
          }

          await odooJsonRpc(odooUrl, 'call', {
            service: 'object',
            method: 'execute_kw',
            args: [
              odooDb, uid, odooApiKey, 
              'product.product', 
              'write', 
              [[productId], updatePayload]
            ]
          });
          results.push({ id: item.product_id, status: 'updated' });
        } else {
          // Create
          const createPayload: any = {
            name: name,
            default_code: item.product_id,
            list_price: listPrice,
            categ_id: catSinglesId,
            type: 'consu',
            is_storable: true
          };
          if (base64Image) {
            createPayload.image_512 = base64Image;
          }

          productId = await odooJsonRpc(odooUrl, 'call', {
            service: 'object',
            method: 'execute_kw',
            args: [
              odooDb, uid, odooApiKey, 
              'product.product', 
              'create', 
              [createPayload]
            ]
          });
          results.push({ id: item.product_id, status: 'created' });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'verify_stock') {
      const { items } = payload;
      if (!items || !Array.isArray(items)) {
        throw new Error("Missing items in payload");
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_URL_OVERRIDE') || 'https://bqfkqnnostzaqueujdms.supabase.co';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
      const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

      const invalidItems = [];

      for (const item of items) {
        let odooDomain: any[] = [];
        
        if (item.accessory_id) {
           if (supabaseUrl && supabaseKey) {
             const accRes = await fetch(`${supabaseUrl}/rest/v1/accessories?id=eq.${item.accessory_id}&select=odoo_id,stock`, {
               headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
             });
             const accJson = await accRes.json();
             if (accJson && accJson.length > 0 && accJson[0].odoo_id) {
               odooDomain = [['id', '=', accJson[0].odoo_id]];
             } else {
               odooDomain = [['default_code', '=', item.accessory_id]];
             }
           } else {
             odooDomain = [['default_code', '=', item.accessory_id]];
           }
        } else {
           odooDomain = [['default_code', '=', item.product_id]];
        }

        const productSearch = await odooJsonRpc(odooUrl, 'call', {
          service: 'object',
          method: 'execute_kw',
          args: [
            odooDb, uid, odooApiKey, 
            'product.product', 
            'search_read', 
            [odooDomain], 
            { fields: ['name', 'qty_available', 'type', 'is_storable'], limit: 1 }
          ]
        });

        if (!productSearch || productSearch.length === 0) {
          // Product not synced to Odoo yet: verify directly in Supabase products table
          if (supabase && item.product_id) {
            const { data: sbProd } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.product_id)
              .maybeSingle();
            if (!sbProd) {
              invalidItems.push({ item, reason: 'NOT_FOUND' });
            } else if ((sbProd.stock || 0) < item.quantity && !item.is_on_demand) {
              invalidItems.push({ item, reason: 'OUT_OF_STOCK', available: sbProd.stock || 0 });
            }
          }
        } else {
          const odooProduct = productSearch[0];
          if (odooProduct.is_storable && odooProduct.qty_available < item.quantity && !item.is_on_demand) {
             invalidItems.push({ item, reason: 'OUT_OF_STOCK', available: odooProduct.qty_available });
          }
        }
      }

      if (invalidItems.length > 0) {
        return new Response(JSON.stringify({ success: false, invalid_items: invalidItems }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'sync_order' || action === 'create_order') {
      const { order_data } = reqBody;
      if (!order_data || !order_data.items) {
        throw new Error("Missing order_data in request");
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_URL_OVERRIDE') || 'https://bqfkqnnostzaqueujdms.supabase.co';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
      const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

      // Sanitize client_order_ref defensively first so we can enrich from DB
      let cleanRef = order_data.id;
      if (typeof cleanRef === 'object' && cleanRef !== null) {
        cleanRef = (cleanRef as any).order_id || JSON.stringify(cleanRef);
      }
      if (typeof cleanRef === 'string') {
        const uuidMatch = cleanRef.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        if (uuidMatch) cleanRef = uuidMatch[0];
      }

      let dbOrder: any = null;
      const dbProductsMap = new Map<string, any>();
      if (supabase && cleanRef) {
        const { data: ordRow } = await supabase
          .from('orders')
          .select('id, shipping_address, guest_info, odoo_order_id')
          .eq('id', cleanRef)
          .maybeSingle();
        dbOrder = ordRow;

        const { data: oiRows } = await supabase
          .from('order_items')
          .select('id, product_id, accessory_id, quantity, price_at_purchase, products(id, name, game, set_code, condition, finish, price, cost, barcode)')
          .eq('order_id', cleanRef);
        for (const oi of oiRows || []) {
          if (oi.product_id && oi.products) {
            dbProductsMap.set(oi.product_id, oi.products);
          }
        }
      }

      // 1. Find or create Partner (enriching customer name & email from orders.shipping_address if available)
      const shippingAddr = dbOrder?.shipping_address || {};
      const guestInfo = dbOrder?.guest_info || {};
      const customerEmail =
        shippingAddr.email ||
        guestInfo.email ||
        order_data.customer_email ||
        'guest@geekorium.com';
      const rawCustomerName = order_data.customer_name;
      const customerName =
        (rawCustomerName && rawCustomerName !== 'Web Customer' ? rawCustomerName : null) ||
        shippingAddr.full_name ||
        rawCustomerName ||
        'Web Customer';
      const customerPhone = shippingAddr.phone || guestInfo.phone || null;

      let partnerId;
      const partnerSearch = await odooJsonRpc(odooUrl, 'call', {
        service: 'object',
        method: 'execute_kw',
        args: [
          odooDb, uid, odooApiKey, 
          'res.partner', 
          'search', 
          [[['email', '=', customerEmail]]], 
          { limit: 1 }
        ]
      });

      if (partnerSearch && partnerSearch.length > 0) {
        partnerId = partnerSearch[0];
        if (customerName && customerName !== 'Web Customer') {
          try {
            await odooJsonRpc(odooUrl, 'call', {
              service: 'object',
              method: 'execute_kw',
              args: [
                odooDb, uid, odooApiKey,
                'res.partner',
                'write',
                [[partnerId], { name: customerName, ...(customerPhone ? { phone: customerPhone } : {}) }]
              ]
            });
          } catch (_e) {
            // non-fatal partner update
          }
        }
      } else {
        partnerId = await odooJsonRpc(odooUrl, 'call', {
          service: 'object',
          method: 'execute_kw',
          args: [
            odooDb, uid, odooApiKey, 
            'res.partner', 
            'create', 
            [{
              name: customerName,
              email: customerEmail,
              ...(customerPhone ? { phone: customerPhone } : {}),
              customer_rank: 1
            }]
          ]
        });
      }

      // Cache for Odoo categories during this request
      const categoryCache = new Map<string, number>();
      const getOrCreateSinglesCategoryId = async (gameCode: string): Promise<number> => {
        const gCode = (gameCode || 'MTG').toUpperCase();
        if (categoryCache.has(gCode)) return categoryCache.get(gCode)!;
        const catJuegosId = await ensureCategory(odooUrl, odooDb, uid, odooApiKey, "Juegos TCG");
        const catGameId = await ensureCategory(odooUrl, odooDb, uid, odooApiKey, gCode, catJuegosId);
        const catSinglesId = await ensureCategory(odooUrl, odooDb, uid, odooApiKey, "Singles", catGameId);
        categoryCache.set(gCode, catSinglesId);
        return catSinglesId;
      };

      // 2. Prepare order lines (auto-creating any missing product.product in Odoo on the fly)
      const orderLines = [];
      for (const item of order_data.items) {
        let odooDomain: any[] = [];
        let resolvedProductId = item.product_id;

        if (!resolvedProductId && !item.accessory_id && item.printing_id && supabase) {
          const reqFinish = (item.finish || (item.foil ? 'foil' : 'nonfoil')).toLowerCase();
          const { data: matchedProd } = await supabase
            .from('products')
            .select('id, name, game, set_code, condition, finish, price, cost, barcode')
            .eq('printing_id', item.printing_id)
            .eq('finish', reqFinish)
            .maybeSingle();
          if (matchedProd) {
            resolvedProductId = matchedProd.id;
            dbProductsMap.set(matchedProd.id, matchedProd);
          }
        }

        if (item.accessory_id) {
           if (supabaseUrl && supabaseKey) {
             const accRes = await fetch(`${supabaseUrl}/rest/v1/accessories?id=eq.${item.accessory_id}&select=odoo_id,name,price`, {
               headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
             });
             const accJson = await accRes.json();
             if (accJson && accJson.length > 0 && accJson[0].odoo_id) {
               odooDomain = [['id', '=', accJson[0].odoo_id]];
             } else {
               odooDomain = [['default_code', '=', item.accessory_id]];
             }
           } else {
             odooDomain = [['default_code', '=', item.accessory_id]];
           }
        } else {
           odooDomain = [['default_code', '=', resolvedProductId]];
        }

        const productSearch = await odooJsonRpc(odooUrl, 'call', {
          service: 'object',
          method: 'execute_kw',
          args: [
            odooDb, uid, odooApiKey, 
            'product.product', 
            'search', 
            [odooDomain], 
            { limit: 1 }
          ]
        });

        let odooProductId: number | null = productSearch && productSearch.length > 0 ? productSearch[0] : null;

        // If the card or accessory is not yet in Odoo, auto-create it on the fly!
        if (!odooProductId) {
          let prodInfo = resolvedProductId ? dbProductsMap.get(resolvedProductId) : null;
          if (!prodInfo && resolvedProductId && supabase) {
            const { data: fetchedProd } = await supabase
              .from('products')
              .select('id, name, game, set_code, condition, finish, price, cost, barcode')
              .eq('id', resolvedProductId)
              .maybeSingle();
            prodInfo = fetchedProd;
          }

          const cardName = prodInfo?.name || item.name || 'Carta TCG';
          const setCode = (prodInfo?.set_code || item.set || 'SET').toUpperCase();
          const finish = (prodInfo?.finish || item.finish || (item.foil ? 'foil' : 'nonfoil')).toLowerCase();
          const condition = (prodInfo?.condition || 'NM').toUpperCase();
          const gameCode = prodInfo?.game || 'MTG';
          const finishStr = finish === 'foil' ? ' (Foil)' : '';
          const formattedName = item.accessory_id
            ? `[ACC] ${cardName}`
            : `[${setCode}] ${cardName}${finishStr} - ${condition}`;
          const defaultCode = item.accessory_id || resolvedProductId || `GEEKO-${Date.now()}`;
          const unitPrice = Number(item.price ?? prodInfo?.price ?? 0);
          const categId = await getOrCreateSinglesCategoryId(gameCode);

          odooProductId = await odooJsonRpc(odooUrl, 'call', {
            service: 'object',
            method: 'execute_kw',
            args: [
              odooDb, uid, odooApiKey,
              'product.product',
              'create',
              [{
                name: formattedName,
                default_code: defaultCode,
                list_price: unitPrice,
                categ_id: categId,
                type: 'consu',
                is_storable: true
              }]
            ]
          });
          console.log(`[Odoo Sync] Auto-created missing product in Odoo: ${formattedName} (ID: ${odooProductId}, Code: ${defaultCode})`);
        }

        if (odooProductId) {
          orderLines.push([0, 0, {
            product_id: odooProductId,
            product_uom_qty: Number(item.quantity || 1),
            price_unit: Number(item.price || 0)
          }]);
        }
      }

      // 3. Create Sale Order
      if (orderLines.length === 0) {
        throw new Error("No mappable products found for this order in Odoo.");
      }

      const usdPricelistId = await ensureUsdPricelist(odooUrl, odooDb, uid, odooApiKey);

      const orderId = await odooJsonRpc(odooUrl, 'call', {
        service: 'object',
        method: 'execute_kw',
        args: [
          odooDb, uid, odooApiKey, 
          'sale.order', 
          'create', 
          [{
            partner_id: partnerId,
            ...(usdPricelistId ? { pricelist_id: usdPricelistId } : {}),
            order_line: orderLines,
            client_order_ref: cleanRef
          }]
        ]
      });

      // Immediately link odoo_order_id to Supabase
      let soName: string | null = null;
      try {
        const soDetails = await odooJsonRpc(odooUrl, 'call', {
          service: 'object',
          method: 'execute_kw',
          args: [
            odooDb, uid, odooApiKey,
            'sale.order',
            'read',
            [[orderId]],
            { fields: ['name'] }
          ]
        });
        soName = soDetails?.[0]?.name || null;
        if (soName && cleanRef && supabaseUrl && supabaseKey) {
          await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${cleanRef}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ odoo_order_id: soName })
          });
        }
      } catch (linkErr) {
        console.error('[Odoo Sync] Error linking odoo_order_id in orders:', linkErr);
      }

      // Step 4: Hold physical MTG cards on SortSwift for items in this order
      try {
        if (cleanRef && supabase) {
          let ssApiKey = Deno.env.get('SORTSWIFT_API_KEY') || '';
          if (!ssApiKey) {
            const { data: cfg } = await supabase
              .from('system_config')
              .select('value')
              .eq('key', 'SORTSWIFT_API_KEY')
              .maybeSingle();
            ssApiKey = cfg?.value || 'ss_inv_fa551970f693f49c03d8b0120d35e6b314ce980a6a31eda3b6b683520efec738';
          }

          const { data: orderItems } = await supabase
            .from('order_items')
            .select('id, product_id')
            .eq('order_id', cleanRef);

          if (Array.isArray(orderItems)) {
            for (const oi of orderItems) {
              if (oi.product_id) {
                const { data: prod } = await supabase
                  .from('products')
                  .select('sortswift_id')
                  .eq('id', oi.product_id)
                  .maybeSingle();

                if (prod?.sortswift_id) {
                  const hold = await reserveSortSwiftCard(prod.sortswift_id, oi.id, 60, ssApiKey);
                  if (hold && hold.id) {
                    await supabase
                      .from('order_items')
                      .update({ sortswift_reservation_id: hold.id })
                      .eq('id', oi.id);
                    console.log(`[SortSwift Hold] Attached reservation ${hold.id} to order_item ${oi.id}`);
                  }
                }
              }
            }
          }
        }
      } catch (ssErr: any) {
        console.error('[SortSwift Hold] Non-fatal error reserving cards on SortSwift:', ssErr.message);
      }

      return new Response(JSON.stringify({ success: true, order_id: orderId, odoo_order_name: soName }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
