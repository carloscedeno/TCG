import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

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

  const text = await response.text();
  try {
    const json = JSON.parse(text);
    if (json.error) {
      throw new Error(`Odoo RPC Error: ${json.error.data?.message || json.error.message}`);
    }
    return json.result;
  } catch (err: any) {
    throw new Error(`Failed to parse Odoo response: ${err.message}. Response: ${text.substring(0, 100)}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Iniciando sincronización BCV...");
    
    // 1. Obtener tasa del BCV (Oficial)
    const oficialResponse = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
    if (!oficialResponse.ok) throw new Error("Fallo API Dolar Oficial");
    const dataOficial = await oficialResponse.json();
    const rateOficial = parseFloat(dataOficial.promedio);

    // 2. Obtener tasa Binance Real (P2P USDT/VES)
    const binanceResponse = await fetch("https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proMerchantAds: false,
        page: 1,
        rows: 1,
        payTypes: [],
        countries: [],
        publisherType: null,
        asset: "USDT",
        fiat: "VES",
        tradeType: "BUY"
      })
    });
    if (!binanceResponse.ok) throw new Error("Fallo API Binance P2P");
    const dataBinance = await binanceResponse.json();
    if (!dataBinance.data || dataBinance.data.length === 0) throw new Error("No hay anuncios en Binance P2P");
    const rateParalelo = parseFloat(dataBinance.data[0].adv.price);

    console.log(`Tasas obtenidas -> Oficial (BCV): ${rateOficial} | Real (Binance P2P): ${rateParalelo}`);

    // 3. Conectar a Odoo
    const odooUrl = Deno.env.get('ODOO_URL');
    const odooDb = Deno.env.get('ODOO_DB');
    const odooUsername = Deno.env.get('ODOO_USERNAME');
    const odooApiKey = Deno.env.get('ODOO_API_KEY');

    if (!odooUrl || !odooDb || !odooUsername || !odooApiKey) {
      throw new Error("Faltan las credenciales de Odoo en las variables de entorno.");
    }

    console.log("Autenticando en Odoo...");
    const uid = await odooJsonRpc(odooUrl, 'call', {
      service: 'common',
      method: 'login',
      args: [odooDb, odooUsername, odooApiKey]
    });

    if (!uid) throw new Error("Fallo la autenticación en Odoo.");

    const today = new Date().toISOString().split('T')[0];
    const results = [];

    // Función auxiliar para procesar una moneda
    async function updateOdooCurrency(currencyName: string, bcvRate: number) {
      const searchCurrency = await odooJsonRpc(odooUrl, 'call', {
        service: 'object',
        method: 'execute_kw',
        args: [odooDb, uid, odooApiKey, 'res.currency', 'search', [[['name', '=', currencyName]]]]
      });

      if (!searchCurrency || searchCurrency.length === 0) {
        console.warn(`Moneda ${currencyName} no encontrada en Odoo, ignorando.`);
        return { currency: currencyName, status: 'Not Found' };
      }

      const currencyId = searchCurrency[0];
      const odooRate = 1 / bcvRate;

      const searchRate = await odooJsonRpc(odooUrl, 'call', {
        service: 'object',
        method: 'execute_kw',
        args: [odooDb, uid, odooApiKey, 'res.currency.rate', 'search', [[['currency_id', '=', currencyId], ['name', '=', today]]]]
      });

      if (searchRate && searchRate.length > 0) {
        await odooJsonRpc(odooUrl, 'call', {
          service: 'object',
          method: 'execute_kw',
          args: [odooDb, uid, odooApiKey, 'res.currency.rate', 'write', [searchRate, { rate: odooRate }]]
        });
        return { currency: currencyName, status: 'Updated', rate: bcvRate, odooRate };
      } else {
        await odooJsonRpc(odooUrl, 'call', {
          service: 'object',
          method: 'execute_kw',
          args: [odooDb, uid, odooApiKey, 'res.currency.rate', 'create', [{ currency_id: currencyId, name: today, rate: odooRate }]]
        });
        return { currency: currencyName, status: 'Created', rate: bcvRate, odooRate };
      }
    }

    // 4. Actualizar USD (Oficial) y USB (Binance/Paralelo)
    results.push(await updateOdooCurrency('USD', rateOficial));
    results.push(await updateOdooCurrency('USB', rateParalelo));

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Sincronización completada.",
      details: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error al actualizar la tasa del BCV:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
