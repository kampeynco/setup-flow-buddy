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
    const { postcardId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get postcard and related donation/profile info
    const { data: postcardData, error: postcardError } = await supabase
      .from("postcards")
      .select(`
        *,
        donation:donations(
          *,
          profile:profiles(*)
        )
      `)
      .eq("id", postcardId)
      .single();

    if (postcardError || !postcardData) {
      throw new Error("Postcard not found");
    }

    // Check if already billed
    if (postcardData.usage_billed) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Postcard already billed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if status qualifies for billing (processing or rendered)
    if (!["processing", "rendered"].includes(postcardData.status)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Postcard not in production status" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const profileId = postcardData.donation.profile_id;

    // Get user's subscription info
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq("profile_id", profileId)
      .eq("status", "active")
      .maybeSingle();

    if (subError) {
      throw new Error("Error fetching subscription");
    }

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    // Calculate charge amount based on plan
    const chargeAmount = subscription.plan.per_mailing_fee; // Keep as dollars for balance operations
    const planType = subscription.plan.name.toLowerCase();

    // For Pay as You Go (Free plan), deduct from account balance instead of Stripe charging
    if (subscription.plan.name === "Free") {
      // Check account balance
      const { data: balance } = await supabase
        .from("account_balances")
        .select("current_balance")
        .eq("profile_id", profileId)
        .single();

      if (!balance) {
        throw new Error("No account balance found");
      }

      const currentBalance = parseFloat(balance.current_balance);
      if (currentBalance < chargeAmount) {
        throw new Error(`Insufficient balance. Current: $${currentBalance}, Required: $${chargeAmount}`);
      }

      // Deduct from balance
      const newBalance = currentBalance - chargeAmount;
      await supabase
        .from("account_balances")
        .update({ current_balance: newBalance })
        .eq("profile_id", profileId);

      // Record the balance transaction
      await supabase
        .from("balance_transactions")
        .insert({
          profile_id: profileId,
          transaction_type: "usage",
          amount: -chargeAmount,
          balance_after: newBalance,
          description: `Postcard mailing charge - $${chargeAmount}`,
          postcard_id: postcardId
        });

      // Record usage charge for Free plan (billed immediately via balance deduction)
      await supabase.from("usage_charges").insert({
        profile_id: profileId,
        postcard_id: postcardId,
        amount: chargeAmount,
        stripe_invoice_item_id: null,
        plan_type: planType,
        billed_at: new Date().toISOString(), // Mark as billed immediately for Free plan
        billing_cycle_start: null,
        billing_cycle_end: null,
      });

      // Mark postcard as billed
      await supabase
        .from("postcards")
        .update({ 
          usage_billed: true
        })
        .eq("id", postcardId);

      // Check if auto top-up needed (balance < $10)
      let autoTopupTriggered = false;
      if (newBalance < 10) {
        const { data: balanceRecord } = await supabase
          .from("account_balances")
          .select("auto_topup_enabled")
          .eq("profile_id", profileId)
          .single();

        if (balanceRecord?.auto_topup_enabled) {
          // Trigger auto top-up via the manage-account-balance function
          const topupResponse = await supabase.functions.invoke('manage-account-balance', {
            body: {
              action: 'auto_topup',
              userId: profileId
            }
          });
          autoTopupTriggered = !topupResponse.error;
        }
      }

      console.log(`Usage deducted from balance for postcard ${postcardId}: $${chargeAmount}. New balance: $${newBalance}`);

      return new Response(JSON.stringify({ 
        success: true,
        amount: chargeAmount,
        payment_method: "account_balance",
        new_balance: newBalance,
        auto_topup_triggered: autoTopupTriggered
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } 
    
    // For Pro users, continue with monthly billing approach
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get billing cycle dates for Pro subscriptions
    let billingCycleStart = null;
    let billingCycleEnd = null;
    
    if (subscription.stripe_subscription_id) {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
      billingCycleStart = new Date(stripeSubscription.current_period_start * 1000).toISOString();
      billingCycleEnd = new Date(stripeSubscription.current_period_end * 1000).toISOString();
    }

    // For Pro subscribers, just create invoice item (don't finalize invoice yet)
    // Monthly billing will collect all usage charges and create a single invoice
    console.log('Creating Stripe invoice item for Pro subscription (monthly billing)');
    
    const invoiceItem = await stripe.invoiceItems.create({
      customer: subscription.stripe_customer_id,
      amount: Math.round(chargeAmount * 100), // Convert to cents
      currency: 'usd',
      description: `Postcard mailing fee - ${postcardData.donation.donor_name || 'Donor'}`,
      metadata: {
        postcardId: postcardId,
        planType: planType,
        profileId: profileId
      }
    });

    console.log('Invoice item created for monthly billing:', invoiceItem.id);

    // Record the usage charge in our database (marked as unbilled for monthly processing)
    await supabase.from("usage_charges").insert({
      profile_id: profileId,
      postcard_id: postcardId,
      amount: chargeAmount,
      plan_type: planType,
      stripe_invoice_item_id: invoiceItem.id,
      billing_cycle_start: billingCycleStart,
      billing_cycle_end: billingCycleEnd,
      billed_at: null, // Leave null for monthly billing
    });

    // Mark postcard as billed
    await supabase
      .from("postcards")
      .update({ 
        usage_billed: true,
        stripe_invoice_item_id: invoiceItem.id
      })
      .eq("id", postcardId);

    console.log(`Usage charge created for postcard ${postcardId}: $${chargeAmount}`);

    return new Response(JSON.stringify({ 
      success: true,
      amount: chargeAmount,
      payment_method: "monthly_billing",
      invoiceItemId: invoiceItem.id,
      billing_cycle_end: billingCycleEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating usage charge:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});