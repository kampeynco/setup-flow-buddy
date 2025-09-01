import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Hookdeck API
const HOOKDECK_API_BASE = "https://api.hookdeck.com/2025-07-01"; // central base
const HOOKDECK_API_KEY = Deno.env.get("HOOKDECK_API_KEY");
// Optional: destination to forward webhooks inside Hookdeck (kept compatible with existing setup)
const HOOKDECK_DESTINATION_ID = Deno.env.get("HOOKDECK_DESTINATION_ID") ?? "des_uDu4ot6quhAS";

// Supabase Admin
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase admin env vars");
}

const adminClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: corsHeaders,
    ...init,
  });
}

function randomPassword(bytes = 24) {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  // base64url encode
  const base64 = btoa(String.fromCharCode(...arr))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  return base64;
}

async function getExistingProfile(user_id: string) {
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, webhook_url, source_id")
    .eq("id", user_id)
    .maybeSingle();
  if (error) throw error;
  
  // Check if webhook credentials exist
  const { data: credData, error: credError } = await adminClient
    .from("webhook_credentials")
    .select("password_hash")
    .eq("profile_id", user_id)
    .maybeSingle();
    
  const hasPassword = credData?.password_hash ? true : false;
  
  return data ? { ...data, webhook_password: hasPassword } : null;
}

async function upsertProfileWebhook(user_id: string, webhook_url: string, webhook_password: string, source_id: string) {
  console.log("Starting upsertProfileWebhook for user:", user_id);
  
  try {
    // Generate a random salt
    const salt = randomPassword(16);
    console.log("Generated salt length:", salt.length);
    
    // Hash the password with salt
    console.log("Calling hash_password_with_salt RPC...");
    console.log("RPC parameters:", { 
      password: "***redacted***", 
      salt: salt,
      passwordLength: webhook_password.length,
      saltLength: salt.length 
    });
    
    const { data: hashData, error: hashError } = await adminClient.rpc('hash_password_with_salt', {
      password: webhook_password,
      salt: salt
    });
    
    console.log("Hash RPC result:", { 
      hasData: !!hashData, 
      dataLength: hashData?.length || 0,
      error: hashError,
      errorMessage: hashError?.message,
      errorCode: hashError?.code,
      errorDetails: hashError?.details 
    });
    
    if (hashError) {
      console.error("Hash password error details:", {
        message: hashError.message,
        code: hashError.code,
        details: hashError.details,
        hint: hashError.hint
      });
      throw new Error(`Failed to hash password: ${hashError.message}`);
    }
    
    if (!hashData) {
      console.error("No hash data returned from RPC");
      throw new Error("Hash function returned null");
    }
    
    console.log("Hash successful, proceeding to profile update...");
    
    // Update profile with webhook URL and source ID
    console.log("Updating profile with webhook_url and source_id...");
    const { data: profileData, error: profileError } = await adminClient
      .from("profiles")
      .update({ webhook_url, source_id })
      .eq("id", user_id)
      .select("id")
      .maybeSingle();
    
    console.log("Profile update result:", { profileData, profileError });
    if (profileError) {
      console.error("Profile update error:", profileError);
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }
    
    // Store encrypted password in webhook_credentials table
    console.log("Upserting webhook credentials...");
    const credentialsPayload = {
      profile_id: user_id,
      password_hash: hashData,
      salt: salt
    };
    console.log("Credentials payload:", { 
      profile_id: user_id, 
      password_hash: "***redacted***", 
      salt: "***redacted***",
      hashLength: hashData.length,
      saltLength: salt.length 
    });
    
    const { data: credData, error: credError } = await adminClient
      .from("webhook_credentials")
      .upsert(credentialsPayload, { onConflict: 'profile_id' })
      .select("*");
      
    console.log("Webhook credentials upsert result:", { 
      hasData: !!credData, 
      dataCount: credData?.length || 0,
      error: credError 
    });
    
    if (credError) {
      console.error("Webhook credentials upsert error:", credError);
      throw new Error(`Failed to upsert webhook credentials: ${credError.message}`);
    }
    
    console.log("Successfully completed upsertProfileWebhook");
    return profileData;
  } catch (error) {
    console.error("Error in upsertProfileWebhook:", {
      errorType: error.constructor.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) // Limit stack trace length
    });
    throw error;
  }
}

