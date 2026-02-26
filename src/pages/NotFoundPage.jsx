import { Link } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Decorative glow */}
        <div className="relative inline-block mb-8">
          <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-[#b76e79]/20 to-[#6366f1]/20 border border-white/10 flex items-center justify-center mx-auto shadow-2xl">
            <span className="font-serif text-5xl font-bold text-white/20">404</span>
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-[#b76e79]/60" />
        </div>

        <h1 className="font-serif text-3xl font-bold text-white/90 mb-3">
          Page Not Found
        </h1>
        <p className="text-[14px] text-white/35 leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back to the collection.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 btn-liquid rounded-2xl px-6 py-3 text-[14px] font-semibold text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ellaura
        </Link>
      </div>
    </div>
  )
}
