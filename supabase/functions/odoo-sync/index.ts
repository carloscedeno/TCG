
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (json.error) {
    throw new Error(`Odoo RPC Error: ${json.error.data?.message || json.error.message}`);
  }
  return json.result;
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
  const domain = [['name', '=', name]];
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

    if (!uid) throw new Error("Authentication failed with Odoo.");

    if (action === 'ping') {
      return new Response(JSON.stringify({ success: true, message: "Odoo Connection OK" }), {
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
        
        // NOTE: Stock quantity update (stock.quant) is complex in Odoo as it requires a location_id.
        // For phase 1, we just sync the product structure and price.
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

      const invalidItems = [];

      for (const item of items) {
        let odooDomain = [];
        
        if (item.accessory_id) {
           const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_URL_OVERRIDE') || 'https://bqfkqnnostzaqueujdms.supabase.co';
           const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
           
           if (supabaseUrl && supabaseKey) {
             const accRes = await fetch(`${supabaseUrl}/rest/v1/accessories?id=eq.${item.accessory_id}&select=odoo_id`, {
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
          invalidItems.push({ item, reason: 'NOT_FOUND' });
        } else {
          const odooProduct = productSearch[0];
          // Only strictly block for out of stock if it's a storable product
          if (odooProduct.is_storable && odooProduct.qty_available < item.quantity) {
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

    if (action === 'sync_order') {
      const { order_data } = reqBody;
      if (!order_data || !order_data.items) {
        throw new Error("Missing order_data in request");
      }

      // 1. Find or create Partner
      const customerEmail = order_data.customer_email || 'guest@geekorium.com';
      const customerName = order_data.customer_name || 'Web Customer';
      
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
              customer_rank: 1
            }]
          ]
        });
      }

      // 2. Prepare order lines
      const orderLines = [];
      for (const item of order_data.items) {
        let odooDomain = [];
        
        if (item.accessory_id) {
           // For accessories, we must fetch the odoo_id from the database
           const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_URL_OVERRIDE') || 'https://bqfkqnnostzaqueujdms.supabase.co';
           const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
           
           if (supabaseUrl && supabaseKey) {
             const accRes = await fetch(`${supabaseUrl}/rest/v1/accessories?id=eq.${item.accessory_id}&select=odoo_id`, {
               headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
             });
             const accJson = await accRes.json();
             if (accJson && accJson.length > 0 && accJson[0].odoo_id) {
               odooDomain = [['id', '=', accJson[0].odoo_id]];
             } else {
               // Fallback to default_code just in case
               odooDomain = [['default_code', '=', item.accessory_id]];
             }
           } else {
             odooDomain = [['default_code', '=', item.accessory_id]];
           }
        } else {
           // For TCG Cards, default_code is the product_id (UUID)
           odooDomain = [['default_code', '=', item.product_id]];
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

        if (productSearch && productSearch.length > 0) {
          orderLines.push([0, 0, {
            product_id: productSearch[0],
            product_uom_qty: item.quantity,
            price_unit: item.price
          }]);
        }
      }

      // 3. Create Sale Order
      if (orderLines.length === 0) {
        throw new Error("No mappable products found for this order in Odoo.");
      }

      const orderId = await odooJsonRpc(odooUrl, 'call', {
        service: 'object',
        method: 'execute_kw',
        args: [
          odooDb, uid, odooApiKey, 
          'sale.order', 
          'create', 
          [{
            partner_id: partnerId,
            order_line: orderLines,
            client_order_ref: order_data.id
          }]
        ]
      });

      return new Response(JSON.stringify({ success: true, order_id: orderId }), {
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
