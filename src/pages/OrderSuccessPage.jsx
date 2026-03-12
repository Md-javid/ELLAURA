import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { CheckCircle, ShoppingBag, Package, MapPin, Mail, ArrowRight, Sparkles, Truck } from 'lucide-react'

export default function OrderSuccessPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [orderId, setOrderId] = useState(state?.orderId || `EL-${Date.now().toString().slice(-8)}`)
  const [total, setTotal] = useState(state?.total || 0)
  const [shipping, setShipping] = useState(state?.shipping || {})
  const tracking = state?.tracking || null  // { awb, courier, trackingUrl }

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100)
    return () => clearTimeout(t)
  }, [])

  const expectedDate = new Date()
  expectedDate.setDate(expectedDate.getDate() + 2)
  const dateStr = expectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  const formatPrice = (p) => `₹${p?.toLocaleString('en-IN')}`
  const shortId = String(orderId).slice(-8).toUpperCase()

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-16">
      <div className={`w-full max-w-lg transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Success card */}
        <div className="glass-dark rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
          <div className="h-1 w-full bg-gradient-to-r from-[#b76e79] via-[#6366f1] to-[#b76e79] bg-[length:200%_auto] animate-shimmer" />

          <div className="p-8 sm:p-10 text-center">

            {/* Animated check */}
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
              </div>
              {/* Sparkle dots */}
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-[#b76e79]"
                  style={{
                    top: `${50 + 40 * Math.sin((deg * Math.PI) / 180)}%`,
                    left: `${50 + 40 * Math.cos((deg * Math.PI) / 180)}%`,
                    transform: 'translate(-50%,-50%)',
                    animation: `pulseRose 1.5s ease-in-out ${i * 0.15}s infinite`,
                    opacity: show ? 1 : 0,
                    transition: `opacity 0.3s ${i * 0.1}s`,
                  }}
                />
              ))}
            </div>

            <div className="mb-6">
              <h1 className="font-serif text-3xl font-bold text-white/95 mb-2">Order Confirmed!</h1>
              <p className="text-[14px] text-white/45">
                Your Ellaura piece is being prepared with care.
              </p>
            </div>

            {/* Order ID */}
            <div className="glass rounded-2xl border border-white/10 px-5 py-4 mb-6 inline-block w-full">
              <p className="text-[10px] tracking-[0.2em] text-white/30 uppercase mb-1">Order ID</p>
              <p className="font-mono text-[16px] font-bold text-[#e8a0a8] tracking-widest">#{shortId}</p>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-8 text-left">
              {shipping.email && (
                <div className="flex items-center gap-3 glass rounded-xl border border-white/8 px-4 py-3">
                  <Mail className="w-4 h-4 text-[#b76e79] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">Confirmation sent to</p>
                    <p className="text-[13px] text-white/70">{shipping.email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 glass rounded-xl border border-white/8 px-4 py-3">
                <Package className="w-4 h-4 text-[#b76e79] flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Expected delivery</p>
                  <p className="text-[13px] text-white/70">{dateStr}</p>
                </div>
              </div>

              {shipping.city && (
                <div className="flex items-center gap-3 glass rounded-xl border border-white/8 px-4 py-3">
                  <MapPin className="w-4 h-4 text-[#b76e79] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">Delivering to</p>
                    <p className="text-[13px] text-white/70">{[shipping.line1, shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(', ')}</p>
                  </div>
                </div>
              )}

              {total > 0 && (
                <div className="flex items-center gap-3 glass rounded-xl border border-white/8 px-4 py-3">
                  <ShoppingBag className="w-4 h-4 text-[#b76e79] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">Amount paid</p>
                    <p className="text-[13px] text-white/70">{formatPrice(total)}</p>
                  </div>
                </div>
              )}

              {/* Shiprocket AWB tracking — shown only when shipment was auto-created */}
              {tracking?.awb && (
                <div className="flex items-center gap-3 glass rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <Truck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">Tracking number · {tracking.courier}</p>
                    <p className="font-mono text-[13px] text-emerald-300 tracking-wider">{tracking.awb}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Brand message */}
            <div className="glass-rose rounded-2xl border border-[#b76e79]/20 px-5 py-4 mb-8 text-left">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#e8a0a8]" />
                <p className="text-[10px] tracking-[0.2em] text-[#e8a0a8]/60 uppercase">A note from Ellaura</p>
              </div>
              <p className="text-[13px] text-[#e8a0a8]/80 leading-relaxed italic">
                "Every stitch carries intention. Your piece is being crafted by our artisans in Coimbatore — tailored for the night you were born to own."
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/"
                className="flex-1 btn-liquid rounded-2xl py-3.5 text-[14px] font-semibold text-white text-center flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <ShoppingBag className="w-4 h-4" />
                Shop More
              </Link>
              {tracking?.trackingUrl ? (
                <a
                  href={tracking.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 glass rounded-2xl border border-emerald-500/30 py-3.5 text-[14px] font-semibold text-emerald-300 hover:text-emerald-200 hover:border-emerald-400/50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  Track Shipment
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  onClick={() => alert('Tracking will be available once your order is dispatched. We\'ll notify you via WhatsApp.')}
                  className="flex-1 glass rounded-2xl border border-white/10 py-3.5 text-[14px] font-semibold text-white/60 hover:text-white/80 hover:border-white/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Package className="w-4 h-4" />
                  Track Order
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-white/20 mt-6">
          For support, reach us at{' '}
          <a href="mailto:ellauraoffi@gmail.com" className="text-[#b76e79]/60 hover:text-[#b76e79] transition-colors">
            ellauraoffi@gmail.com
          </a>
        </p>
      </div>
    </div>
  )
}
