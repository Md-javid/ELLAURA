import { useState, useEffect, useRef } from 'react'
import { Instagram, Mail, Sparkles, Heart } from 'lucide-react'
import { supabase, DEMO_MODE } from '../lib/supabase'

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919087915193'

// ── WhatsApp icon ─────────────────────────────────────────────
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

// ── Countdown hook ────────────────────────────────────────────
function useCountdown(target) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target - Date.now())
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  return time
}

// ── Countdown unit card ───────────────────────────────────────
function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl blur-xl bg-purple-500/20 scale-110" />
        <div className="relative glass-premium rounded-2xl border border-purple-500/20 px-4 sm:px-6 py-3 sm:py-4 min-w-[64px] sm:min-w-[80px] text-center">
          <span className="font-serif font-bold text-3xl sm:text-4xl text-gradient-hero tabular-nums leading-none">
            {String(value).padStart(2, '0')}
          </span>
        </div>
      </div>
      <span className="text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-white/35 font-medium">
        {label}
      </span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function ComingSoonPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [inputError, setInputError] = useState('')
  const canvasRef = useRef(null)

  // April 9 2026 at midnight IST — change to your real launch date
  const LAUNCH_TARGET = new Date('2026-04-09T00:00:00+05:30').getTime()
  const { days, hours, minutes, seconds } = useCountdown(LAUNCH_TARGET)

  // ── Starfield canvas ──────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.005 + 0.002,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach(s => {
        s.phase += s.speed
        const alpha = (Math.sin(s.phase) * 0.5 + 0.5) * 0.6 + 0.1
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,180,220,${alpha})`
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // ── Email subscribe ───────────────────────────────────────
  const handleSubscribe = async (e) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setInputError('Please enter a valid email address.')
      return
    }
    setInputError('')
    setSubmitting(true)

    // Always persist locally
    try {
      const key = 'ellaura_waitlist'
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      if (!existing.includes(trimmed)) {
        localStorage.setItem(key, JSON.stringify([...existing, trimmed]))
      }
    } catch { /* ignore */ }

    // Also try Supabase waitlist table if live
    if (!DEMO_MODE) {
      supabase.from('waitlist').upsert({ email: trimmed }, { onConflict: 'email' }).catch(() => {})
    }

    await new Promise(r => setTimeout(r, 800))
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#050508]">
      {/* Starfield */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Neon blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px] animate-float"
        />
        <div
          className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-[#b76e79]/8 blur-[100px]"
          style={{ animation: 'float 8s ease-in-out infinite reverse' }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-indigo-600/8 blur-[100px] animate-float"
          style={{ animationDelay: '3s' }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-8 max-w-3xl w-full py-16">

        {/* Brand */}
        <div className="mb-8 animate-fadeIn" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <div className="flex items-center gap-3 mb-3 justify-center">
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#b76e79]/50" />
            <Sparkles className="w-3.5 h-3.5 text-[#b76e79]/60" />
            <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#b76e79]/50" />
          </div>
          <h1 className="font-serif text-5xl sm:text-7xl font-bold tracking-[0.15em] text-rose-gold leading-none">
            ELLAURA
          </h1>
          <p className="text-[9px] sm:text-[10px] tracking-[0.55em] text-white/25 font-light uppercase mt-2">
            Couture Nights
          </p>
        </div>

        {/* Headline */}
        <div className="mb-10 animate-fadeIn" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
          <div className="inline-block glass-premium rounded-full px-4 py-1.5 mb-5 border border-purple-500/20">
            <span className="text-[11px] tracking-[0.3em] uppercase text-purple-300/70 font-medium">
              ✦ &nbsp;Launching Soon&nbsp; ✦
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white/90 leading-tight mb-4">
            The Night Deserves<br />
            <span className="text-gradient-hero italic">Something&nbsp;Extraordinary.</span>
          </h2>
          <p className="text-[14px] sm:text-[15px] text-white/45 max-w-md mx-auto leading-relaxed">
            Premium custom-stitched nightwear and cocktail dresses — hand-crafted for the modern Indian woman. Be the first to know.
          </p>
        </div>

        {/* Countdown */}
        <div className="mb-12 animate-fadeIn" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
          <p className="text-[11px] tracking-[0.3em] uppercase text-white/25 mb-5">Launching in</p>
          <div className="flex items-start gap-3 sm:gap-5 justify-center">
            <CountdownUnit value={days} label="Days" />
            <span className="text-3xl text-white/20 font-thin mt-3 select-none">:</span>
            <CountdownUnit value={hours} label="Hours" />
            <span className="text-3xl text-white/20 font-thin mt-3 select-none">:</span>
            <CountdownUnit value={minutes} label="Mins" />
            <span className="text-3xl text-white/20 font-thin mt-3 select-none">:</span>
            <CountdownUnit value={seconds} label="Secs" />
          </div>
        </div>

        {/* Email capture */}
        <div className="w-full max-w-md mb-10 animate-fadeIn" style={{ animationDelay: '0.55s', animationFillMode: 'both' }}>
          {submitted ? (
            <div className="glass-premium rounded-2xl border border-emerald-500/20 px-6 py-5 animate-fadeIn">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-1">
                  <Heart className="w-5 h-5 text-emerald-400" fill="currentColor" />
                </div>
                <p className="text-[15px] font-semibold text-white/90">You&apos;re on the list!</p>
                <p className="text-[12px] text-white/40 text-center">
                  We&apos;ll email you the moment Ellaura goes live. Expect magic.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 glass rounded-2xl border border-white/10 px-4 flex items-center gap-3 focus-within:border-[#b76e79]/40 transition-all duration-300">
                <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setInputError('') }}
                  placeholder="your@email.com"
                  className="flex-1 bg-transparent text-white placeholder-white/25 outline-none text-[14px] py-3.5"
                  disabled={submitting}
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-liquid rounded-2xl px-6 py-3.5 text-[13px] font-semibold text-white tracking-wide active:scale-95 transition-all whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                    Adding…
                  </span>
                ) : 'Notify Me'}
              </button>
            </form>
          )}
          {inputError && (
            <p className="text-[12px] text-red-400/80 mt-2 text-center">{inputError}</p>
          )}
          {!submitted && (
            <p className="text-[11px] text-white/20 mt-3 text-center">
              No spam — ever. Unsubscribe any time.
            </p>
          )}
        </div>

        {/* Social links */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 mb-14 animate-fadeIn"
          style={{ animationDelay: '0.7s', animationFillMode: 'both' }}
        >
          <a
            href={`https://wa.me/${WA_NUMBER}?text=Hi%20Ellaura!%20I%20can%27t%20wait%20for%20you%20to%20launch%20%F0%9F%92%96`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 glass rounded-2xl border border-white/10 px-5 py-2.5 text-[13px] text-white/60 hover:text-white hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 group"
          >
            <span className="text-emerald-400 group-hover:scale-110 transition-transform">
              <WhatsAppIcon />
            </span>
            WhatsApp Us
          </a>
          <a
            href="https://instagram.com/ellaura.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 glass rounded-2xl border border-white/10 px-5 py-2.5 text-[13px] text-white/60 hover:text-white hover:border-[#b76e79]/30 hover:bg-[#b76e79]/5 transition-all duration-300 group"
          >
            <Instagram className="w-4 h-4 text-[#b76e79] group-hover:scale-110 transition-transform" />
            Follow on Instagram
          </a>
          <a
            href="mailto:hello@ellaura.in"
            className="flex items-center gap-2 glass rounded-2xl border border-white/10 px-5 py-2.5 text-[13px] text-white/60 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-300 group"
          >
            <Mail className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            hello@ellaura.in
          </a>
        </div>

        {/* Teaser feature cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl animate-fadeIn"
          style={{ animationDelay: '0.85s', animationFillMode: 'both' }}
        >
          {[
            { icon: '✂️', title: 'Custom Stitched', desc: 'Every piece made to your exact measurements' },
            { icon: '⚡', title: '48-Hour Delivery', desc: 'Hand-crafted & delivered in two days' },
            { icon: '💎', title: 'Premium Fabrics', desc: 'Velvet, satin & silk — nothing less' },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="glass-liquid rounded-2xl border border-purple-500/10 p-4 text-center hover:border-[#b76e79]/20 transition-all duration-300 group"
            >
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-[13px] font-semibold text-white/80 mb-1 group-hover:text-white transition-colors">
                {title}
              </p>
              <p className="text-[11px] text-white/35 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Hidden admin link — invisible dot, only for brand owner */}
        <a
          href="/admin"
          className="mt-16 text-[10px] text-white/5 hover:text-white/15 transition-colors select-none"
          aria-hidden="true"
          tabIndex={-1}
        >
          ·
        </a>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full border-t border-white/5 py-5 text-center">
        <p className="text-[11px] text-white/20">
          © {new Date().getFullYear()} Ellaura. Coimbatore, India. All rights reserved.
        </p>
      </div>
    </div>
  )
}
