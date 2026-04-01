import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, ChevronLeft, ChevronRight, Star, ShoppingBag, Heart,
  Clock, Package, Truck, RotateCcw, Info, ChevronDown, ChevronUp,
  Send, User as UserIcon, RotateCw, Shirt, Palette, Ruler, ExternalLink,
  Plus, Trash2, ShieldCheck, Zap,
} from 'lucide-react'
import { useCart, useUI, useAuth } from '../context/AppContext'
import { SIZE_CHART, COLOR_SWATCHES } from '../lib/products'
import { getSavedMeasurements, saveMeasurementsDB, getReviews, addReview, hasPurchasedProduct } from '../lib/supabase'

// ── Sizes with chart popup + Custom Measurements ─────────────
const REQUIRED_MEASUREMENTS = [
  { key: 'bust',  label: 'Bust' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips',  label: 'Hips' },
]
const OPTIONAL_MEASUREMENTS = [
  { key: 'shoulder_armhole',  label: 'Shoulder (Armhole)' },
  { key: 'shoulder_to_wrist', label: 'Shoulder to Wrist' },
  { key: 'arms_round',        label: 'Arms Round' },
  { key: 'back_shoulder',     label: 'Back (Shoulder to Shoulder)' },
  { key: 'below_chest',       label: 'Below Chest' },
  { key: 'seat',              label: 'Seat' },
  { key: 'leg_length',        label: 'Leg Length' },
]

function SizeGuide({ sizes, selected, onSelect, measurements, onMeasurementsChange, measureError, setMeasureError, loggedIn, saveChecked, onSaveChecked }) {
  const [open, setOpen] = useState(false)
  const [extraFields, setExtraFields] = useState(measurements?._extra || [])
  const unit = measurements?._unit || 'cm'

  const setUnit = (u) => onMeasurementsChange?.({ ...(measurements || {}), _unit: u })

  const setField = (key, val) => {
    onMeasurementsChange?.({ ...(measurements || {}), [key]: val })
    if (measureError) setMeasureError(false)
  }

  const addExtraField = () => {
    const updated = [...extraFields, { label: '', value: '' }]
    setExtraFields(updated)
    onMeasurementsChange?.({ ...(measurements || {}), _extra: updated })
  }

  const updateExtraField = (idx, key, val) => {
    const updated = extraFields.map((f, i) => i === idx ? { ...f, [key]: val } : f)
    setExtraFields(updated)
    onMeasurementsChange?.({ ...(measurements || {}), _extra: updated })
  }

  const removeExtraField = (idx) => {
    const updated = extraFields.filter((_, i) => i !== idx)
    setExtraFields(updated)
    onMeasurementsChange?.({ ...(measurements || {}), _extra: updated })
  }

  const handleSizeClick = (s) => {
    if (s !== 'Custom') onSelect(s)
    else onSelect('Custom')
  }

  const placeholder = unit === 'cm' ? 'e.g. 36' : 'e.g. 14'

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

          {/* Header + unit toggle */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-white/40 uppercase tracking-widest">Your Measurements</p>
            <div className="flex items-center gap-0.5 glass rounded-lg border border-white/10 p-0.5">
              {['cm', 'inch'].map(u => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                    unit === u ? 'bg-purple-600 text-white shadow' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Required fields */}
          <p className="text-[9px] text-white/25 uppercase tracking-widest mb-2">Required</p>
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {REQUIRED_MEASUREMENTS.map(({ key, label }) => {
              const isEmpty = measureError && !measurements?.[key]?.trim()
              return (
                <div key={key}>
                  <label className={`text-[10px] block mb-1 ${isEmpty ? 'text-red-400' : 'text-white/50'}`}>
                    {label} <span className={isEmpty ? 'text-red-400' : 'text-purple-400/60'}>*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={placeholder}
                    value={measurements?.[key] || ''}
                    onChange={e => setField(key, e.target.value)}
                    className={`w-full glass rounded-xl border px-3 py-2 text-[12px] text-white placeholder-white/20 outline-none transition-all ${
                      isEmpty ? 'border-red-500/50 focus:border-red-400/70' : 'border-white/10 focus:border-purple-500/50'
                    }`}
                  />
                </div>
              )
            })}
          </div>

          {/* Optional fields */}
          <p className="text-[9px] text-white/25 uppercase tracking-widest mb-2">Optional — add what you know</p>
          <div className="grid grid-cols-2 gap-2.5">
            {OPTIONAL_MEASUREMENTS.map(({ key, label }) => (
              <div key={key}>
                <label className="text-[10px] text-white/35 block mb-1">{label}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={placeholder}
                  value={measurements?.[key] || ''}
                  onChange={e => setField(key, e.target.value)}
                  className="w-full glass rounded-xl border border-white/10 focus:border-purple-500/40 px-3 py-2 text-[12px] text-white placeholder-white/20 outline-none transition-all"
                />
              </div>
            ))}
          </div>

          {/* Extra custom fields */}
          {extraFields.length > 0 && (
            <div className="mt-4 space-y-2">
              {extraFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Shoulder (Armhole)"
                    value={field.label}
                    onChange={e => updateExtraField(idx, 'label', e.target.value)}
                    className="flex-1 glass rounded-xl border border-white/10 focus:border-purple-500/40 px-3 py-2 text-[12px] text-white placeholder-white/20 outline-none transition-all"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={placeholder}
                    value={field.value}
                    onChange={e => updateExtraField(idx, 'value', e.target.value)}
                    className="w-24 glass rounded-xl border border-white/10 focus:border-purple-500/40 px-3 py-2 text-[12px] text-white placeholder-white/20 outline-none transition-all"
                  />
                  <button
                    onClick={() => removeExtraField(idx)}
                    className="w-8 h-8 flex-shrink-0 rounded-xl glass border border-white/10 hover:border-red-500/30 hover:text-red-400 text-white/30 flex items-center justify-center transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add more button */}
          <button
            onClick={addExtraField}
            className="mt-3 flex items-center gap-1.5 text-[11px] text-purple-400/70 hover:text-purple-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add more measurements
          </button>

          {measureError && (
            <p className="text-[11px] text-red-400 mt-3 flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-[9px] flex-shrink-0">!</span>
              Please fill in Bust, Waist & Hips to continue.
            </p>
          )}
          {!measureError && (
            <p className="text-[10px] text-white/20 mt-3">Custom stitched to your exact measurements — no extra charge.</p>
          )}

          {/* Save measurements checkbox */}
          {loggedIn && (
            <label className="flex items-center gap-2 mt-3 cursor-pointer group">
              <div className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-all ${
                saveChecked ? 'bg-purple-600 border-purple-500' : 'glass border-white/20 group-hover:border-purple-500/50'
              }`}
                onClick={() => onSaveChecked(!saveChecked)}
              >
                {saveChecked && <span className="text-white text-[9px] font-bold">✓</span>}
              </div>
              <span className="text-[11px] text-white/40 group-hover:text-white/60 transition-colors select-none"
                onClick={() => onSaveChecked(!saveChecked)}
              >
                Save my measurements for future orders
              </span>
            </label>
          )}
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

// ── Lightbox ───────────────────────────────────────────────────
function Lightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx)
  const imgs = images || []
  const prev = useCallback(() => setIdx(i => (i - 1 + imgs.length) % imgs.length), [imgs.length])
  const next = useCallback(() => setIdx(i => (i + 1) % imgs.length), [imgs.length])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next, onClose])

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image */}
      <img
        key={idx}
        src={imgs[idx]}
        alt=""
        onClick={e => e.stopPropagation()}
        className="max-h-[90vh] max-w-[92vw] object-contain rounded-xl select-none"
      />

      {/* Arrows */}
      {imgs.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white hover:bg-white/25 transition-all active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white hover:bg-white/25 transition-all active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {imgs.length > 1 && (
        <div className="absolute bottom-6 flex gap-2">
          {imgs.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIdx(i) }}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-[#e8a0a8] scale-125' : 'bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Image Carousel ─────────────────────────────────────────────
function ImageCarousel({ images, name }) {
  const [idx, setIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const imgs = images?.length ? images : []

  const prev = useCallback(() => setIdx(i => (i - 1 + imgs.length) % imgs.length), [imgs.length])
  const next = useCallback(() => setIdx(i => (i + 1) % imgs.length), [imgs.length])

  useEffect(() => {
    const handler = (e) => {
      if (lightbox) return
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next, lightbox])

  return (
    <>
      {lightbox && <Lightbox images={imgs} startIdx={idx} onClose={() => setLightbox(false)} />}
      <div className="relative">
        {/* Main image */}
        <div
          className="relative overflow-hidden rounded-2xl cursor-zoom-in"
          style={{ height: '420px' }}
          onClick={() => setLightbox(true)}
        >
          <img
            key={idx}
            src={imgs[idx]}
            alt={`${name} — view ${idx + 1}`}
            className="w-full h-full object-cover object-top transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Tap to zoom hint */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/40 border border-white/15 text-[10px] text-white/60 pointer-events-none">
            Tap to zoom
          </div>

          {/* Nav arrows */}
          {imgs.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev() }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-white/30 flex items-center justify-center text-white hover:bg-black/70 transition-all active:scale-90 shadow-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); next() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-white/30 flex items-center justify-center text-white hover:bg-black/70 transition-all active:scale-90 shadow-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Counter */}
          {imgs.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/50 border border-white/15 rounded-full px-2.5 py-1 text-[10px] text-white/80">
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
                className={`relative overflow-hidden rounded-xl transition-all duration-200 ${
                  i === idx
                    ? 'ring-2 ring-[#b76e79] ring-offset-1 ring-offset-black opacity-100'
                    : 'opacity-45 hover:opacity-70'
                }`}
                style={{ width: '72px', height: '72px', flexShrink: 0 }}
              >
                <img src={img} alt="" className="w-full h-full object-cover object-top" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
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
  const [canReview, setCanReview] = useState(false)

  // Reload reviews when productId changes (different product opened)
  useEffect(() => {
    let active = true
    setSubmitted(false)
    setShowForm(false)

    // Parallel fetch: reviews + purchase status
    Promise.all([
      getReviews(productId),
      hasPurchasedProduct(user?.id, productId)
    ]).then(([fetchedReviews, purchased]) => {
      if (!active) return
      setReviews(fetchedReviews)
      setCanReview(purchased)
    })

    return () => { active = false }
  }, [productId, user?.id])

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newReview.rating || !newReview.text.trim() || !canReview) return
    setSubmitting(true)

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous'

    const review = await addReview({
      productId,
      userId: user?.id,
      userName,
      rating: newReview.rating,
      text: newReview.text,
      verifiedPurchase: canReview
    })

    setReviews(prev => [review, ...prev])
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
        {canReview && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-[11px] text-[#b76e79]/80 hover:text-[#b76e79] border border-[#b76e79]/30 rounded-xl px-3 py-1.5 glass transition-all"
          >
            + Write Review
          </button>
        )}
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
  const { toggleWishlist, isWishlisted } = useUI()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedSize, setSelectedSize] = useState('M')
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedMeasurements, setSelectedMeasurements] = useState(null)
  const [measureError, setMeasureError] = useState(false)
  const [added, setAdded] = useState(false)
  const [saveMeasurementsChecked, setSaveMeasurementsChecked] = useState(false)


  const product = productModal

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[2] || product.sizes?.[1] || 'M')
      setSelectedColor(product.colors?.[0] || null)
      setSelectedMeasurements(null)
      setAdded(false)
      setSaveMeasurementsChecked(false)
    }
  }, [product])

  // Auto-fill saved measurements when Custom Fit is chosen
  useEffect(() => {
    if (selectedSize === 'Custom' && !selectedMeasurements) {
      getSavedMeasurements(user?.id).then(saved => {
        if (saved) setSelectedMeasurements(saved)
      })
    }
  }, [selectedSize]) // eslint-disable-line react-hooks/exhaustive-deps

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
    // Save measurements to profile if user opted in
    if (selectedSize === 'Custom' && saveMeasurementsChecked && selectedMeasurements) {
      saveMeasurementsDB(user?.id, selectedMeasurements)
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  // Check if all required options are selected/valid
  const isReadyToBuy = () => {
    if (!selectedSize) return false
    if (selectedSize === 'Custom') {
      const { bust, waist, hips } = selectedMeasurements || {}
      return !!(bust?.trim() && waist?.trim() && hips?.trim())
    }
    return true
  }

  const handleBuyNow = () => {
    // Must be logged in to buy
    if (!user) {
      setProductModal(null)
      navigate('/login?redirect=checkout')
      return
    }
    if (selectedSize === 'Custom') {
      const { bust, waist, hips } = selectedMeasurements || {}
      if (!bust?.trim() || !waist?.trim() || !hips?.trim()) {
        setMeasureError(true)
        return
      }
    }
    setMeasureError(false)
    addToCart(product, selectedSize, selectedMeasurements)
    if (selectedSize === 'Custom' && saveMeasurementsChecked && selectedMeasurements) {
      saveMeasurementsDB(user?.id, selectedMeasurements)
    }
    setProductModal(null)
    navigate('/checkout')
  }

  const images = product.images?.length ? product.images : [product.img]

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

            {/* Instagram post link */}
            {product.instagramUrl && (
              <a
                href={product.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 glass rounded-2xl border border-[#e1306c]/20 px-4 py-3 hover:border-[#e1306c]/50 transition-all group"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#e1306c] flex-shrink-0" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#e1306c]/80 group-hover:text-[#e1306c]" style={{transition:'color 0.2s'}}>View on Instagram</p>
                  <p className="text-[10px] text-white/25 truncate">See how it looks IRL</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-[#e1306c]/60 flex-shrink-0" style={{transition:'color 0.2s'}} />
              </a>
            )}


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
              loggedIn={!!user}
              saveChecked={saveMeasurementsChecked}
              onSaveChecked={setSaveMeasurementsChecked}
            />

            {/* CTA — Add to Bag + Buy Now */}
            <div className="space-y-2.5">
              {/* Row 1: Add to Bag + Wishlist */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`flex-1 py-3.5 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                    added
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
                  onClick={() => toggleWishlist(product)}
                  className="w-12 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center transition-all active:scale-90"
                >
                  <Heart className={`w-5 h-5 transition-all ${isWishlisted(product.id) ? 'fill-[#e8a0a8] text-[#e8a0a8] scale-110' : 'text-white/40'}`} />
                </button>
              </div>

              {/* Row 2: Buy Now — full width, only active when ready */}
              <div className="relative group">
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0 || !isReadyToBuy()}
                  className={`buy-now-btn w-full py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.98] ${
                    isReadyToBuy() && product.stock !== 0
                      ? 'bg-gradient-to-r from-[#8b4f5a] via-[#b76e79] to-[#e8a0a8] text-white border border-[#e8a0a8]/30 hover:opacity-90 hover:shadow-[0_4px_24px_rgba(183,110,121,0.45)] shadow-md'
                      : 'bg-white/5 text-white/25 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  <Zap className={`w-4 h-4 transition-colors ${
                    isReadyToBuy() ? 'text-[#e8a0a8]' : 'text-white/20'
                  }`} />
                  <span>Buy Now</span>
                  {isReadyToBuy() && (
                    <span className="text-[11px] font-normal text-white/50 ml-1">→ Go to checkout</span>
                  )}
                </button>
                {/* Tooltip when not ready */}
                {!isReadyToBuy() && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1.5 glass-dark rounded-xl border border-white/10 text-[10px] text-white/50 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    {selectedSize === 'Custom'
                      ? 'Enter your measurements to buy now'
                      : 'Select a size to buy now'}
                  </div>
                )}
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Truck,        label: 'Express Delivery' },
                { icon: ShieldCheck,  label: 'Fit Promise' },
                { icon: Ruler,        label: 'Custom Fit' },
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
