import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting monthly usage billing process");

    // Initialize Supabase with service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get all active Pro subscriptions that need billing
    const { data: subscriptions, error: subscriptionError } = await supabaseService
      .from("user_subscriptions")
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq("status", "active")
      .neq("subscription_plans.name", "Free");

    if (subscriptionError) {
      throw new Error(`Failed to fetch subscriptions: ${subscriptionError.message}`);
    }

    console.log(`Processing ${subscriptions?.length || 0} active Pro subscriptions`);

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const subscription of subscriptions || []) {
      try {
        console.log(`Processing subscription for profile: ${subscription.profile_id}`);

        // Get current billing period from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        const billingPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
        const billingPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
        const now = new Date();

        // Check if we're at the end of the billing cycle (within last 24 hours)
        const timeUntilEnd = billingPeriodEnd.getTime() - now.getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;

        if (timeUntilEnd > oneDayMs) {
          console.log(`Billing cycle not ready for profile ${subscription.profile_id}, ${Math.round(timeUntilEnd / (1000 * 60 * 60))} hours remaining`);
          continue;
        }

        // Get all unbilled usage charges for this billing cycle
        const { data: usageCharges, error: usageError } = await supabaseService
          .from("usage_charges")
          .select("*")
          .eq("profile_id", subscription.profile_id)
          .eq("plan_type", subscription.subscription_plans.name)
          .is("billed_at", null)
          .gte("billing_cycle_start", billingPeriodStart.toISOString())
          .lte("billing_cycle_end", billingPeriodEnd.toISOString());

        if (usageError) {
          throw new Error(`Failed to fetch usage charges: ${usageError.message}`);
        }

        if (!usageCharges || usageCharges.length === 0) {
          console.log(`No unbilled usage charges for profile ${subscription.profile_id}`);
          continue;
        }

        console.log(`Found ${usageCharges.length} unbilled usage charges for profile ${subscription.profile_id}`);

        // Calculate total usage amount
        const totalAmount = usageCharges.reduce((sum, charge) => sum + Number(charge.amount), 0);

        if (totalAmount === 0) {
          console.log(`No usage charges to bill for profile ${subscription.profile_id}`);
          
          // Mark charges as billed even if amount is 0
          await supabaseService
            .from("usage_charges")
            .update({ billed_at: new Date().toISOString() })
            .in("id", usageCharges.map(charge => charge.id));
          
          continue;
        }

        // Create and finalize invoice with all usage charges
        console.log(`Creating invoice for $${totalAmount} usage charges`);

        const invoice = await stripe.invoices.create({
          customer: subscription.stripe_customer_id,
          description: `Monthly usage charges for ${billingPeriodStart.toLocaleDateString()} - ${billingPeriodEnd.toLocaleDateString()}`,
          auto_advance: true,
        });

        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
        console.log(`Invoice finalized: ${finalizedInvoice.id}`);

        // Mark all usage charges as billed
        const { error: updateError } = await supabaseService
          .from("usage_charges")
          .update({ 
            billed_at: new Date().toISOString(),
            invoice_id: finalizedInvoice.id
          })
          .in("id", usageCharges.map(charge => charge.id));

        if (updateError) {
          throw new Error(`Failed to update usage charges: ${updateError.message}`);
        }

        console.log(`Successfully processed billing for profile ${subscription.profile_id}: $${totalAmount}`);
        processedCount++;

      } catch (error) {
        console.error(`Error processing subscription for profile ${subscription.profile_id}:`, error);
        errorCount++;
        errors.push(`Profile ${subscription.profile_id}: ${error.message}`);
      }
    }

    const result = {
      success: true,
      processed: processedCount,
      errors: errorCount,
      errorDetails: errors,
      message: `Processed ${processedCount} subscriptions, ${errorCount} errors`
    };

    console.log("Monthly billing process completed:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Monthly billing process failed:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});