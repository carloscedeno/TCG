import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://bqfkqnnostzaqueujdms.supabase.co";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    let userEmail = "admin";
    let ghToken = Deno.env.get("GITHUB_TOKEN");

    if (supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user?.email) userEmail = user.email;
      }

      if (!ghToken) {
        const { data: config } = await supabase
          .from("system_config")
          .select("value")
          .eq("key", "GITHUB_TOKEN")
          .maybeSingle();
        if (config?.value) ghToken = config.value;
      }
    }

    let dispatched = false;

    if (ghToken) {
      try {
        const ghRes = await fetch("https://api.github.com/repos/carloscedeno/TCG/dispatches", {
          method: "POST",
          headers: {
            "Accept": "application/vnd.github.v3+json",
            "Authorization": `token ${ghToken}`,
            "Content-Type": "application/json",
            "User-Agent": "Geekorium-Admin-Sync",
          },
          body: JSON.stringify({
            event_type: "sortswift_sync_trigger",
            client_payload: {
              target_env: "dev",
              triggered_by: userEmail,
            },
          }),
        });
        if (ghRes.ok || ghRes.status === 204) {
          dispatched = true;
        }
      } catch (err) {
        console.warn("GitHub dispatch error:", err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: "dispatched",
        dispatched,
        message: "Pipeline de sincronización SortSwift y Odoo ERP despachado exitosamente en DEV.",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
