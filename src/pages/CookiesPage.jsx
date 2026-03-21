import { Link } from 'react-router-dom'
import { ArrowLeft, Cookie } from 'lucide-react'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#050508] neon-bg py-16 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[12px] text-white/30 hover:text-white/60 transition-colors mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] tracking-[0.4em] text-[#b76e79]/60 uppercase mb-3">Cookies Policy</p>
          <h1 className="font-serif text-4xl font-bold text-white/90 mb-3">Cookies & Tracking</h1>
          <p className="text-[13px] text-white/30">Last updated: March 2026</p>
        </div>

        <div className="space-y-6 text-[14px] text-white/50 leading-relaxed">

          <div className="glass-premium rounded-2xl border border-purple-500/10 p-6">
            <h2 className="text-[15px] font-semibold text-white/85 mb-3">What Are Cookies?</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and improve your browsing experience on ellaura.in.</p>
          </div>

          <div className="glass-premium rounded-2xl border border-purple-500/10 p-6">
            <h2 className="text-[15px] font-semibold text-white/85 mb-3">Cookies We Use</h2>
            <div className="space-y-4">
              {[
                { name: 'Essential Cookies', desc: 'Required for the site to function — shopping cart, session auth, and checkout flow. Cannot be disabled.' },
                { name: 'Preference Cookies', desc: 'Remember your size, colour choices, and wishlist so you don\'t have to re-select them on every visit.' },
                { name: 'Analytics Cookies', desc: 'Help us understand which pages perform well and how visitors navigate the site (e.g. via Vercel Analytics). No personal data is collected.' },
              ].map(({ name, desc }) => (
                <div key={name} className="border-t border-white/5 pt-4 first:border-0 first:pt-0">
                  <p className="text-[13px] font-semibold text-white/70 mb-1">{name}</p>
                  <p className="text-[13px] text-white/40">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-premium rounded-2xl border border-purple-500/10 p-6">
            <h2 className="text-[15px] font-semibold text-white/85 mb-3">Third-Party Services</h2>
            <p>We use Razorpay for secure payment processing. Razorpay may set its own cookies during checkout. Their cookie policy is available at <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-[#b76e79]/70 hover:text-[#b76e79]">razorpay.com/privacy</a>.</p>
          </div>

          <div className="glass-premium rounded-2xl border border-purple-500/10 p-6">
            <h2 className="text-[15px] font-semibold text-white/85 mb-3">Managing Cookies</h2>
            <p>You can clear or block cookies via your browser settings. Note that disabling essential cookies may affect how the site works (e.g. your cart may not be saved).</p>
          </div>

          <div className="glass-premium rounded-2xl border border-purple-500/10 p-6">
            <h2 className="text-[15px] font-semibold text-white/85 mb-3">Contact</h2>
            <p>Questions about our cookie use? Email us at{' '}
              <a href="mailto:ellauraoffi@gmail.com" className="text-[#b76e79]/70 hover:text-[#b76e79] transition-colors">
                ellauraoffi@gmail.com
              </a>
            </p>
          </div>

        </div>

        <p className="text-[11px] text-white/15 text-center mt-12">
          © {new Date().getFullYear()} Ellaura · Coimbatore, India
        </p>
      </div>
    </div>
  )
}
