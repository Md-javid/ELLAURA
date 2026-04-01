import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, Sparkles, User, Mail, Phone, MapPin, Heart, Info, Lock } from 'lucide-react'
import { signIn, signUp, DEMO_MODE, isSupabaseOffline } from '../lib/supabase'
import { useAuth, useUI } from '../context/AppContext'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@ellaura.in'
const ADMIN_SESSION_KEY = 'ellaura_admin_session'
const ADMIN_ACCOUNTS_KEY = 'ellaura_admin_accounts_v2' // must match AdminPage.jsx

// SHA-256 hash — identical to AdminPage.jsx so password changes take effect everywhere
const hashPasswordAsync = async (pw) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const STYLE_OPTIONS = [
  { key: 'cocktail', label: '🍸 Cocktail & Rooftop', desc: 'Elegant evening wear' },
  { key: 'club', label: '🌙 Club & Lounge', desc: 'Bold party & event looks' },
  { key: 'both', label: '✨ Both vibes', desc: "I dress for every occasion" },
]

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [step, setStep] = useState(1) // signup step 1 or 2
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const [form, setForm] = useState({
    email: '', password: '',
    fullName: '', phone: '', city: '',
    stylePreference: 'both',
  })

  const { user } = useAuth()
  const { showToast, theme } = useUI()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  // Already logged in
  useEffect(() => {
    if (user) navigate(redirect === 'checkout' ? '/checkout' : '/', { replace: true })
  }, [user])

  // Auto-reseed admin accounts if env credentials changed (runs on page load)
  useEffect(() => {
    const reseed = async () => {
      const hash = await hashPasswordAsync(import.meta.env.VITE_ADMIN_PASSWORD || 'Ellaura@2026')
      const seed = [{ email: ADMIN_EMAIL, password: hash }]
      try {
        const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY)
        if (!raw) {
          localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(seed))
        } else {
          const parsed = JSON.parse(raw)
          if (!parsed.some(a => a.email === ADMIN_EMAIL)) {
            localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(seed))
          }
        }
      } catch {
        localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(seed))
      }
    }
    reseed()
  }, [])

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // ── Admin shortcut: check against local admin credentials ──
    const rawAccounts = localStorage.getItem(ADMIN_ACCOUNTS_KEY)
    if (rawAccounts) {
      try {
        const accounts = JSON.parse(rawAccounts)
        const inputHash = await hashPasswordAsync(form.password)
        const adminMatch = accounts.find(a => a.email === form.email && a.password === inputHash)
        if (adminMatch) {
          sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ ts: Date.now(), email: adminMatch.email }))
          setLoading(false)
          navigate('/admin', { replace: true })
          return
        }
      } catch { /* malformed localStorage — fall through */ }
    }

    try {
      await signIn({ email: form.email, password: form.password })
      showToast('Welcome back!', 'success')
      navigate(redirect === 'checkout' ? '/checkout' : '/', { replace: true })
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('rate limit')) {
        setError('Rate limit reached. Please wait a few minutes and try again.')
      } else if (msg.includes('credentials') || msg.includes('password')) {
        setError('Incorrect email or password. Please try again.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignupStep1 = (e) => {
    e.preventDefault()
    if (!form.fullName.trim()) return setError('Please enter your full name.')
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) return setError('Please enter a valid 10-digit mobile number.')
    if (!form.email.trim() || !form.email.includes('@')) return setError('Please enter a valid email.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    setError('')
    setStep(2)
  }

  const handleSignupStep2 = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
        city: form.city,
        stylePreference: form.stylePreference,
      })
      showToast(
        (DEMO_MODE || isSupabaseOffline())
          ? 'Welcome to Ellaura! ✨ (Offline demo — no email required)'
          : 'Welcome to Ellaura! ✨ Please check your email to confirm.',
        'success'
      )
      navigate(redirect === 'checkout' ? '/checkout' : '/', { replace: true })
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('rate limit')) {
        setError('Rate limit reached. Please wait a few minutes and try again.')
      } else if (msg.includes('already registered') || msg.includes('duplicate')) {
        setError('This email is already registered. Try logging in.')
      } else {
        setError(msg)
      }
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = isDark
    ? "w-full bg-transparent text-white/90 placeholder-white/30 outline-none text-[14px] py-3"
    : "w-full bg-transparent text-[#2d1b1e] placeholder-[#2d1b1e]/40 outline-none text-[14px] py-3"
  const wrapClass = isDark
    ? "bg-white/6 rounded-2xl border border-white/10 px-4 flex items-center gap-3 focus-within:border-[#b76e79]/50 focus-within:bg-white/10 transition-all duration-300"
    : "bg-white/60 rounded-2xl border border-[#b76e79]/20 px-4 flex items-center gap-3 focus-within:border-[#b76e79]/50 focus-within:bg-white/90 transition-all duration-300 shadow-sm"
  const labelClass = isDark
    ? "text-[10px] tracking-[0.2em] text-white/40 uppercase block mb-2"
    : "text-[10px] tracking-[0.2em] text-[#2d1b1e]/50 uppercase block mb-2"
  const iconColor = isDark ? "w-4 h-4 text-white/30 flex-shrink-0" : "w-4 h-4 text-[#2d1b1e]/40 flex-shrink-0"
  const subtextColor = isDark ? 'text-white/30' : 'text-[#2d1b1e]/50'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-[#b76e79]/10 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-[#6366f1]/8 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Back link */}
        <Link to="/" className={`inline-flex items-center gap-1.5 text-[13px] transition-colors mb-8 ${isDark ? 'text-white/40 hover:text-white/70' : 'text-[#2d1b1e]/60 hover:text-[#2d1b1e]'}`}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Ellaura
        </Link>

        {/* Card */}
        <div className={`glass-dark rounded-[28px] shadow-2xl overflow-hidden ${isDark ? 'border border-white/8' : 'border border-[#b76e79]/15'}`}>
          {/* Glow strip */}
          <div className="h-1 w-full bg-gradient-to-r from-[#b76e79] via-[#e8a0a8] to-[#6366f1]" />

          <div className="p-7 sm:p-9">
            {/* Brand */}
            <div className="text-center mb-8">
              <p className="font-serif text-2xl font-bold text-rose-gold tracking-widest">ELLAURA</p>
              <p className={`text-[9px] tracking-[0.4em] uppercase mt-1 ${isDark ? 'text-white/25' : 'text-[#2d1b1e]/40'}`}>Couture</p>
            </div>

            {/* Mode toggle */}
            <div className="glass rounded-2xl p-1 flex mb-8">
              {[['login', 'Sign In'], ['signup', 'Join Ellaura']].map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setStep(1); setError('') }}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-400 ${
                    mode === m
                      ? 'bg-gradient-to-r from-[#b76e79]/90 to-[#8b4f5a]/90 text-white shadow-md'
                      : isDark ? 'text-white/40 hover:text-white/70' : 'text-[#2d1b1e]/60 hover:text-[#2d1b1e]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Demo mode notice */}
            {DEMO_MODE && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-[12px] text-amber-700 leading-relaxed">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                <span>
                  <strong className="text-amber-800">Demo mode</strong> — Supabase isn't configured yet.
                  Your login will be saved locally so you can explore the full app.
                  Add real credentials in <code className="font-mono text-amber-600">.env</code> later.
                </span>
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={labelClass}>Email</label>
                  <div className={wrapClass}>
                    <Mail className={iconColor} />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={set('email')}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Password</label>
                  <div className={wrapClass}>
                    <Lock className={iconColor} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={form.password}
                      onChange={set('password')}
                      required
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className={`${isDark ? 'text-white/30 hover:text-white/60' : 'text-[#2d1b1e]/40 hover:text-[#2d1b1e]/70'} transition-colors flex-shrink-0`}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-[12px] text-red-600 bg-red-50 border border-red-200/50 rounded-xl px-4 py-2.5 leading-snug">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-liquid rounded-2xl py-4 text-[15px] font-semibold text-white tracking-wide transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'Signing In...' : 'Sign In →'}
                </button>

                <p className={`text-center text-[12px] pt-2 ${isDark ? 'text-white/30' : 'text-[#2d1b1e]/50'}`}>
                  Forgot password?{' '}
                  <button type="button" className="text-[#b76e79] hover:text-[#8b4f5a] font-medium transition-colors">Reset here</button>
                </p>
              </form>
            )}

            {/* ── SIGNUP FORM: Step 1 ── */}
            {mode === 'signup' && step === 1 && (
              <form onSubmit={handleSignupStep1} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#b76e79] to-[#8b4f5a] flex items-center justify-center text-[11px] font-bold text-white">1</div>
                  <p className={`text-[12px] font-medium ${isDark ? 'text-white/60' : 'text-[#2d1b1e]/70'}`}>Basic Info</p>
                  <div className="flex-1 h-[1px] bg-[#b76e79]/20" />
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] ${isDark ? 'bg-white/6 border-white/10 text-white/30' : 'bg-white/60 border-[#b76e79]/20 text-[#2d1b1e]/40'}`}>2</div>
                  <p className={`text-[12px] ${isDark ? 'text-white/30' : 'text-[#2d1b1e]/40'}`}>Style Profile</p>
                </div>

                <div>
                  <label className={labelClass}>Full Name</label>
                  <div className={wrapClass}>
                    <User className={iconColor} />
                    <input type="text" placeholder="Your name" value={form.fullName} onChange={set('fullName')} required className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Mobile Number *</label>
                  <div className={wrapClass}>
                    <Phone className={iconColor} />
                    <input type="tel" placeholder="+91 XXXXXXXXXX" value={form.phone} onChange={set('phone')} required className={inputClass} />
                  </div>
                  <p className={`text-[10px] mt-1 ml-1 ${subtextColor}`}>For order updates & delivery coordination</p>
                </div>

                <div>
                  <label className={labelClass}>Email *</label>
                  <div className={wrapClass}>
                    <Mail className={iconColor} />
                    <input type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Password *</label>
                  <div className={wrapClass}>
                    <Lock className={iconColor} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={form.password}
                      onChange={set('password')}
                      required
                      minLength={8}
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className={`${isDark ? 'text-white/30 hover:text-white/60' : 'text-[#2d1b1e]/40 hover:text-[#2d1b1e]/70'} transition-colors flex-shrink-0`}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-[12px] text-red-600 bg-red-50 border border-red-200/50 rounded-xl px-4 py-2.5 leading-snug">{error}</p>
                )}

                <button type="submit" className="w-full btn-liquid rounded-2xl py-4 text-[15px] font-semibold text-white tracking-wide transition-all active:scale-[0.98] mt-2">
                  Continue →
                </button>
              </form>
            )}

            {/* ── SIGNUP FORM: Step 2 ── */}
            {mode === 'signup' && step === 2 && (
              <form onSubmit={handleSignupStep2} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-white/60 border border-[#b76e79]/30 flex items-center justify-center text-[11px] text-[#b76e79] font-bold">✓</div>
                  <p className={`text-[12px] ${isDark ? 'text-white/40' : 'text-[#2d1b1e]/50'}`}>Basic Info</p>
                  <div className="flex-1 h-[1px] bg-[#b76e79]/30" />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#b76e79] to-[#8b4f5a] flex items-center justify-center text-[11px] font-bold text-white">2</div>
                  <p className={`text-[12px] font-medium ${isDark ? 'text-white/60' : 'text-[#2d1b1e]/70'}`}>Style Profile</p>
                </div>

                <div>
                  <label className={labelClass}>City</label>
                  <div className={wrapClass}>
                    <MapPin className={iconColor} />
                    <input type="text" placeholder="Your city" value={form.city} onChange={set('city')} className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={`${labelClass} mb-3`}>Your Style Vibe</label>
                  <div className="space-y-2">
                    {STYLE_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, stylePreference: opt.key }))}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all duration-300 ${
                          form.stylePreference === opt.key
                            ? isDark ? 'bg-[#b76e79]/15 border-[#b76e79]/40' : 'bg-[#b76e79]/10 border-[#b76e79]/40 shadow-sm'
                            : isDark ? 'bg-white/5 border-white/8 hover:border-white/15' : 'bg-white/60 border-[#b76e79]/15 hover:border-[#b76e79]/30 shadow-sm'
                        }`}
                      >
                        <span className="text-base">{opt.label.split(' ')[0]}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-medium ${isDark ? 'text-white/70' : 'text-[#2d1b1e]/80'}`}>{opt.label.substring(3)}</p>
                          <p className={`text-[10px] ${subtextColor}`}>{opt.desc}</p>
                        </div>
                        {form.stylePreference === opt.key && (
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#b76e79] to-[#8b4f5a] flex items-center justify-center flex-shrink-0">
                            <span className="text-[8px] text-white">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-[12px] text-red-600 bg-red-50 border border-red-200/50 rounded-xl px-4 py-2.5 leading-snug">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className={`flex-1 rounded-2xl py-3.5 text-sm font-medium transition-all active:scale-[0.98] ${isDark ? 'bg-white/6 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10' : 'bg-white/60 border border-[#b76e79]/20 text-[#2d1b1e]/70 hover:text-[#2d1b1e] hover:bg-white/90 hover:border-[#b76e79]/40 shadow-sm'}`}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-liquid rounded-2xl py-3.5 text-[14px] font-semibold text-white tracking-wide transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    {loading ? 'Creating...' : 'Join Ellaura ✨'}
                  </button>
                </div>
              </form>
            )}

            {/* Footer note */}
            <p className={`text-center text-[10px] mt-6 leading-relaxed ${isDark ? 'text-white/25' : 'text-[#2d1b1e]/40'}`}>
              By continuing, you agree to our{' '}
              <span className={`cursor-pointer transition-colors font-medium ${isDark ? 'text-white/50 hover:text-white/70' : 'text-[#2d1b1e]/70 hover:text-[#2d1b1e]'}`}>Terms</span>
              {' '}&{' '}
              <span className={`cursor-pointer transition-colors font-medium ${isDark ? 'text-white/50 hover:text-white/70' : 'text-[#2d1b1e]/70 hover:text-[#2d1b1e]'}`}>Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

