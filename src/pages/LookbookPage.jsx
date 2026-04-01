import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Heart, Sparkles } from 'lucide-react'
import { getLiveProducts } from '../lib/products'
import { useUI, useCart } from '../context/AppContext'
import { loadLookbookConfig } from '../lib/lookbookConfig'

// Layout & style templates (paired with products dynamically)
const LAYOUT_TEMPLATES = [
  { layout: 'hero',         accentColor: 'from-[#b76e79] to-[#8b4f5a]',  bgGradient: 'linear-gradient(135deg, #fff7fa 0%, #fceff3 52%, #f7edf9 100%)' },
  { layout: 'side',         accentColor: 'from-[#c9a227] to-[#8b7220]',  bgGradient: 'linear-gradient(135deg, #fffaf0 0%, #fdf4df 48%, #f8f1e7 100%)' },
  { layout: 'split',        accentColor: 'from-[#6366f1] to-[#4338ca]',  bgGradient: 'linear-gradient(135deg, #f5f4ff 0%, #ecebff 50%, #f7f6ff 100%)' },
  { layout: 'side-reverse',  accentColor: 'from-[#475569] to-[#1e293b]',  bgGradient: 'linear-gradient(135deg, #f4f6f8 0%, #edf1f5 50%, #f8fafc 100%)' },
  { layout: 'hero',         accentColor: 'from-[#e8a0a8] to-[#b76e79]',  bgGradient: 'linear-gradient(135deg, #fff7f8 0%, #fdeff3 46%, #fef8f0 100%)' },
]

