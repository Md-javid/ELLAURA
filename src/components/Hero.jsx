import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { getLiveProducts } from '../lib/products'
import { getProducts } from '../lib/supabase'
import { useUI } from '../context/AppContext'

// ── Auto-Slideshow Hook ─────────────────────────────────────────
function useAutoSlideshow(items, interval = 3500) {
  const [idx, setIdx] = useState(0)
  const [animating, setAnimating] = useState(false)

  const go = useCallback((nextIdx) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setIdx(nextIdx)
      setAnimating(false)
    }, 380)
  }, [animating])

  const next = useCallback(() => {
    if (!items.length) return
    go((idx + 1) % items.length)
  }, [idx, items.length, go])

  const prev = useCallback(() => {
    if (!items.length) return
    go((idx - 1 + items.length) % items.length)
  }, [idx, items.length, go])

  const goTo = useCallback((i) => {
    if (i !== idx) go(i)
  }, [idx, go])

  useEffect(() => {
    if (items.length <= 1) return
    const t = setInterval(next, interval)
    return () => clearInterval(t)
  }, [next, interval, items.length])

  return { idx, animating, prev, next, goTo }
}

// ── Desktop Slideshow ───────────────────────────────────────────
function DesktopSlideshow({ loaded, products, idx, animating, prev, next, goTo }) {
  const { setProductModal } = useUI()
  const product = products[idx]
  if (!product) return null

  return (
    <div className={`hidden lg:flex justify-center items-center transition-all duration-1000 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="relative animate-float w-72">
        {/* Glow behind card */}
        <div className="absolute -inset-6 rounded-[36px] bg-[#b76e79]/18 blur-3xl" />

        {/* Card */}
        <div
          className="relative glass rounded-[32px] border border-white/10 overflow-hidden shadow-2xl cursor-pointer"
          onClick={() => setProductModal(product)}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setProductModal(product)}
        >
          {/* Image with fade transition */}
          <div className="relative w-full h-96 overflow-hidden">
            <img
              key={idx}
              src={product.img}
              alt={product.name}
              className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-380 ${animating ? 'opacity-0' : 'opacity-100'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          </div>

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] tracking-widest text-white/50 uppercase mb-1">Launch Collection</p>
                <p className="font-serif text-lg font-semibold text-white">{product.name}</p>
                <p className="text-[#e8a0a8] text-sm font-medium mt-0.5">{product.priceDisplay}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); next() }}
                className="w-10 h-10 rounded-xl btn-liquid flex items-center justify-center flex-shrink-0"
              >
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        {products.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {products.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${i === idx ? 'w-5 h-2 bg-[#b76e79]' : 'w-2 h-2 bg-white/25 hover:bg-white/50'}`}
              />
            ))}
          </div>
        )}

        {/* Prev/Next arrows */}
        {products.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-[-20px] top-[40%] w-8 h-8 glass rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={next} className="absolute right-[-20px] top-[40%] w-8 h-8 glass rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Mobile Slideshow ────────────────────────────────────────────
function MobileSlideshow({ loaded, products, idx, animating, prev, next, goTo }) {
  const { setProductModal } = useUI()

  if (!products.length) return null
  const product = products[idx]

  return (
    <div className={`lg:hidden mt-5 mb-2 transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* Label */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-[1px] w-5 bg-[#b76e79]/50" />
        <span className="text-[9px] tracking-[0.3em] uppercase text-[#8b6269]/70 font-medium">Featured Piece</span>
      </div>

      {/* Card */}
      <div
        className="relative rounded-[22px] overflow-hidden shadow-xl cursor-pointer active:scale-[0.98] transition-transform"
        style={{ minHeight: '220px' }}
        onClick={() => setProductModal(product)}
      >
        <img
          key={idx}
          src={product.img}
          alt={product.name}
          className={`w-full h-56 object-cover object-top transition-opacity duration-380 ${animating ? 'opacity-0' : 'opacity-100'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          <div>
            <p className="text-[9px] tracking-[0.25em] text-white/50 uppercase mb-0.5">Launch Collection</p>
            <p className="font-serif text-base font-semibold text-white leading-tight">{product.name}</p>
            <p className="text-[#e8a0a8] text-sm font-medium mt-0.5">{product.priceDisplay}</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); next() }}
            className="w-9 h-9 rounded-xl btn-liquid flex items-center justify-center"
          >
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* Swipe arrows */}
        {products.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); prev() }} className="absolute left-2 top-1/3 w-7 h-7 glass rounded-full flex items-center justify-center text-white/60">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={e => { e.stopPropagation(); next() }} className="absolute right-2 top-1/3 w-7 h-7 glass rounded-full flex items-center justify-center text-white/60">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {products.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${i === idx ? 'w-4 h-1.5 bg-[#b76e79]' : 'w-1.5 h-1.5 bg-[#b76e79]/25'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Hero ──────────────────────────────────────────────────
export default function Hero() {
  const [loaded, setLoaded] = useState(false)
  const [products, setProducts] = useState([])
  const { theme } = useUI()

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    getProducts().then(dbProducts => {
      const list = (dbProducts && dbProducts.length > 0)
        ? dbProducts.filter(p => p.active !== false)
        : getLiveProducts()
      setProducts(list)
    }).catch(() => {
      setProducts(getLiveProducts())
    })
  }, [])

  const { idx, animating, prev, next, goTo } = useAutoSlideshow(products, 3500)

  const handleExplore = () => {
    const el = document.getElementById('gallery')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="relative min-h-screen w-full flex flex-col" style={{ overflowX: 'clip', touchAction: 'pan-y' }}>
      {/* ── Background: dual-image crossfade between light/dark ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Light background image */}
        <img
          src="/hero-bg.jpeg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[800ms] ease-in-out"
          style={{
            opacity: theme === 'dark' ? 0 : 1,
            filter: 'blur(1px) brightness(0.97) saturate(1.08)',
          }}
        />

        {/* Dark background image */}
        <img
          src="/hero-bg-dark.jpeg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[800ms] ease-in-out"
          style={{
            opacity: theme === 'dark' ? 1 : 0,
            filter: 'blur(1px) brightness(0.55) saturate(0.85)',
          }}
        />

        {/* Light overlay — soft pastels */}
        <div
          className="absolute inset-0 transition-opacity duration-[800ms] ease-in-out"
          style={{
            opacity: theme === 'dark' ? 0 : 1,
            background: 'linear-gradient(160deg, rgba(255,248,251,0.72) 0%, rgba(252,232,240,0.65) 30%, rgba(245,238,255,0.60) 55%, rgba(253,232,244,0.68) 78%, rgba(255,245,248,0.75) 100%)',
          }}
        />

        {/* Dark overlay — moody gradient */}
        <div
          className="absolute inset-0 transition-opacity duration-[800ms] ease-in-out"
          style={{
            opacity: theme === 'dark' ? 1 : 0,
            background: 'linear-gradient(160deg, rgba(5,5,8,0.60) 0%, rgba(12,8,16,0.55) 35%, rgba(10,7,13,0.50) 60%, rgba(18,14,24,0.62) 100%)',
          }}
        />

        {/* Radial highlights — dark theme */}
        <div
          className="absolute inset-0 transition-opacity duration-[800ms] ease-in-out"
          style={{
            opacity: theme === 'dark' ? 1 : 0,
            background: 'radial-gradient(ellipse 70% 50% at 15% 10%, rgba(183,110,121,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 45% at 85% 85%, rgba(139,92,246,0.08) 0%, transparent 55%)',
          }}
        />
        {/* Radial highlights — light theme */}
        <div
          className="absolute inset-0 transition-opacity duration-[800ms] ease-in-out"
          style={{
            opacity: theme === 'dark' ? 0 : 1,
            background: 'radial-gradient(ellipse 70% 50% at 15% 10%, rgba(255,255,255,0.28) 0%, transparent 60%), radial-gradient(ellipse 60% 45% at 85% 85%, rgba(183,110,121,0.10) 0%, transparent 55%)',
          }}
        />
      </div>

      {/* ── Content grid ── */}
      <div className="relative z-10 flex-1 flex items-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-10 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center w-full">

          {/* ── Left: Text ── */}
          <div className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Headline */}
            <h1 className="font-serif leading-[1.18] mb-5 pb-1">
              <span className="block text-[clamp(3rem,8vw,5.5rem)] font-bold text-rose-gold hero-title-glow">
                Own Every
              </span>
              <span className="block text-[clamp(3rem,8vw,5.5rem)] font-bold text-rose-gold hero-title-glow pb-2">
                Moment.
              </span>
              <span className={`block text-[clamp(1.1rem,2.5vw,1.5rem)] font-serif font-light mt-4 tracking-[0.08em] italic ${theme === 'dark' ? 'text-white/70' : 'text-[#553d43]'}`}>
                Custom fits for every occasion.
              </span>
            </h1>

            <p className={`text-[15px] sm:text-base leading-relaxed mb-6 max-w-md font-normal ${theme === 'dark' ? 'text-white/50' : 'text-[#3f2b2f]/90'}`}>
              Bespoke western &amp; occasion wear crafted for brunches, events &amp; evenings out.
              Every piece, exclusively yours — stitched in Coimbatore.
            </p>

            {/* Mobile Slideshow — appears between copy and CTAs on small screens */}
            {products.length > 0 && (
              <MobileSlideshow
                loaded={loaded}
                products={products}
                idx={idx}
                animating={animating}
                prev={prev}
                next={next}
                goTo={goTo}
              />
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
              <button
                onClick={handleExplore}
                className="group btn-liquid rounded-2xl px-7 py-4 text-white font-medium text-[15px] tracking-wide flex items-center justify-center gap-3 transition-all duration-500 active:scale-95"
              >
                Explore the Collection
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </button>
              <a
                href="https://wa.me/919087915193?text=Hi%20Ellaura!%20I%E2%80%99d%20love%20to%20book%20a%20custom%20fit%20%F0%9F%92%96"
                target="_blank" rel="noopener noreferrer"
                className={`group glass rounded-2xl px-7 py-4 font-medium text-[15px] tracking-wide transition-all duration-300 active:scale-95 text-center ${theme === 'dark' ? 'border border-white/15 text-white/60 hover:text-white/90 hover:bg-white/10' : 'border border-[#b76e79]/22 text-[#553d43] hover:text-[#2d1b1e] hover:bg-white/75'}`}
              >
                Book a Custom Fit
              </a>
            </div>
          </div>

          {/* ── Right: Desktop Slideshow ── */}
          {products.length > 0 && (
            <DesktopSlideshow
              loaded={loaded}
              products={products}
              idx={idx}
              animating={animating}
              prev={prev}
              next={next}
              goTo={goTo}
            />
          )}

        </div>
      </div>

      {/* ── Scroll hint (mobile) ── */}
      <div className="relative z-10 flex justify-center pb-8 lg:hidden animate-bounce-subtle">
        <div className={`flex flex-col items-center gap-1 ${theme === 'dark' ? 'text-white/20' : 'text-[#8b6269]/70'}`}>
          <span className="text-[9px] tracking-[0.3em] uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </section>
  )
}
