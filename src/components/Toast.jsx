import { CheckCircle, AlertCircle, Info } from 'lucide-react'

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

const COLORS = {
  success: 'border-emerald-500/30 from-emerald-500/20 to-emerald-500/5 text-emerald-400',
  error: 'border-red-500/30 from-red-500/20 to-red-500/5 text-red-400',
  info: 'border-[#b76e79]/30 from-[#b76e79]/20 to-[#b76e79]/5 text-[#e8a0a8]',
}

export default function Toast({ message, type = 'info' }) {
  const Icon = ICONS[type] || Info
  const color = COLORS[type] || COLORS.info

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none flex items-center justify-center px-4">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border bg-gradient-to-r shadow-2xl backdrop-blur-xl animate-toastPop ${color}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="text-[14px] font-semibold text-white/90 leading-snug">{message}</p>
      </div>
    </div>
  )
}
