import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingBag, Search, User, X, Menu, LogOut, ChevronDown, Sun, Moon } from 'lucide-react'
import { useCart, useUI, useAuth } from '../context/AppContext'
import { signOut } from '../lib/supabase'

const NAV_LINKS = [
  { label: 'Collection', href: '#gallery' },
  { label: 'Lookbook', href: '/lookbook' },
  { label: 'Custom Fit', href: '#about' },
  { label: 'About', href: '#about' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { cartCount, setCartOpen } = useCart()
  const { setSearchOpen, theme, toggleTheme } = useUI()
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
      const el = document.getElementById(href.slice(1))
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate(href)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setUserMenuOpen(false)
    navigate('/')
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'backdrop-blur-2xl bg-black/65 border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
            : 'backdrop-blur-xl bg-black/30 border-b border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden w-10 h-10 rounded-2xl glass flex items-center justify-center transition-all duration-300 hover:bg-white/10 active:scale-95 flex-shrink-0"
            aria-label="Toggle menu"
          >
            <span className="relative w-5 h-4 flex flex-col justify-between">
              <span className={`block h-[1.5px] bg-white/80 rounded-full transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[7.5px]' : ''}`} />
              <span className={`block h-[1.5px] bg-white/80 rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block h-[1.5px] bg-white/80 rounded-full transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7.5px]' : ''}`} />
            </span>
          </button>

          {/* ── Brand ── */}
          <Link to="/" className="flex flex-col items-center flex-shrink-0">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-widest text-rose-gold leading-none">
              ELLAURA
            </span>
            <span className="hidden sm:block text-[7px] tracking-[0.4em] text-white/25 font-light uppercase mt-0.5">
              Couture Nights
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all duration-300 tracking-wide"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* ── Right actions ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 rounded-2xl glass flex items-center justify-center transition-all duration-300 hover:bg-white/10 active:scale-95"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-white/70" />
            </button>

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-10 h-10 rounded-2xl glass flex items-center justify-center transition-all duration-300 hover:bg-white/10 active:scale-95"
                  aria-label="Account"
                >
                  <User className="w-4 h-4 text-white/70" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-48 glass-dark rounded-2xl border border-white/10 shadow-2xl py-2 animate-slideDown">
                    <div className="px-4 py-2 border-b border-white/8 mb-1">
                      <p className="text-[11px] text-white/40 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl glass border border-white/10 text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                <User className="w-3.5 h-3.5" />
                Login
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-2xl glass flex items-center justify-center transition-all duration-300 hover:bg-white/10 active:scale-95"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4 text-white/70" />
                : <Moon className="w-4 h-4 text-white/70" />}
            </button>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="w-10 h-10 rounded-2xl glass flex items-center justify-center transition-all duration-300 hover:bg-white/10 active:scale-95 relative"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="w-4 h-4 text-white/70" />
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
                onClick={() => handleNavClick(link.href)}
                className="text-left py-3 px-3 rounded-2xl text-white/80 font-medium text-[15px] tracking-wide hover:bg-white/5 hover:text-white transition-all duration-300"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto">
            {user ? (
              <button onClick={handleSignOut} className="w-full flex items-center gap-2 py-3 px-3 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
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
    </>
  )
}
