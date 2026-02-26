/**
 * AIStylist — Built-in rule-based recommendation engine.
 * Zero API keys. Uses TF-IDF-style keyword scoring + context extraction.
 */
import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, ChevronDown, Zap, ShoppingBag } from 'lucide-react'
import { useCart, useUI } from '../context/AppContext'
import { getLiveProducts } from '../lib/products'

// ── Knowledge base ─────────────────────────────────────────────
const OCCASION_MAP = {
  pub: ['pub','bar','lounge','night','nightout','party'],
  club: ['club','dance','dj','rave','nightclub'],
  rooftop: ['rooftop','terrace','outdoor','sky bar','high rise'],
  dinner: ['dinner','restaurant','fine dining','date night','date','anniversary'],
  wedding: ['wedding','reception','sangeet','bride','mehendi','engagement','shaadi'],
  office: ['office','work','meeting','corporate','professional','presentation'],
  brunch: ['brunch','lunch','daytime','afternoon'],
  festival: ['festival','holi','diwali','navratri','festive','celebration','garba'],
}

const COLOR_MAP = {
  black: ['black','noir','dark','charcoal','ebony'],
  gold:  ['gold','golden','amber','warm','beige','caramel'],
  pink:  ['pink','rose','blush','mauve','soft'],
  red:   ['red','crimson','wine','berry','burgundy'],
  blue:  ['blue','navy','indigo','electric','cobalt'],
  white: ['white','ivory','cream','off-white','pearl'],
}

const BUDGET_KEYWORDS = {
  low:  ['cheap','budget','affordable','under 5k','under 8k','low budget'],
  high: ['luxury','premium','expensive','splurge','high end','special'],
}

const VIBE_MAP = {
  cocktail: ['elegant','sophisticated','chic','classy','refined','minimal'],
  club:     ['bold','sexy','statement','edgy','fierce','glam','dramatic'],
}

const CITY_MAP = {
  mumbai:    ['mumbai','bandra','juhu','colaba','lower parel','andheri','powai'],
  delhi:     ['delhi','cp','connaught','gk','defence colony','hauz khas'],
  bangalore: ['bangalore','koramangala','indiranagar'],
  hyderabad: ['hyderabad','banjara','jubilee'],
}

const BODY_KEYWORDS = ['petite','tall','slim','curvy','plus','athletic','hourglass']

// ── Scoring Engine ─────────────────────────────────────────────
function extractContext(text) {
  const low = text.toLowerCase()
  const ctx = { occasions: [], colors: [], budget: null, vibes: [], city: null, body: null, budgetCap: null }

  for (const [occ, kws] of Object.entries(OCCASION_MAP))
    if (kws.some(k => low.includes(k))) ctx.occasions.push(occ)

  for (const [color, kws] of Object.entries(COLOR_MAP))
    if (kws.some(k => low.includes(k))) ctx.colors.push(color)

  for (const [budget, kws] of Object.entries(BUDGET_KEYWORDS))
    if (kws.some(k => low.includes(k))) ctx.budget = budget

  for (const [vibe, kws] of Object.entries(VIBE_MAP))
    if (kws.some(k => low.includes(k))) ctx.vibes.push(vibe)

  for (const [city, kws] of Object.entries(CITY_MAP))
    if (kws.some(k => low.includes(k))) { ctx.city = city; break }

  ctx.body = BODY_KEYWORDS.find(k => low.includes(k)) || null

  const priceMatch = low.match(/(?:under|below|around|₹|rs\.?)\s*(\d{1,3}[kK]?)/)
  if (priceMatch) {
    const v = priceMatch[1]
    ctx.budgetCap = parseInt(v) * (v.toLowerCase().includes('k') ? 1000 : 1)
  }
  return ctx
}

