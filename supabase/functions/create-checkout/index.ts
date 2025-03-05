import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Polar } from "npm:@polar-sh/sdk";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-customer-email',
};

const polar = new Polar({
  accessToken: Deno.env.get('POLAR_ACCESS_TOKEN'),
  server: "sandbox",
});


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productPriceId, successUrl, customerEmail, metadata } = await req.json();

    if (!productPriceId || !successUrl || !customerEmail || !metadata) {
      throw new Error('Missing required parameters');
    }

    const result = await polar.checkouts.create({
      productPriceId,
      successUrl,
      customerEmail,
      metadata,
    });

    console.log("result", result)

    return new Response(
      JSON.stringify({ sessionId: result.id, url: result.url }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});