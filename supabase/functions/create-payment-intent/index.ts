// Supabase Edge Function: create-payment-intent
// Deploy: supabase functions deploy create-payment-intent
// Set secret: supabase secrets set STRIPE_SECRET_KEY=sk_live_...
import Stripe from 'npm:stripe@14'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency = 'inr', metadata = {} } = await req.json()

    if (!amount || amount < 50) {
      return Response.json({ error: 'Invalid amount' }, { status: 400, headers: corsHeaders })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // must be integer paise
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    })

    return Response.json(
      { clientSecret: paymentIntent.client_secret },
      { headers: corsHeaders },
    )
  } catch (err: any) {
    console.error('create-payment-intent error:', err.message)
    return Response.json(
      { error: err.message ?? 'Internal error' },
      { status: 500, headers: corsHeaders },
    )
  }
})
