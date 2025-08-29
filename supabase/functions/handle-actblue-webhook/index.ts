import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ActBlueContribution {
  donor: {
    firstname: string
    lastname: string
    addr1?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    email?: string
    phone?: string
    employerData?: {
      employer?: string
      occupation?: string
    }
  }
  contribution: {
    createdAt: string
    orderNumber?: string
    contributionForm?: string
    refcode?: string
    refcode2?: string
    status?: string
    isRecurring?: boolean
    recurringPeriod?: string
  }
  lineitems: Array<{
    amount: string
    paidAt: string
    entityId: number
    paymentId: number
    lineitemId: number
    amountLessAbFees: string
  }>
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('ActBlue webhook received:', req.method)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const payload = await req.json() as ActBlueContribution
    console.log('Received payload:', JSON.stringify(payload, null, 2))

    // Background function to monitor postcard status changes and trigger usage billing
    async function monitorPostcardForUsageBilling(postcardId: string) {
      const maxRetries = 10;
      const retryDelay = 30000; // 30 seconds
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Check postcard status
          const { data: postcard, error } = await supabase
            .from('postcards')
            .select('status, usage_billed')
            .eq('id', postcardId)
            .single();

          if (error) {
            console.error(`Error checking postcard status (attempt ${attempt + 1}):`, error);
            continue;
          }

          // If postcard is in production status and not yet billed
          if (['processing', 'rendered'].includes(postcard.status) && !postcard.usage_billed) {
            console.log(`Postcard ${postcardId} is in production (${postcard.status}), triggering usage billing`);
            
            // Trigger usage billing
            try {
              await supabase.functions.invoke('create-usage-charge', {
                body: { postcardId }
              });
              console.log(`Usage billing triggered for postcard ${postcardId}`);
              break; // Exit monitoring loop
            } catch (billingError) {
              console.error(`Failed to trigger usage billing for postcard ${postcardId}:`, billingError);
            }
          } else if (postcard.usage_billed) {
            console.log(`Postcard ${postcardId} already billed, stopping monitoring`);
            break;
          }

          // Wait before next check
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } catch (error) {
          console.error(`Error in postcard monitoring (attempt ${attempt + 1}):`, error);
        }
      }
    }

    // Validate required fields
    if (!payload.donor || !payload.contribution) {
      console.error('Missing required donor or contribution data')
      return new Response(
        JSON.stringify({ error: 'Missing required donor or contribution data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use the existing profile ID for Julian for U.S. Senate
    // In production, this should map donations to the correct user based on refcode or other identifiers
    const defaultProfileId = 'bfcee165-f32d-48af-8f27-a3533541f807'
    
    // Verify the profile exists before proceeding
    const { data: profileCheck, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', defaultProfileId)
      .single()
    
    if (profileError || !profileCheck) {
      console.error('Profile not found:', profileError)
      return new Response(
        JSON.stringify({ error: 'Invalid profile configuration', details: profileError?.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the first lineitem for the donation amount and date
    const firstLineitem = payload.lineitems[0]
    if (!firstLineitem) {
      console.error('No lineitems found in payload')
      return new Response(
        JSON.stringify({ error: 'No donation lineitems found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare donation data
    const donationData = {
      profile_id: defaultProfileId,
      donor_name: `${payload.donor.firstname} ${payload.donor.lastname}`,
      donor_email: payload.donor.email,
      donor_address: payload.donor.addr1,
      donor_city: payload.donor.city,
      donor_state: payload.donor.state,
      donor_zip: payload.donor.zip,
      donor_country: payload.donor.country || 'US',
      donor_phone: payload.donor.phone,
      employer: payload.donor.employerData?.employer,
      occupation: payload.donor.employerData?.occupation,
      amount: parseFloat(firstLineitem.amount),
      donation_date: new Date(firstLineitem.paidAt).toISOString(),
      is_recurring: payload.contribution.isRecurring || false,
      recurring_period: payload.contribution.recurringPeriod,
      order_number: payload.contribution.orderNumber,
      form_name: payload.contribution.contributionForm,
      refcode: payload.contribution.refcode,
      refcode2: payload.contribution.refcode2,
      refcode_custom: null,
      lineitem_id: firstLineitem.lineitemId.toString(),
      donation_status: 'completed'
    }

    console.log('Inserting donation:', JSON.stringify(donationData, null, 2))

    // Insert donation into database
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert(donationData)
      .select()
      .single()

    if (donationError) {
      console.error('Error inserting donation:', donationError)
      return new Response(
        JSON.stringify({ error: 'Failed to create donation', details: donationError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Donation created successfully:', donation.id)

    // Create initial postcard record
    const { data: postcard, error: postcardError } = await supabase
      .from('postcards')
      .insert({
        donation_id: donation.id,
        status: 'pending'
      })
      .select()
      .single()

    if (postcardError) {
      console.error('Error creating postcard:', postcardError)
      // Don't fail the entire request if postcard creation fails
    } else {
      console.log('Postcard created successfully:', postcard.id)
    }

    // Send notification to Loops.so about the new donation
    try {
      await supabase.functions.invoke('send-loops-notification', {
        body: {
          action: 'send_event',
          profileId: defaultProfileId,
          data: {
            eventName: 'donation_received',
            eventProperties: {
              donationAmount: donationData.amount,
              donorName: donationData.donor_name,
              donorState: donationData.donor_state,
              orderNumber: donationData.order_number,
              donationDate: donationData.donation_date
            }
          }
        }
      });
      console.log('Donation notification sent to Loops');
    } catch (notificationError) {
      console.error('Failed to send donation notification:', notificationError);
      // Don't fail the webhook if notification fails
    }

    // Set up background task to monitor postcard status for usage billing
    if (postcard?.id) {
      EdgeRuntime.waitUntil(monitorPostcardForUsageBilling(postcard.id));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        donation_id: donation.id,
        postcard_id: postcard?.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})