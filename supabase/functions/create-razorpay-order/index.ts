// Supabase Edge Function — create-razorpay-order
// Creates a Razorpay order server-side so the frontend never exposes the secret key.
// Deploy: supabase functions deploy create-razorpay-order
// Env vars required (set in Supabase Dashboard → Settings → Edge Functions):
//   RAZORPAY_KEY_ID     — your Razorpay Key ID
//   RAZORPAY_KEY_SECRET — your Razorpay Key Secret

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { amount } = await req.json()
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!KEY_ID || !KEY_SECRET) {
      return new Response(JSON.stringify({ error: 'Razorpay keys not configured' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // convert INR to paise
        currency: 'INR',
        receipt: `ellaura_${Date.now()}`,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Razorpay API error: ${errText}`)
    }

    const order = await response.json()

    return new Response(JSON.stringify({ orderId: order.id, amount: order.amount }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
