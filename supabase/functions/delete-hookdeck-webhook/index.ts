// Supabase Edge Function: delete-hookdeck-webhook
// Deletes the authenticated user's Hookdeck Source and clears webhook fields in profile.
// - Requires user JWT
// - Uses HOOKDECK_API_KEY to call Hookdeck API
// - On success (or 404), nulls out webhook-related fields in profiles

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const HOOKDECK_API_BASE = "https://api.hookdeck.com/2025-07-01";

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const HOOKDECK_API_KEY = Deno.env.get("HOOKDECK_API_KEY");

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return json({ error: "Missing Supabase env vars" }, { status: 500 });
    }

    // Identify current user via JWT
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Admin client for privileged operations
    const admin = createClient(supabaseUrl, serviceKey);

    // Load source_id from profile
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("id, source_id")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) {
      console.error("Failed to load profile", profErr);
      return json({ error: "Failed to load profile" }, { status: 500 });
    }

    if (!profile) {
      return json({ status: "no_profile" });
    }

    const sourceId = (profile as any)?.source_id as string | null;

    if (!sourceId) {
      // Still clear fields to be safe
      const { error: clearErr } = await admin
        .from("profiles")
        .update({
          source_id: null,
          webhook_url: null,
          webhook_password: null,
          client_uuid: null,
          client_secret: null,
        })
        .eq("id", userId);
      if (clearErr) {
        console.warn("Failed to clear webhook fields without source_id", clearErr);
      }
      return json({ status: "no_source" });
    }

    if (!HOOKDECK_API_KEY) {
      console.warn("HOOKDECK_API_KEY not set; skipping Hookdeck deletion");
    } else {
      const url = `${HOOKDECK_API_BASE}/sources/${sourceId}`;
      console.log("Deleting Hookdeck source:", url);
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${HOOKDECK_API_KEY}`,
          "Content-Type": "application/json",
        },
      });
      const text = await res.text();
      if (res.status === 404) {
        console.log("Hookdeck source not found (treated as success)");
      } else if (!res.ok) {
        console.error("Hookdeck delete failed", res.status, text);
        return json({ error: "Hookdeck delete failed", statusCode: res.status }, { status: 502 });
      }
    }

    // Clear webhook fields after successful deletion (or 404)
    const { error: updErr } = await admin
      .from("profiles")
      .update({
        source_id: null,
        webhook_url: null,
        webhook_password: null,
        client_uuid: null,
        client_secret: null,
      })
      .eq("id", userId);
    if (updErr) {
      console.warn("Failed to clear webhook fields after deletion", updErr);
    }

    return json({ status: "deleted", source_id: sourceId });
  } catch (err) {
    console.error("delete-hookdeck-webhook error", err);
    return json({ error: "Failed to delete webhook" }, { status: 500 });
  }
});
