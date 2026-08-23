import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_URL_OVERRIDE') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check Authorization token in header or secret in URL query
    const authHeader = req.headers.get('Authorization')
    const urlObj = new URL(req.url)
    const urlSecret = urlObj.searchParams.get('secret')
    
    const WEBHOOK_SECRET = 'geekorium_odoo_secret_2026'

    let isAuthorized = false
    if (authHeader && authHeader === `Bearer ${supabaseKey}`) {
        isAuthorized = true
    } else if (urlSecret && urlSecret === WEBHOOK_SECRET) {
        isAuthorized = true
    }

    if (!isAuthorized) {
        console.warn('Unauthorized webhook request from Odoo.')
        return new Response(JSON.stringify({ error: 'Unauthorized', receivedUrl: req.url }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401
        })
    }

    const rawBody = await req.json()
    console.log("Raw Odoo Webhook Payload:", JSON.stringify(rawBody))

    let email = ''
    let name = ''

    // Handle Odoo native webhook payload which might be an array of records
    if (Array.isArray(rawBody) && rawBody.length > 0) {
        email = rawBody[0].email
        name = rawBody[0].name
    } else {
        email = rawBody.email
        name = rawBody.name
    }

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    console.log(`Processing Odoo customer creation for: ${email}`)

    // Check if the user already exists in auth.users
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      throw listError
    }

    const existingUser = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (existingUser) {
      console.log(`User ${email} already exists in Supabase. Skipping invitation.`)
      return new Response(JSON.stringify({ status: 'ignored', message: 'User already exists' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Generate Invite
    console.log(`Sending Magic Link invite to ${email}...`)
    
    // We can also pass user metadata like their name so they don't have to fill it out
    const nameParts = name ? name.split(' ') : []
    const first_name = nameParts[0] || ''
    const last_name = nameParts.slice(1).join(' ') || ''

    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: first_name,
        last_name: last_name
      }
    })

    if (inviteError) {
      throw inviteError
    }

    console.log(`Invitation sent successfully to ${email}.`)

    return new Response(JSON.stringify({ status: 'success', message: `Invited ${email}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error(`Error processing webhook: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
