// Supabase Edge Function — verify-razorpay-payment
// Verifies the Razorpay payment signature HMAC server-side.
// Deploy: supabase functions deploy verify-razorpay-payment
// Env vars required:
//   RAZORPAY_KEY_SECRET — your Razorpay Key Secret

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

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
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json()

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return new Response(JSON.stringify({ valid: false, error: 'Missing parameters' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!KEY_SECRET) {
      return new Response(JSON.stringify({ valid: false, error: 'Secret not configured' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Razorpay signature = HMAC-SHA256(order_id|payment_id, secret)
    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expected = createHmac('sha256', KEY_SECRET).update(body).digest('hex')
    const valid = expected === razorpay_signature

    return new Response(JSON.stringify({ valid }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, error: err.message }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
