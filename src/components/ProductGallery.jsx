import { useState, useEffect } from 'react'
import { Heart, Star, Zap, Moon, ShoppingBag, Eye, X, Shirt, ExternalLink, Scissors, Gem, Truck } from 'lucide-react'
import { useCart, useUI } from '../context/AppContext'
import { getLiveProducts, COLOR_SWATCHES } from '../lib/products'
import { getProducts } from '../lib/supabase'

// ── Vibe Toggle ────────────────────────────────────────────────
function VibeToggle({ vibe, onToggle }) {
  return (
    <div className="glass rounded-2xl p-1.5 flex items-center gap-1 w-fit">
      {[
        { key: 'cocktail', icon: Zap, label: 'Cocktail Hour', active: 'from-[#b76e79] to-[#8b4f5a] shadow-[#b76e79]/30' },
        { key: 'club', icon: Moon, label: 'Club & Party', active: 'from-[#6366f1] to-[#4f46e5] shadow-[#6366f1]/30' },
        { key: 'all', icon: null, label: 'All Pieces', active: 'from-white/15 to-white/5 shadow-white/10' },
      ].map(({ key, icon: Icon, label, active }) => (
        <button
          key={key}
          onClick={() => onToggle(key)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-medium tracking-wide transition-all duration-500 ${vibe === key
              ? `bg-gradient-to-r ${active} text-white shadow-lg`
              : 'text-white/50 hover:text-white/70'
            }`}
        >
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Size Picker Modal (centered popup before add-to-bag) ──────
function SizePickerModal({ product, onSelect, onClose }) {
  const [selected, setSelected] = useState(product.sizes?.[2] || product.sizes?.[0] || 'M')

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-dark rounded-[28px] border border-white/10 p-6 max-w-sm w-full shadow-2xl animate-toastPop"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-all"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>

        {/* Product info */}
        <div className="flex items-center gap-3 mb-5">
          <img src={product.img} alt={product.imgAlt} className="w-14 h-18 rounded-xl object-cover object-top" />
          <div>
            <h3 className="font-serif text-base font-semibold text-white/90">{product.name}</h3>
            <p className="text-[#e8a0a8] font-semibold text-sm">{product.priceDisplay}</p>
          </div>
        </div>

        {/* Material */}
        {product.material && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 glass rounded-xl border border-white/8">
            <Shirt className="w-3.5 h-3.5 text-[#b76e79]/70 flex-shrink-0" />
            <p className="text-[11px] text-white/50">{product.material}</p>
          </div>
        )}

        {/* Size selection */}
        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Select Your Size</p>
        <div className="flex gap-2 flex-wrap mb-5">
          {(product.sizes || ['S', 'M', 'L']).map(s => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={`min-w-[44px] h-11 rounded-xl text-[13px] font-semibold transition-all duration-200 ${selected === s
                  ? 'bg-gradient-to-br from-[#b76e79] to-[#8b4f5a] text-white shadow-lg shadow-[#b76e79]/30'
                  : 'glass text-white/60 hover:text-white border border-white/10 hover:border-[#b76e79]/30'
                }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Color swatches */}
        {product.colors?.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Available Colors</p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map(c => (
                <div key={c} className="flex items-center gap-2 glass rounded-xl border border-white/10 px-3 py-1.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/20"
                    style={{ backgroundColor: COLOR_SWATCHES[c] || '#666' }}
                  />
                  <span className="text-[11px] text-white/60">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add to bag */}
        <button
          onClick={() => onSelect(selected)}
          className="w-full btn-liquid rounded-2xl py-3.5 text-[14px] font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          Add to Bag — {selected}
        </button>
      </div>
    </div>
  )
}

// ── Product Card ───────────────────────────────────────────────
function ProductCard({ product, index }) {
  const [liked, setLiked] = useState(false)
  const [visible, setVisible] = useState(false)
  const { setProductModal } = useUI()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 90)
    return () => clearTimeout(t)
  }, [index])

  const handleCardClick = () => {
    setProductModal(product)
  }

  return (
    <>
      <div
        className={`group glass-premium rounded-3xl border border-purple-500/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.35)] overflow-hidden transition-all duration-500 cursor-pointer ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          } hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(139,92,246,0.15)] hover:border-purple-500/25`}
        onClick={handleCardClick}
        role="button"
      >
        {/* ── Image ── */}
        <div
          className="relative overflow-hidden"
          style={{ height: '240px' }}
          title="Tap to preview"
        >
          <img
            src={product.img}
            alt={product.imgAlt}
            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.07]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

          {/* Tag */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-semibold tracking-wider text-white bg-gradient-to-r ${product.tagColor} shadow-lg`}>
              {product.tag}
            </span>
          </div>

          {/* Badge – stacked below tag on the left */}
          {product.badge && (
            <div className="absolute top-9 left-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold text-white glass border border-white/20">
                {product.badge}
              </span>
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={(e) => { e.stopPropagation(); setLiked(!liked) }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full glass flex items-center justify-center transition-all duration-300 active:scale-90"
          >
            <Heart className={`w-3.5 h-3.5 transition-all duration-300 ${liked ? 'fill-[#e8a0a8] text-[#e8a0a8] scale-110' : 'text-white/60'}`} />
          </button>


        </div>

        {/* ── Content ── */}
        <div className="p-4">
          {/* Name & Rating */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-sm font-semibold text-white/90 truncate leading-tight">{product.name}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 fill-[#e8a0a8] text-[#e8a0a8]" />
                <span className="text-[10px] text-white/40">{product.rating} ({product.reviews})</span>
              </div>
            </div>
            <p className="text-[#e8a0a8] font-semibold text-sm whitespace-nowrap">{product.priceDisplay}</p>
          </div>

          {/* Category & Vibe */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {product.category && (
              <span className="text-[9px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-full glass border border-white/10 text-white/40">
                {product.category}
              </span>
            )}
            {product.vibe?.map(v => (
              <span key={v} className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-[#b76e79]/15 border border-[#b76e79]/20 text-[#e8a0a8]/60">
                {v === 'cocktail' ? '🍸' : v === 'club' ? '🌙' : '✦'} {v}
              </span>
            ))}
          </div>

          {/* Description (hidden on xs, shown on md+) */}
          <p className="hidden md:block text-[11px] text-white/35 leading-snug mb-2 line-clamp-2">{product.description}</p>

          {/* Material tag */}
          {product.material && (
            <div className="flex items-center gap-1.5 mb-3">
              <Shirt className="w-3 h-3 text-[#b76e79]/50" />
              <span className="text-[10px] text-white/30 truncate">{product.material?.split('•')[0]?.trim()}</span>
            </div>
          )}

          {/* Instagram link */}
          {product.instagramUrl && (
            <a
              href={product.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 mb-3 text-[10px] text-[#e1306c]/60 hover:text-[#e1306c] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              View on Instagram
            </a>
          )}

          {/* Color swatches */}
          {product.colors?.length > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              {product.colors.map(c => (
                <div
                  key={c}
                  title={c}
                  className="w-5 h-5 rounded-full border-2 border-white/15 transition-transform hover:scale-125 cursor-pointer"
                  style={{ backgroundColor: COLOR_SWATCHES[c] || '#666' }}
                />
              ))}
              <span className="text-[9px] text-white/25 ml-1">{product.colors.length} {product.colors.length === 1 ? 'color' : 'colors'}</span>
            </div>
          )}

          {/* Actions */}
          <button
            onClick={(e) => { e.stopPropagation(); handleCardClick() }}
            className="w-full py-3 rounded-xl text-[13px] font-medium tracking-wide flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] btn-liquid text-white"
          >
            <Eye className="w-4 h-4" /> View Product
          </button>
        </div>
      </div>

    </>
  )
}

// ── Gallery ────────────────────────────────────────────────────
export default function ProductGallery() {
  const [vibe, setVibe] = useState('all')
  const [transitioning, setTransitioning] = useState(false)
  const [allProducts, setAllProducts] = useState([])
  const [displayed, setDisplayed] = useState([])

  // Fetch from Supabase on mount; fall back to localStorage/static when offline or DB is empty
  useEffect(() => {
    getProducts().then(dbProducts => {
      // null = offline/error → fall back to localStorage/static
      // [] or [...] = Supabase responded → use it as source of truth (even if empty)
      if (dbProducts === null) {
        const products = getLiveProducts()
        setAllProducts(products)
        setDisplayed(products)
      } else {
        const products = dbProducts.filter(p => p.active !== false)
        setAllProducts(products)
        setDisplayed(products)
      }
    }).catch(() => {
      const products = getLiveProducts()
      setAllProducts(products)
      setDisplayed(products)
    })
  }, [])

  const filterByVibe = (products, v) =>
    v === 'all' ? products : products.filter(p => p.vibe?.includes(v))

  const handleVibeToggle = (newVibe) => {
    if (newVibe === vibe) return
    setTransitioning(true)
    setTimeout(() => {
      setVibe(newVibe)
      setDisplayed(filterByVibe(allProducts, newVibe))
      setTransitioning(false)
    }, 250)
  }

  return (
    <section id="gallery" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Section Header */}
      <div className="mb-10 lg:flex lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-[1px] bg-gradient-to-r from-purple-500 to-transparent" />
            <span className="text-[10px] tracking-[0.35em] text-purple-400/70 uppercase">The Launch Collection</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white/90 leading-tight mb-2">
            Dress For The
            <span className="text-rose-gold"> Moment.</span>
          </h2>
          <p className="text-[13px] text-white/40 font-light">Handcrafted for you. Made to order. Coming soon.</p>
        </div>
        <div className="mt-6 lg:mt-0 overflow-x-auto pb-1">
          <VibeToggle vibe={vibe} onToggle={handleVibeToggle} />
        </div>
      </div>

      {/* Grid */}
      <div
        key={vibe}
        className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'
          }`}
      >
        {displayed.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      {/* Coming Soon state */}
      {displayed.length === 0 && (
        <div className="text-center py-12">
          {/* Main card */}
          <div className="glass-premium rounded-3xl border border-purple-500/15 p-10 max-w-2xl mx-auto relative overflow-hidden">
            {/* Soft glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-[#b76e79]/5 pointer-events-none" />
            
            {/* Badge */}
            <div className="inline-block glass rounded-full px-4 py-1.5 mb-6 border border-purple-500/20">
              <span className="text-[11px] tracking-[0.3em] uppercase text-purple-300/70 font-medium">
                ✦ &nbsp;Collection Coming Soon&nbsp; ✦
              </span>
            </div>

            {/* Headline */}
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white/85 mb-3 leading-snug">
              Something Beautiful<br />
              <span className="text-gradient-hero italic">Is Being Made For You.</span>
            </h3>
            <p className="text-[14px] text-white/40 max-w-sm mx-auto leading-relaxed mb-8">
              Our artisans are hand-stitching the launch collection in Coimbatore. Every piece will be ready for you very soon.
            </p>

            {/* Tease cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { Icon: Scissors, color: 'text-[#e8a0a8]', bg: 'bg-[#b76e79]/12 border-[#b76e79]/25', title: 'Custom Stitched',  desc: 'Made to your measurements' },
                { Icon: Truck,    color: 'text-[#a78bfa]', bg: 'bg-[#6366f1]/12 border-[#6366f1]/25', title: 'Express Delivery',  desc: 'From artisan to your door' },
                { Icon: Gem,      color: 'text-[#e8a0a8]', bg: 'bg-[#b76e79]/12 border-[#b76e79]/25', title: 'Artisan Crafted',   desc: 'Hand-stitched in Coimbatore' },
              ].map(({ Icon, color, bg, title, desc }) => (
                <div key={title} className="glass-liquid rounded-2xl border border-purple-500/10 p-4 text-center">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 border ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <p className="text-[12px] font-semibold text-white/75 mb-0.5">{title}</p>
                  <p className="text-[11px] text-white/30">{desc}</p>
                </div>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/919087915193?text=Hi%20Ellaura!%20I%27d%20love%20to%20know%20when%20your%20collection%20launches%20%F0%9F%92%96"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-liquid inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-[13px] font-semibold text-white tracking-wide active:scale-95 transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Notify Me on WhatsApp
            </a>
          </div>
        </div>
      )}
    </section>
  )
}