function scoreProduct(product, ctx) {
  let score = 0
  const tags = `${product.tag} ${product.name} ${product.description} ${product.material}`.toLowerCase()

  for (const occ of ctx.occasions) {
    if (occ === 'pub' && (tags.includes('cocktail') || tags.includes('night'))) score += 30
    if (occ === 'club' && (tags.includes('club') || tags.includes('night'))) score += 30
    if (occ === 'rooftop' && (tags.includes('dinner') || tags.includes('gown') || tags.includes('evening'))) score += 25
    if (occ === 'dinner' && (tags.includes('dinner') || tags.includes('gown') || tags.includes('elegant'))) score += 25
    if (occ === 'wedding' && (tags.includes('bridal') || tags.includes('wedding') || tags.includes('traditional'))) score += 40
    if (occ === 'office' && (tags.includes('power') || tags.includes('work'))) score += 35
    if (occ === 'festival' && (tags.includes('festive') || tags.includes('traditional'))) score += 30
  }

  for (const color of ctx.colors) {
    const cStr = `${product.name} ${(product.colors || []).join(' ')}`.toLowerCase()
    if (cStr.includes(color)) score += 20
  }

  if (ctx.budget === 'low' && product.price < 9000) score += 15
  if (ctx.budget === 'high' && product.price >= 12000) score += 15
  if (ctx.budgetCap && product.price <= ctx.budgetCap) score += 20
  if (ctx.budgetCap && product.price > ctx.budgetCap * 1.2) score -= 20

  for (const vibe of ctx.vibes) {
    const vTag = (product.tag || '').toLowerCase()
    if (vibe === 'club' && (vTag.includes('club') || vTag.includes('night'))) score += 25
    if (vibe === 'cocktail' && (vTag.includes('cocktail') || vTag.includes('dinner'))) score += 20
  }

  if (product.stock === 0) score -= 100
  else if (product.stock <= 2) score -= 10
  score += (product.rating || 4) * 2
  return score
}

function rankProducts(text) {
  const products = getLiveProducts()
  const ctx = extractContext(text)
  const scored = products.map(p => ({ ...p, _score: scoreProduct(p, ctx) }))
  scored.sort((a, b) => b._score - a._score)
  return { products: scored.slice(0, 3), ctx }
}

function generateResponse(userText, rankedProducts, ctx) {
  const cityPhrase = ctx.city === 'mumbai' ? 'under Mumbai lights' :
    ctx.city === 'delhi' ? 'in Delhi' :
    ctx.city === 'bangalore' ? 'across Bangalore rooftops' : 'for your night out'

  const occasionIntros = {
    pub:     `Bar-ready and head-turning — here${APOSTROPHE}s what I${APOSTROPHE}d pick ${cityPhrase} 🍸`,
    club:    `Ready to own the dance floor? These pieces were made ${cityPhrase} 🔥`,
    rooftop: `Rooftop drama calls for pieces that catch the city lights ✨`,
    dinner:  `Date night needs something that says ${QUOTE}effortlessly stunning${QUOTE} 🌹`,
    wedding: `For the celebrations that matter — pieces that honour every moment 💍`,
    office:  `Power dressing that commands every room you walk into 💼`,
    festival:`Festive, vibrant, and unmistakably yours 🌸`,
    brunch:  `Sun-kissed and chic, perfect for a breezy afternoon ☀️`,
  }

  const intro = ctx.occasions.length > 0
    ? (occasionIntros[ctx.occasions[0]] || `Here${APOSTROPHE}s what I${APOSTROPHE}d pick ${cityPhrase} ✨`)
    : `Based on your vibe, here are my top picks for you ✨`

  const top = rankedProducts.filter(p => p.stock > 0)
  if (!top.length) return {
    intro: "You have excellent taste! All our current pieces are flying out — check back in 24h, or WhatsApp us for a custom order 🌸",
    products: [],
  }
  return { intro, products: top }
}

const APOSTROPHE = "'"
const QUOTE = '"'

