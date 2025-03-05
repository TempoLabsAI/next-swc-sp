import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { validateEvent } from 'npm:@polar-sh/sdk/webhooks';


// Types
type WebhookEvent = {
  event_type: string;
  type: string;
  polar_event_id: string;
  created_at: string;
  modified_at: string;
  data: any;
};

type SubscriptionData = {
  polar_id: string;
  user_id: string;
  polar_price_id: string;
  currency: string;
  interval: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  amount: number;
  started_at: number;
  customer_id: string;
  metadata: Record<string, any>;
  custom_field_data: Record<string, any>;
  canceled_at?: number;
  ended_at?: number;
  customer_cancellation_reason?: string | null;
  customer_cancellation_comment?: string | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Polar webhook signature
async function verifyPolarSignature(
  request: Request,
  body: string
): Promise<boolean> {
  try {
    // Internally validateEvent uses headers as a dictionary e.g. headers["webhook-id"]
    // So we need to convert the headers to a dictionary 
    // (request.headers is a Headers object which is accessed as request.headers.get("webhook-id"))
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    validateEvent(
      body,
      headers,
      Deno.env.get('POLAR_WEBHOOK_SECRET'),
    )
    return true;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Utility functions
async function storeWebhookEvent(
  supabaseClient: any,
  body: any
): Promise<any> {
  try {
    const { data, error } = await supabaseClient
      .from("webhook_events")
      .insert({
        event_type: body.type,
        type: body.type,
        polar_event_id: body.data.id,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString(),
        data: body.data
      } as WebhookEvent)
      .select();

    if (error) {
      console.error('Error storing webhook event:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in storeWebhookEvent:', error);
    throw error;
  }
}

// Event handlers
async function handleSubscriptionCreated(supabaseClient: any, body: any) {
  console.log('Handling subscription created:', body.data.id);

  try {
    const { data, error } = await supabaseClient
      .from("subscriptions")
      .insert({
        polar_id: body.data.id,
        polar_price_id: body.data.price_id,
        currency: body.data.currency,
        interval: body.data.recurring_interval,
        user_id: body.data.metadata.user_id,
        status: body.data.status,
        current_period_start: new Date(body.data.current_period_start).getTime(),
        current_period_end: new Date(body.data.current_period_end).getTime(),
        cancel_at_period_end: body.data.cancel_at_period_end,
        amount: body.data.amount,
        started_at: new Date(body.data.started_at).getTime(),
        ended_at: body.data.ended_at
          ? new Date(body.data.ended_at).getTime()
          : null,
        canceled_at: body.data.canceled_at
          ? new Date(body.data.canceled_at).getTime()
          : null,
        customer_cancellation_reason: body.data.customer_cancellation_reason || null,
        customer_cancellation_comment: body.data.customer_cancellation_comment || null,
        metadata: body.data.metadata || {},
        custom_field_data: body.data.custom_field_data || {},
        customer_id: body.data.customer_id
      })
      .select();

    if (error) {
      console.error('Error inserting subscription:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ message: "Subscription created successfully" }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
    return new Response(
      JSON.stringify({ error: "Failed to create subscription" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleSubscriptionUpdated(supabaseClient: any, body: any) {
  console.log('Handling subscription updated:', body.data.id);

  try {
    const { data: existingSub } = await supabaseClient
      .from("subscriptions")
      .select()
      .eq("polar_id", body.data.id)
      .single();

    if (existingSub) {
      const { error } = await supabaseClient
        .from("subscriptions")
        .update({
          amount: body.data.amount,
          status: body.data.status,
          current_period_start: new Date(body.data.current_period_start).getTime(),
          current_period_end: new Date(body.data.current_period_end).getTime(),
          cancel_at_period_end: body.data.cancel_at_period_end,
          metadata: body.data.metadata || {},
          custom_field_data: body.data.custom_field_data || {}
        })
        .eq("polar_id", body.data.id);

      if (error) {
        console.error('Error updating subscription:', error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ message: "Subscription updated successfully" }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating subscription:', error);
    return new Response(
      JSON.stringify({ error: "Failed to update subscription" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleSubscriptionActive(supabaseClient: any, body: any) {
  console.log('Handling subscription active:', body.data.id);

  try {
    const { data: activeSub } = await supabaseClient
      .from("subscriptions")
      .select()
      .eq("polar_id", body.data.id)
      .single();

    if (activeSub) {
      const { error } = await supabaseClient
        .from("subscriptions")
        .update({
          status: body.data.status,
          started_at: new Date(body.data.started_at).getTime()
        })
        .eq("polar_id", body.data.id);

      if (error) {
        console.error('Error activating subscription:', error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ message: "Subscription activated successfully" }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error activating subscription:', error);
    return new Response(
      JSON.stringify({ error: "Failed to activate subscription" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleSubscriptionCanceled(supabaseClient: any, body: any) {
  console.log('Handling subscription canceled:', body.data.id);

  try {
    const { data: canceledSub } = await supabaseClient
      .from("subscriptions")
      .select()
      .eq("polar_id", body.data.id)
      .single();

    if (canceledSub) {
      const { error } = await supabaseClient
        .from("subscriptions")
        .update({
          status: body.data.status,
          canceled_at: body.data.canceled_at
            ? new Date(body.data.canceled_at).getTime()
            : null,
          customer_cancellation_reason: body.data.customer_cancellation_reason || null,
          customer_cancellation_comment: body.data.customer_cancellation_comment || null
        })
        .eq("polar_id", body.data.id);

      if (error) {
        console.error('Error canceling subscription:', error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ message: "Subscription canceled successfully" }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return new Response(
      JSON.stringify({ error: "Failed to cancel subscription" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleSubscriptionUncanceled(supabaseClient: any, body: any) {
  console.log('Handling subscription uncanceled:', body.data.id);

  try {
    const { data: uncanceledSub } = await supabaseClient
      .from("subscriptions")
      .select()
      .eq("polar_id", body.data.id)
      .single();

    if (uncanceledSub) {
      const { error } = await supabaseClient
        .from("subscriptions")
        .update({
          status: body.data.status,
          cancel_at_period_end: false,
          canceled_at: null,
          customer_cancellation_reason: null,
          customer_cancellation_comment: null
        })
        .eq("polar_id", body.data.id);

      if (error) {
        console.error('Error uncanceling subscription:', error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ message: "Subscription uncanceled successfully" }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error uncanceling subscription:', error);
    return new Response(
      JSON.stringify({ error: "Failed to uncancel subscription" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleSubscriptionRevoked(supabaseClient: any, body: any) {
  console.log('Handling subscription revoked:', body.data.id);

  try {
    const { data: revokedSub } = await supabaseClient
      .from("subscriptions")
      .select()
      .eq("polar_id", body.data.id)
      .single();

    if (revokedSub) {
      const { error } = await supabaseClient
        .from("subscriptions")
        .update({
          status: 'revoked',
          ended_at: body.data.ended_at
            ? new Date(body.data.ended_at).getTime()
            : null
        })
        .eq("polar_id", body.data.id);

      if (error) {
        console.error('Error revoking subscription:', error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ message: "Subscription revoked successfully" }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error revoking subscription:', error);
    return new Response(
      JSON.stringify({ error: "Failed to revoke subscription" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleOrderCreated(supabaseClient: any, body: any) {
  console.log('Handling order created:', body.data.id);
  // Orders are handled through the subscription events
  return new Response(
    JSON.stringify({ message: "Order created event received" }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Main webhook handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let eventId: string | null = null;

  try {
    // Clone the request to get the body as text for signature verification
    const clonedReq = req.clone();
    const rawBody = await clonedReq.text();
    const isValidSignature = await verifyPolarSignature(req, rawBody);
    
    if (!isValidSignature) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Parse the body as JSON
    const body = JSON.parse(rawBody);
    console.log('Processing webhook event:', body.type);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Store the webhook event
    const eventData = await storeWebhookEvent(supabaseClient, body);
    eventId = eventData?.[0]?.id;

    // Handle the event based on type
    switch (body.type) {
      case 'subscription.created':
        return await handleSubscriptionCreated(supabaseClient, body);
      case 'subscription.updated':
        return await handleSubscriptionUpdated(supabaseClient, body);
      case 'subscription.active':
        return await handleSubscriptionActive(supabaseClient, body);
      case 'subscription.canceled':
        return await handleSubscriptionCanceled(supabaseClient, body);
      case 'subscription.uncanceled':
        return await handleSubscriptionUncanceled(supabaseClient, body);
      case 'subscription.revoked':
        return await handleSubscriptionRevoked(supabaseClient, body);
      case 'order.created':
        return await handleOrderCreated(supabaseClient, body);
      default:
        console.log(`Unhandled event type: ${body.type}`);
        return new Response(
          JSON.stringify({ message: `Unhandled event type: ${body.type}` }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (err) {
    console.error('Error processing webhook:', err);
    
    // Try to update event status to error if we have an eventId
    if (eventId) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );
        
        await supabaseClient
          .from("webhook_events")
          .update({ error: err.message })
          .eq("id", eventId);
      } catch (updateErr) {
        console.error('Error updating webhook event with error:', updateErr);
      }
    }
    
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});


