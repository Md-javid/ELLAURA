// Supabase Edge Function: create-phonepe-payment
// Deploy: supabase functions deploy create-phonepe-payment
// Set secrets:
//   supabase secrets set PHONEPE_MERCHANT_ID=YOUR_MERCHANT_ID
//   supabase secrets set PHONEPE_SALT_KEY=YOUR_SALT_KEY
//   supabase secrets set PHONEPE_SALT_INDEX=1
//   supabase secrets set PHONEPE_HOST=https://api.phonepe.com/apis/hermes
//
// Test/sandbox host: https://api-preprod.phonepe.com/apis/pg-sandbox

import { encode as base64Encode } from 'https://deno.land/std@0.208.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const MERCHANT_ID = Deno.env.get('PHONEPE_MERCHANT_ID') ?? ''
    const SALT_KEY = Deno.env.get('PHONEPE_SALT_KEY') ?? ''
    const SALT_INDEX = Deno.env.get('PHONEPE_SALT_INDEX') ?? '1'
    const HOST = Deno.env.get('PHONEPE_HOST') ?? 'https://api-preprod.phonepe.com/apis/pg-sandbox'

    const { orderId, amount, customerName, customerPhone, customerEmail, callbackUrl, redirectUrl } =
      await req.json()

    if (!amount || amount < 100) {
      return Response.json(
        { error: 'Amount must be at least ₹1 (100 paise)' },
        { status: 400, headers: corsHeaders }
      )
    }

    const merchantTransactionId = `ELLAURA_${orderId}_${Date.now()}`

    // Build PhonePe Pay API payload
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: customerEmail || `user_${Date.now()}`,
      amount, // already in paise
      redirectUrl: redirectUrl || 'https://ellaura.in/order-success',
      redirectMode: 'REDIRECT',
      callbackUrl: callbackUrl || 'https://ellaura.in/order-success',
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    }

    // Base64 encode the payload
    const payloadBase64 = base64Encode(new TextEncoder().encode(JSON.stringify(payload)))

    // Generate X-VERIFY checksum: SHA256(base64 + "/pg/v1/pay" + saltKey) + "###" + saltIndex
    const checksumInput = payloadBase64 + '/pg/v1/pay' + SALT_KEY
    const checksum = (await sha256(checksumInput)) + '###' + SALT_INDEX

    // Call PhonePe Pay API
    const response = await fetch(`${HOST}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
      },
      body: JSON.stringify({ request: payloadBase64 }),
    })

    const data = await response.json()

    if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
      return Response.json(
        {
          redirectUrl: data.data.instrumentResponse.redirectInfo.url,
          transactionId: merchantTransactionId,
        },
        { headers: corsHeaders }
      )
    }

    return Response.json(
      { error: data.message || 'PhonePe payment initiation failed', code: data.code },
      { status: 400, headers: corsHeaders }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    console.error('create-phonepe-payment error:', message)
    return Response.json({ error: message }, { status: 500, headers: corsHeaders })
  }
})
