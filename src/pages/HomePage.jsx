import { useState, useEffect } from 'react'
import Hero from '../components/Hero'
import ProductGallery from '../components/ProductGallery'
import { Instagram, Mail, Sparkles, Heart, X, Zap, Scissors, Gem, RotateCcw, Ruler, MoonStar } from 'lucide-react'
import { getNewArrivals } from '../lib/products'

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const WA_LINK = 'https://wa.me/919087915193?text=Hi%20Ellaura!%20I%E2%80%99d%20love%20to%20enquire%20about%20your%20collection%20%F0%9F%92%96'

// ── New Arrivals Popup ─────────────────────────────────────────
function NewArrivalsPopup() {
  const [newProducts, setNewProducts] = useState([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Check for new arrivals
    const arrivals = getNewArrivals()
    const dismissed = JSON.parse(localStorage.getItem('ellaura_dismissed_arrivals') || '[]')
    const unseen = arrivals.filter(p => !dismissed.includes(p.id))
    if (unseen.length > 0) {
      setTimeout(() => {
        setNewProducts(unseen.slice(0, 3))
        setVisible(true)
      }, 2000)
    }

    // Listen for admin-added products
    const handler = (e) => {
      const product = e.detail
      if (product) {
        setNewProducts(prev => [product, ...prev].slice(0, 3))
        setVisible(true)
      }
    }
    window.addEventListener('ellaura_new_product', handler)
    return () => window.removeEventListener('ellaura_new_product', handler)
  }, [])

  const dismiss = () => {
    const ids = newProducts.map(p => p.id)
    const prev = JSON.parse(localStorage.getItem('ellaura_dismissed_arrivals') || '[]')
    localStorage.setItem('ellaura_dismissed_arrivals', JSON.stringify([...prev, ...ids]))
    setVisible(false)
  }

  if (!visible || newProducts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[55] max-w-xs w-full animate-slideUp">
      <div className="glass-liquid rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/10 bg-gradient-to-r from-purple-600/20 to-[#b76e79]/10">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#e8a0a8]" />
            <span className="text-[12px] font-semibold text-white/90">New Arrivals</span>
          </div>
          <button onClick={dismiss} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all">
            <X className="w-3 h-3 text-white/40" />
          </button>
        </div>
        {/* Products */}
        <div className="p-3 space-y-2">
          {newProducts.map(p => (
            <div key={p.id} className="flex items-center gap-3 glass rounded-xl border border-white/8 p-2.5 hover:border-[#b76e79]/30 transition-all cursor-pointer"
              onClick={() => {
                dismiss()
                document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <img src={p.img} alt={p.imgAlt || p.name} className="w-10 h-12 rounded-lg object-cover object-top flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white/80 truncate">{p.name}</p>
                <p className="text-[11px] text-[#e8a0a8] font-medium">{p.priceDisplay || `₹${p.price?.toLocaleString('en-IN')}`}</p>
              </div>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#b76e79]/20 text-[#e8a0a8] border border-[#b76e79]/30 font-bold flex-shrink-0">
                NEW
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            dismiss()
            document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="w-full text-center py-2.5 text-[11px] text-[#b76e79] font-medium border-t border-white/5 hover:bg-white/5 transition-all"
        >
          View Collection →
        </button>
      </div>
    </div>
  )
}

function AboutSection() {
  return (
    <section id="about" className="relative py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Divider */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-purple-500/25" />
          <Sparkles className="w-4 h-4 text-purple-400/50" />
          <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-purple-500/25" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: Statement */}
          <div>
            <p className="text-[10px] tracking-[0.35em] text-purple-400/60 uppercase mb-5">Our Philosophy</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white/90 mb-6 leading-snug">
              Every woman deserves to feel like the night was made for her.
            </h2>
            <p className="text-[15px] text-white/45 leading-relaxed mb-6">
              Ellaura crafts custom pieces that fit your body, your mood, and your night — not the other way around. Each silhouette is hand-stitched by artisans in Coimbatore, delivered in 48 hours.
            </p>

            {/* Custom Fit Process */}
            <div className="glass-premium rounded-2xl border border-purple-500/15 p-5 mb-6">
              <h4 className="text-[13px] font-semibold text-white/80 mb-3 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-purple-400" />
                Custom Fit Process
              </h4>
              <div className="space-y-2.5">
                {[
                  { step: '01', label: 'Share your measurements via WhatsApp' },
                  { step: '02', label: 'Choose your fabric, color & silhouette preferences' },
                  { step: '03', label: 'Our artisans hand-stitch your piece in Coimbatore' },
                  { step: '04', label: 'Delivered to your doorstep within 48 hours' },
                ].map(({ step, label }) => (
                  <div key={step} className="flex items-start gap-3">
                    <span className="text-[11px] font-bold text-purple-400/80 bg-purple-500/10 rounded-lg px-2 py-1 flex-shrink-0">{step}</span>
                    <p className="text-[12px] text-white/50 leading-relaxed pt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <a
              href="https://wa.me/919087915193?text=Hi%20Ellaura!%20I%E2%80%99d%20love%20to%20book%20a%20free%20fitting%20consultation"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-liquid rounded-2xl px-7 py-3.5 text-sm font-medium text-white tracking-wide active:scale-95 transition-all inline-block text-center"
            >
              Book a Free Fitting Consultation
            </a>
          </div>

          {/* Right: feature cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { Icon: Scissors, title: 'Custom Fit', sub: 'Your measurements, your silhouette', color: 'text-[#b76e79]' },
              { Icon: Zap, title: '48h Ready', sub: 'Express hand-stitching', color: 'text-purple-400' },
              { Icon: Gem, title: 'Premium', sub: 'Finest fabrics only', color: 'text-purple-300' },
              { Icon: RotateCcw, title: '7-Day Returns', sub: 'Hassle-free policy', color: 'text-[#b76e79]' },
              { Icon: Ruler, title: 'Zero Alterations', sub: 'Perfect fit, guaranteed', color: 'text-purple-400' },
              { Icon: MoonStar, title: 'Night-Tested', sub: 'Designed for the evening', color: 'text-purple-300' },
            ].map(({ Icon, title, sub, color }) => (
              <div key={title} className="glass-premium rounded-2xl border border-purple-500/15 p-4 text-center hover:border-purple-400/30 transition-all duration-300 group">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${color} group-hover:scale-110 transition-transform`} />
                <p className="text-[12px] font-semibold text-white/80">{title}</p>
                <p className="text-[10px] text-white/30 mt-1 leading-snug">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="relative py-12 border-t border-purple-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-white/5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h2 className="font-serif text-3xl font-bold text-rose-gold tracking-widest mb-2">ELLAURA</h2>
            <p className="text-[9px] tracking-[0.4em] text-white/20 uppercase mb-4">Couture Nights</p>
            <p className="text-[13px] text-white/35 leading-relaxed max-w-xs">
              Premium custom-stitched clothing for the modern city woman. Hand-crafted in Coimbatore.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-2xl glass border border-white/10 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-95" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-2xl glass border border-white/10 flex items-center justify-center hover:bg-[#25D366]/15 hover:border-[#25D366]/30 text-white/50 hover:text-[#25D366] transition-all active:scale-95" aria-label="WhatsApp">
                <WhatsAppIcon />
              </a>
              <a href="mailto:hello@ellaura.in"
                className="w-10 h-10 rounded-2xl glass border border-white/10 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-95" aria-label="Email">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase mb-4">Shop</p>
            {[
              { label: 'New Arrivals', action: () => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' }) },
              { label: 'Cocktail', action: () => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' }) },
              { label: 'Club Night', action: () => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' }) },
              { label: 'Custom Fit', action: () => window.open(WA_LINK, '_blank') },
              { label: 'Lookbook', action: () => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' }) },
            ].map(({ label, action }) => (
              <button key={label} onClick={action} className="block text-[13px] text-white/40 hover:text-white/80 mb-2 transition-colors text-left">{label}</button>
            ))}
          </div>

          <div>
            <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase mb-4">Help</p>
            {[
              { label: 'Size Guide', action: () => window.open(WA_LINK, '_blank') },
              { label: 'Shipping & Returns', action: () => window.open(WA_LINK, '_blank') },
              { label: 'Custom Fit Process', action: () => window.open(WA_LINK, '_blank') },
              { label: 'Contact Us', action: () => window.open(WA_LINK, '_blank') },
              { label: 'FAQ', action: () => window.open(WA_LINK, '_blank') },
            ].map(({ label, action }) => (
              <button key={label} onClick={action} className="block text-[13px] text-white/40 hover:text-white/80 mb-2 transition-colors text-left">{label}</button>
            ))}
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-white/20 tracking-wide">
            © 2026 Ellaura. All rights reserved.
          </p>
          <p className="text-[11px] text-white/20 flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 text-[#b76e79] fill-[#b76e79]" /> in Coimbatore
          </p>
          <p className="text-[11px] text-white/15">
            Privacy · Terms · Cookies
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ProductGallery />
      <AboutSection />
      <Footer />
      <NewArrivalsPopup />
    </main>
  )
}
