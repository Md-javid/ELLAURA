import { createRazorpayOrder, verifyRazorpayPayment } from './supabase'

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || ''

// Demo mode when no real key is configured
export const RAZORPAY_DEMO_MODE = !RAZORPAY_KEY || RAZORPAY_KEY.startsWith('YOUR_')

// Dynamically loads the Razorpay checkout script from CDN
export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

/**
 * Opens the Razorpay payment popup.
 *
 * Flow:
 *  1. Call Supabase Edge Function to create a Razorpay order (server-side)     ← gets razorpay_order_id
 *  2. Open Razorpay popup with that order_id
 *  3. Handler verifies HMAC signature via Edge Function before calling onSuccess
 *
 * In demo mode: simulates a 2-second payment and skips all server calls.
 *
 * @param {object} opts
 * @param {string} opts.orderId      - Local Ellaura order ID (used as receipt)
 * @param {number} opts.amount       - Amount in INR
 * @param {string} opts.name         - Customer name
 * @param {string} opts.email        - Customer email
 * @param {string} opts.phone        - Customer phone
 * @param {function} opts.onSuccess  - Called with { razorpay_payment_id } on verified success
 * @param {function} opts.onFailure  - Called with Error on failure / cancellation
 */
export const openRazorpayCheckout = async ({ orderId, amount, name, email, phone, onSuccess, onFailure }) => {
  // ── Demo / test mode ──────────────────────────────────────────
  if (RAZORPAY_DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 2000))
    onSuccess({ razorpay_payment_id: `demo_rzp_${Date.now()}` })
    return
  }

  // ── Load Razorpay script ──────────────────────────────────────
  const loaded = await loadRazorpayScript()
  if (!loaded) {
    onFailure(new Error('Could not load Razorpay. Please check your connection and try again.'))
    return
  }

  // ── Create Razorpay order server-side ─────────────────────────
  let razorpayOrderId = null
  try {
    razorpayOrderId = await createRazorpayOrder(amount)
  } catch {
    // Edge function unavailable — proceed without server-side order ID
    // (signature verification will be skipped in verifyRazorpayPayment too)
    console.warn('[Ellaura] Could not create Razorpay order server-side. Proceeding client-only.')
  }

  // ── Open Razorpay popup ───────────────────────────────────────
  const rzp = new window.Razorpay({
    key: RAZORPAY_KEY,
    amount: Math.round(amount * 100),      // paise
    currency: 'INR',
    name: 'Ellaura',
    description: `Order ${orderId}`,
    order_id: razorpayOrderId || undefined, // set only if we got one from server
    image: '/favicon.ico',
    prefill: { name, email, contact: phone },
    theme: { color: '#b76e79' },
    handler: async (response) => {
      // Verify signature server-side before confirming the order
      const verified = await verifyRazorpayPayment({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id || razorpayOrderId || orderId,
        razorpay_signature: response.razorpay_signature || '',
      })
      if (verified) {
        onSuccess({ razorpay_payment_id: response.razorpay_payment_id })
      } else {
        onFailure(new Error('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id))
      }
    },
    modal: {
      ondismiss: () => onFailure(new Error('Payment was cancelled.')),
    },
  })

  rzp.open()
}
