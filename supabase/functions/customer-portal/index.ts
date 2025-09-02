import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== CUSTOMER PORTAL FUNCTION START ===");
  
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting customer portal function");

    // Check environment variables first
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    console.log("Environment check:", {
      hasStripeKey: !!stripeKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey
    });

    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    // Get user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    
    console.log("Auth header found");
    const token = authHeader.replace("Bearer ", "");
    
    const supabaseClient = createClient(supabaseUrl!, supabaseKey!);
    
    console.log("Getting user...");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error("Authentication failed:", userError);
      throw new Error("User not authenticated");
    }
    
    const user = userData.user;
    console.log("User authenticated:", { userId: user.id, email: user.email });

    // Get user's subscription info
    console.log("Querying user subscriptions...");
    const { data: subscriptions, error: subError } = await supabaseClient
      .from("user_subscriptions")
      .select("stripe_customer_id, status")
      .eq("profile_id", user.id);

    console.log("Subscription query result:", { subscriptions, error: subError });

    if (subError) {
      console.error("Subscription query error:", subError);
      throw new Error("Error fetching subscription: " + subError.message);
    }

    // Find any subscription with a stripe_customer_id
    let stripeCustomerId = null;
    if (subscriptions && subscriptions.length > 0) {
      const activeSubscription = subscriptions.find(sub => sub.status === 'active');
      stripeCustomerId = activeSubscription?.stripe_customer_id || subscriptions[0]?.stripe_customer_id;
    }

    console.log("Stripe customer ID:", stripeCustomerId);

    if (!stripeCustomerId) {
      throw new Error("No customer record found for this user");
    }

    console.log("Initializing Stripe...");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    console.log("Creating customer portal session...");
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${req.headers.get("origin")}/dashboard`,
    });

    console.log("Portal session created successfully:", { 
      sessionId: portalSession.id, 
      url: portalSession.url 
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("ERROR in customer-portal:", errorMessage);
    console.error("Full error:", error);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});