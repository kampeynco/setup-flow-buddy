import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== CUSTOMER PORTAL START ===");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    // Get user authentication using anon key
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    console.log("Authenticating user...");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error("Auth failed:", userError);
      throw new Error("Authentication failed");
    }
    
    const userId = userData.user.id;
    console.log("User ID:", userId);

    // Use service role key to bypass RLS for subscription query
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Query subscriptions using service role
    console.log("Querying subscriptions with service role...");
    const { data: subscriptions, error: subError } = await supabaseService
      .from("user_subscriptions")
      .select("stripe_customer_id, status")
      .eq("profile_id", userId);

    if (subError) {
      console.error("Subscription query failed:", subError);
      throw new Error("Failed to query subscriptions: " + subError.message);
    }

    console.log("Found subscriptions:", subscriptions?.length || 0);
    console.log("Subscription data:", subscriptions);

    if (!subscriptions || subscriptions.length === 0) {
      throw new Error("No subscriptions found for user");
    }

    // Get the stripe_customer_id from any subscription
    let stripeCustomerId = null;
    for (const sub of subscriptions) {
      if (sub.stripe_customer_id) {
        stripeCustomerId = sub.stripe_customer_id;
        console.log("Using stripe_customer_id:", stripeCustomerId);
        break;
      }
    }

    if (!stripeCustomerId) {
      console.log("No stripe_customer_id found in any subscription");
      throw new Error("No Stripe customer ID found");
    }

    // Create Stripe portal session
    console.log("Creating Stripe portal session...");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${req.headers.get("origin")}/dashboard`,
    });

    console.log("Portal session created successfully");
    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Customer portal error:", message);
    
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});