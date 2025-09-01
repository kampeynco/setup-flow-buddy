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
    const planType = session.metadata?.planType;
    
    if (!userId || planType !== "pay_as_you_go_initial") {
      throw new Error("Invalid session metadata");
    }

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

    // Create the user subscription record
    const { data: planData } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("name", "Free")
      .single();

    if (planData) {
      await supabaseClient
        .from("user_subscriptions")
        .insert({
          profile_id: userId,
          plan_id: planData.id,
          status: "active",
          stripe_customer_id: session.customer,
          current_period_start: new Date().toISOString(),
          current_period_end: null // Pay as you go doesn't have periods
        });
    }

    console.log(`Credited $${creditAmount} to user ${userId}. New balance: $${newBalance}`);

    return new Response(JSON.stringify({ 
      success: true, 
      balance: newBalance,
      credited: creditAmount 
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