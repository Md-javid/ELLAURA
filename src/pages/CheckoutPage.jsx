import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, MapPin, Phone, User, Mail, CreditCard, Lock, CheckCircle, Info, Tag, X as XIcon } from 'lucide-react'

// ── Coupon definitions ─────────────────────────────────────────
const COUPONS = {
  'ELLAURA10': { type: 'percent', value: 10, label: '10% off — Welcome' },
  'LAUNCH20':  { type: 'percent', value: 20, label: '20% off — Launch Offer' },
  'BANDRA500': { type: 'fixed',   value: 500, label: '₹500 off — Bandra Special' },
  'VIP15':     { type: 'percent', value: 15, label: '15% VIP Discount' },
  'FREESHIP':  { type: 'fixed',   value: 0,  label: 'Free Shipping (already free!)' },
}
import { useCart, useAuth, useUI } from '../context/AppContext'
import { createOrder } from '../lib/supabase'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: 'rgba(255,255,255,0.87)',
      fontFamily: 'Inter, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: 'rgba(255,255,255,0.25)' },
      iconColor: '#b76e79',
    },
    invalid: { color: '#f87171', iconColor: '#f87171' },
  },
}

// ── Payment form — must live inside <Elements> context ─────────
function StripePaymentForm({ demoMode, card, setC, cartTotal, onPay, onBack, error: parentError }) {
  const stripe = useStripe()
  const elements = useElements()
  const [localError, setLocalError] = useState('')
  const error = parentError || localError

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    if (!demoMode && !stripe) return setLocalError('Stripe is still loading. Please wait.')
    onPay(stripe, elements)
  }

  const inputClass = 'w-full bg-transparent text-white placeholder-white/25 outline-none text-[14px] py-3'
  const wrapClass = 'glass rounded-2xl border border-white/10 px-4 flex items-center gap-3 focus-within:border-[#b76e79]/40 transition-all duration-300'

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
      <div>
        <h2 className="font-serif text-xl font-semibold text-white/90 mb-1">Payment</h2>
        {demoMode && (
          <div className="flex items-start gap-2 glass border border-amber-400/20 rounded-xl px-4 py-3 mb-4 text-[12px] text-amber-400/80">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>Demo mode active. Add your Stripe key in <code className="font-mono">.env</code> for live payments. Card details entered here are <strong>not</strong> processed.</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Name on Card</label>
            <div className={wrapClass}>
              <User className="w-4 h-4 text-white/30 flex-shrink-0" />
              <input type="text" placeholder="As on your card" value={card.nameOnCard} onChange={setC('nameOnCard')} className={inputClass} required />
            </div>
          </div>

          {demoMode ? (
            <>
              <div>
                <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Card Number</label>
                <div className={wrapClass}>
                  <CreditCard className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <input type="text" placeholder="1234 5678 9012 3456" value={card.number} onChange={setC('number')} maxLength={19} className={inputClass + ' font-mono tracking-widest'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Expiry</label>
                  <div className={wrapClass}>
                    <input type="text" placeholder="MM/YY" value={card.expiry} onChange={setC('expiry')} maxLength={5} className={inputClass + ' font-mono'} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">CVC</label>
                  <div className={wrapClass}>
                    <input type="text" placeholder="•••" value={card.cvc} onChange={setC('cvc')} maxLength={3} className={inputClass + ' font-mono tracking-widest'} />
                    <Lock className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Card Details</label>
              <div className="glass rounded-2xl border border-white/10 px-4 py-3.5 focus-within:border-[#b76e79]/40 transition-all duration-300">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
              <p className="text-[10px] text-white/20 mt-1.5 flex items-center gap-1.5">
                <Lock className="w-2.5 h-2.5" /> Card details encrypted by Stripe — never touch our servers.
              </p>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</p>}

      <button
        type="submit"
        disabled={!stripe && !demoMode}
        className="w-full btn-liquid rounded-2xl py-4 text-[15px] font-semibold text-white tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
      >
        <Lock className="w-4 h-4" />
        {demoMode ? `Place Demo Order — ₹${cartTotal.toLocaleString('en-IN')}` : `Pay Securely — ₹${cartTotal.toLocaleString('en-IN')}`}
      </button>

      <p className="text-center text-[11px] text-white/20 flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3" />
        {demoMode ? 'Demo mode — no real payment' : 'Secured by Stripe · 256-bit SSL encryption'}
      </p>

      <button type="button" onClick={onBack} className="w-full text-center text-[12px] text-white/25 hover:text-white/50 transition-colors">
        ← Edit shipping details
      </button>
    </form>
  )
}

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart()
  const { user } = useAuth()
  const { showToast } = useUI()
  const navigate = useNavigate()

  const [step, setStep] = useState('shipping') // 'shipping' | 'payment' | 'processing'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')

  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? Math.round(cartTotal * appliedCoupon.value / 100)
      : appliedCoupon.value
    : 0
  const finalTotal = Math.max(0, cartTotal - discountAmount)

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    const coupon = COUPONS[code]
    if (!coupon) {
      setCouponError('Invalid coupon code. Try ELLAURA10 for 10% off!')
      setAppliedCoupon(null)
      return
    }
    setAppliedCoupon({ ...coupon, code })
    setCouponError('')
    setCouponInput('')
  }
  const demoMode = !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.includes('placeholder') ||
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.includes('YOUR_KEY')

  const [shipping, setShipping] = useState({
    name: '', email: user?.email || '', phone: '',
    line1: '', line2: '', city: '', state: '', pincode: '',
  })

  const [card, setCard] = useState({
    number: '', expiry: '', cvc: '', nameOnCard: '',
  })

  useEffect(() => {
    if (items.length === 0) {
      navigate('/')
    }
  }, [items])

  const setS = (key) => (e) => setShipping(s => ({ ...s, [key]: e.target.value }))
  const setC = (key) => (e) => {
    let val = e.target.value.replace(/\D/g, '')
    if (key === 'number') val = val.slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
    if (key === 'expiry') val = val.slice(0, 4).replace(/(.{2})/, '$1/')
    if (key === 'cvc') val = val.slice(0, 3)
    setCard(c => ({ ...c, [key]: val }))
  }

  const formatPrice = (p) => `₹${p.toLocaleString('en-IN')}`

  const handleShippingNext = (e) => {
    e.preventDefault()
    const required = ['name', 'email', 'phone', 'line1', 'city', 'state', 'pincode']
    for (const f of required) {
      if (!shipping[f].trim()) return setError(`Please fill in your ${f.replace(/([A-Z])/g, ' $1').toLowerCase()}.`)
    }
    setError('')
    setStep('payment')
  }

  const handlePay = async (stripe, elements) => {
    setError('')
    setLoading(true)
    setStep('processing')

    try {
      // Demo mode: simulate payment with fake order
      if (demoMode) {
        await new Promise(r => setTimeout(r, 2000))
        const order = await createOrder({
          userId: user?.id || null,
          items: items.map(i => ({
            productId: i.product.id,
            name: i.product.name,
            price: i.product.price,
            qty: i.qty,
            size: i.size,
          })),
          total: finalTotal,
          shippingAddress: shipping,
          stripePaymentIntentId: `demo_${Date.now()}`,
        }).catch(() => ({ id: `demo_order_${Date.now()}` }))

        clearCart()
        showToast('Order placed successfully! 🎉', 'success')
        navigate('/order-success', { state: { orderId: order.id, shipping, total: cartTotal } })
        return
      }

      // Production: create payment intent via Supabase Edge Function
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            amount: finalTotal * 100, // convert ₹ to paise
            currency: 'inr',
            metadata: { userId: user?.id || 'guest' },
          }),
        }
      )
      const { clientSecret, error: apiError } = await res.json()
      if (apiError) throw new Error(apiError)

      const cardElement = elements.getElement(CardElement)
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: card.nameOnCard || shipping.name,
            email: shipping.email,
            phone: shipping.phone,
            address: {
              line1: shipping.line1,
              line2: shipping.line2 || undefined,
              city: shipping.city,
              state: shipping.state,
              postal_code: shipping.pincode,
              country: 'IN',
            },
          },
        },
      })
      if (stripeError) throw new Error(stripeError.message)

      const order = await createOrder({
        userId: user?.id || null,
        items: items.map(i => ({
          productId: i.product.id,
          name: i.product.name,
          price: i.product.price,
          qty: i.qty,
          size: i.size,
        })),
        total: finalTotal,
        shippingAddress: shipping,
        stripePaymentIntentId: paymentIntent.id,
      })

      clearCart()
      showToast('Order placed successfully! 🎉', 'success')
      navigate('/order-success', { state: { orderId: order.id, shipping, total: cartTotal } })
    } catch (err) {
      setError(err.message)
      setStep('payment')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-transparent text-white placeholder-white/25 outline-none text-[14px] py-3"
  const wrapClass = "glass rounded-2xl border border-white/10 px-4 flex items-center gap-3 focus-within:border-[#b76e79]/40 transition-all duration-300"

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" />
          Continue Shopping
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
          
          {/* ── Left: Forms ── */}
          <div>
            {/* Steps indicator */}
            <div className="flex items-center gap-3 mb-8">
              {[
                { key: 'shipping', label: 'Shipping', num: 1 },
                { key: 'payment', label: 'Payment', num: 2 },
              ].map(({ key, label, num }, i) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ${
                    step === key || (step === 'processing' && key === 'payment')
                      ? 'bg-gradient-to-br from-[#b76e79] to-[#8b4f5a] text-white'
                      : step === 'payment' && key === 'shipping'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'glass border border-white/10 text-white/30'
                  }`}>
                    {step === 'payment' && key === 'shipping' ? '✓' : num}
                  </div>
                  <span className={`text-[13px] font-medium ${step === key ? 'text-white/80' : 'text-white/30'}`}>{label}</span>
                  {i === 0 && <div className="flex-1 h-[1px] w-12 bg-white/10 mx-2" />}
                </div>
              ))}
            </div>

            {/* ── Shipping Form ── */}
            {step === 'shipping' && (
              <form onSubmit={handleShippingNext} className="space-y-5 animate-fadeIn">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-white/90 mb-4">Delivery Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Full Name *</label>
                      <div className={wrapClass}>
                        <User className="w-4 h-4 text-white/30 flex-shrink-0" />
                        <input type="text" placeholder="As on ID" value={shipping.name} onChange={setS('name')} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Email *</label>
                      <div className={wrapClass}>
                        <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
                        <input type="email" placeholder="For order updates" value={shipping.email} onChange={setS('email')} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Phone *</label>
                      <div className={wrapClass}>
                        <Phone className="w-4 h-4 text-white/30 flex-shrink-0" />
                        <input type="tel" placeholder="+91 XXXXXXXXXX" value={shipping.phone} onChange={setS('phone')} className={inputClass} />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Address Line 1 *</label>
                      <div className={wrapClass}>
                        <MapPin className="w-4 h-4 text-white/30 flex-shrink-0" />
                        <input type="text" placeholder="Flat / House no., Street" value={shipping.line1} onChange={setS('line1')} className={inputClass} />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Address Line 2</label>
                      <div className={wrapClass}>
                        <input type="text" placeholder="Landmark, Area (optional)" value={shipping.line2} onChange={setS('line2')} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">City *</label>
                      <div className={wrapClass}>
                        <input type="text" placeholder="City" value={shipping.city} onChange={setS('city')} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">State *</label>
                      <div className={wrapClass}>
                        <input type="text" placeholder="State" value={shipping.state} onChange={setS('state')} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">PIN Code *</label>
                      <div className={wrapClass}>
                        <input type="text" placeholder="6-digit PIN" value={shipping.pincode} onChange={setS('pincode')} maxLength={6} className={inputClass} />
                      </div>
                    </div>
                  </div>
                </div>

                {error && <p className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</p>}

                <button type="submit" className="w-full btn-liquid rounded-2xl py-4 text-[15px] font-semibold text-white tracking-wide transition-all active:scale-[0.98]">
                  Continue to Payment →
                </button>
              </form>
            )}

            {/* ── Payment Form ── */}
            {step === 'payment' && (
              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  demoMode={demoMode}
                  card={card}
                  setC={setC}
                  cartTotal={finalTotal}
                  onPay={handlePay}
                  onBack={() => setStep('shipping')}
                  error={error}
                />
              </Elements>
            )}

            {/* ── Processing ── */}
            {step === 'processing' && (
              <div className="flex flex-col items-center justify-center py-20 gap-6 animate-fadeIn">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#b76e79] to-[#6366f1] flex items-center justify-center animate-pulse-rose">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-serif text-xl text-white/90 mb-2">Processing your order...</p>
                  <p className="text-[13px] text-white/40">Please don't close this window</p>
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#b76e79] thinking-dot" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="glass-dark rounded-[24px] border border-white/10 overflow-hidden shadow-2xl">
              <div className="h-0.5 w-full bg-gradient-to-r from-[#b76e79] to-[#6366f1]" />
              <div className="p-5">
                <h3 className="font-serif text-base font-semibold text-white/90 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#e8a0a8]" /> Order Summary
                </h3>

                <div className="space-y-3 mb-4">
                  {items.map(({ product, size, qty }) => (
                    <div key={`${product.id}-${size}`} className="flex gap-3">
                      <img src={product.img} alt={product.imgAlt} className="w-14 h-18 rounded-xl object-cover object-top flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-[13px] font-semibold text-white/85 leading-tight truncate">{product.name}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">Size {size} · Qty {qty}</p>
                        <p className="text-[#e8a0a8] text-[12px] font-semibold mt-1">{formatPrice(product.price * qty)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon code */}
                <div className="border-t border-white/8 pt-4 mb-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between glass rounded-xl border border-emerald-500/20 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-emerald-400" />
                        <div>
                          <p className="text-[11px] font-bold text-emerald-400">{appliedCoupon.code}</p>
                          <p className="text-[9px] text-emerald-400/60">{appliedCoupon.label}</p>
                        </div>
                      </div>
                      <button onClick={() => setAppliedCoupon(null)} className="w-6 h-6 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all">
                        <XIcon className="w-3 h-3 text-white/40" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <div className="flex-1 glass rounded-xl border border-white/10 px-3 flex items-center gap-2 focus-within:border-[#b76e79]/30 transition-all">
                          <Tag className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Coupon code"
                            value={couponInput}
                            onChange={e => setCouponInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                            className="flex-1 bg-transparent text-[13px] text-white placeholder-white/25 outline-none py-2.5"
                          />
                        </div>
                        <button
                          onClick={handleApplyCoupon}
                          className="btn-liquid px-4 rounded-xl text-[12px] font-semibold text-white whitespace-nowrap"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && <p className="text-[10px] text-red-400/80 mt-1.5 px-1">{couponError}</p>}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[13px] text-white/50">
                    <span>Subtotal</span><span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] text-white/50">
                    <span>Custom Stitching</span><span className="text-emerald-400">Free</span>
                  </div>
                  <div className="flex justify-between text-[13px] text-white/50">
                    <span>Express Delivery</span><span className="text-emerald-400">Free</span>
                  </div>
                  {appliedCoupon && discountAmount > 0 && (
                    <div className="flex justify-between text-[13px] text-emerald-400 font-medium">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>− {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-white/8">
                    <span className="text-white">Total</span>
                    <span className="text-[#e8a0a8]">{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {['48h Delivery', '7-day Return', 'Custom Fit'].map(t => (
                    <div key={t} className="glass rounded-xl py-2 px-1 border border-white/8">
                      <p className="text-[9px] text-white/35 leading-tight">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
