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
    employer?: string
    occupation?: string
  }
  contribution: {
    amount: number
    date: string
    recurring?: boolean
    recurring_period?: string
    order_number?: string
    form_name?: string
    refcode?: string
    refcode2?: string
    refcode_custom?: string
    lineitems?: Array<{
      amount: number
      entity_id: string
    }>
  }
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
      employer: payload.donor.employer,
      occupation: payload.donor.occupation,
      amount: payload.contribution.amount,
      donation_date: new Date(payload.contribution.date).toISOString(),
      is_recurring: payload.contribution.recurring || false,
      recurring_period: payload.contribution.recurring_period,
      order_number: payload.contribution.order_number,
      form_name: payload.contribution.form_name,
      refcode: payload.contribution.refcode,
      refcode2: payload.contribution.refcode2,
      refcode_custom: payload.contribution.refcode_custom,
      lineitem_id: payload.contribution.lineitems?.[0]?.entity_id,
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