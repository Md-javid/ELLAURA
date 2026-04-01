import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingBag, Search, User, X, Menu, LogOut, ChevronDown, Package, Settings, MapPin, Heart, Trash2, Sun, Moon } from 'lucide-react'
import { useCart, useUI, useAuth } from '../context/AppContext'
import { signOut } from '../lib/supabase'

const NAV_LINKS = [
  { label: 'Collection', href: '#gallery' },
  { label: 'Lookbook', href: '/lookbook' },
  { label: 'Custom Fit', href: '#custom-fit' },
  { label: 'About', href: '#about' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [activeNav, setActiveNav] = useState(null)
  const { cartCount, setCartOpen, addToCart } = useCart()
  const { setSearchOpen, wishlist, toggleWishlist, setProductModal, wishlistOpen, setWishlistOpen, theme, toggleTheme } = useUI()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  const handleNavClick = (href) => {
    setMenuOpen(false)
    if (href.startsWith('#')) {
      if (location.pathname !== '/') {
        navigate('/')
        // Wait for navigation then scroll
        setTimeout(() => {
          const el = document.getElementById(href.slice(1))
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 300)
      } else {
        const el = document.getElementById(href.slice(1))
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      navigate(href)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setUserMenuOpen(false)
    navigate('/')
  }

  const isDark = theme === 'dark'

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'backdrop-blur-2xl bg-white/90 border-b border-[#b76e79]/20 shadow-[0_8px_30px_rgba(183,110,121,0.14)]'
            : 'backdrop-blur-xl bg-white/70 border-b border-[#b76e79]/12'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-[40px_1fr_auto] lg:flex lg:justify-between items-center gap-2 lg:gap-4">
          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden w-10 h-10 rounded-2xl glass flex items-center justify-center transition-all duration-300 hover:bg-white/10 active:scale-95 flex-shrink-0"
            aria-label="Toggle menu"
          >
            <span className="relative w-5 h-4 flex flex-col justify-between">
              <span className={`block h-[1.5px] bg-[#4d3439]/80 rounded-full transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[7.5px]' : ''}`} />
              <span className={`block h-[1.5px] bg-[#4d3439]/80 rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block h-[1.5px] bg-[#4d3439]/80 rounded-full transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7.5px]' : ''}`} />
            </span>
          </button>

          {/* ── Brand ── */}
          <Link to="/" className="flex flex-col items-center justify-self-center lg:justify-self-auto flex-shrink-0 mt-2 lg:mt-0">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-widest text-[#a15c68] brand-title-glow leading-none">
              ELLAURA
            </span>
            <span className="text-[7px] tracking-[0.4em] text-[#8b6269] font-light uppercase mt-0.5">
              Couture
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <nav className="hidden lg:flex items-center gap-1.5 flex-1 justify-center">
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                onClick={() => { setActiveNav(link.label); handleNavClick(link.href) }}
                className={`relative px-5 py-2 rounded-xl text-[13px] font-medium tracking-wide transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  activeNav === link.label
                    ? 'text-[#7d3a45] border border-[#b76e79]/50 shadow-[0_0_18px_rgba(183,110,121,0.15),inset_0_1px_0_rgba(255,255,255,0.6)]'
                    : 'text-[#4d3439]/55 border border-transparent hover:text-[#2d1b1e] hover:border-[#b76e79]/25 hover:shadow-[0_0_12px_rgba(183,110,121,0.08)]'
                }`}
                style={activeNav === link.label ? {
                  background: 'rgba(255,240,245,0.45)',
                  backdropFilter: 'blur(16px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(140%)',
                } : {}}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* ── Right actions ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* ── Theme Toggle — Sun/Moon with smooth morph ──
                HIDDEN for production (light-mode only). To re-enable, remove 'hidden' class below.
            */}
            <button
              onClick={toggleTheme}
              className="hidden theme-toggle-btn w-10 h-10 rounded-2xl glass flex items-center justify-center transition-all duration-500 hover:shadow-[0_0_20px_rgba(183,110,121,0.30)] active:scale-90 relative overflow-hidden group"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {/* Sun icon */}
              <Sun
                className="w-4 h-4 absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  opacity: isDark ? 0 : 1,
                  transform: isDark ? 'rotate(-90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
                  color: '#e8a0a8',
                }}
              />
              {/* Moon icon */}
              <Moon
                className="w-4 h-4 absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  opacity: isDark ? 1 : 0,
                  transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
                  color: '#e8a0a8',
                }}
              />
              {/* Hover glow ring */}
              <span
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: isDark
                    ? 'radial-gradient(circle, rgba(232,160,168,0.15) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(183,110,121,0.12) 0%, transparent 70%)',
                }}
              />
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 rounded-2xl glass flex items-center justify-center transition-all duration-300 hover:bg-white/10 active:scale-95"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-[#4d3439]/70" />
            </button>

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-10 h-10 rounded-2xl glass flex items-center justify-center transition-all duration-300 hover:bg-white/10 active:scale-95"
                  aria-label="Account"
                >
                  <User className="w-4 h-4 text-[#4d3439]/70" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-56 rounded-2xl border border-[#b76e79]/15 shadow-2xl py-2 animate-slideDown" style={{background:'rgba(255,250,252,0.96)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)'}}>
                    <div className="px-4 py-2 border-b border-[#b76e79]/10 mb-1">
                      <p className="text-[11px] text-[#2d1b1e]/45 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate('/orders') }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#2d1b1e]/60 hover:text-[#2d1b1e] hover:bg-[#b76e79]/6 transition-all duration-200"
                    >
                      <Package className="w-3.5 h-3.5" />
                      My Orders
                    </button>
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate('/orders?tab=account') }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#2d1b1e]/60 hover:text-[#2d1b1e] hover:bg-[#b76e79]/6 transition-all duration-200"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Account
                    </button>
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate('/orders?tab=addresses') }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#2d1b1e]/60 hover:text-[#2d1b1e] hover:bg-[#b76e79]/6 transition-all duration-200"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Manage Addresses
                    </button>
                    <div className="border-t border-[#b76e79]/8 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-red-500/60 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl glass border border-[#b76e79]/18 text-[12px] font-medium text-[#4d3439]/70 hover:text-[#2d1b1e] hover:bg-[#b76e79]/8 transition-all duration-300"
              >
                <User className="w-3.5 h-3.5" />
                Login
              </Link>
            )}

            {/* Wishlist */}
            <button
              onClick={() => setWishlistOpen(true)}
              className="w-10 h-10 rounded-2xl glass flex items-center justify-center transition-all duration-300 hover:bg-white/10 active:scale-95 relative"
              aria-label="Wishlist"
            >
              <Heart className={`w-4 h-4 transition-all ${wishlist.length > 0 ? 'fill-[#e8a0a8] text-[#e8a0a8]' : 'text-[#4d3439]/70'}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-[#e8a0a8] to-[#b76e79] text-[9px] font-bold text-white flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="w-10 h-10 rounded-2xl glass flex items-center justify-center transition-all duration-300 hover:bg-white/10 active:scale-95 relative"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="w-4 h-4 text-[#4d3439]/70" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-[#e8a0a8] to-[#b76e79] text-[9px] font-bold text-white flex items-center justify-center animate-pulse-rose">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
        <div className={`absolute top-0 left-0 h-full w-72 glass-dark border-r border-white/10 flex flex-col pt-20 pb-12 px-6 transition-transform duration-500 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#b76e79]/10 to-transparent pointer-events-none" />
          <p className="text-[10px] tracking-[0.3em] text-[#b76e79]/50 uppercase mb-4">Navigation</p>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                onClick={() => { setActiveNav(link.label); handleNavClick(link.href) }}
                className={`text-left py-3 px-3 rounded-2xl font-medium text-[15px] tracking-wide transition-all duration-300 ${
                  activeNav === link.label
                    ? 'text-white bg-purple-500/15 border border-purple-500/20'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-1">
            {user ? (
              <>
                <div className="px-3 py-2 mb-2 border-b border-white/5">
                  <p className="text-[10px] text-white/25 truncate">{user.email}</p>
                </div>
                <button onClick={() => { setMenuOpen(false); navigate('/orders') }} className="w-full flex items-center gap-2 py-3 px-3 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300">
                  <Package className="w-4 h-4" />
                  My Orders
                </button>
                <button onClick={() => { setMenuOpen(false); navigate('/orders?tab=account') }} className="w-full flex items-center gap-2 py-3 px-3 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300">
                  <Settings className="w-4 h-4" />
                  Account
                </button>
                <button onClick={() => { setMenuOpen(false); navigate('/orders?tab=addresses') }} className="w-full flex items-center gap-2 py-3 px-3 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300">
                  <MapPin className="w-4 h-4" />
                  Manage Addresses
                </button>
                <button onClick={handleSignOut} className="w-full flex items-center gap-2 py-3 px-3 rounded-2xl text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-all duration-300">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="w-full btn-liquid rounded-2xl py-3 text-center text-sm font-medium text-white block">
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Close user menu on outside click */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
      )}

      {/* ── Wishlist Drawer ── */}
      {wishlistOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setWishlistOpen(false)} />
          <div className="relative w-full max-w-sm h-full flex flex-col glass-dark border-l border-white/10 shadow-2xl animate-slideInRight">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 fill-[#e8a0a8] text-[#e8a0a8]" />
                <h2 className="font-serif text-[15px] font-semibold text-white/90">Wishlist</h2>
                {wishlist.length > 0 && (
                  <span className="text-[10px] text-white/30 glass rounded-full px-2 py-0.5 border border-white/8">{wishlist.length}</span>
                )}
              </div>
              <button onClick={() => setWishlistOpen(false)} className="w-8 h-8 rounded-xl glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                  <Heart className="w-10 h-10 text-white/10" />
                  <p className="text-[13px] text-white/30">Your wishlist is empty</p>
                  <p className="text-[11px] text-white/20 text-center">Heart any product to save it here</p>
                </div>
              ) : (
                wishlist.map(product => (
                  <div key={product.id} className="flex items-center gap-3 glass rounded-2xl border border-white/8 p-3">
                    <img
                      src={product.img}
                      alt={product.name}
                      className="w-14 h-16 rounded-xl object-cover object-top flex-shrink-0 border border-white/8 cursor-pointer"
                      onClick={() => { setWishlistOpen(false); setProductModal(product) }}
                    />
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setWishlistOpen(false); setProductModal(product) }}>
                      <p className="text-[13px] font-semibold text-white/80 truncate">{product.name}</p>
                      {product.category && (
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">{product.category}</p>
                      )}
                      <p className="text-[13px] font-bold text-[#e8a0a8] mt-1">
                        {product.priceDisplay || (product.price ? `₹${product.price.toLocaleString('en-IN')}` : '')}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleWishlist(product)}
                      className="w-8 h-8 rounded-xl glass border border-white/8 flex items-center justify-center hover:border-red-400/30 hover:bg-red-400/5 transition-all flex-shrink-0"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white/30 hover:text-red-400 transition-colors" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer CTA */}
            {wishlist.length > 0 && (
              <div className="px-4 py-4 border-t border-white/8 flex-shrink-0 space-y-2">
                <button
                  onClick={() => {
                    wishlist.forEach(p => addToCart(p, p.sizes?.[1] || 'M'))
                    setWishlistOpen(false)
                    setCartOpen(true)
                  }}
                  className="w-full btn-liquid py-3 rounded-2xl text-[13px] font-semibold text-white flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" /> Add All to Bag
                </button>
                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/login?redirect=checkout')
                      setWishlistOpen(false)
                      return
                    }
                    wishlist.forEach(p => addToCart(p, p.sizes?.[1] || 'M'))
                    setWishlistOpen(false)
                    navigate('/checkout')
                  }}
                  className="w-full glass border border-[#b76e79]/30 py-3 rounded-2xl text-[13px] font-semibold text-[#e8a0a8] flex items-center justify-center gap-2 hover:bg-[#b76e79]/10 transition-all"
                >
                  Checkout Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
