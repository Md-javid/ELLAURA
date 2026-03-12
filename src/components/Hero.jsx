import { useState, useEffect } from 'react'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { getLiveProducts } from '../lib/products'
import { getProducts } from '../lib/supabase'
import { useUI } from '../context/AppContext'

function HeroFeaturedCard({ loaded, onExplore }) {
  const [featured, setFeatured] = useState(null)
  const { setProductModal } = useUI()

  useEffect(() => {
    getProducts().then(dbProducts => {
      const list = (dbProducts && dbProducts.length > 0)
        ? dbProducts.filter(p => p.active !== false)
        : getLiveProducts()
      setFeatured(list[0] || null)
    }).catch(() => {
      setFeatured(getLiveProducts()[0] || null)
    })
  }, [])

  if (!featured) return null

  return (
    <div className={`hidden lg:flex justify-center items-center transition-all duration-1000 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="relative animate-float">
        <div className="absolute -inset-6 rounded-[36px] bg-[#b76e79]/15 blur-3xl" />
        <div
          className="relative glass rounded-[32px] border border-white/10 overflow-hidden w-72 shadow-2xl cursor-pointer"
          onClick={() => setProductModal(featured)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setProductModal(featured)}
        >
          <img
            src={featured.img}
            alt={featured.name}
            className="w-full h-96 object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] tracking-widest text-white/50 uppercase mb-1">Launch Collection</p>
                <p className="font-serif text-lg font-semibold text-white">{featured.name}</p>
                <p className="text-[#e8a0a8] text-sm font-medium mt-0.5">{featured.priceDisplay}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onExplore() }}
                className="w-10 h-10 rounded-xl btn-liquid flex items-center justify-center flex-shrink-0"
              >
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80)
    return () => clearTimeout(t)
  }, [])

  const handleExplore = () => {
    const el = document.getElementById('gallery')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const bgUrl = '/hero-bg.jpeg'

  return (
    <section className="relative min-h-screen w-full flex flex-col" style={{ overflowX: 'clip', touchAction: 'pan-y' }}>
      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={bgUrl}
          alt="Fashion Editorial"
          className="w-full h-full object-cover"
          style={{ filter: 'blur(2px) brightness(0.55) saturate(1.2)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#050508]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050508]/60 via-transparent to-transparent" />
        {/* Neon glows */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full blur-[80px] animate-pulse bg-purple-600/15" />
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 rounded-full blur-[60px] animate-pulse bg-purple-500/12" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* ── Content grid ── */}
      <div className="relative z-10 flex-1 flex items-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-20 lg:pt-24 pb-10 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">

          {/* ── Left: Text ── */}
          <div className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Headline */}
            <h1 className="font-serif leading-[1.18] mb-6 pb-1">
              <span className="block text-[clamp(3rem,8vw,5.5rem)] font-bold text-rose-gold">
                Own Every
              </span>
              <span className="block text-[clamp(3rem,8vw,5.5rem)] font-bold text-rose-gold pb-2">
                Moment.
              </span>
              <span className="block text-[clamp(1.1rem,2.5vw,1.5rem)] font-serif font-light text-white/70 mt-5 tracking-[0.08em] italic">
                Custom fits for every occasion.
              </span>
            </h1>

            <p className="text-[15px] sm:text-base text-white/60 leading-relaxed mb-10 max-w-md font-light">
              Bespoke western &amp; occasion wear crafted for brunches, events &amp; evenings out.
              Every piece, exclusively yours — stitched in Coimbatore.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
                className="group glass border border-white/10 rounded-2xl px-7 py-4 font-medium text-[15px] tracking-wide transition-all duration-300 active:scale-95 text-center text-white/70 hover:text-white hover:bg-white/8"
              >
                Book a Custom Fit
              </a>
            </div>


          </div>

          {/* ── Right: Featured dress card (only when products exist) ── */}
          <HeroFeaturedCard loaded={loaded} onExplore={handleExplore} />

        </div>
      </div>

      {/* ── Scroll hint (mobile) ── */}
      <div className="relative z-10 flex justify-center pb-8 lg:hidden animate-bounce-subtle">
        <div className="flex flex-col items-center gap-1 text-white/20">
          <span className="text-[9px] tracking-[0.3em] uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </section>
  )
}
