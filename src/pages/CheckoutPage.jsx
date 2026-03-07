import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, MapPin, Phone, User, Mail, Lock, CheckCircle, Info, Tag, X as XIcon, Smartphone, Package, ChevronDown } from 'lucide-react'
import { useCart, useAuth, useUI } from '../context/AppContext'
import { createOrder, decrementProductStock, getSavedAddresses, saveAddress, sendWhatsAppOrderNotification } from '../lib/supabase'
import { openRazorpayCheckout, RAZORPAY_DEMO_MODE } from '../lib/razorpay'

// ── Coupon definitions ─────────────────────────────────────────
const COUPONS = {
  'ELLAURA10': { type: 'percent', value: 10, label: '10% off — Welcome' },
  'LAUNCH20':  { type: 'percent', value: 20, label: '20% off — Launch Offer' },
  'BANDRA500': { type: 'fixed',   value: 500, label: '₹500 off — Bandra Special' },
  'VIP15':     { type: 'percent', value: 15, label: '15% VIP Discount' },
  'FREESHIP':  { type: 'fixed',   value: 0,  label: 'Free Shipping (already free!)' },
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
  const [savedAddresses, setSavedAddresses] = useState([])
  const [saveAddrChecked, setSaveAddrChecked] = useState(true)

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

  const [shipping, setShipping] = useState({
    name: '', email: user?.email || '', phone: '',
    line1: '', line2: '', city: '', state: '', pincode: '',
  })

  useEffect(() => {
    if (items.length === 0) navigate('/')
  }, [items])

  // Load saved addresses and pre-fill the most recent/default one
  useEffect(() => {
    if (!user?.id) return
    getSavedAddresses(user.id).then(addrs => {
      setSavedAddresses(addrs)
      if (addrs.length > 0) {
        const def = addrs.find(a => a.is_default) || addrs[0]
        setShipping(s => ({
          ...s,
          name: def.name || s.name,
          phone: def.phone || s.phone,
          email: def.email || s.email,
          line1: def.line1 || s.line1,
          line2: def.line2 || s.line2,
          city: def.city || s.city,
          state: def.state || s.state,
          pincode: def.pincode || s.pincode,
        }))
      }
    })
  }, [user?.id])

  const setS = (key) => (e) => setShipping(s => ({ ...s, [key]: e.target.value }))

  const formatPrice = (p) => `₹${p.toLocaleString('en-IN')}`

  const handleShippingNext = (e) => {
    e.preventDefault()
    const required = ['name', 'email', 'phone', 'line1', 'city', 'state', 'pincode']
    for (const f of required) {
      if (!shipping[f].trim()) return setError(`Please fill in your ${f.replace(/([A-Z])/g, ' $1').toLowerCase()}.`)
    }
    if (shipping.pincode.length !== 6) return setError('Please enter a valid 6-digit PIN code.')
    setError('')
    setStep('payment')
  }

  const handleRazorpayPay = async () => {
    setError('')
    setLoading(true)
    setStep('processing')

    const orderId = `ELLAURA_${Date.now()}`
    const orderItems = items.map(i => ({
      product: { id: i.product.id, name: i.product.name, price: i.product.price, img: i.product.img },
      qty: i.qty,
      size: i.size,
    }))

    const onSuccess = async (paymentResponse) => {
      try {
        const order = await createOrder({
          userId: user?.id || null,
          items: orderItems,
          subtotal: cartTotal,
          total: finalTotal,
          shippingAddress: shipping,
          stripePaymentIntentId: paymentResponse.razorpay_payment_id,
        }).catch(() => ({ id: orderId }))

        await Promise.all(items.map(i => decrementProductStock(i.product.id, i.qty)))

        if (saveAddrChecked && user?.id) saveAddress(user.id, shipping)

        sendWhatsAppOrderNotification({ orderId: order.id || orderId, items: orderItems, total: finalTotal, shipping })

        clearCart()
        showToast('Order placed successfully! 🎉', 'success')
        navigate('/order-success', { state: { orderId: order.id || orderId, shipping, total: finalTotal } })
      } catch (err) {
        setError(err.message || 'Order creation failed. Contact support.')
        setStep('payment')
      } finally {
        setLoading(false)
      }
    }

    const onFailure = (err) => {
      setError(err.message || 'Payment failed. Please try again.')
      setStep('payment')
      setLoading(false)
    }

    await openRazorpayCheckout({
      orderId,
      amount: finalTotal,
      name: shipping.name,
      email: shipping.email,
      phone: shipping.phone,
      onSuccess,
      onFailure,
    })
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
                      ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white'
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
                  <h2 className="font-serif text-xl font-semibold text-white/90 mb-1">Delivery Address</h2>
                  <p className="text-[12px] text-white/30 mb-4">Where should we send your order?</p>

                  {/* Saved address picker */}
                  {savedAddresses.length > 0 && (
                    <div className="mb-4">
                      <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Use a Saved Address</label>
                      <div className="relative">
                        <select
                          onChange={e => {
                            const a = savedAddresses[parseInt(e.target.value)]
                            if (!a) return
                            setShipping(s => ({ ...s, name: a.name || s.name, phone: a.phone || s.phone, email: a.email || s.email, line1: a.line1 || '', line2: a.line2 || '', city: a.city || '', state: a.state || '', pincode: a.pincode || '' }))
                          }}
                          className="w-full glass rounded-2xl border border-white/10 px-4 py-3 text-[13px] text-white bg-transparent appearance-none pr-10 focus:border-[#b76e79]/40 transition-all outline-none"
                        >
                          <option value="" className="bg-[#1a1a1e]">— select a saved address —</option>
                          {savedAddresses.map((a, i) => (
                            <option key={a.id} value={i} className="bg-[#1a1a1e]">
                              {a.line1}, {a.city} — {a.pincode}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                      </div>
                      <p className="text-[10px] text-white/20 mt-1 ml-1">Or fill in a new address below</p>
                    </div>
                  )}

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
                        <input type="text" placeholder="6-digit PIN" value={shipping.pincode} onChange={setS('pincode')} maxLength={6} className={inputClass + ' font-mono'} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save address checkbox */}
                {user?.id && (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => setSaveAddrChecked(v => !v)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                        saveAddrChecked ? 'bg-[#b76e79] border-[#b76e79]' : 'border-white/20 glass'
                      }`}
                    >
                      {saveAddrChecked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-[12px] text-white/50 group-hover:text-white/70 transition-colors">Save this address for future orders</span>
                  </label>
                )}

                {error && <p className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</p>}

                <button type="submit" className="w-full btn-liquid rounded-2xl py-4 text-[15px] font-semibold text-white tracking-wide transition-all active:scale-[0.98]">
                  Continue to Payment →
                </button>
              </form>
            )}

            {/* ── Payment Step — Razorpay ── */}
            {step === 'payment' && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-white/90 mb-1">Payment</h2>
                  <p className="text-[13px] text-white/40 mb-4">Pay securely via Razorpay (UPI, Cards, Net Banking)</p>

                  {RAZORPAY_DEMO_MODE && (
                    <div className="flex items-start gap-2 glass border border-amber-400/20 rounded-xl px-4 py-3 mb-5 text-[12px] text-amber-400/80">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>Demo mode active. Add your Razorpay Key ID in <code className="font-mono text-[11px]">.env</code> for live payments. No real charges will be made.</p>
                    </div>
                  )}

                  {/* Delivery destination summary */}
                  {shipping.city && (
                    <div className="glass rounded-2xl border border-white/10 p-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-800/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-white/80">Shipping to {shipping.city}, {shipping.state}</p>
                          <p className="text-[11px] text-white/40">2–5 business days via courier</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment option: Razorpay */}
                  <div className="glass-premium rounded-2xl border border-[#b76e79]/20 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#b76e79] to-[#8b4958] flex items-center justify-center shadow-lg">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white/90 text-[15px]">Razorpay</p>
                        <p className="text-[11px] text-white/40">UPI · Cards · Net Banking · Wallet</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-[#b76e79] ml-auto" />
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {['UPI', 'Cards', 'NetBank', 'Wallet'].map(m => (
                        <div key={m} className="glass rounded-lg py-2 text-center border border-white/8">
                          <p className="text-[10px] text-white/40">{m}</p>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-white/30 mb-4">
                      A secure Razorpay popup will open to complete your payment — no page redirect needed.
                    </p>
                  </div>
                </div>

                {error && <p className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</p>}

                <button
                  onClick={handleRazorpayPay}
                  disabled={loading}
                  className="w-full btn-liquid rounded-2xl py-4 text-[15px] font-semibold text-white tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  <Lock className="w-4 h-4" />
                  {RAZORPAY_DEMO_MODE
                    ? `Place Demo Order — ${formatPrice(finalTotal)}`
                    : `Pay ${formatPrice(finalTotal)} via Razorpay`}
                </button>

                <p className="text-center text-[11px] text-white/20 flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  {RAZORPAY_DEMO_MODE ? 'Demo mode — no real payment' : 'Secured by Razorpay · 256-bit SSL encryption'}
                </p>

                <button type="button" onClick={() => setStep('shipping')} className="w-full text-center text-[12px] text-white/25 hover:text-white/50 transition-colors">
                  ← Edit shipping details
                </button>
              </div>
            )}

            {/* ── Processing ── */}
            {step === 'processing' && (
              <div className="flex flex-col items-center justify-center py-20 gap-6 animate-fadeIn">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center animate-pulse-rose">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-serif text-xl text-white/90 mb-2">Processing your order...</p>
                  <p className="text-[13px] text-white/40">Please don't close this window</p>
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-purple-500 thinking-dot" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="glass-dark rounded-[24px] border border-white/10 overflow-hidden shadow-2xl">
              <div className="h-0.5 w-full bg-gradient-to-r from-purple-600 to-indigo-600" />
              <div className="p-5">
                <h3 className="font-serif text-base font-semibold text-white/90 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-purple-400" /> Order Summary
                </h3>

                <div className="space-y-3 mb-4">
                  {items.map(({ product, size, qty }) => (
                    <div key={`${product.id}-${size}`} className="flex gap-3">
                      <img src={product.img} alt={product.imgAlt} className="w-14 h-18 rounded-xl object-cover object-top flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-[13px] font-semibold text-white/85 leading-tight truncate">{product.name}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">Size {size} · Qty {qty}</p>
                        <p className="text-purple-300 text-[12px] font-semibold mt-1">{formatPrice(product.price * qty)}</p>
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
                        <div className="flex-1 glass rounded-xl border border-white/10 px-3 flex items-center gap-2 focus-within:border-purple-500/30 transition-all">
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
                    <span>Shipping</span><span className="text-emerald-400">Free</span>
                  </div>

                  {appliedCoupon && discountAmount > 0 && (
                    <div className="flex justify-between text-[13px] text-emerald-400 font-medium">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>− {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-white/8">
                    <span className="text-white">Total</span>
                    <span className="text-purple-300">{formatPrice(finalTotal)}</span>
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

                {/* Payment method badge */}
                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-white/20">
                  <Smartphone className="w-3 h-3" />
                  <span>Secured by Razorpay</span>
                  <span>·</span>
                  <Package className="w-3 h-3" />
                  <span>Shipped by us with care</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
