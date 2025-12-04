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
    const { action, userId, amount } = await req.json();
    
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    if (action === "check_balance") {
      // Get current balance for user
      const { data: balance } = await supabaseClient
        .from("account_balances")
        .select("*")
        .eq("profile_id", userId)
        .single();

      return new Response(JSON.stringify({ 
        balance: balance ? parseFloat(balance.current_balance) : 0,
        auto_topup_enabled: balance ? balance.auto_topup_enabled : true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "deduct_usage" && amount) {
      // Deduct amount from user's balance
      const { data: balance } = await supabaseClient
        .from("account_balances")
        .select("*")
        .eq("profile_id", userId)
        .single();

      if (!balance) {
        throw new Error("No account balance found");
      }

      const currentBalance = parseFloat(balance.current_balance);
      const newBalance = currentBalance - amount;

      // Update balance
      await supabaseClient
        .from("account_balances")
        .update({ current_balance: newBalance })
        .eq("profile_id", userId);

      // Record transaction
      await supabaseClient
        .from("balance_transactions")
        .insert({
          profile_id: userId,
          transaction_type: "usage",
          amount: -amount,
          balance_after: newBalance,
          description: `Postcard mailing charge - $${amount}`
        });

      // Check if auto top-up needed (balance < $10)
      if (newBalance < 10 && balance.auto_topup_enabled) {
        await initiateAutoTopUp(userId, supabaseClient, stripe);
      }

      return new Response(JSON.stringify({ 
        success: true,
        new_balance: newBalance,
        auto_topup_triggered: newBalance < 10 && balance.auto_topup_enabled
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "auto_topup") {
      await initiateAutoTopUp(userId, supabaseClient, stripe);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action");

  } catch (error) {
    console.error("Error managing account balance:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function initiateAutoTopUp(userId: string, supabaseClient: any, stripe: Stripe) {
  try {
    // Get user's subscription to find Stripe customer ID
    const { data: subscription } = await supabaseClient
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("profile_id", userId)
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      console.error("No Stripe customer ID found for user", userId);
      return;
    }

    // Get customer's default payment method - handle deleted customers
    let customer;
    try {
      customer = await stripe.customers.retrieve(subscription.stripe_customer_id);
      if (customer.deleted) {
        console.error("Stripe customer has been deleted", subscription.stripe_customer_id);
        return;
      }
    } catch (stripeError) {
      console.error("Failed to retrieve Stripe customer", subscription.stripe_customer_id, stripeError);
      return;
    }
    
    if (!customer.invoice_settings?.default_payment_method) {
      console.error("No default payment method for customer", subscription.stripe_customer_id);
      return;
    }

    // Create payment intent for $50 top-up
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000, // $50.00
      currency: "usd",
      customer: subscription.stripe_customer_id,
      payment_method: customer.invoice_settings.default_payment_method,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        userId: userId,
        type: "auto_topup"
      }
    });

    if (paymentIntent.status === "succeeded") {
      // Credit balance
      const { data: currentBalance } = await supabaseClient
        .from("account_balances")
        .select("current_balance")
        .eq("profile_id", userId)
        .single();

      const newBalance = parseFloat(currentBalance.current_balance) + 50;

      await supabaseClient
        .from("account_balances")
        .update({ 
          current_balance: newBalance,
          last_topup_at: new Date().toISOString()
        })
        .eq("profile_id", userId);

      // Record transaction
      await supabaseClient
        .from("balance_transactions")
        .insert({
          profile_id: userId,
          transaction_type: "topup",
          amount: 50,
          balance_after: newBalance,
          description: "Automatic top-up - $50 credit",
          stripe_payment_intent_id: paymentIntent.id
        });

      console.log(`Auto top-up successful for user ${userId}. New balance: $${newBalance}`);
    }
  } catch (error) {
    console.error("Auto top-up failed:", error);
  }
}