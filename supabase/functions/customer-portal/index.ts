import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    
    const token = authHeader.replace("Bearer ", "");
    logStep("Auth header found");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) {
      logStep("Authentication failed", { error: userError?.message });
      throw new Error("User not authenticated");
    }
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's subscription info - look for active subscriptions first
    logStep("Querying user subscriptions");
    const { data: subscriptions, error: subError } = await supabaseClient
      .from("user_subscriptions")
      .select("stripe_customer_id, status")
      .eq("profile_id", user.id)
      .eq("status", "active");

    if (subError) {
      logStep("Subscription query error", { error: subError });
      throw new Error("Error fetching subscription");
    }

    logStep("Subscription query result", { subscriptions });

    // If no active subscription, try any subscription for this user
    let stripeCustomerId = null;
    if (subscriptions && subscriptions.length > 0) {
      stripeCustomerId = subscriptions[0].stripe_customer_id;
    } else {
      logStep("No active subscription, checking for any subscription");
      const { data: anySubscription, error: anySubError } = await supabaseClient
        .from("user_subscriptions")
        .select("stripe_customer_id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (anySubError) {
        logStep("Any subscription query error", { error: anySubError });
        throw new Error("Error fetching subscription");
      }

      stripeCustomerId = anySubscription?.stripe_customer_id;
      logStep("Any subscription result", { stripeCustomerId });
    }

    if (!stripeCustomerId) {
      logStep("No stripe customer ID found");
      throw new Error("No customer record found");
    }

    logStep("Found stripe customer ID", { stripeCustomerId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    logStep("Creating customer portal session");
    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${req.headers.get("origin")}/dashboard`,
    });

    logStep("Portal session created", { sessionId: portalSession.id, url: portalSession.url });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { message: errorMessage });
    console.error("Error creating customer portal session:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});