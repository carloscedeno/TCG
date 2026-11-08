import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_URL_OVERRIDE') || ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        const supabase = createClient(supabaseUrl, supabaseKey)

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
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            })
        }

        let rawBody
        try {
            rawBody = await req.json()
            console.log("Raw Odoo Webhook Payload (eWallet):", JSON.stringify(rawBody))

            // SMART REDIRECT: If we are running in the DEV project, forward to PROD
            if (supabaseUrl.includes('bqfkqnnostzaqueujdms')) {
                console.log("DEV Environment detected. Forwarding webhook to PROD...");
                const prodUrl = `https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/odoo-ewallet-sync?secret=${WEBHOOK_SECRET}`;
                try {
                    const prodResponse = await fetch(prodUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(rawBody)
                    });
                    const prodResponseText = await prodResponse.text();
                    console.log("Forwarded to PROD. Response:", prodResponseText);
                    return new Response(prodResponseText, {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: prodResponse.status
                    });
                } catch (fwdError: any) {
                    console.error("Error forwarding to PROD:", fwdError.message);
                }
            }
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders })
        }

        const records = Array.isArray(rawBody) ? rawBody : [rawBody]
        console.log(`Received ${records.length} records from Odoo eWallet webhook.`)

        const results = []

        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
        if (usersError) throw usersError

        for (const record of records) {
            const email = record.x_partner_email
            const points = record.points

            if (!email || email === 'false' || email === false) {
                results.push({ id: record._id, status: 'skipped', reason: 'No email' })
                continue
            }
            if (points === undefined || points === null) {
                results.push({ id: record._id, status: 'skipped', reason: 'No points' })
                continue
            }

            const user = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
            if (!user) {
                results.push({ email, status: 'skipped', reason: 'User not found in Web DB' })
                continue
            }

            const userId = user.id

            // Fetch current balance to calculate the difference for history
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('geek_credits')
                .eq('id', userId)
                .single()

            if (profileError) {
                results.push({ email, status: 'error', reason: 'Failed to fetch current profile' })
                continue
            }

            const oldBalance = profile.geek_credits || 0
            const difference = points - oldBalance

            // Update profiles table with new absolute balance
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ geek_credits: points })
                .eq('id', userId)

            if (updateError) {
                results.push({ email, status: 'error', reason: 'Failed to update profile' })
                continue
            }

            // If there's a difference, log it in credit_history
            if (difference !== 0) {
                const actionWord = difference > 0 ? 'Recarga' : 'Consumo'
                const customReason = record.x_last_description || `${actionWord} en Tienda Física (Odoo)`
                
                const { error: historyError } = await supabase
                    .from('credit_history')
                    .insert({
                        user_id: userId,
                        amount: difference,
                        reason: customReason
                    })

                if (historyError) {
                    console.error('Failed to insert history:', historyError)
                }
            }

            results.push({ email, status: 'success', balance: points, difference })
        }

        return new Response(JSON.stringify({ message: 'Processed', results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
