import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, providedPassword } = await req.json();
    
    if (!profileId || !providedPassword) {
      return new Response(JSON.stringify({ valid: false, error: "Missing required parameters" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the stored raw password
    const { data: credData, error: credError } = await supabase
      .from("webhook_credentials")
      .select("raw_password")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (credError || !credData) {
      return new Response(JSON.stringify({ valid: false, error: "No webhook credentials found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Compare the raw passwords directly
    const isValid = providedPassword === credData.raw_password;

    return new Response(JSON.stringify({ valid: isValid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in verify-webhook-auth:", error);
    return new Response(JSON.stringify({ valid: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});