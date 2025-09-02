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
    
    // Test basic functionality first
    console.log("Request method:", req.method);
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body parsed successfully:", JSON.stringify(requestBody));
    } catch (parseError) {
      console.error("JSON parsing error:", parseError.message);
      throw new Error(`Invalid JSON in request body: ${parseError.message}`);
    }
    
    const { planId, cancelUrl } = requestBody;
    
    if (!planId) {
      throw new Error("planId is required");
    }
    
    console.log("planId:", planId);
    console.log("cancelUrl:", cancelUrl);
    
    // Check environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    console.log("Environment variables:");
    console.log("- STRIPE_SECRET_KEY exists:", !!stripeKey);
    console.log("- SUPABASE_URL exists:", !!supabaseUrl);
    console.log("- SUPABASE_ANON_KEY exists:", !!supabaseKey);
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not found in environment");
    }
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables missing");
    }
    
    // Test Stripe initialization
    console.log("Initializing Stripe...");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    console.log("Stripe initialized successfully");
    
    // Simple test
    console.log("Testing Stripe API...");
    const testCustomers = await stripe.customers.list({ limit: 1 });
    console.log("Stripe API test successful");
    
    // Get user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    
    console.log("Auth header exists");
    const token = authHeader.replace("Bearer ", "");
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    
    console.log("Getting user...");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user?.email) {
      console.error("User authentication error:", userError);
      throw new Error("User not authenticated");
    }
    
    console.log("User authenticated:", userData.user.email);
    const user = userData.user;
    
    // Get subscription plan details
    console.log("Getting plan data for planId:", planId);
    const { data: planData, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .maybeSingle();
      
    if (planError) {
      console.error("Plan query error:", planError);
      throw new Error("Error fetching plan details");
    }
    
    if (!planData) {
      console.error("No plan found for ID:", planId);
      throw new Error("Invalid plan selected");
    }
    
    console.log("Plan found:", planData.name);

    // Check if customer exists
    console.log("Checking for existing customer...");
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      console.log("No existing customer found");
    }

    // Create checkout session
    const defaultCancelUrl = `${req.headers.get("origin")}/dashboard?checkout=canceled`;
    let sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || defaultCancelUrl,
    };

    if (planData.name === "Free") {
      // For Pay as You Go plan, create $50 initial charge
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
              unit_amount: 5000, // $50.00 in cents
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
      // For Pro plan, create subscription with 7-day trial
      sessionConfig = {
        ...sessionConfig,
        line_items: [
          {
            price: planData.stripe_price_id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        subscription_data: {
          trial_period_days: 7,
          metadata: { userId: user.id, planId: planId.toString() }
        },
      };
    }

    console.log("Creating Stripe checkout session...");
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log("Checkout session created successfully:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("=== ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("=== END ERROR ===");
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});