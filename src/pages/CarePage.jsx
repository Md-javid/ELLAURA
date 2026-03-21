import { Link } from 'react-router-dom'
import { ArrowLeft, Droplets, Wind, Sun, Package, Heart, AlertCircle } from 'lucide-react'

export default function CarePage() {
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
          <p className="text-[10px] tracking-[0.4em] text-[#b76e79]/60 uppercase mb-3">Garment Care</p>
          <h1 className="font-serif text-4xl font-bold text-white/90 mb-3">
            Care for Your Ellaura
          </h1>
          <p className="text-[15px] text-white/40 leading-relaxed">
            Each Ellaura piece is hand-stitched with love in Coimbatore. A little care goes a long way in keeping your garment looking as beautiful as the day it arrived.
          </p>
        </div>

        <div className="space-y-6">

          {/* Washing */}
          <div className="glass-premium rounded-2xl border border-purple-500/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-xl bg-[#b76e79]/12 border border-[#b76e79]/25 flex items-center justify-center flex-shrink-0">
                <Droplets className="w-4.5 h-4.5 text-[#b76e79]" />
              </span>
              <h2 className="text-[15px] font-semibold text-white/85">Washing</h2>
            </div>
            <ul className="space-y-2 text-[13px] text-white/50 leading-relaxed">
              <li>• <strong className="text-white/70">Hand wash only</strong> in cold water (max 30°C) for embellished or delicate pieces</li>
              <li>• Use a mild, pH-neutral detergent — no bleach or harsh chemicals</li>
              <li>• Machine wash on gentle/delicate cycle only for plain cotton pieces</li>
              <li>• Wash dark and light colours separately to prevent bleeding</li>
              <li>• Turn the garment inside out before washing to protect the outer surface</li>
            </ul>
          </div>

          {/* Drying */}
          <div className="glass-premium rounded-2xl border border-purple-500/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-xl bg-[#6366f1]/12 border border-[#6366f1]/25 flex items-center justify-center flex-shrink-0">
                <Wind className="w-4.5 h-4.5 text-[#a78bfa]" />
              </span>
              <h2 className="text-[15px] font-semibold text-white/85">Drying</h2>
            </div>
            <ul className="space-y-2 text-[13px] text-white/50 leading-relaxed">
              <li>• <strong className="text-white/70">Lay flat to dry</strong> — never wring or twist the fabric</li>
              <li>• Dry in shade, not direct sunlight — UV can fade colours over time</li>
              <li>• Avoid tumble drying; the heat can shrink or distort the shape</li>
              <li>• Gently reshape while damp and allow to air dry naturally</li>
            </ul>
          </div>

          {/* Ironing */}
          <div className="glass-premium rounded-2xl border border-purple-500/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-xl bg-amber-500/12 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              </span>
              <h2 className="text-[15px] font-semibold text-white/85">Ironing & Steaming</h2>
            </div>
            <ul className="space-y-2 text-[13px] text-white/50 leading-relaxed">
              <li>• <strong className="text-white/70">Steam is preferred</strong> over direct ironing for most pieces</li>
              <li>• If ironing, use a low-heat setting and always iron inside out</li>
              <li>• Place a thin cloth between the iron and the garment for embellished sections</li>
              <li>• Never iron directly on embroidery, sequins, or printed areas</li>
            </ul>
          </div>

          {/* Storage */}
          <div className="glass-premium rounded-2xl border border-purple-500/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-xl bg-[#b76e79]/12 border border-[#b76e79]/25 flex items-center justify-center flex-shrink-0">
                <Package className="w-4.5 h-4.5 text-[#e8a0a8]" />
              </span>
              <h2 className="text-[15px] font-semibold text-white/85">Storage</h2>
            </div>
            <ul className="space-y-2 text-[13px] text-white/50 leading-relaxed">
              <li>• Store in a cool, dry, well-ventilated space away from direct sunlight</li>
              <li>• Hang structured pieces (dresses, blazers) on padded hangers</li>
              <li>• Fold delicate or stretchy fabrics flat to retain their shape</li>
              <li>• Keep in the tissue-lined Ellaura pouch/box provided for long-term storage</li>
              <li>• Avoid plastic bags — fabric needs to breathe</li>
            </ul>
          </div>

          {/* Our Promise */}
          <div className="glass-rose rounded-2xl border border-[#b76e79]/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="w-4 h-4 text-[#b76e79]" fill="currentColor" />
              <h2 className="text-[14px] font-semibold text-white/85">Our Care Promise</h2>
            </div>
            <p className="text-[13px] text-white/50 leading-relaxed">
              Every Ellaura garment is packed with tissue paper and sealed carefully before dispatch. We care deeply about the pieces we make — we hope you'll love wearing them just as much as we loved making them.
            </p>
            <p className="text-[13px] text-white/40 leading-relaxed mt-2">
              If you ever have a care question, reach us at{' '}
              <a href="mailto:ellauraoffi@gmail.com" className="text-[#b76e79]/70 hover:text-[#b76e79] transition-colors">
                ellauraoffi@gmail.com
              </a>{' '}
              or WhatsApp us — we're always happy to help.
            </p>
          </div>

          {/* Note */}
          <div className="glass rounded-2xl border border-white/8 p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400/70 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-white/35 leading-relaxed">
              Care instructions may vary slightly by fabric. When in doubt, hand wash in cold water and lay flat to dry — this works for almost every Ellaura piece.
            </p>
          </div>

        </div>

        {/* Footer */}
        <p className="text-[11px] text-white/15 text-center mt-12">
          © {new Date().getFullYear()} Ellaura · Coimbatore, India
        </p>
      </div>
    </div>
  )
}
