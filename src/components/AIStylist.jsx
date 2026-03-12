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
  pub:      ['pub','bar','lounge','night out','nightout','party','drinks'],
  club:     ['club','dance','dj','rave','nightclub','clubbing'],
  rooftop:  ['rooftop','terrace','outdoor','sky bar','high rise','skyline'],
  dinner:   ['dinner','restaurant','fine dining','date night','date','anniversary','candle'],
  wedding:  ['wedding','reception','sangeet','bride','mehendi','engagement','shaadi','function'],
  office:   ['office','work','meeting','corporate','professional','presentation','interview'],
  brunch:   ['brunch','lunch','daytime','afternoon','casual'],
  festival: ['festival','holi','diwali','navratri','festive','celebration','garba','puja'],
}

// Occasions that naturally align with each vibe
const OCCASION_VIBE = {
  pub:     ['cocktail','club'],
  club:    ['club'],
  rooftop: ['cocktail'],
  dinner:  ['cocktail'],
  wedding: ['cocktail'],
  office:  [],
  brunch:  ['cocktail'],
  festival:['cocktail','club'],
}

// Category keywords a user might type
const CATEGORY_MAP = {
  midi:    ['midi','mid length','mid-length','knee length'],
  slip:    ['slip','satin','slip dress'],
  gown:    ['gown','floor length','long dress','maxi dress','formal'],
  bodycon: ['bodycon','body con','tight','fitted','figure hugging'],
  mini:    ['mini','short dress','short'],
  maxi:    ['maxi','long','floor'],
  'co-ord':['co-ord','coord','set','two piece','top and skirt'],
}

const COLOR_MAP = {
  black: ['black','noir','dark','charcoal','ebony','all black'],
  gold:  ['gold','golden','amber','warm','beige','caramel'],
  pink:  ['pink','rose','blush','mauve','soft pink'],
  red:   ['red','crimson','wine','berry','burgundy','maroon'],
  blue:  ['blue','navy','indigo','electric','cobalt'],
  white: ['white','ivory','cream','off-white','pearl'],
  brown: ['brown','chocolate','coffee','mocha','nude'],
}

const BUDGET_KEYWORDS = {
  low:  ['cheap','budget','affordable','under 5k','under 8k','low budget','not too expensive'],
  high: ['luxury','premium','expensive','splurge','high end','special','pricey'],
}

const VIBE_MAP = {
  cocktail: ['elegant','sophisticated','chic','classy','refined','minimal','feminine','graceful'],
  club:     ['bold','sexy','statement','edgy','fierce','glam','dramatic','party','hot','daring'],
}

const CITY_MAP = {
  mumbai:    ['mumbai','bandra','juhu','colaba','lower parel','andheri','powai','worli'],
  delhi:     ['delhi','cp','connaught','gk','defence colony','hauz khas','saket'],
  bangalore: ['bangalore','bengaluru','koramangala','indiranagar','whitefield'],
  hyderabad: ['hyderabad','banjara','jubilee','hitech city'],
  chennai:   ['chennai','t nagar','anna nagar','velachery'],
  coimbatore:['coimbatore','cbe','cbse'],
}

const BODY_KEYWORDS = ['petite','tall','slim','curvy','plus size','athletic','hourglass','plus']
const SIZE_KEYWORDS  = ['xs','s size','m size','l size','xl size','xxl','small','medium','large']

