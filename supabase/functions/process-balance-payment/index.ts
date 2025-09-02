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
    const { sessionId } = await req.json();
    
    // Create Supabase client with service role for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session || session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const planType = session.metadata?.planType;
    
    if (!userId) {
      throw new Error("Invalid session metadata - missing userId");
    }

    console.log(`Processing payment for user ${userId}, planId: ${planId}, planType: ${planType}`);

    let responseData;
    if (planType === "pay_as_you_go_initial") {
      // Handle Pay as You Go initial payment
      responseData = await handlePayAsYouGoPayment(supabaseClient, userId, session, planId);
    } else if (session.mode === "subscription") {
      // Handle Pro subscription
      responseData = await handleProSubscription(supabaseClient, userId, session, planId);
    } else {
      throw new Error(`Unsupported payment type: ${planType || session.mode}`);
    }

    console.log(`Payment processed successfully for user ${userId}`);

    return new Response(JSON.stringify({ 
      success: true,
      ...responseData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing balance payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handlePayAsYouGoPayment(supabaseClient: any, userId: string, session: any, planId: string) {
  // Credit $50 to user's account balance
  const creditAmount = 50.00;
  
  // Create or update account balance
  const { data: existingBalance } = await supabaseClient
    .from("account_balances")
    .select("*")
    .eq("profile_id", userId)
    .single();

  let newBalance;
  if (existingBalance) {
    // Update existing balance
    newBalance = parseFloat(existingBalance.current_balance) + creditAmount;
    await supabaseClient
      .from("account_balances")
      .update({ 
        current_balance: newBalance,
        last_topup_at: new Date().toISOString()
      })
      .eq("profile_id", userId);
  } else {
    // Create new balance record
    newBalance = creditAmount;
    await supabaseClient
      .from("account_balances")
      .insert({
        profile_id: userId,
        current_balance: newBalance,
        last_topup_at: new Date().toISOString()
      });
  }

  // Record the transaction
  await supabaseClient
    .from("balance_transactions")
    .insert({
      profile_id: userId,
      transaction_type: "topup",
      amount: creditAmount,
      balance_after: newBalance,
      description: "Initial account setup - $50 credit",
      stripe_payment_intent_id: session.payment_intent
    });

  // Create the user subscription record for Pay as You Go
  const { data: planData } = await supabaseClient
    .from("subscription_plans")
    .select("*")
    .eq("id", planId || 1) // Default to Free plan (id: 1) if no planId
    .single();

  if (planData) {
    console.log(`Creating subscription for Free plan: ${planData.name}`);
    const { error: subscriptionError } = await supabaseClient
      .from("user_subscriptions")
      .upsert({
        profile_id: userId,
        plan_id: planData.id,
        status: "active",
        stripe_customer_id: session.customer,
        current_period_start: new Date().toISOString(),
        current_period_end: null // Pay as you go doesn't have periods
      }, { 
        onConflict: 'profile_id',
        ignoreDuplicates: false 
      });
    
    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError);
      throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
    }
  }

  console.log(`Credited $${creditAmount} to user ${userId}. New balance: $${newBalance}`);
  
  return {
    planType: "pay_as_you_go",
    balance: newBalance,
    credited: creditAmount,
    planName: planData?.name || "Pay as You Go"
  };
}

async function handleProSubscription(supabaseClient: any, userId: string, session: any, planId: string) {
  // For Pro subscriptions, we don't add account balance, but we create the subscription record
  const { data: planData } = await supabaseClient
    .from("subscription_plans")
    .select("*")
    .eq("id", planId || 2) // Default to Pro plan (id: 2) if no planId
    .single();

  // Get subscription details from Stripe
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
  });
  
  const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);

  if (planData) {
    console.log(`Creating subscription for Pro plan: ${planData.name}`);
    
    const { error: subscriptionError } = await supabaseClient
      .from("user_subscriptions")
      .upsert({
        profile_id: userId,
        plan_id: planData.id,
        status: "active",
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        trial_end: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toISOString() : null
      }, { 
        onConflict: 'profile_id',
        ignoreDuplicates: false 
      });
    
    if (subscriptionError) {
      console.error("Error creating Pro subscription:", subscriptionError);
      throw new Error(`Failed to create Pro subscription: ${subscriptionError.message}`);
    }
  }

  console.log(`Pro subscription created successfully for user ${userId}`);
  
  return {
    planType: "pro_subscription",
    planName: planData?.name || "Pro",
    subscriptionDetails: {
      stripe_subscription_id: session.subscription,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      trial_end: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toISOString() : null,
      has_trial: !!stripeSubscription.trial_end
    }
  };
}