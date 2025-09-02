import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    console.log("=== FUNCTION START ===");
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body:", JSON.stringify(requestBody));
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      throw new Error(`Invalid JSON: ${parseError.message}`);
    }
    
    const { planId, cancelUrl } = requestBody;
    
    if (!planId) {
      throw new Error("planId is required");
    }
    
    console.log("planId:", planId, "cancelUrl:", cancelUrl);
    
    // Check environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    console.log("Environment check:");
    console.log("- STRIPE_SECRET_KEY exists:", !!stripeKey);
    console.log("- SUPABASE_URL exists:", !!supabaseUrl);
    console.log("- SUPABASE_ANON_KEY exists:", !!supabaseKey);
    
    if (!stripeKey || !supabaseUrl || !supabaseKey) {
      throw new Error("Missing environment variables");
    }
    
    // Initialize Stripe
    console.log("Initializing Stripe...");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    console.log("Stripe initialized");
    
    // Test Stripe API
    console.log("Testing Stripe API...");
    const customers = await stripe.customers.list({ limit: 1 });
    console.log("Stripe test successful");
    
    // Get user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    console.log("Auth header found");
    
    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client created");
    
    // Get user
    console.log("Getting user...");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user?.email) {
      console.error("User error:", userError);
      throw new Error("User not authenticated");
    }
    
    const user = userData.user;
    console.log("User authenticated:", user.email);
    
    // Get plan data
    console.log("Getting plan data...");
    const { data: planData, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .maybeSingle();
      
    if (planError) {
      console.error("Plan error:", planError);
      throw new Error("Plan query failed");
    }
    
    if (!planData) {
      throw new Error("Plan not found");
    }
    
    console.log("Plan found:", planData.name);
    
    // Check for existing Stripe customer
    console.log("Checking for existing customer...");
    const existingCustomers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      console.log("No existing customer found");
    }
    
    // Create checkout session
    console.log("Creating checkout session...");
    const origin = req.headers.get("origin") || "https://example.com";
    const defaultCancelUrl = `${origin}/dashboard?checkout=canceled`;
    
    let sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || defaultCancelUrl,
    };
    
    if (planData.name === "Free") {
      sessionConfig = {
        ...sessionConfig,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { 
                name: "Pay as You Go - Initial Account Balance",
                description: "$50 credit added to your account balance"
              },
              unit_amount: 5000,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        payment_method_types: ["card"],
        metadata: {
          userId: user.id,
          planId: planId.toString(),
          planType: "pay_as_you_go_initial"
        }
      };
    } else {
      sessionConfig = {
        ...sessionConfig,
        line_items: [
          {
            price: planData.stripe_price_id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        metadata: {
          userId: user.id,
          planId: planId.toString(),
          planType: "pro_subscription"
        },
        subscription_data: {
          trial_period_days: 7,
          metadata: { userId: user.id, planId: planId.toString() }
        },
      };
    }
    
    console.log("Session config ready, creating session...");
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log("Session created successfully:", session.id);
    
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("=== ERROR CAUGHT ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("=== END ERROR ===");
    
    return new Response(JSON.stringify({ 
      error: error.message,
      type: error.name 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});