function LookCard({ look, onShop }) {
  const [liked, setLiked] = useState(false)
  const isHero = look.layout === 'hero'
  const isSplitRight = look.layout === 'side-reverse'

  return (
    <article
      onClick={() => onShop(look.product)}
      className={`relative overflow-hidden cursor-pointer ${isHero ? 'rounded-[32px]' : 'rounded-[28px]'} border border-[#b76e79]/16 group`}
      style={{ background: look.bgGradient }}
    >
      {/* Ambient glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${look.accentColor} transition-opacity duration-700`} style={{ opacity: 0.08 }} />

      <div className={`grid ${isHero ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} ${isSplitRight ? 'sm:[&>*:first-child]:order-2' : ''}`}>
        {/* Image */}
        <div className={`relative overflow-hidden ${isHero ? 'h-[520px] sm:h-[640px]' : 'h-[460px]'}`}>
          <img
            src={look.product.img}
            alt={look.title}
            className="w-full h-full object-cover object-top transition-transform duration-[1200ms] group-hover:scale-105"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#fef9f5]/88 via-[#fef9f5]/16 to-transparent" />

          {/* Mood tag */}
          <div className="absolute top-5 left-5">
            <span className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.12em] text-white bg-gradient-to-r ${look.accentColor} shadow-lg`}>
              {look.mood}
            </span>
          </div>

          {/* Like */}
          <button
            onClick={e => { e.stopPropagation(); setLiked(l => !l) }}
            className="absolute top-5 right-5 w-9 h-9 rounded-full glass border border-white/20 flex items-center justify-center transition-all active:scale-90"
          >
            <Heart className={`w-4 h-4 transition-all ${liked ? 'fill-[#e8a0a8] text-[#e8a0a8]' : 'text-[#4d3439]/65'}`} />
          </button>

          {isHero && (
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="text-[9px] text-[#7d5a62] uppercase tracking-[0.18em] mb-2">{look.subtitle}</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2d1b1e] mb-3 leading-tight">{look.title}</h2>
              <p className="text-[13px] text-[#4d3439]/90 leading-relaxed mb-5 max-w-md">{look.description}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={e => { e.stopPropagation(); onShop(look.product) }}
                  className="btn-liquid px-6 py-3 rounded-2xl text-[13px] font-semibold text-white flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Shop This Look · {look.product.priceDisplay}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Text side (non-hero) */}
        {!isHero && (
          <div className="flex flex-col justify-center p-6 sm:p-10">
            <p className="text-[9px] text-[#7d5a62] uppercase tracking-[0.18em] mb-3">{look.subtitle}</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2d1b1e] mb-4 leading-tight">{look.title}</h2>
            <p className="text-[13px] text-[#4d3439]/90 leading-relaxed mb-6">{look.description}</p>

            {/* Product mini card */}
            <div className="glass rounded-2xl border border-white/8 p-4 mb-6 flex items-center gap-3">
              <img src={look.product.img} alt={look.product.name} className="w-14 h-14 rounded-xl object-cover object-top" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#2d1b1e] truncate">{look.product.name}</p>
                <p className="text-[11px] text-[#6f4e55]">{look.product.material}</p>
                <p className="text-[13px] font-bold text-[#e8a0a8] mt-0.5">{look.product.priceDisplay}</p>
              </div>
            </div>

            <button
              onClick={e => { e.stopPropagation(); onShop(look.product) }}
              className="btn-liquid w-full py-3.5 rounded-2xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Bag
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

export default function LookbookPage() {
  const navigate = useNavigate()
  const { setProductModal } = useUI()
  const config = loadLookbookConfig()

  const handleShop = (product) => {
    setProductModal(product)
  }

  // Build looks dynamically from admin-managed products + admin-editable text
  const liveProducts = getLiveProducts()
  const LOOKS = LAYOUT_TEMPLATES
    .slice(0, liveProducts.length)
    .map((template, i) => ({
      id: i + 1,
      ...template,
      title: config.looks[i]?.title || template.title || `Look ${i + 1}`,
      subtitle: config.looks[i]?.subtitle || '',
      description: config.looks[i]?.description || '',
      mood: config.looks[i]?.mood || 'Editorial',
      product: liveProducts[i],
    }))

  return (
    <div className="min-h-screen pt-16 relative" style={{ background: 'linear-gradient(135deg, #fff9fb 0%, #fef9f5 48%, #f7f3ff 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-[-100px] w-[260px] h-[260px] rounded-full blur-[90px] bg-[#f5c6d0]/45" />
        <div className="absolute bottom-20 left-[-80px] w-[220px] h-[220px] rounded-full blur-[90px] bg-[#d4c5f9]/40" />
      </div>
      {/* Header strip */}
      <div className="glass-liquid border-b border-[#b76e79]/12 px-5 py-4 relative z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl glass border border-[#b76e79]/18 flex items-center justify-center hover:bg-[#f5c6d0]/35 transition-all active:scale-90"
          >
            <ArrowLeft className="w-4 h-4 text-[#4d3439]" />
          </button>
          <div>
            <h1 className="font-serif text-xl font-bold text-[#2d1b1e]">{config.pageTitle}</h1>
            <p className="text-[10px] text-[#8b6269] tracking-widest uppercase">{config.pageSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 relative z-10">
        {/* Intro */}
        <div className="text-center py-6">
          <p className="text-[9px] text-[#b76e79]/60 uppercase tracking-[0.25em] mb-3">{config.heroSubtitle}</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2d1b1e] mb-3">
            {config.heroTitle}
          </h2>
          <p className="text-[14px] text-[#4d3439]/85 max-w-xl mx-auto leading-relaxed">
            {LOOKS.length > 0
              ? config.heroDescription
              : config.emptyDescription || 'Our editorial collection is being curated. Check back soon for stunning looks.'}
          </p>
        </div>

        {LOOKS.length === 0 ? (
          /* Empty state */
          <div className="text-center glass-dark rounded-[32px] border border-white/8 py-20 px-6">
            <Sparkles className="w-10 h-10 text-[#8b6269]/40 mx-auto mb-4" />
            <h3 className="font-serif text-2xl font-bold text-[#4d3439] mb-3">{config.emptyTitle}</h3>
            <p className="text-[13px] text-[#6f4e55] mb-6 max-w-sm mx-auto">
              {config.emptyDescription}
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-liquid inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-[13px] font-semibold text-white"
            >
              Browse Collection
            </button>
          </div>
        ) : (
          <>
            {/* Looks */}
            {LOOKS.map(look => (
              <LookCard key={look.id} look={look} onShop={handleShop} />
            ))}
          </>
        )}

        {/* CTA */}
        <div className="text-center glass-dark rounded-[32px] border border-white/8 py-12 px-6">
          <p className="text-[9px] text-[#8b6269]/85 tracking-[0.2em] uppercase mb-3">{config.ctaSubtitle}</p>
          <h3 className="font-serif text-2xl font-bold text-[#2d1b1e] mb-3">{config.ctaTitle}</h3>
          <p className="text-[13px] text-[#4d3439]/85 mb-6 max-w-sm mx-auto">{config.ctaDescription}</p>
          <a
            href={`https://wa.me/${config.ctaWhatsAppNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-liquid inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-[14px] font-semibold text-white"
          >
            {config.ctaButtonLabel}
          </a>
        </div>
      </div>
    </div>
  )
}
