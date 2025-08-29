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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Calculate charge amount based on plan
    const chargeAmount = subscription.plan.per_mailing_fee * 100; // Convert to cents
    const planType = subscription.plan.name.toLowerCase();

    // Create invoice item for usage charge
    const invoiceItem = await stripe.invoiceItems.create({
      customer: subscription.stripe_customer_id,
      amount: chargeAmount,
      currency: "usd",
      description: `Postcard mailing - ${subscription.plan.name} plan`,
      metadata: {
        postcardId: postcardId,
        planType: planType,
        profileId: profileId
      }
    });

    // Create invoice and finalize it immediately for usage charges
    const invoice = await stripe.invoices.create({
      customer: subscription.stripe_customer_id,
      auto_advance: true,
      collection_method: "charge_automatically",
      description: `Usage charges for ${new Date().toLocaleDateString()}`,
    });

    await stripe.invoices.finalizeInvoice(invoice.id);

    // Record the usage charge in our database
    await supabase.from("usage_charges").insert({
      profile_id: profileId,
      postcard_id: postcardId,
      amount: subscription.plan.per_mailing_fee,
      stripe_invoice_item_id: invoiceItem.id,
      plan_type: planType
    });

    // Mark postcard as billed
    await supabase
      .from("postcards")
      .update({ 
        usage_billed: true,
        stripe_invoice_item_id: invoiceItem.id
      })
      .eq("id", postcardId);

    console.log(`Usage charge created for postcard ${postcardId}: $${subscription.plan.per_mailing_fee}`);

    return new Response(JSON.stringify({ 
      success: true,
      amount: subscription.plan.per_mailing_fee,
      invoiceItemId: invoiceItem.id
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