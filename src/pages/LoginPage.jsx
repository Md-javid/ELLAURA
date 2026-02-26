import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, Sparkles, User, Mail, Phone, MapPin, Heart, Info } from 'lucide-react'
import { signIn, signUp, DEMO_MODE } from '../lib/supabase'
import { useAuth, useUI } from '../context/AppContext'

const STYLE_OPTIONS = [
  { key: 'cocktail', label: '🍸 Cocktail & Rooftop', desc: 'Elegant evening wear' },
  { key: 'club', label: '🌙 Club & Lounge', desc: 'Bold night-out looks' },
  { key: 'both', label: '✨ Both vibes', desc: "I dress for every night" },
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
  const { showToast } = useUI()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  // Already logged in
  useEffect(() => {
    if (user) navigate(redirect === 'checkout' ? '/checkout' : '/', { replace: true })
  }, [user])

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn({ email: form.email, password: form.password })
      showToast('Welcome back! 💖', 'success')
      navigate(redirect === 'checkout' ? '/checkout' : '/', { replace: true })
    } catch (err) {
      setError(err.message.includes('credentials') || err.message.includes('password')
        ? 'Incorrect email or password. Please try again.'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignupStep1 = (e) => {
    e.preventDefault()
    if (!form.fullName.trim()) return setError('Please enter your full name.')
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
        DEMO_MODE
          ? 'Welcome to Ellaura! ✨ (Demo mode — no email required)'
          : 'Welcome to Ellaura! ✨ Please check your email to confirm.',
        'success'
      )
      navigate(redirect === 'checkout' ? '/checkout' : '/', { replace: true })
    } catch (err) {
      setError(err.message.includes('already registered') || err.message.includes('duplicate')
        ? 'This email is already registered. Try logging in.'
        : err.message)
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-transparent text-white placeholder-white/25 outline-none text-[14px] py-3"
  const wrapClass = "glass rounded-2xl border border-white/10 px-4 flex items-center gap-3 focus-within:border-[#b76e79]/40 transition-all duration-300"

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-[#b76e79]/10 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-[#6366f1]/8 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Ellaura
        </Link>

        {/* Card */}
        <div className="glass-dark rounded-[28px] border border-white/10 shadow-2xl overflow-hidden">
          {/* Glow strip */}
          <div className="h-1 w-full bg-gradient-to-r from-[#b76e79] via-[#e8a0a8] to-[#6366f1]" />

          <div className="p-7 sm:p-9">
            {/* Brand */}
            <div className="text-center mb-8">
              <p className="font-serif text-2xl font-bold text-rose-gold tracking-widest">ELLAURA</p>
              <p className="text-[9px] tracking-[0.4em] text-white/20 uppercase mt-1">Couture Nights</p>
            </div>

            {/* Mode toggle */}
            <div className="glass rounded-2xl p-1 flex mb-8">
              {[['login', 'Sign In'], ['signup', 'Join Ellaura']].map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setStep(1); setError('') }}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-400 ${
                    mode === m
                      ? 'bg-gradient-to-r from-[#b76e79]/80 to-[#8b4f5a]/80 text-white shadow-lg'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Demo mode notice */}
            {DEMO_MODE && (
              <div className="flex items-start gap-2.5 glass border border-amber-400/20 rounded-xl px-4 py-3 mb-6 text-[12px] text-amber-400/80 leading-relaxed">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400/60" />
                <span>
                  <strong className="text-amber-400/90">Demo mode</strong> — Supabase isn't configured yet.
                  Your login will be saved locally so you can explore the full app.
                  Add real credentials in <code className="font-mono text-amber-300/60">.env</code> later.
                </span>
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Email</label>
                  <div className={wrapClass}>
                    <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
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
                  <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Password</label>
                  <div className={wrapClass}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={form.password}
                      onChange={set('password')}
                      required
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5 leading-snug">
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

                <p className="text-center text-[12px] text-white/25">
                  Forgot password?{' '}
                  <button type="button" className="text-[#e8a0a8] hover:text-[#b76e79] transition-colors">Reset here</button>
                </p>
              </form>
            )}

            {/* ── SIGNUP FORM: Step 1 ── */}
            {mode === 'signup' && step === 1 && (
              <form onSubmit={handleSignupStep1} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#b76e79] to-[#8b4f5a] flex items-center justify-center text-[11px] font-bold text-white">1</div>
                  <p className="text-[12px] text-white/50">Basic Info</p>
                  <div className="flex-1 h-[1px] bg-white/8" />
                  <div className="w-6 h-6 rounded-full glass border border-white/10 flex items-center justify-center text-[11px] text-white/25">2</div>
                  <p className="text-[12px] text-white/20">Style Profile</p>
                </div>

                <div>
                  <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Full Name</label>
                  <div className={wrapClass}>
                    <User className="w-4 h-4 text-white/30 flex-shrink-0" />
                    <input type="text" placeholder="Your name" value={form.fullName} onChange={set('fullName')} required className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Email</label>
                  <div className={wrapClass}>
                    <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
                    <input type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Password</label>
                  <div className={wrapClass}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={form.password}
                      onChange={set('password')}
                      required
                      minLength={8}
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</p>
                )}

                <button type="submit" className="w-full btn-liquid rounded-2xl py-4 text-[15px] font-semibold text-white tracking-wide transition-all active:scale-[0.98]">
                  Continue →
                </button>
              </form>
            )}

            {/* ── SIGNUP FORM: Step 2 ── */}
            {mode === 'signup' && step === 2 && (
              <form onSubmit={handleSignupStep2} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full glass border border-[#b76e79]/30 flex items-center justify-center text-[11px] text-[#b76e79]">✓</div>
                  <p className="text-[12px] text-white/30">Basic Info</p>
                  <div className="flex-1 h-[1px] bg-[#b76e79]/30" />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#b76e79] to-[#8b4f5a] flex items-center justify-center text-[11px] font-bold text-white">2</div>
                  <p className="text-[12px] text-white/50">Style Profile</p>
                </div>

                <div>
                  <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Phone Number</label>
                  <div className={wrapClass}>
                    <Phone className="w-4 h-4 text-white/30 flex-shrink-0" />
                    <input type="tel" placeholder="+91 XXXXXXXXXX" value={form.phone} onChange={set('phone')} className={inputClass} />
                  </div>
                  <p className="text-[10px] text-white/20 mt-1 ml-1">For order updates & custom fitting coordination</p>
                </div>

                <div>
                  <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">City</label>
                  <div className={wrapClass}>
                    <MapPin className="w-4 h-4 text-white/30 flex-shrink-0" />
                    <input type="text" placeholder="Your city" value={form.city} onChange={set('city')} className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-3">Your Style Vibe</label>
                  <div className="space-y-2">
                    {STYLE_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, stylePreference: opt.key }))}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all duration-300 ${
                          form.stylePreference === opt.key
                            ? 'glass-rose border-[#b76e79]/40 '
                            : 'glass border-white/8 hover:border-white/15'
                        }`}
                      >
                        <span className="text-base">{opt.label.split(' ')[0]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-white/80">{opt.label.substring(3)}</p>
                          <p className="text-[10px] text-white/35">{opt.desc}</p>
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
                  <p className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 glass border border-white/10 rounded-2xl py-3.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all active:scale-[0.98]"
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
            <p className="text-center text-[10px] text-white/20 mt-6 leading-relaxed">
              By continuing, you agree to our{' '}
              <span className="text-white/35 hover:text-white/60 cursor-pointer transition-colors">Terms</span>
              {' '}&{' '}
              <span className="text-white/35 hover:text-white/60 cursor-pointer transition-colors">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
