import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoopsRequest {
  action: 'create_contact' | 'update_contact' | 'send_event' | 'send_transactional';
  profileId: string;
  data: any;
}

interface LoopsContact {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
  subscribed?: boolean;
  userGroup?: string;
  userId?: string;
  committeName?: string;
  organizationName?: string;
  city?: string;
  state?: string;
  country?: string;
  subscriptionStatus?: string;
}

interface LoopsEvent {
  email: string;
  eventName: string;
  eventProperties?: Record<string, any>;
}

interface LoopsTransactional {
  transactionalId: string;
  email: string;
  dataVariables?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOOPS_API_KEY = Deno.env.get('LOOPS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOOPS_API_KEY) {
      throw new Error('LOOPS_API_KEY not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, profileId, data }: LoopsRequest = await req.json();

    // Get user profile and preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found: ${profileError?.message}`);
    }

    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profileId);
    if (userError || !user?.email) {
      throw new Error(`User email not found: ${userError?.message}`);
    }

    let loopsResponse;
    let eventData: any = { action, ...data };

    switch (action) {
      case 'create_contact':
      case 'update_contact': {
        const contactData: LoopsContact = {
          email: user.email,
          firstName: data.firstName || profile.committee_name?.split(' ')[0],
          lastName: data.lastName || '',
          source: 'thank-donors-app',
          subscribed: profile.marketing_emails ?? true,
          userGroup: 'committee',
          userId: profileId,
          committeName: profile.committee_name,
          organizationName: profile.organization_name,
          city: profile.city,
          state: profile.state,
          country: profile.country,
          subscriptionStatus: 'active',
          ...data
        };

        const endpoint = action === 'create_contact' ? 'contacts/create' : 'contacts/update';
        loopsResponse = await fetch(`https://app.loops.so/api/v1/${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOOPS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contactData),
        });

        // Update profile with Loops contact ID if creating
        if (action === 'create_contact' && loopsResponse.ok) {
          const loopsResult = await loopsResponse.json();
          if (loopsResult.id) {
            await supabase
              .from('profiles')
              .update({ loops_contact_id: loopsResult.id })
              .eq('id', profileId);
            eventData.loops_contact_id = loopsResult.id;
          }
        }
        break;
      }

      case 'send_event': {
        if (!profile.email_notifications) {
          console.log('Email notifications disabled for user:', profileId);
          return new Response(JSON.stringify({ success: true, skipped: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const eventPayload: LoopsEvent = {
          email: user.email,
          eventName: data.eventName,
          eventProperties: {
            userId: profileId,
            committeName: profile.committee_name,
            organizationName: profile.organization_name,
            ...data.eventProperties
          }
        };

        loopsResponse = await fetch('https://app.loops.so/api/v1/events/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOOPS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        });
        break;
      }

      case 'send_transactional': {
        if (!profile.status_updates && data.transactionalId !== 'welcome') {
          console.log('Status updates disabled for user:', profileId);
          return new Response(JSON.stringify({ success: true, skipped: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const transactionalPayload: LoopsTransactional = {
          transactionalId: data.transactionalId,
          email: user.email,
          dataVariables: {
            firstName: profile.committee_name?.split(' ')[0] || 'there',
            committeName: profile.committee_name,
            organizationName: profile.organization_name,
            ...data.dataVariables
          }
        };

        loopsResponse = await fetch('https://app.loops.so/api/v1/transactional', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOOPS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionalPayload),
        });
        break;
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    if (!loopsResponse.ok) {
      const errorText = await loopsResponse.text();
      throw new Error(`Loops API error: ${loopsResponse.status} - ${errorText}`);
    }

    const loopsResult = await loopsResponse.json();
    console.log('Loops API response:', loopsResult);

    // Log the notification event
    await supabase
      .from('notification_events')
      .insert({
        profile_id: profileId,
        event_type: action,
        event_data: eventData,
        loops_sent: true,
        loops_event_id: loopsResult.id || loopsResult.success || 'sent'
      });

    return new Response(JSON.stringify({ 
      success: true, 
      loops_response: loopsResult 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-loops-notification function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});