// ── Thinking indicator ─────────────────────────────────────────
const THINKING_STEPS = [
  { icon: '🔄', text: 'Reading your vibe...' },
  { icon: '📦', text: 'Scanning the collection...' },
  { icon: '✨', text: 'Scoring each piece...' },
  { icon: '💅', text: 'Curating your looks...' },
]

function ThinkingBar({ step }) {
  return (
    <div className="flex items-center gap-3 p-3 glass rounded-2xl animate-fadeIn">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#b76e79]/30 to-[#6366f1]/30 flex items-center justify-center flex-shrink-0 animate-pulse">
        <span className="text-base">{THINKING_STEPS[step]?.icon}</span>
      </div>
      <div className="flex-1">
        <p className="text-[12px] text-white/70">{THINKING_STEPS[step]?.text}</p>
        <div className="flex gap-1 mt-1.5">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="h-0.5 rounded-full bg-gradient-to-r from-[#b76e79] to-[#6366f1]"
              style={{ width: `${12 + i * 6}px`, opacity: 0.3 + i * 0.1 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Product card in chat ───────────────────────────────────────
function ChatProductCard({ product, match }) {
  const { addToCart } = useCart()
  const { setProductModal } = useUI()
  const [added, setAdded] = useState(false)

  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden flex animate-fadeIn">
      <div className="relative w-24 flex-shrink-0 cursor-pointer" onClick={() => setProductModal(product)}>
        <img src={product.img} alt={product.name} className="w-full h-full object-cover object-top" style={{ minHeight: '110px' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
        <div className="absolute bottom-2 left-2">
          <span className="text-[8px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-1.5 py-0.5">
            {match}% match
          </span>
        </div>
      </div>
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <p className="text-[13px] font-semibold text-white font-serif truncate">{product.name}</p>
          <p className="text-[10px] text-white/40 leading-snug mb-1">{product.material}</p>
          <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-semibold bg-gradient-to-r ${product.tagColor} text-white`}>
            {product.tag}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[#e8a0a8] text-[12px] font-semibold">{product.priceDisplay}</p>
          <button
            onClick={() => { addToCart(product, 'M'); setAdded(true); setTimeout(() => setAdded(false), 2500) }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all active:scale-95 ${
              added ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'btn-liquid text-white'
            }`}
          >
            {added ? '✓ Added' : <><ShoppingBag className="w-2.5 h-2.5 mr-0.5" /> Add</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Chat message ───────────────────────────────────────────────
function ChatMessage({ message }) {
  if (message.type === 'user') {
    return (
      <div className="flex justify-end animate-fadeIn">
        <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#b76e79]/80 to-[#8b4f5a]/80 text-white text-[13px] leading-relaxed">
          {message.text}
        </div>
      </div>
    )
  }
  if (message.type === 'thinking') return <ThinkingBar step={message.step} />
  if (message.type === 'ai') {
    return (
      <div className="flex flex-col gap-3 animate-fadeIn">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#b76e79] to-[#6366f1] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 glass rounded-2xl rounded-tl-sm px-4 py-3">
            <p className="text-[13px] text-white/85 leading-relaxed">{message.intro}</p>
          </div>
        </div>
        {message.products?.length > 0 && (
          <div className="flex flex-col gap-2.5 ml-10">
            {message.products.map((p, i) => (
              <ChatProductCard key={p.id} product={p}
                match={Math.max(70, Math.min(99, 95 - i * 4))} />
            ))}
          </div>
        )}
      </div>
    )
  }
  return null
}

const QUICK_PROMPTS = [
  'Pub night in Bandra 🍸',
  'Rooftop dinner look ✨',
  'Club look under ₹8k 💎',
  'Something all black 🖤',
  'Wedding guest look 💍',
  'Office power dressing 💼',
]

// ── Main Component ─────────────────────────────────────────────
export default function AIStylist() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{
    type: 'ai',
    intro: "Hi gorgeous! 💖 I'm Ella, your on-device AI stylist — trained on every piece in the Ellaura collection. Tell me where you're heading and I'll find your perfect look.",
    products: [],
  }])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 300) }, [open])

  const runMLEngine = async (userText) => {
    if (isThinking) return
    setIsThinking(true)
    setMessages(prev => [...prev, { type: 'thinking', step: 0 }])
    for (let i = 1; i < THINKING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 550))
      setMessages(prev => [...prev.slice(0, -1), { type: 'thinking', step: i }])
    }
    await new Promise(r => setTimeout(r, 350))
    const { products, ctx } = rankProducts(userText)
    const { intro, products: recommended } = generateResponse(userText, products, ctx)
    setMessages(prev => [...prev.slice(0, -1), { type: 'ai', intro, products: recommended }])
    setIsThinking(false)
  }

  const handleSend = (text) => {
    const msg = (text || input).trim()
    if (!msg || isThinking) return
    setInput('')
    setMessages(prev => [...prev, { type: 'user', text: msg }])
    runMLEngine(msg)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-5 z-50 transition-all duration-500 ${open ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        aria-label="Open AI Stylist"
      >
        <div className="relative w-16 h-16 rounded-[22px] btn-liquid flex items-center justify-center shadow-2xl animate-pulse-rose">
          <Sparkles className="w-6 h-6 text-white" />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-[#e8a0a8] to-[#b76e79] flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
        </div>
        <p className="text-[9px] text-white/50 text-center mt-1.5 tracking-widest uppercase">AI Stylist</p>
      </button>

      <div
        className={`fixed inset-x-0 max-w-md mx-auto bottom-0 z-50 transition-all duration-500 ${
          open ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{ height: '85vh' }}
      >
        <div className="h-full flex flex-col glass-dark rounded-t-[32px] border border-[#b76e79]/20 shadow-[0_-20px_80px_rgba(183,110,121,0.15)] overflow-hidden">
          <div className="pt-3 pb-2 flex justify-center flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
          <div className="flex items-center justify-between px-5 pb-4 flex-shrink-0 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#b76e79] to-[#6366f1] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-base font-semibold text-white">Ella</h3>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium tracking-widest uppercase">Live</span>
                </div>
                <p className="text-[10px] text-white/35">AI Stylist · Style Intelligence Engine</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-all active:scale-90">
              <ChevronDown className="w-4 h-4 text-white/60" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4 scrollbar-hide">
            {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
            <div ref={messagesEndRef} />
          </div>

          {!isThinking && messages.length <= 1 && (
            <div className="px-4 pb-3 flex-shrink-0">
              <p className="text-[9px] text-white/25 tracking-widest uppercase mb-2">Try asking</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map(q => (
                  <button key={q} onClick={() => handleSend(q)}
                    className="px-3 py-1.5 rounded-xl glass border border-white/10 text-[11px] text-white/65 hover:text-white hover:bg-white/10 transition-all active:scale-95 whitespace-nowrap">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 pb-6 pt-3 flex-shrink-0 border-t border-white/5">
            <div className="flex items-end gap-3 glass rounded-2xl border border-[#b76e79]/15 px-4 py-3 focus-within:border-[#b76e79]/40 transition-all duration-300">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your night out..."
                rows={1}
                disabled={isThinking}
                className="flex-1 bg-transparent text-[14px] text-white placeholder-white/25 resize-none outline-none leading-relaxed max-h-24 scrollbar-hide"
                style={{ minHeight: '22px' }}
              />
              <button onClick={() => handleSend()} disabled={!input.trim() || isThinking}
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${input.trim() && !isThinking ? 'btn-liquid' : 'bg-white/5 cursor-not-allowed'}`}>
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-center text-[9px] text-white/15 tracking-widest uppercase mt-2">
              Ellaura AI · On-device Style Intelligence Engine
            </p>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm hidden md:block" onClick={() => setOpen(false)} />
      )}
    </>
  )
}