// ── Scoring Engine ─────────────────────────────────────────────
function extractContext(text) {
  const low = text.toLowerCase()
  const ctx = {
    occasions: [], colors: [], budget: null, vibes: [],
    categories: [], city: null, body: null, budgetCap: null, size: null,
  }

  for (const [occ, kws] of Object.entries(OCCASION_MAP))
    if (kws.some(k => low.includes(k))) ctx.occasions.push(occ)

  for (const [color, kws] of Object.entries(COLOR_MAP))
    if (kws.some(k => low.includes(k))) ctx.colors.push(color)

  for (const [cat, kws] of Object.entries(CATEGORY_MAP))
    if (kws.some(k => low.includes(k))) ctx.categories.push(cat)

  for (const [budget, kws] of Object.entries(BUDGET_KEYWORDS))
    if (kws.some(k => low.includes(k))) ctx.budget = budget

  for (const [vibe, kws] of Object.entries(VIBE_MAP))
    if (kws.some(k => low.includes(k))) ctx.vibes.push(vibe)

  // Also infer vibes from occasions
  for (const occ of ctx.occasions)
    for (const v of (OCCASION_VIBE[occ] || []))
      if (!ctx.vibes.includes(v)) ctx.vibes.push(v)

  for (const [city, kws] of Object.entries(CITY_MAP))
    if (kws.some(k => low.includes(k))) { ctx.city = city; break }

  ctx.body = BODY_KEYWORDS.find(k => low.includes(k)) || null
  ctx.size = SIZE_KEYWORDS.find(k => low.includes(k)) || null

  // Budget parsing — catches all common phrasings:
  // "under ₹8k", "budget is 5000", "my budget 10k", "have 8000", "1k budget", "₹5,000"
  const pricePatterns = [
    // "under/below/around/upto ₹8k" or "under 8000"
    /(?:under|below|around|upto|up to|within|atmost|at most)\s*[₹rs\.]*\s*(\d{1,3}(?:[,.]?\d{3})?[kK]?)/,
    // "₹8000" or "rs 8000"
    /[₹]\s*(\d{1,3}(?:[,.]?\d{3})?[kK]?)/,
    /(?:rs\.?)\s*(\d{1,3}(?:[,.]?\d{3})?[kK]?)/i,
    // "budget is 5k" / "budget of 5k" / "my budget 5k"
    /budget\s*(?:is|of|:|=)?\s*(\d{1,3}(?:[,.]?\d{3})?[kK]?)/,
    // "have 5k" / "got 5k"
    /(?:have|got|with)\s*(\d{1,3}(?:[,.]?\d{3})?[kK]?)\s*(?:budget|only|rupees|rs|₹)?/,
    // "5k budget" (number then word budget)
    /(\d{1,3}(?:[,.]?\d{3})?[kK]?)\s*(?:budget|rs|rupees|₹|only)/,
  ]
  for (const pat of pricePatterns) {
    const m = low.match(pat)
    if (m) {
      const v = m[1].replace(',', '')
      const parsed = parseFloat(v) * (v.toLowerCase().endsWith('k') ? 1000 : 1)
      if (parsed >= 100) { // ignore nonsense values
        ctx.budgetCap = parsed
        break
      }
    }
  }
  return ctx
}

function scoreProduct(product, ctx) {
  let score = 0
  const productVibes = product.vibe || []
  const productCategory = (product.category || '').toLowerCase()
  const searchableText = `${product.tag || ''} ${product.name || ''} ${product.description || ''} ${product.material || ''}`.toLowerCase()

  // ── Vibe match (direct from product.vibe array) ───────────────
  for (const v of ctx.vibes) {
    if (productVibes.includes(v)) score += 40
  }

  // ── Category match (direct from product.category) ─────────────
  for (const cat of ctx.categories) {
    if (productCategory === cat) score += 35
    else if (productCategory.includes(cat) || cat.includes(productCategory)) score += 20
  }

  // ── Occasion scoring via vibe + category ─────────────────────
  for (const occ of ctx.occasions) {
    const occVibes = OCCASION_VIBE[occ] || []
    if (occVibes.some(v => productVibes.includes(v))) score += 25
    // Also match occasion keywords in product text
    if (occ === 'pub'      && (searchableText.includes('cocktail') || searchableText.includes('night'))) score += 15
    if (occ === 'club'     && (searchableText.includes('club') || productVibes.includes('club'))) score += 15
    if (occ === 'rooftop'  && (searchableText.includes('gown') || searchableText.includes('evening') || productVibes.includes('cocktail'))) score += 15
    if (occ === 'dinner'   && (searchableText.includes('gown') || searchableText.includes('elegant') || productVibes.includes('cocktail'))) score += 15
    if (occ === 'wedding'  && (searchableText.includes('gown') || productCategory === 'gown' || productCategory === 'maxi')) score += 20
    if (occ === 'festival' && (searchableText.includes('festive') || productVibes.includes('cocktail'))) score += 15
  }

  // ── Color match ───────────────────────────────────────────────
  for (const color of ctx.colors) {
    const colorStr = `${product.name} ${(product.colors || []).join(' ')} ${product.description}`.toLowerCase()
    if (colorStr.includes(color)) score += 25
  }

  // ── Budget match ──────────────────────────────────────────────
  if (ctx.budget === 'low'  && product.price < 9000)  score += 15
  if (ctx.budget === 'high' && product.price >= 12000) score += 15
  if (ctx.budgetCap && product.price <= ctx.budgetCap)       score += 25
  if (ctx.budgetCap && product.price > ctx.budgetCap)        score -= 999 // hard exclude over-budget

  // ── Body type hints ───────────────────────────────────────────
  if (ctx.body === 'petite' && (productCategory === 'mini' || productCategory === 'midi')) score += 10
  if (ctx.body === 'tall'   && (productCategory === 'gown' || productCategory === 'maxi')) score += 10
  if (ctx.body === 'curvy'  && (productCategory === 'bodycon' || searchableText.includes('wrap'))) score += 10

  // ── Stock / rating boost ──────────────────────────────────────
  if (product.stock === 0) score -= 100
  else if (product.stock <= 2) score -= 10
  score += (product.rating || 4) * 2

  return score
}

