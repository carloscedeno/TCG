import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const payload = await req.json()
    console.log("Supabase Webhook Payload:", JSON.stringify(payload))

    if (payload.type !== 'INSERT' || payload.table !== 'event_registrations') {
        return new Response('Not a registration insert', { status: 200 })
    }

    const registration = payload.record
    if (!registration.event_id || !registration.user_id) {
        return new Response('Missing event_id or user_id', { status: 200 })
    }

    // Get the Odoo Event ID
    const { data: eventData } = await supabase.from('events').select('odoo_id').eq('id', registration.event_id).single()
    if (!eventData || !eventData.odoo_id) {
        throw new Error('Odoo Event ID not found for this event')
    }

    // Get the User details
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', registration.user_id).single()
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(registration.user_id)
    
    const email = userData?.user?.email
    const name = profile?.full_name || email?.split('@')[0] || 'Unknown Attendee'

    if (!email) {
        throw new Error('User email not found')
    }

    console.log(`Registering ${email} to Odoo event ${eventData.odoo_id}`)

    const ODOO_URL = Deno.env.get('ODOO_URL')
    const ODOO_DB = Deno.env.get('ODOO_DB')
    const ODOO_USERNAME = Deno.env.get('ODOO_USERNAME')
    const ODOO_PASSWORD = Deno.env.get('ODOO_PASSWORD')

    if (!ODOO_URL) {
        throw new Error('Missing Odoo credentials in environment')
    }

    // 1. Authenticate with Odoo JSON-RPC
    const authPayload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            service: "common",
            method: "authenticate",
            args: [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}]
        },
        id: Math.floor(Math.random() * 1000)
    }

    const authRes = await fetch(`${ODOO_URL}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authPayload)
    })
    
    const authData = await authRes.json()
    const uid = authData.result

    if (!uid) {
        throw new Error('Odoo Authentication failed')
    }

    // 2. Search for partner by email
    const searchPartnerPayload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            service: "object",
            method: "execute_kw",
            args: [ODOO_DB, uid, ODOO_PASSWORD, 'res.partner', 'search', [[['email', '=', email]]]]
        },
        id: Math.floor(Math.random() * 1000)
    }

    const partnerRes = await fetch(`${ODOO_URL}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchPartnerPayload)
    })
    const partnerData = await partnerRes.json()
    const partnerIds = partnerData.result
    
    let partnerId = partnerIds && partnerIds.length > 0 ? partnerIds[0] : null

    // 3. Create the event.registration
    const regPayload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            service: "object",
            method: "execute_kw",
            args: [
                ODOO_DB, uid, ODOO_PASSWORD, 
                'event.registration', 'create', 
                [{
                    event_id: eventData.odoo_id,
                    email: email,
                    name: name,
                    partner_id: partnerId
                }]
            ]
        },
        id: Math.floor(Math.random() * 1000)
    }

    const createRes = await fetch(`${ODOO_URL}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regPayload)
    })

    const createData = await createRes.json()
    const attendeeId = createData.result

    if (createData.error) {
        throw new Error(`Odoo API Error: ${JSON.stringify(createData.error)}`)
    }

    console.log(`Created Odoo attendee ID: ${attendeeId}`)

    // 4. Update the Supabase record with the odoo_attendee_id
    if (attendeeId) {
        await supabase.from('event_registrations').update({ odoo_attendee_id: attendeeId }).eq('id', registration.id)
    }

    return new Response(JSON.stringify({ status: 'success', attendee_id: attendeeId }), { status: 200 })

  } catch (error: any) {
    console.error(`Error syncing registration: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
