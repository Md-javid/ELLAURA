// ── PhonePe Payment Gateway Integration ────────────────────────
// Docs: https://developer.phonepe.com/docs/
//
// Required env vars:
//   VITE_PHONEPE_MERCHANT_ID   — Your merchant ID from PhonePe dashboard
//   VITE_PHONEPE_HOST          — 'https://api.phonepe.com/apis/hermes' (prod)
//                                 or 'https://api-preprod.phonepe.com/apis/pg-sandbox' (test)
//
// The actual payment initiation happens server-side (Supabase Edge Function)
// because the salt key must be kept secret. The frontend only redirects.

const PHONEPE_MERCHANT_ID = import.meta.env.VITE_PHONEPE_MERCHANT_ID || ''
const PHONEPE_HOST = import.meta.env.VITE_PHONEPE_HOST || 'https://api-preprod.phonepe.com/apis/pg-sandbox'

export const DEMO_MODE = !PHONEPE_MERCHANT_ID || PHONEPE_MERCHANT_ID === 'YOUR_MERCHANT_ID'

/**
 * Initiates a PhonePe payment via Supabase Edge Function.
 * Returns { redirectUrl } on success.
 */
export async function initiatePhonePePayment({ orderId, amount, customerName, customerPhone, customerEmail, callbackUrl, redirectUrl }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const res = await fetch(`${supabaseUrl}/functions/v1/create-phonepe-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      orderId,
      amount: Math.round(amount * 100), // convert to paise
      customerName,
      customerPhone,
      customerEmail,
      callbackUrl: callbackUrl || `${window.location.origin}/order-success`,
      redirectUrl: redirectUrl || `${window.location.origin}/order-success`,
    }),
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data // { redirectUrl, transactionId }
}

/**
 * Demo mode: simulates a payment flow.
 */
export async function simulatePhonePePayment() {
  await new Promise(r => setTimeout(r, 2000))
  return {
    transactionId: `DEMO_PP_${Date.now()}`,
    status: 'SUCCESS',
  }
}