async function createHookdeckConnection({ name, destination_id }: { name: string; destination_id: string }) {
  if (!HOOKDECK_API_KEY) {
    throw new Error("HOOKDECK_API_KEY is not configured");
  }
  const url = `${HOOKDECK_API_BASE}/connections`;
  const payload = {
    name: "thankdonors",
    source: { name, type: "WEBHOOK" },
    destination_id,
  };
  console.log("Creating Hookdeck connection at:", url);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${HOOKDECK_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("Hookdeck create connection error", res.status, text);
    throw new Error(`Hookdeck create connection failed (${res.status})`);
  }
  try {
    return JSON.parse(text);
  } catch (_) {
    return text as unknown as Record<string, unknown>;
  }
}

async function updateHookdeckSourceAuth(sourceId: string, username: string, password: string) {
  if (!HOOKDECK_API_KEY) {
    throw new Error("HOOKDECK_API_KEY is not configured");
  }
  // Use the specific source endpoint and PUT to update auth config
  const url = `${HOOKDECK_API_BASE}/sources/${sourceId}`;
  const payload = {
    name: sourceId,
    type: "WEBHOOK",
    config: {
      auth_type: "BASIC_AUTH",
      auth: {
        username,
        password,
      },
    },
  };
  console.log("Updating Hookdeck source auth at:", url, "payload:", {
    ...payload,
    config: { ...payload.config, auth: { username, password: "***redacted***" } },
  });
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${HOOKDECK_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("Hookdeck source update error", res.status, text);
    throw new Error(`Hookdeck source update failed (${res.status})`);
  }
  try {
    return JSON.parse(text);
  } catch (_) {
    return text as unknown as Record<string, unknown>;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("Missing Authorization header");
      return jsonResponse({ error: "Missing Authorization header" }, { status: 401 });
    }

    console.log("Parsing request body...");
    const requestBody = await req.json().catch((e) => {
      console.error("Failed to parse request body:", e);
      return { user_id: undefined, email: undefined };
    });
    
    const { user_id, email } = requestBody;
    console.log("Request body parsed:", { user_id: user_id ? "present" : "missing", email: email ? "present" : "missing", emailType: typeof email, emailValue: email });

    if (!user_id || typeof user_id !== "string") {
      console.log("Invalid user_id:", { user_id, type: typeof user_id });
      return jsonResponse({ error: "Invalid or missing user_id" }, { status: 400 });
    }

    // Idempotency: if profile already has webhook details, return early
    console.log("Checking existing profile for user:", user_id);
    const existing = await getExistingProfile(user_id);
    console.log("Existing profile check result:", { 
      hasWebhookUrl: !!existing?.webhook_url, 
      hasWebhookPassword: !!existing?.webhook_password,
      existing 
    });
    
    if (existing?.webhook_url && existing?.webhook_password) {
      console.log("Webhook already provisioned for", user_id);
      return jsonResponse({ status: "already_provisioned", webhook_url: existing.webhook_url });
    }

    if (!email || typeof email !== "string") {
      console.log("Invalid email:", { email, type: typeof email, truthiness: !!email });
      return jsonResponse({ error: "Missing email (username for basic auth)" }, { status: 400 });
    }

    // Generate a secure password server-side
    const password = randomPassword(24);

    // Create a Hookdeck connection (creates a Source automatically)
    const connection = await createHookdeckConnection({ name: user_id, destination_id: HOOKDECK_DESTINATION_ID });

    // Extract source id and url from the connection response
    let sourceId = "";
    let webhookUrl = "";
    if (connection?.source) {
      sourceId = connection.source.id ?? "";
      webhookUrl = connection.source.url ?? "";
    } else if (Array.isArray(connection?.sources) && connection.sources.length > 0) {
      sourceId = connection.sources[0].id ?? "";
      webhookUrl = connection.sources[0].url ?? "";
    }

    if (!sourceId || !webhookUrl) {
      console.error("Could not determine sourceId/webhookUrl from Hookdeck response", connection);
      return jsonResponse({ error: "Failed to create webhook Source in Hookdeck" }, { status: 502 });
    }

    // Update source with Basic Auth credentials
    await updateHookdeckSourceAuth(sourceId, email, password);

    // Persist to profile
    await upsertProfileWebhook(user_id, webhookUrl, password, sourceId);

    return jsonResponse({ status: "ok", webhook_url: webhookUrl });
  } catch (e) {
    console.error("create-hookdeck-webhook error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 400 });
  }
});
