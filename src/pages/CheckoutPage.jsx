import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, MapPin, Phone, User, Mail, Lock, CheckCircle, Tag, X as XIcon, Package, CreditCard } from 'lucide-react'
import { useCart, useAuth, useUI } from '../context/AppContext'
import { createOrder, decrementProductStock, getSavedAddresses, saveAddress, sendWhatsAppOrderNotification, sendOrderToGoogleSheets, validateCoupon, incrementCouponUse } from '../lib/supabase'
import { openRazorpayCheckout } from '../lib/razorpay'

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
  const [couponLoading, setCouponLoading] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [saveAddrChecked, setSaveAddrChecked] = useState(true)

  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? Math.round(cartTotal * appliedCoupon.value / 100)
      : appliedCoupon.value
    : 0
  const finalTotal = Math.max(0, cartTotal - discountAmount)

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true)
    setCouponError('')
    const result = await validateCoupon(code, cartTotal)
    setCouponLoading(false)
    if (!result.valid) {
      setCouponError(result.error || 'Invalid coupon code.')
      setAppliedCoupon(null)
      return
    }
    setAppliedCoupon(result)
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

  const handleShippingNext = async (e) => {
    e.preventDefault()
    const required = ['name', 'email', 'phone', 'line1', 'city', 'state', 'pincode']
    for (const f of required) {
      if (!shipping[f].trim()) return setError(`Please fill in your ${f.replace(/([A-Z])/g, ' $1').toLowerCase()}.`)
    }
    if (shipping.pincode.length !== 6) return setError('Please enter a valid 6-digit PIN code.')
    // Validate Indian mobile number (10 digits, starts with 6-9)
    const phoneDigits = shipping.phone.replace(/\D/g, '').replace(/^91/, '')
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) return setError('Please enter a valid 10-digit Indian mobile number.')
    setError('')
    setStep('payment')
  }

  const handleOnlinePayment = async () => {
    setError('')
    setLoading(true)
    setStep('processing')
    const orderId = `ELLAURA_${Date.now()}`
    const orderItems = items.map(i => ({
      product: { id: i.product.id, name: i.product.name, price: i.product.price, img: i.product.img },
      qty: i.qty,
      size: i.size,
      measurements: i.measurements || null,
    }))
    const onSuccess = async (paymentResponse) => {
      try {
        const order = await createOrder({
          userId: user?.id || null,
          items: orderItems,
          subtotal: cartTotal,
          total: finalTotal,
          shippingAddress: shipping,
          stripePaymentIntentId: paymentResponse.razorpay_payment_id || paymentResponse.paymentId || orderId,
        }).catch(() => ({ id: orderId }))

        await Promise.all(items.map(i => decrementProductStock(i.product.id, i.qty)))
        if (saveAddrChecked && user?.id) await saveAddress(user.id, shipping)
        if (appliedCoupon?.code) await incrementCouponUse(appliedCoupon.code)

        sendOrderToGoogleSheets({ orderId: order.id || orderId, items: orderItems, total: finalTotal, shipping, paymentMethod: 'Razorpay' })
        sendWhatsAppOrderNotification({ orderId: order.id || orderId, items: orderItems, total: finalTotal, shipping, userId: user?.id, paymentMethod: 'Razorpay' })

        clearCart()
        showToast('Payment received! Order confirmed 🎉', 'success')
        navigate('/order-success', { state: { orderId: order.id || orderId, shipping, total: finalTotal } })
      } catch (err) {
        setError(err.message || 'Order creation failed. Contact support.')
        setStep('payment')
        setLoading(false)
      }
    }
    const onFailure = (err) => {
      setError(err?.message || 'Payment failed. Please try again.')
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

  const inputClass = "w-full bg-transparent text-[#2d1b1e] placeholder-[#2d1b1e]/40 outline-none text-[14px] py-3"
  const wrapClass = "bg-white/60 rounded-2xl border border-[#b76e79]/20 px-4 flex items-center gap-3 focus-within:border-[#b76e79]/50 focus-within:bg-white/90 transition-all duration-300 shadow-sm"

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-[#2d1b1e]/50 hover:text-[#2d1b1e] transition-colors mb-8">
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
                      ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                      : 'bg-white/60 border border-[#b76e79]/20 text-[#2d1b1e]/30'
                  }`}>
                    {step === 'payment' && key === 'shipping' ? '✓' : num}
                  </div>
                  <span className={`text-[13px] font-medium ${step === key ? 'text-[#2d1b1e]' : 'text-[#2d1b1e]/30'}`}>{label}</span>
                  {i === 0 && <div className="flex-1 h-[1px] w-12 bg-[#b76e79]/20 mx-2" />}
                </div>
              ))}
            </div>

            {/* ── Shipping Form ── */}
            {step === 'shipping' && (
              <form onSubmit={handleShippingNext} className="space-y-5 animate-fadeIn">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-[#2d1b1e] mb-1">Delivery Address</h2>
                  <p className="text-[12px] text-[#2d1b1e]/40 mb-4">Where should we send your order?</p>

                  {/* Saved address picker */}
                  {user?.id && (
                    <div className="mb-5">
                      <label className="text-[10px] tracking-[0.2em] text-[#2d1b1e]/40 uppercase block mb-2">Saved Addresses</label>
                      {savedAddresses.length === 0 ? (
                        <div className="bg-white/60 rounded-2xl border border-[#b76e79]/15 px-4 py-3 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#2d1b1e]/25 flex-shrink-0" />
                          <p className="text-[11px] text-[#2d1b1e]/35">No saved addresses yet — your address will be saved after your first order.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {savedAddresses.map((a) => (
                            <div
                              key={a.id}
                              onClick={() => setShipping(s => ({ ...s, name: a.name || s.name, phone: a.phone || s.phone, email: a.email || s.email, line1: a.line1 || '', line2: a.line2 || '', city: a.city || '', state: a.state || '', pincode: a.pincode || '' }))}
                              className={`cursor-pointer bg-white/60 rounded-2xl border px-4 py-3 flex items-start gap-3 transition-all hover:border-[#b76e79]/40 ${
                                shipping.line1 === a.line1 && shipping.pincode === a.pincode
                                  ? 'border-[#b76e79]/50 shadow-sm shadow-[#b76e79]/10'
                                  : 'border-[#b76e79]/15'
                              }`}
                            >
                              <MapPin className="w-3.5 h-3.5 text-[#b76e79] mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-medium text-[#2d1b1e]/80 truncate">{a.name || shipping.name} · {a.phone || shipping.phone}</p>
                                <p className="text-[11px] text-[#2d1b1e]/45 truncate mt-0.5">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} — {a.pincode}</p>
                              </div>
                              {a.is_default && <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#b76e79]/15 text-[#b76e79] border border-[#b76e79]/20 flex-shrink-0">Default</span>}
                            </div>
                          ))}
                          <p className="text-[10px] text-[#2d1b1e]/30 mt-1 ml-1">Click a saved address to fill the form, or type a new one below</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-[#2d1b1e]/40 uppercase block mb-2">Full Name *</label>
                      <div className={wrapClass}>
                        <User className="w-4 h-4 text-[#2d1b1e]/35 flex-shrink-0" />
                        <input type="text" placeholder="As on ID" value={shipping.name} onChange={setS('name')} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-[#2d1b1e]/40 uppercase block mb-2">Email *</label>
                      <div className={wrapClass}>
                        <Mail className="w-4 h-4 text-[#2d1b1e]/35 flex-shrink-0" />
                        <input type="email" placeholder="For order updates" value={shipping.email} onChange={setS('email')} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-[#2d1b1e]/40 uppercase block mb-2">Phone *</label>
                      <div className={wrapClass}>
                        <Phone className="w-4 h-4 text-[#2d1b1e]/35 flex-shrink-0" />
                        <input type="tel" placeholder="10-digit mobile number" value={shipping.phone} onChange={setS('phone')} className={inputClass} maxLength={13} />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] tracking-[0.2em] text-[#2d1b1e]/40 uppercase block mb-2">Address Line 1 *</label>
                      <div className={wrapClass}>
                        <MapPin className="w-4 h-4 text-[#2d1b1e]/35 flex-shrink-0" />
                        <input type="text" placeholder="Flat / House no., Street" value={shipping.line1} onChange={setS('line1')} className={inputClass} />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] tracking-[0.2em] text-[#2d1b1e]/40 uppercase block mb-2">Address Line 2</label>
                      <div className={wrapClass}>
                        <input type="text" placeholder="Landmark, Area (optional)" value={shipping.line2} onChange={setS('line2')} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-[#2d1b1e]/40 uppercase block mb-2">City *</label>
                      <div className={wrapClass}>
                        <input type="text" placeholder="City" value={shipping.city} onChange={setS('city')} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-[#2d1b1e]/40 uppercase block mb-2">State *</label>
                      <div className={wrapClass}>
                        <input type="text" placeholder="State" value={shipping.state} onChange={setS('state')} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-[#2d1b1e]/40 uppercase block mb-2">PIN Code *</label>
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
                        saveAddrChecked ? 'bg-[#b76e79] border-[#b76e79]' : 'border-[#b76e79]/25 bg-white/60'
                      }`}
                    >
                      {saveAddrChecked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-[12px] text-[#2d1b1e]/50 group-hover:text-[#2d1b1e]/70 transition-colors">Save this address for future orders</span>
                  </label>
                )}

                {error && <p className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</p>}

                <button type="submit" className="w-full btn-liquid rounded-2xl py-4 text-[15px] font-semibold text-white tracking-wide transition-all active:scale-[0.98]">
                  Continue to Payment →
                </button>
              </form>
            )}

            {/* ── Payment Step ── */}
            {step === 'payment' && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-[#2d1b1e] mb-1">Secure Payment</h2>
                  <p className="text-[13px] text-[#2d1b1e]/50 mb-6">Pay securely via UPI, Cards, Net Banking or Wallets.</p>

                  {/* Delivery info */}
                  {shipping.city && (
                    <div className="bg-white/60 rounded-2xl border border-[#b76e79]/15 p-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b76e79]/20 to-[#8b4f5a]/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-[#b76e79]" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-[#2d1b1e]/80">Shipping to {shipping.city}, {shipping.state}</p>
                          <p className="text-[11px] text-[#2d1b1e]/40">2–5 business days · Free shipping</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment method card */}
                  <div className="glass-premium rounded-2xl border border-[#b76e79]/30 p-5 shadow-lg shadow-[#b76e79]/5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#b76e79] to-[#8b4f5a] flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#2d1b1e] text-[15px]">Pay Online</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {['UPI', 'Cards', 'Net Banking', 'Wallets'].map(t => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#b76e79]/8 text-[#2d1b1e]/50 border border-[#b76e79]/15">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-[#b76e79] flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#b76e79]" />
                      </div>
                    </div>
                  </div>

                  {/* Why no COD — warm, trustworthy explanation */}
                  <div className="bg-white/60 rounded-2xl border border-amber-500/20 bg-amber-50 p-5 mt-6">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {/* Needle & thread icon */}
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 3l4 4M17 3a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4z"/>
                          <path d="M13.5 6.5L7 13l-4 8 8-4 6.5-6.5"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-amber-700 mb-1.5 flex items-center gap-1.5">
                          Why only online payment? We'll explain.
                        </p>
                        <p className="text-[12px] text-[#2d1b1e]/55 leading-relaxed">
                          Every Ellaura piece is <span className="text-[#2d1b1e]/80 font-medium">hand-stitched to order</span> — crafted personally by our artisans in Coimbatore, just for you. Unlike mass-produced garments, your outfit starts being made <span className="text-[#2d1b1e]/80 font-medium">the moment you place your order</span>.
                        </p>
                        <p className="text-[12px] text-[#2d1b1e]/55 leading-relaxed mt-2">
                          Cash on Delivery isn't possible because a last-minute cancellation at the doorstep would mean hours of artisan work and premium fabric go to waste — a loss we cannot absorb while keeping our prices fair and quality uncompromised.
                        </p>
                        <p className="text-[12px] text-[#2d1b1e]/55 leading-relaxed mt-2">
                          We hope you understand — this is how we protect both the artisan's effort and your right to an affordable, beautifully made garment. 🤍
                        </p>
                        {/* Promise strip */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {[
                            { icon: '✦', text: 'Easy returns within 7 days' },
                            { icon: '✦', text: '100% secure payment' },
                            { icon: '✦', text: 'WhatsApp support anytime' },
                          ].map(({ icon, text }) => (
                            <span key={text} className="inline-flex items-center gap-1 text-[10px] text-amber-700/70 bg-amber-100/60 border border-amber-500/20 rounded-full px-2.5 py-1">
                              <span className="text-amber-600">{icon}</span> {text}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {error && <p className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</p>}

                <button
                  onClick={handleOnlinePayment}
                  disabled={loading}
                  className="w-full btn-liquid rounded-2xl py-4 text-[15px] font-semibold text-white tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  <CreditCard className="w-4 h-4" />
                  {loading ? 'Opening Payment…' : `Pay ${formatPrice(finalTotal)} Securely`}
                </button>

                <p className="text-center text-[11px] text-[#2d1b1e]/25 flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Secured by Razorpay · SSL Encrypted · 100% Safe
                </p>

                <button type="button" onClick={() => setStep('shipping')} className="w-full text-center text-[12px] text-[#2d1b1e]/30 hover:text-[#2d1b1e]/60 transition-colors">
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
                  <p className="font-serif text-xl text-[#2d1b1e] mb-2">Processing your payment...</p>
                  <p className="text-[13px] text-[#2d1b1e]/40">Please don't close this window</p>
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
            <div className="glass-dark rounded-[24px] border border-[#b76e79]/15 overflow-hidden shadow-2xl">
              <div className="h-0.5 w-full bg-gradient-to-r from-[#b76e79] to-[#e8a0a8]" />
              <div className="p-5">
                <h3 className="font-serif text-base font-semibold text-[#2d1b1e] mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#b76e79]" /> Order Summary
                </h3>

                <div className="space-y-3 mb-4">
                  {items.map(({ product, size, qty }) => (
                    <div key={`${product.id}-${size}`} className="flex gap-3">
                      <img src={product.img} alt={product.imgAlt} className="w-14 h-18 rounded-xl object-cover object-top flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-[13px] font-semibold text-[#2d1b1e] leading-tight truncate">{product.name}</p>
                        <p className="text-[10px] text-[#2d1b1e]/40 mt-0.5">Size {size} · Qty {qty}</p>
                        <p className="text-[#b76e79] text-[12px] font-semibold mt-1">{formatPrice(product.price * qty)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon code */}
                <div className="border-t border-[#b76e79]/12 pt-4 mb-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-white/60 rounded-xl border border-emerald-500/20 px-3 py-2.5">
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
                        <div className="flex-1 bg-white/60 rounded-xl border border-[#b76e79]/15 px-3 flex items-center gap-2 focus-within:border-[#b76e79]/40 transition-all">
                          <Tag className="w-3.5 h-3.5 text-[#2d1b1e]/30 flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Coupon code"
                            value={couponInput}
                            onChange={e => setCouponInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                            className="flex-1 bg-transparent text-[13px] text-[#2d1b1e] placeholder-[#2d1b1e]/35 outline-none py-2.5"
                          />
                        </div>
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponInput.trim()}
                          className="btn-liquid px-4 rounded-xl text-[12px] font-semibold text-white whitespace-nowrap disabled:opacity-50"
                        >
                          {couponLoading ? '…' : 'Apply'}
                        </button>
                      </div>
                      {couponError && <p className="text-[10px] text-red-400/80 mt-1.5 px-1">{couponError}</p>}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[13px] text-[#2d1b1e]/55">
                    <span>Subtotal</span><span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] text-[#2d1b1e]/55">
                    <span>Custom Stitching</span><span className="text-emerald-600">Free</span>
                  </div>
                  <div className="flex justify-between text-[13px] text-[#2d1b1e]/55">
                    <span>Shipping</span><span className="text-emerald-600">Free</span>
                  </div>

                  {appliedCoupon && discountAmount > 0 && (
                    <div className="flex justify-between text-[13px] text-emerald-400 font-medium">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>− {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-[#b76e79]/12">
                    <span className="text-[#2d1b1e]">Total</span>
                    <span className="text-[#b76e79]">{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {['Secure Payment', 'Custom Fit', 'Free Shipping'].map(t => (
                    <div key={t} className="bg-white/60 rounded-xl py-2 px-1 border border-[#b76e79]/12">
                      <p className="text-[9px] text-[#2d1b1e]/40 leading-tight">{t}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-[#2d1b1e]/25">
                  <Lock className="w-3 h-3" />
                  <span>Razorpay · SSL Secured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
