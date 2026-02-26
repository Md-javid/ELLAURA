import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Heart } from 'lucide-react'
import { PRODUCTS } from '../lib/products'
import { useUI, useCart } from '../context/AppContext'

// Editorial looks — each pairing 1–2 products with a story
const LOOKS = [
  {
    id: 1,
    title: 'The Night Belongs to You',
    subtitle: 'ELLAURA AUTUMN / WINTER 2026',
    description: 'Step into rooms and silence them. A velvet silhouette designed for women who don\'t ask for attention — they command it.',
    mood: 'Dark Romantique',
    product: PRODUCTS[0],
    layout: 'hero',
    accentColor: 'from-[#b76e79] to-[#8b4f5a]',
    bgGradient: 'from-[#1a0e0f] via-[#2a1520] to-[#0d0d0f]',
  },
  {
    id: 2,
    title: 'Golden Hour, Your Rules',
    subtitle: 'THE FESTIVE EDIT',
    description: 'Silk so fine it catches every candle. Worn to the celebrations that matter — and the quiet ones only you know about.',
    mood: 'Luxe Festive',
    product: PRODUCTS[1],
    layout: 'side',
    accentColor: 'from-[#c9a227] to-[#8b7220]',
    bgGradient: 'from-[#15110a] via-[#1e1508] to-[#0d0d0f]',
  },
  {
    id: 3,
    title: 'Made for the City After Dark',
    subtitle: 'URBAN NIGHTS',
    description: 'Sequins that remember every beat. From Bandra cafés to rooftop parties — this is your going-out armour.',
    mood: 'Urban Glam',
    product: PRODUCTS[2],
    layout: 'split',
    accentColor: 'from-[#6366f1] to-[#4338ca]',
    bgGradient: 'from-[#080816] via-[#0d0d20] to-[#0d0d0f]',
  },
  {
    id: 4,
    title: 'Corporate Runway',
    subtitle: 'THE POWER DRESSING EDIT',
    description: 'Tailored to command. Soft enough to feel like a second skin, structured enough that every room knows exactly who walked in.',
    mood: 'Power Dressing',
    product: PRODUCTS[3],
    layout: 'side-reverse',
    accentColor: 'from-[#475569] to-[#1e293b]',
    bgGradient: 'from-[#0a0c0e] via-[#111318] to-[#0d0d0f]',
  },
  {
    id: 5,
    title: 'She\'s Not Wearing White',
    subtitle: 'THE BRIDAL EDIT',
    description: 'Because the real statement is the one that\'s entirely yours. Blush, ivory, gold — in a cut that starts conversations.',
    mood: 'New Bride',
    product: PRODUCTS[4],
    layout: 'hero',
    accentColor: 'from-[#e8a0a8] to-[#b76e79]',
    bgGradient: 'from-[#1a0e12] via-[#250d16] to-[#0d0d0f]',
  },
]

function LookCard({ look, onShop }) {
  const [liked, setLiked] = useState(false)
  const isHero = look.layout === 'hero'
  const isSplitRight = look.layout === 'side-reverse'

  return (
    <article
      className={`relative overflow-hidden ${isHero ? 'rounded-[32px]' : 'rounded-[28px]'} border border-white/5 group`}
      style={{ background: `linear-gradient(135deg, ${look.bgGradient.replace('from-','').replace(' via-',' ').replace(' to-','')})` }}
    >
      {/* Ambient glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${look.accentColor} transition-opacity duration-700`} style={{ opacity: 0.03 }} />

      <div className={`grid ${isHero ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} ${isSplitRight ? 'sm:[&>*:first-child]:order-2' : ''}`}>
        {/* Image */}
        <div className={`relative overflow-hidden ${isHero ? 'h-[520px] sm:h-[640px]' : 'h-[460px]'}`}>
          <img
            src={look.product.img}
            alt={look.title}
            className="w-full h-full object-cover object-top transition-transform duration-[1200ms] group-hover:scale-105"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Mood tag */}
          <div className="absolute top-5 left-5">
            <span className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.12em] text-white bg-gradient-to-r ${look.accentColor} shadow-lg`}>
              {look.mood}
            </span>
          </div>

          {/* Like */}
          <button
            onClick={() => setLiked(l => !l)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full glass border border-white/20 flex items-center justify-center transition-all active:scale-90"
          >
            <Heart className={`w-4 h-4 transition-all ${liked ? 'fill-[#e8a0a8] text-[#e8a0a8]' : 'text-white/60'}`} />
          </button>

          {isHero && (
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="text-[9px] text-white/30 uppercase tracking-[0.18em] mb-2">{look.subtitle}</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white/95 mb-3 leading-tight">{look.title}</h2>
              <p className="text-[13px] text-white/55 leading-relaxed mb-5 max-w-md">{look.description}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onShop(look.product)}
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
            <p className="text-[9px] text-white/25 uppercase tracking-[0.18em] mb-3">{look.subtitle}</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white/90 mb-4 leading-tight">{look.title}</h2>
            <p className="text-[13px] text-white/50 leading-relaxed mb-6">{look.description}</p>

            {/* Product mini card */}
            <div className="glass rounded-2xl border border-white/8 p-4 mb-6 flex items-center gap-3">
              <img src={look.product.img} alt={look.product.name} className="w-14 h-14 rounded-xl object-cover object-top" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white/80 truncate">{look.product.name}</p>
                <p className="text-[11px] text-white/35">{look.product.material}</p>
                <p className="text-[13px] font-bold text-[#e8a0a8] mt-0.5">{look.product.priceDisplay}</p>
              </div>
            </div>

            <button
              onClick={() => onShop(look.product)}
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

  const handleShop = (product) => {
    setProductModal(product)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0d0d0f' }}>
      {/* Header strip */}
      <div className="sticky top-0 z-30 glass-dark border-b border-white/5 px-5 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
          >
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </button>
          <div>
            <h1 className="font-serif text-xl font-bold text-white/90">Lookbook</h1>
            <p className="text-[10px] text-white/30 tracking-widest uppercase">Autumn / Winter 2026 Editorial</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Intro */}
        <div className="text-center py-6">
          <p className="text-[9px] text-[#b76e79]/60 uppercase tracking-[0.25em] mb-3">Ellaura × AW26</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white/90 mb-3">
            Dressed for the Life You're Already Living
          </h2>
          <p className="text-[14px] text-white/40 max-w-xl mx-auto leading-relaxed">
            Five wearable stories crafted in Mumbai, tailored to you within 48 hours.
            Each piece custom stitched, every silhouette a statement.
          </p>
        </div>

        {/* Looks */}
        {LOOKS.map(look => (
          <LookCard key={look.id} look={look} onShop={handleShop} />
        ))}

        {/* CTA */}
        <div className="text-center glass-dark rounded-[32px] border border-white/8 py-12 px-6">
          <p className="text-[9px] text-white/25 tracking-[0.2em] uppercase mb-3">Your Story, Your Silhouette</p>
          <h3 className="font-serif text-2xl font-bold text-white/85 mb-3">Want Something Unique?</h3>
          <p className="text-[13px] text-white/40 mb-6 max-w-sm mx-auto">Every Ellaura piece is made-to-measure. Share your vision and we'll bring it to life.</p>
          <a
            href="https://wa.me/919082527247"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-liquid inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-[14px] font-semibold text-white"
          >
            WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  )
}