function rankProducts(text) {
  const products = getLiveProducts()
  if (!products.length) return { products: [], ctx: extractContext(text) }
  const ctx = extractContext(text)
  const scored = products.map(p => ({ ...p, _score: scoreProduct(p, ctx) }))
  scored.sort((a, b) => b._score - a._score)
  const valid = scored.filter(p => p._score > 0)
  return { products: valid.slice(0, 3), ctx }
}

function buildMatchReason(product, ctx) {
  const reasons = []
  const productVibes = product.vibe || []
  const cat = product.category || ''

  if (ctx.occasions.length) {
    const occ = ctx.occasions[0]
    const occVibes = OCCASION_VIBE[occ] || []
    if (occVibes.some(v => productVibes.includes(v)))
      reasons.push(`perfect ${occ} look`)
  }
  if (ctx.vibes.some(v => productVibes.includes(v)))
    reasons.push(`${ctx.vibes.filter(v => productVibes.includes(v)).join(' & ')} vibe`)
  if (ctx.categories.includes(cat))
    reasons.push(`${cat} silhouette you asked for`)
  if (ctx.budgetCap && product.price <= ctx.budgetCap)
    reasons.push(`within your ₹${ctx.budgetCap.toLocaleString('en-IN')} budget`)
  if (ctx.colors.length) {
    const colorStr = `${product.name} ${(product.colors || []).join(' ')} ${product.description}`.toLowerCase()
    const matchedColor = ctx.colors.find(c => colorStr.includes(c))
    if (matchedColor) reasons.push(`${matchedColor} tone you wanted`)
  }
  return reasons.length ? reasons.slice(0, 2).join(' · ') : null
}

function generateResponse(userText, rankedProducts, ctx) {
  const cityPhrase = ctx.city === 'mumbai'     ? 'under Mumbai lights' :
                     ctx.city === 'delhi'       ? 'for Delhi nights' :
                     ctx.city === 'bangalore'   ? 'across Bangalore rooftops' :
                     ctx.city === 'hyderabad'   ? 'for Hyderabad evenings' :
                     ctx.city === 'chennai'     ? 'for Chennai nights' :
                     ctx.city === 'coimbatore'  ? 'straight from our Coimbatore atelier' : 'for your night out'

  const occasionIntros = {
    pub:      `Bar-ready and head-turning — here${AP}s what I${AP}d pick ${cityPhrase} 🍸`,
    club:     `Ready to own the dance floor? These pieces were made ${cityPhrase} 🔥`,
    rooftop:  `Rooftop drama calls for pieces that catch the city lights ✨`,
    dinner:   `Date night needs something that says ${QT}effortlessly stunning${QT} 🌹`,
    wedding:  `For the celebrations that matter — pieces that honour every moment 💍`,
    office:   `Power dressing that commands every room you walk into 💼`,
    festival: `Festive, vibrant, and unmistakably yours 🌸`,
    brunch:   `Sun-kissed and chic, perfect for a breezy afternoon ☀️`,
  }

  const top = rankedProducts.filter(p => p.stock > 0)
  if (!top.length) {
    if (ctx.budgetCap) {
      const fmt = `₹${ctx.budgetCap.toLocaleString('en-IN')}`
      return {
        intro: `Hmm, our current pieces start a little above ${fmt} — but every look in our collection is made to order, just for you. Want to explore what${AP}s available, or reach us for a special deal? 💖`,
        products: [], reasons: [], awaitingExplore: true,
      }
    }
    return {
      intro: `You have excellent taste! All our current pieces are flying out — check back very soon, or reach us for a custom order 🌸`,
      products: [], reasons: [], awaitingExplore: true,
    }
  }

  const intro = ctx.occasions.length > 0
    ? (occasionIntros[ctx.occasions[0]] || `Here${AP}s what I${AP}d pick ${cityPhrase} ✨`)
    : ctx.vibes.length > 0
      ? `Curated for your ${ctx.vibes[0]} vibe — every piece from our live collection ✨`
      : ctx.categories.length > 0
        ? `I found these ${ctx.categories[0]} styles in our collection for you 🌸`
        : `Based on your vibe, here are my top picks from our live collection ✨`

  const reasons = top.map(p => buildMatchReason(p, ctx))
  return { intro, products: top, reasons }
}

