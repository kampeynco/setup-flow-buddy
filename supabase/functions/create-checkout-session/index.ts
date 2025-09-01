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
    const { planId } = await req.json();
    
    // Check Stripe API key first
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("Stripe key exists:", !!stripeKey);
    console.log("Stripe key length:", stripeKey?.length || 0);
    console.log("Stripe key prefix:", stripeKey?.substring(0, 8));
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    
    if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
      throw new Error("Invalid Stripe API key format. Must start with sk_test_ or sk_live_");
    }
    
    // Get user authentication
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user?.email) {
      throw new Error("User not authenticated");
    }
    
    const user = userData.user;
    
    // Get subscription plan details
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

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session
    let sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/dashboard?checkout=canceled`,
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

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});