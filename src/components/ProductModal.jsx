import { useState, useEffect, useCallback, useRef } from 'react'
import {
  X, ChevronLeft, ChevronRight, Star, ShoppingBag, Heart,
  Clock, Package, Truck, RotateCcw, Info, ChevronDown, ChevronUp,
  Send, User as UserIcon, RotateCw, Shirt, Palette, Ruler,
} from 'lucide-react'
import { useCart, useUI, useAuth } from '../context/AppContext'
import { SIZE_CHART, COLOR_SWATCHES } from '../lib/products'

// ── Sizes with chart popup + Custom Measurements ─────────────
function SizeGuide({ sizes, selected, onSelect, measurements, onMeasurementsChange, measureError, setMeasureError }) {
  const [open, setOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(selected === 'Custom')

  const handleSizeClick = (s) => {
    if (s === 'Custom') {
      setCustomOpen(true)
      onSelect('Custom')
    } else {
      setCustomOpen(false)
      onSelect(s)
    }
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-white/40 uppercase tracking-widest">Select Size</span>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-[10px] text-[#b76e79]/80 hover:text-[#b76e79] transition-colors"
        >
          <Info className="w-3 h-3" /> Size Chart
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Size buttons */}
      <div className="flex gap-2 flex-wrap mb-2">
        {sizes.map(s => (
          <button
            key={s}
            onClick={() => handleSizeClick(s)}
            className={`min-w-[44px] h-10 rounded-xl text-[12px] font-semibold transition-all duration-200 ${selected === s
                ? 'bg-gradient-to-br from-[#b76e79] to-[#8b4f5a] text-white shadow-lg shadow-[#b76e79]/30'
                : 'glass text-white/60 hover:text-white border border-white/10 hover:border-[#b76e79]/30'
              }`}
          >
            {s}
          </button>
        ))}
        {/* Custom Fit button */}
        <button
          onClick={() => handleSizeClick('Custom')}
          className={`h-10 px-3 rounded-xl text-[12px] font-semibold transition-all duration-200 flex items-center gap-1.5 ${
            selected === 'Custom'
              ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
              : 'glass text-white/60 hover:text-white border border-white/10 hover:border-purple-500/30'
          }`}
        >
          <Ruler className="w-3 h-3" /> Custom Fit
        </button>
      </div>

      {/* Custom measurements input */}
      {selected === 'Custom' && (
        <div className={`glass rounded-2xl border p-4 mt-2 animate-fadeIn transition-colors ${
          measureError ? 'border-red-500/40 bg-red-500/5' : 'border-purple-500/20'
        }`}>
          <p className="text-[11px] text-white/40 uppercase tracking-widest mb-3">Enter Your Measurements (cm)</p>
          <div className="grid grid-cols-3 gap-3">
            {[{key:'bust',label:'Bust'},{key:'waist',label:'Waist'},{key:'hips',label:'Hips'}].map(({key,label}) => {
              const isEmpty = measureError && !measurements?.[key]?.trim()
              return (
                <div key={key}>
                  <label className={`text-[10px] block mb-1 ${isEmpty ? 'text-red-400' : 'text-white/30'}`}>{label}{isEmpty && ' *'}</label>
                  <input
                    type="number"
                    min="40"
                    max="160"
                    placeholder="cm"
                    value={measurements?.[key] || ''}
                    onChange={e => {
                      onMeasurementsChange?.({ ...(measurements||{}), [key]: e.target.value })
                      if (measureError) setMeasureError(false)
                    }}                    className={`w-full glass rounded-xl border px-3 py-2 text-[13px] text-white placeholder-white/20 outline-none transition-all ${
                      isEmpty
                        ? 'border-red-500/50 focus:border-red-400/70'
                        : 'border-white/10 focus:border-purple-500/40'
                    }`}
                  />
                </div>
              )
            })}
          </div>
          {measureError && (
            <p className="text-[11px] text-red-400 mt-2.5 flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-[9px] flex-shrink-0">!</span>
              Please fill in all three measurements to continue.
            </p>
          )}
          {!measureError && <p className="text-[10px] text-white/20 mt-2">Custom stitched to your exact measurements — no extra charge.</p>}
        </div>
      )}

      {/* Size chart table */}
      {open && (
        <div className="mt-3 glass-dark rounded-2xl border border-white/8 overflow-hidden animate-fadeIn">
          <div className="px-4 py-2 border-b border-white/5">
            <p className="text-[10px] text-white/30 uppercase tracking-widest">All measurements in cm</p>
          </div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-2 text-white/30 font-medium">Size</th>
                <th className="text-center px-3 py-2 text-white/30 font-medium">Bust</th>
                <th className="text-center px-3 py-2 text-white/30 font-medium">Waist</th>
                <th className="text-center px-3 py-2 text-white/30 font-medium">Hips</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SIZE_CHART).filter(([key]) => sizes.includes(key)).map(([key, val]) => (
                <tr
                  key={key}
                  onClick={() => onSelect(key)}
                  className={`border-b border-white/[0.04] cursor-pointer transition-colors ${selected === key ? 'bg-[#b76e79]/10' : 'hover:bg-white/[0.02]'
                    }`}
                >
                  <td className="px-4 py-2">
                    <span className={`font-bold ${selected === key ? 'text-[#e8a0a8]' : 'text-white/70'}`}>{val.label}</span>
                  </td>
                  <td className="text-center px-3 py-2 text-white/50">{val.bust}</td>
                  <td className="text-center px-3 py-2 text-white/50">{val.waist}</td>
                  <td className="text-center px-3 py-2 text-white/50">{val.hips}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-2 text-[9px] text-white/20">
            Custom stitching available — <span className="text-[#b76e79]/70">WhatsApp us your measurements</span>
          </p>
        </div>
      )}
    </div>
  )
}

// ── Image Carousel ─────────────────────────────────────────────
function ImageCarousel({ images, name }) {
  const [idx, setIdx] = useState(0)
  const imgs = images?.length ? images : []

  const prev = useCallback(() => setIdx(i => (i - 1 + imgs.length) % imgs.length), [imgs.length])
  const next = useCallback(() => setIdx(i => (i + 1) % imgs.length), [imgs.length])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next])

  return (
    <div className="relative">
      {/* Main image */}
      <div className="relative overflow-hidden rounded-2xl" style={{ height: '420px' }}>
        <img
          key={idx}
          src={imgs[idx]}
          alt={`${name} — view ${idx + 1}`}
          className="w-full h-full object-cover object-top transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Nav arrows */}
        {imgs.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Counter */}
        {imgs.length > 1 && (
          <div className="absolute bottom-3 right-3 glass rounded-full px-2.5 py-1 text-[10px] text-white/70">
            {idx + 1} / {imgs.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div className="flex gap-2 mt-3">
          {imgs.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`flex-1 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${i === idx ? 'border-[#b76e79] opacity-100' : 'border-transparent opacity-50 hover:opacity-75'
                }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover object-top" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 360° View ─────────────────────────────────────────────────
function View360({ images, name }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  const containerRef = useRef(null)
  const imgs = images?.length ? images : []

  // Auto-rotate
  useEffect(() => {
    if (!autoRotate || isDragging || imgs.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % imgs.length)
    }, 1200)
    return () => clearInterval(interval)
  }, [autoRotate, isDragging, imgs.length])

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setAutoRotate(false)
    setStartX(e.clientX || e.touches?.[0]?.clientX || 0)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0
    const diff = clientX - startX
    if (Math.abs(diff) > 40) {
      setCurrentIdx(prev => {
        if (diff > 0) return (prev + 1) % imgs.length
        return (prev - 1 + imgs.length) % imgs.length
      })
      setStartX(clientX)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  if (imgs.length === 0) return null

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <RotateCw className="w-3.5 h-3.5 text-[#b76e79]/70" />
          <span className="text-[11px] text-white/40 uppercase tracking-widest">360° View</span>
        </div>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`text-[10px] px-2.5 py-1 rounded-lg transition-all ${autoRotate
              ? 'bg-[#b76e79]/20 text-[#e8a0a8] border border-[#b76e79]/30'
              : 'glass text-white/40 border border-white/10'
            }`}
        >
          {autoRotate ? '⏸ Pause' : '▶ Auto'}
        </button>
      </div>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-white/10 cursor-grab active:cursor-grabbing select-none"
        style={{ height: '260px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <img
          src={imgs[currentIdx]}
          alt={`${name} — 360° view ${currentIdx + 1}`}
          className="w-full h-full object-cover object-top transition-opacity duration-200"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Drag hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 glass rounded-full px-3 py-1 text-[10px] text-white/50 flex items-center gap-1.5">
          <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
          {isDragging ? 'Rotating...' : 'Drag to rotate'}
        </div>

        {/* Progress dots */}
        <div className="absolute bottom-3 right-3 flex gap-1">
          {imgs.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIdx ? 'bg-[#e8a0a8] scale-125' : 'bg-white/20'
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Star Rating Input ──────────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={`w-5 h-5 transition-colors ${n <= (hover || value) ? 'fill-[#e8a0a8] text-[#e8a0a8]' : 'text-white/20'
              }`}
          />
        </button>
      ))}
    </div>
  )
}

// ── Reviews Section ────────────────────────────────────────────
function ReviewsSection({ productId, initialRating, initialCount }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 0, text: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newReview.rating || !newReview.text.trim()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 800))
    setReviews(prev => [{
      id: Date.now(),
      name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
      rating: newReview.rating,
      text: newReview.text,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      verified: !!user,
    }, ...prev])
    setNewReview({ rating: 0, text: '' })
    setSubmitting(false)
    setSubmitted(true)
    setShowForm(false)
  }

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-serif text-base font-semibold text-white/90">Reviews</h3>
          <div className="flex items-center gap-1.5">
            {avgRating ? (
              <>
                <Star className="w-4 h-4 fill-[#e8a0a8] text-[#e8a0a8]" />
                <span className="text-[14px] font-bold text-white/80">{avgRating}</span>
                <span className="text-[11px] text-white/30">({reviews.length})</span>
              </>
            ) : (
              <span className="text-[11px] text-white/25">No reviews yet</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[11px] text-[#b76e79]/80 hover:text-[#b76e79] border border-[#b76e79]/30 rounded-xl px-3 py-1.5 glass transition-all"
        >
          + Write Review
        </button>
      </div>

      {/* Rating distribution (only when reviews exist) */}
      {reviews.length > 0 && (
        <div className="glass-dark rounded-2xl border border-white/8 p-4 mb-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="font-serif text-4xl font-bold text-white/90">{avgRating}</p>
            <div className="flex justify-center gap-0.5 my-1">
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} className={`w-3 h-3 ${n <= Math.round(parseFloat(avgRating)) ? 'fill-[#e8a0a8] text-[#e8a0a8]' : 'text-white/15'}`} />
              ))}
            </div>
            <p className="text-[10px] text-white/25">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map(star => {
              const count = reviews.filter(r => r.rating === star).length
              const pct = reviews.length ? (count / reviews.length) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30 w-3">{star}</span>
                  <Star className="w-2.5 h-2.5 fill-[#e8a0a8] text-[#e8a0a8]" />
                  <div className="flex-1 h-1.5 glass rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#b76e79] to-[#e8a0a8] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/20 w-4 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
        </div>
      )}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-dark rounded-2xl border border-[#b76e79]/20 p-4 mb-4 animate-fadeIn">
          <p className="text-[12px] text-white/60 mb-3 font-medium">Share your experience</p>
          <div className="mb-3">
            <p className="text-[10px] text-white/30 mb-1.5">Your rating</p>
            <StarInput value={newReview.rating} onChange={r => setNewReview(v => ({ ...v, rating: r }))} />
          </div>
          <textarea
            value={newReview.text}
            onChange={e => setNewReview(v => ({ ...v, text: e.target.value }))}
            placeholder="How was the fit, fabric, and delivery?"
            rows={3}
            className="w-full glass rounded-xl border border-white/10 px-3 py-2.5 text-[13px] text-white/80 placeholder-white/20 outline-none focus:border-[#b76e79]/40 resize-none mb-3 transition-all"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newReview.rating || !newReview.text.trim() || submitting}
              className="flex-1 btn-liquid rounded-xl py-2.5 text-[13px] font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Posting...' : 'Post Review'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="glass rounded-xl border border-white/10 px-4 text-[12px] text-white/40">
              Cancel
            </button>
          </div>
        </form>
      )}
      {submitted && (
        <div className="glass rounded-xl border border-emerald-500/20 px-4 py-2.5 text-[12px] text-emerald-400 mb-3 animate-fadeIn">
          ✓ Your review has been posted. Thank you!
        </div>
      )}

      {/* Review list */}
      <div className="space-y-3">
        {reviews.map(r => (
          <div key={r.id} className="glass-dark rounded-2xl border border-white/8 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#b76e79]/30 to-[#6366f1]/30 border border-white/10 flex items-center justify-center">
                  <UserIcon className="w-3.5 h-3.5 text-white/50" />
                </div>
                <div>
                  <p className="text-[12px] font-medium text-white/80">{r.name}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className={`w-2.5 h-2.5 ${n <= r.rating ? 'fill-[#e8a0a8] text-[#e8a0a8]' : 'text-white/15'}`} />
                      ))}
                    </div>
                    {r.verified && (
                      <span className="text-[9px] text-emerald-400/70 bg-emerald-400/10 border border-emerald-400/15 rounded-full px-1.5 py-0.5">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-white/20">{r.date}</span>
            </div>
            <p className="text-[12px] text-white/55 leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Modal ─────────────────────────────────────────────────
export default function ProductModal() {
  const { productModal, setProductModal } = useUI()
  const { addToCart } = useCart()
  const [selectedSize, setSelectedSize] = useState('M')
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedMeasurements, setSelectedMeasurements] = useState(null)
  const [measureError, setMeasureError] = useState(false)
  const [liked, setLiked] = useState(false)
  const [added, setAdded] = useState(false)


  const product = productModal

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[2] || product.sizes?.[1] || 'M')
      setSelectedColor(product.colors?.[0] || null)
      setSelectedMeasurements(null)
      setAdded(false)
    }
  }, [product])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setProductModal(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setProductModal])

  // Lock body scroll
  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [product])

  if (!product) return null

  const handleAddToCart = () => {
    if (selectedSize === 'Custom') {
      const { bust, waist, hips } = selectedMeasurements || {}
      if (!bust?.trim() || !waist?.trim() || !hips?.trim()) {
        setMeasureError(true)
        return
      }
    }
    setMeasureError(false)
    addToCart(product, selectedSize, selectedMeasurements)
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  const images = product.images?.length ? product.images : [product.img]
  const stockColor = product.stock === 0 ? 'text-red-400' : product.stock <= 3 ? 'text-amber-400' : 'text-emerald-400'
  const stockText = product.stock === 0 ? 'Out of Stock' : product.stock <= 3 ? `Only ${product.stock} left!` : `${product.stock} in stock`

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-0 sm:px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setProductModal(null)}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-4xl max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto glass-dark rounded-t-[32px] sm:rounded-[32px] border border-white/10 shadow-[0_-20px_80px_rgba(0,0,0,0.6)] animate-fadeIn scrollbar-hide">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 glass-dark border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-semibold tracking-wider text-white bg-gradient-to-r ${product.tagColor} shadow-lg`}>
              {product.tag}
            </span>
            {product.badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold text-white glass border border-white/20">
                {product.badge}
              </span>
            )}
          </div>
          <button
            onClick={() => setProductModal(null)}
            className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Left: Images */}
          <div>
            <ImageCarousel images={images} name={product.name} />
          </div>

          {/* Right: Details */}
          <div className="flex flex-col gap-4">
            {/* Name + price */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-white/95 mb-1">{product.name}</h2>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(product.rating) ? 'fill-[#e8a0a8] text-[#e8a0a8]' : 'text-white/15'}`} />
                  ))}
                  <span className="text-[11px] text-white/40 ml-1">{product.rating} ({product.reviews} reviews)</span>
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <p className="font-serif text-2xl font-bold text-[#e8a0a8]">{product.priceDisplay}</p>
                <span className="text-[11px] text-white/30">Custom stitched · Free delivery</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-[13px] text-white/60 leading-relaxed">{product.description}</p>

            {/* Material & Fabric */}
            {product.material && (
              <div className="glass rounded-2xl border border-white/8 p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Shirt className="w-3.5 h-3.5 text-[#b76e79]/70" />
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">Material & Fabric</span>
                </div>
                <p className="text-[12px] text-white/60 leading-relaxed">{product.material}</p>
                {product.careInstructions && (
                  <p className="text-[10px] text-white/30 mt-1.5">Care: {product.careInstructions}</p>
                )}
              </div>
            )}

            {/* Stock indicator */}
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-white/30" />
              <span className={`text-[12px] font-medium ${stockColor}`}>{stockText}</span>
              <span className="text-[11px] text-white/25">· Delivery in {product.deliveryDays}h</span>
            </div>

            {/* Colors with visual swatches */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-3.5 h-3.5 text-white/30" />
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Available Colors</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors?.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] transition-all ${selectedColor === c
                        ? 'bg-[#b76e79]/20 border border-[#b76e79]/40 text-white/80'
                        : 'glass border border-white/10 text-white/60 hover:border-[#b76e79]/30'
                      }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: COLOR_SWATCHES[c] || '#666' }}
                    />
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Size guide */}
            <SizeGuide
              sizes={product.sizes || ['XS', 'S', 'M', 'L', 'XL']}
              selected={selectedSize}
              onSelect={(s) => { setSelectedSize(s); if (s !== 'Custom') { setSelectedMeasurements(null); setMeasureError(false) } }}
              measurements={selectedMeasurements}
              onMeasurementsChange={setSelectedMeasurements}
              measureError={measureError}
              setMeasureError={setMeasureError}
            />

            {/* CTA */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 py-3.5 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${added
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'btn-liquid text-white'
                  }`}
              >
                {added ? (
                  <><span>✓</span> Added to Bag</>
                ) : (
                  <><ShoppingBag className="w-4 h-4" /> Add to Bag — {selectedSize}</>
                )}
              </button>
              <button
                onClick={() => setLiked(l => !l)}
                className="w-12 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center transition-all active:scale-90"
              >
                <Heart className={`w-5 h-5 transition-all ${liked ? 'fill-[#e8a0a8] text-[#e8a0a8]' : 'text-white/40'}`} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Truck, label: `${product.deliveryDays}h Delivery` },
                { icon: RotateCcw, label: '7-Day Return' },
                { icon: Package, label: 'Custom Fit' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="glass rounded-xl border border-white/8 py-2 px-1 text-center">
                  <Icon className="w-3.5 h-3.5 text-[#b76e79]/60 mx-auto mb-1" />
                  <p className="text-[9px] text-white/35 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="px-5 pb-8">
          <div className="border-t border-white/5 pt-0">
            <ReviewsSection productId={product.id} initialRating={product.rating} initialCount={product.reviews} />
          </div>
        </div>
      </div>
    </div>
  )
}
