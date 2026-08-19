import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as postgres from "https://deno.land/x/postgres@v0.17.0/mod.ts";

serve(async (req) => {
  try {
    const { query } = await req.json();
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!dbUrl) throw new Error("Missing DB URL");

    // Connect to database
    const pool = new postgres.Pool(dbUrl, 1, true);
    const connection = await pool.connect();

    try {
      const result = await connection.queryObject(query);
      return new Response(JSON.stringify({ success: true, rows: result.rows }), { status: 200 });
    } finally {
      connection.release();
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