const AP = "'"
const QT = '"'

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
function ChatProductCard({ product, match, reason }) {
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
          {/* Category + Vibe pills */}
          <div className="flex flex-wrap gap-1 my-1">
            {product.category && (
              <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full glass border border-white/10 text-white/40 uppercase tracking-wide">
                {product.category}
              </span>
            )}
            {(product.vibe || []).map(v => (
              <span key={v} className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#b76e79]/15 border border-[#b76e79]/20 text-[#e8a0a8]/70">
                {v === 'cocktail' ? '🍸' : v === 'club' ? '🌙' : '✦'} {v}
              </span>
            ))}
          </div>
          {/* Why matched */}
          {reason && (
            <p className="text-[9px] text-[#6366f1]/70 leading-snug mb-1 italic">✓ {reason}</p>
          )}
          <p className="text-[10px] text-white/35 leading-snug truncate">{product.material?.split('•')[0]?.trim()}</p>
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
  if (message.type === 'contact') {
    return (
      <div className="flex items-start gap-2.5 animate-fadeIn">
        <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#b76e79] to-[#6366f1] flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 glass rounded-2xl rounded-tl-sm px-4 py-3 flex flex-col gap-3">
          <p className="text-[13px] text-white/85 leading-relaxed">{message.text}</p>
          <a
            href={`https://wa.me/919087915193?text=Hi%20Ellaura!%20I%20need%20help%20finding%20something%20within%20my%20budget%20%F0%9F%92%96`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366]/20 border border-[#25D366]/50 text-[#25D366] text-[13px] font-semibold hover:bg-[#25D366]/30 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Chat on WhatsApp
          </a>
        </div>
      </div>
    )
  }
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
                match={Math.max(70, Math.min(99, 95 - i * 4))}
                reason={message.reasons?.[i]} />
            ))}
          </div>
        )}
      </div>
    )
  }
  return null
}

const QUICK_PROMPTS = [
  'Pub night out 🍸',
  'Rooftop dinner look ✨',
  'Club look under ₹8k 🌙',
  'Something all black 🖤',
  'Wedding guest look 💍',
  'Show me midi dresses 👗',
]

// ── Main Component ─────────────────────────────────────────────
export default function AIStylist() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{
    type: 'ai',
    intro: "Hi gorgeous! 💖 I'm Ella, your AI stylist — I know every piece in the Ellaura collection. Tell me your occasion, vibe, budget or category and I'll pick the perfect look for you!",
    products: [],
    reasons: [],
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

    // If user says yes/sure after a budget-not-found or no-stock prompt, show WhatsApp CTA
    const isAffirmative = /^(yes|yeah|sure|ok|okay|yep|yup|show me|explore|contact|whatsapp)\b/i.test(userText.trim())
    const lastMsg = messages[messages.length - 1]
    if (isAffirmative && lastMsg?.awaitingExplore) {
      await new Promise(r => setTimeout(r, 600))
      setMessages(prev => [...prev, {
        type: 'contact',
        text: "Here's how to reach us — we'd love to find something perfect for you! 💖",
      }])
      setIsThinking(false)
      return
    }

    setMessages(prev => [...prev, { type: 'thinking', step: 0 }])
    for (let i = 1; i < THINKING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 550))
      setMessages(prev => [...prev.slice(0, -1), { type: 'thinking', step: i }])
    }
    await new Promise(r => setTimeout(r, 350))
    const { products, ctx } = rankProducts(userText)
    const { intro, products: recommended, reasons, awaitingExplore } = generateResponse(userText, products, ctx)
    setMessages(prev => [...prev.slice(0, -1), { type: 'ai', intro, products: recommended, reasons, awaitingExplore }])
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
