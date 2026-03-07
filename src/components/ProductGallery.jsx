import { useState, useEffect } from 'react'
import { Heart, Star, Zap, Moon, ShoppingBag, Eye, X, Shirt } from 'lucide-react'
import { useCart, useUI } from '../context/AppContext'
import { getLiveProducts, COLOR_SWATCHES } from '../lib/products'
import { getProducts } from '../lib/supabase'

// ── Vibe Toggle ────────────────────────────────────────────────
function VibeToggle({ vibe, onToggle }) {
  return (
    <div className="glass rounded-2xl p-1.5 flex items-center gap-1 w-fit">
      {[
        { key: 'cocktail', icon: Zap, label: 'Cocktail Hour', active: 'from-[#b76e79] to-[#8b4f5a] shadow-[#b76e79]/30' },
        { key: 'club', icon: Moon, label: 'Club Night', active: 'from-[#6366f1] to-[#4f46e5] shadow-[#6366f1]/30' },
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
  const [added, setAdded] = useState(false)
  const [showSizePicker, setShowSizePicker] = useState(false)
  const { addToCart } = useCart()
  const { setProductModal } = useUI()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 90)
    return () => clearTimeout(t)
  }, [index])

  const handleAddToCart = () => {
    setShowSizePicker(true)
  }

  const handleSizeSelected = (size) => {
    addToCart(product, size)
    setShowSizePicker(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleCardClick = (e) => {
    // Don't open modal if clicking buttons
    if (e.target.closest('button')) return
    setProductModal(product)
  }

  return (
    <>
      <div
        className={`group glass-premium rounded-3xl border border-purple-500/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.35)] overflow-hidden transition-all duration-500 cursor-pointer ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          } hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(139,92,246,0.15)] hover:border-purple-500/25`}
        onClick={handleCardClick}
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

          {/* Stock warning */}
          {product.stock <= 5 && (
            <div className="absolute bottom-12 left-3">
              <span className="text-[9px] text-amber-400/90 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
                Only {product.stock} left
              </span>
            </div>
          )}
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

          {/* Description (hidden on xs, shown on md+) */}
          <p className="hidden md:block text-[11px] text-white/35 leading-snug mb-2 line-clamp-2">{product.description}</p>

          {/* Material tag */}
          {product.material && (
            <div className="flex items-center gap-1.5 mb-3">
              <Shirt className="w-3 h-3 text-[#b76e79]/50" />
              <span className="text-[10px] text-white/30 truncate">{product.material?.split('•')[0]?.trim()}</span>
            </div>
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
            onClick={(e) => { e.stopPropagation(); handleAddToCart() }}
            className={`w-full py-3 rounded-xl text-[13px] font-medium tracking-wide flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] ${added
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'btn-liquid text-white'
              }`}
          >
            {added ? (
              <><span>✓</span> Added to Bag</>
            ) : (
              <><ShoppingBag className="w-4 h-4" /> Add to Bag</>
            )}
          </button>
        </div>
      </div>

      {/* Size Picker Modal */}
      {showSizePicker && (
        <SizePickerModal
          product={product}
          onSelect={handleSizeSelected}
          onClose={() => setShowSizePicker(false)}
        />
      )}
    </>
  )
}

// ── Gallery ────────────────────────────────────────────────────
export default function ProductGallery() {
  const [vibe, setVibe] = useState('all')
  const [transitioning, setTransitioning] = useState(false)
  const [allProducts, setAllProducts] = useState([])
  const [displayed, setDisplayed] = useState([])

  // Fetch from Supabase on mount; fall back to local/static products
  useEffect(() => {
    getProducts().then(dbProducts => {
      const products = (dbProducts && dbProducts.length > 0)
        ? dbProducts
        : getLiveProducts()
      setAllProducts(products)
      setDisplayed(products)
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
          <p className="text-[13px] text-white/40 font-light">5 exclusive pieces. Custom stitched. Yours in 48 hours.</p>
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

      {/* Empty state */}
      {displayed.length === 0 && (
        <div className="text-center py-20">
          <div className="glass-premium rounded-3xl border border-purple-500/15 p-10 max-w-md mx-auto">
            <ShoppingBag className="w-10 h-10 text-purple-400/40 mx-auto mb-4" />
            <p className="font-serif text-xl text-white/50 mb-2">No products yet</p>
            <p className="text-[13px] text-white/30 leading-relaxed">Products will appear here once added through the admin panel.</p>
          </div>
        </div>
      )}
    </section>
  )
}
