import { useState, useEffect } from 'react'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { getLiveProducts } from '../lib/products'

function HeroFeaturedCard({ loaded, onExplore }) {
  const liveProducts = getLiveProducts()
  const featured = liveProducts[0]
  if (!featured) return null

  return (
    <div className={`hidden lg:flex justify-center items-center transition-all duration-1000 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="relative animate-float">
        <div className="absolute -inset-6 rounded-[36px] bg-[#b76e79]/15 blur-3xl" />
        <div className="relative glass rounded-[32px] border border-white/10 overflow-hidden w-72 shadow-2xl">
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
                onClick={onExplore}
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

  const bgUrl = 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=1600&q=80&auto=format&fit=crop'

  return (
    <section className="relative min-h-screen w-full flex flex-col" style={{ overflowX: 'clip', touchAction: 'pan-y' }}>
      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={bgUrl}
          alt="City Night"
          className="w-full h-full object-cover"
          style={{ filter: 'blur(3px) brightness(0.38) saturate(1.3)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#050508]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050508]/60 via-transparent to-transparent" />
        {/* Neon glows */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full blur-[80px] animate-pulse bg-purple-600/15" />
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 rounded-full blur-[60px] animate-pulse bg-purple-500/12" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* ── Content grid ── */}
      <div className="relative z-10 flex-1 flex items-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 lg:pt-24 pb-10 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">

          {/* ── Left: Text ── */}
          <div className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Headline */}
            <h1 className="font-serif leading-[1.08] mb-6 pb-1">
              <span className="block text-[clamp(3rem,8vw,5.5rem)] font-bold text-rose-gold">
                Own The
              </span>
              <span className="block text-[clamp(3rem,8vw,5.5rem)] font-bold text-rose-gold pb-2">
                Night.
              </span>
              <span className="block text-[clamp(1.3rem,3vw,1.8rem)] font-light font-sans text-white/85 mt-4 tracking-wide">
                Custom fits for city lights.
              </span>
            </h1>

            <p className="text-[15px] sm:text-base text-white/60 leading-relaxed mb-10 max-w-md font-light">
              Bespoke silhouettes crafted for rooftops, lounges &amp; dance floors.
              Every piece, exclusively yours — stitched in Coimbatore, delivered in 48&nbsp;hours.
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
