import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLogs() {
    const { data, error } = await supabase
        .from('logs')
        .select('*')
        .limit(10)

    if (error) {
        console.error('Error fetching logs:', error)
    } else {
        console.log('Last 10 logs:', data)
    }
}

checkLogs().catch(console.error)
