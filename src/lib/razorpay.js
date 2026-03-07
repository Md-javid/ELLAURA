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
 * Opens the Razorpay payment popup (or simulates it in demo mode).
 * @param {object} opts
 * @param {string} opts.orderId      - Your internal order ID (shown in description)
 * @param {number} opts.amount       - Amount in INR (will be converted to paise)
 * @param {string} opts.name         - Customer name (pre-fills the form)
 * @param {string} opts.email        - Customer email
 * @param {string} opts.phone        - Customer phone
 * @param {function} opts.onSuccess  - Called with { razorpay_payment_id } on success
 * @param {function} opts.onFailure  - Called with Error on failure / cancellation
 */
export const openRazorpayCheckout = async ({ orderId, amount, name, email, phone, onSuccess, onFailure }) => {
  // ── Demo / test mode ────────────────────────────────────────
  if (RAZORPAY_DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 2000))
    onSuccess({ razorpay_payment_id: `demo_rzp_${Date.now()}` })
    return
  }

  // ── Live / test-key mode ─────────────────────────────────────
  const loaded = await loadRazorpayScript()
  if (!loaded) {
    onFailure(new Error('Could not load Razorpay. Please check your connection and try again.'))
    return
  }

  const rzp = new window.Razorpay({
    key: RAZORPAY_KEY,
    amount: Math.round(amount * 100), // Razorpay expects paise
    currency: 'INR',
    name: 'Ellaura',
    description: `Order ${orderId}`,
    image: '/favicon.ico', // optional brand logo shown in popup
    prefill: {
      name,
      email,
      contact: phone,
    },
    theme: { color: '#b76e79' },
    handler: onSuccess,
    modal: {
      ondismiss: () => onFailure(new Error('Payment was cancelled.')),
    },
  })

  rzp.open()
}
