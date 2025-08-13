// Supabase Edge Function: delete-account
// Deletes the authenticated user's account and related data using the service role.
// Best practices:
// - Require user authentication (JWT)
// - Clean dependent records first to satisfy FKs
// - Use service role to bypass RLS
// - Return clear status codes and messages

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client with the user's JWT to identify current user
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Service role client for privileged operations
    const admin = createClient(supabaseUrl, serviceKey);

    // Attempt to delete Hookdeck Source if configured
    try {
      const HOOKDECK_API_KEY = Deno.env.get("HOOKDECK_API_KEY");
      const HOOKDECK_API_BASE = "https://api.hookdeck.com/2025-07-01";
      if (HOOKDECK_API_KEY) {
        const { data: profRow, error: profSelErr } = await admin
          .from("profiles")
          .select("source_id")
          .eq("id", userId)
          .maybeSingle();
        if (profSelErr) {
          console.warn("Failed to load profile for Hookdeck deletion", profSelErr);
        } else if (profRow?.source_id) {
          const srcId = profRow.source_id as string;
          const url = `${HOOKDECK_API_BASE}/sources/${srcId}`;
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
            console.log("Hookdeck source not found, treating as deleted");
          } else if (!res.ok) {
            console.warn("Hookdeck source delete failed", res.status, text);
          } else {
            console.log("Hookdeck source deleted");
          }
        }
      } else {
        console.warn("HOOKDECK_API_KEY not set; skipping Hookdeck source deletion");
      }
    } catch (hdErr) {
      console.warn("Hookdeck deletion step error (ignored)", hdErr);
    }

    // 1) Gather related IDs (donations -> postcards -> tracking_events)
    const { data: donations, error: donationsErr } = await admin
      .from("donations")
      .select("id")
      .eq("profile_id", userId);
    if (donationsErr) throw donationsErr;
    const donationIds = (donations ?? []).map((d: any) => d.id);

    let postcardIds: string[] = [];
    if (donationIds.length > 0) {
      const { data: postcards, error: postcardsErr } = await admin
        .from("postcards")
        .select("id")
        .in("donation_id", donationIds);
      if (postcardsErr) throw postcardsErr;
      postcardIds = (postcards ?? []).map((p: any) => p.id);
    }

    // 2) Delete children first to satisfy FKs
    if (postcardIds.length > 0) {
      const { error: teErr } = await admin
        .from("tracking_events")
        .delete()
        .in("postcard_id", postcardIds);
      if (teErr) throw teErr;

      const { error: pcErr } = await admin
        .from("postcards")
        .delete()
        .in("id", postcardIds);
      if (pcErr) throw pcErr;
    }

    // 3) Delete per-profile resources
    const deletions: Promise<any>[] = [];
    deletions.push(
      admin.from("template_files").delete().eq("profile_id", userId),
      admin.from("templates").delete().eq("profile_id", userId),
      admin.from("csvs").delete().eq("profile_id", userId),
      admin.from("mailing_usage").delete().eq("profile_id", userId),
      admin.from("user_subscriptions").delete().eq("profile_id", userId),
    );
    if (donationIds.length > 0) {
      deletions.push(admin.from("donations").delete().in("id", donationIds));
    }
    await Promise.all(deletions);

    // 4) Delete profile row
    const { error: profErr } = await admin.from("profiles").delete().eq("id", userId);
    if (profErr) {
      // Log but still attempt to delete auth user
      console.warn("Profile delete error", profErr);
    }

    // 5) Delete the auth user (requires service role)
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("delete-account error", err);
    return new Response(JSON.stringify({ error: "Failed to delete account" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
