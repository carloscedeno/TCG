import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper for Odoo RPC
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("[Odoo Sync Event Reg] Received payload:", JSON.stringify(payload));

    const record = payload.record;
    if (!record || payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ message: "Not an insert or missing record" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { event_id, full_name, email, phone, id: registrationId } = record;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the event to get its Odoo ID
    const { data: eventData, error: eventErr } = await supabase
        .from('events')
        .select('odoo_id')
        .eq('id', event_id)
        .single();

    if (eventErr || !eventData || !eventData.odoo_id) {
        console.error("Event not found or missing odoo_id:", eventErr);
        return new Response(JSON.stringify({ error: "Event missing Odoo ID" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    const odooEventId = eventData.odoo_id;

    // Odoo credentials
    const odooUrl = Deno.env.get('ODOO_URL');
    const odooDb = Deno.env.get('ODOO_DB');
    const odooUsername = Deno.env.get('ODOO_USERNAME');
    const odooApiKey = Deno.env.get('ODOO_API_KEY');

    if (!odooUrl || !odooDb || !odooUsername || !odooApiKey) {
      throw new Error("Missing Odoo credentials.");
    }

    // 1. Authenticate to Odoo
    const uid = await odooJsonRpc(odooUrl, 'call', {
      service: 'common',
      method: 'authenticate',
      args: [odooDb, odooUsername, odooApiKey, {}]
    });

    // 2. Create the registration in Odoo.
    // NOTE: Depending on Odoo setup, this might be `event.registration` (Events app) 
    // or `calendar.attendee` (Calendar app). Assuming `event.registration` as primary.
    
    // We search or create a partner first
    let partnerId = null;
    const partnerSearch = await odooJsonRpc(odooUrl, 'call', {
      service: 'object',
      method: 'execute_kw',
      args: [odooDb, uid, odooApiKey, 'res.partner', 'search', [[['email', '=', email]]]]
    });

    if (partnerSearch && partnerSearch.length > 0) {
        partnerId = partnerSearch[0];
    } else {
        partnerId = await odooJsonRpc(odooUrl, 'call', {
            service: 'object',
            method: 'execute_kw',
            args: [odooDb, uid, odooApiKey, 'res.partner', 'create', [{
                name: full_name,
                email: email,
                phone: phone
            }]]
        });
    }

    const regId = await odooJsonRpc(odooUrl, 'call', {
        service: 'object',
        method: 'execute_kw',
        args: [
            odooDb, uid, odooApiKey, 
            'event.registration', 
            'create', 
            [{
                event_id: parseInt(odooEventId, 10),
                partner_id: partnerId,
                name: full_name,
                email: email,
                phone: phone
            }]
        ]
    });

    console.log(`[Odoo Sync Event Reg] Created event.registration ${regId} in Odoo`);

    // 3. Save the odoo_attendee_id back to Supabase
    await supabase.from('event_registrations').update({
        odoo_attendee_id: regId
    }).eq('id', registrationId);

    return new Response(JSON.stringify({ success: true, odoo_attendee_id: regId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error("[Odoo Sync Event Reg] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
