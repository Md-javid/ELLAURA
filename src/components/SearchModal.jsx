import { useState, useEffect, useRef } from 'react'
import { X, Search, ArrowRight, ShoppingBag } from 'lucide-react'
import { searchProducts } from '../lib/products'
import { useCart, useUI } from '../context/AppContext'

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const inputRef = useRef(null)
  const { addToCart } = useCart()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const results = searchProducts(query)
    setResults(results)
  }, [query])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex flex-col pt-20 sm:items-center sm:justify-start sm:pt-24 px-4 sm:px-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/92 backdrop-blur-xl" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl mx-auto animate-slideDown">
        {/* Search input */}
        <div className="glass-dark rounded-2xl border border-white/10 px-5 py-4 flex items-center gap-3 shadow-2xl">
          <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search dresses, tags, vibes..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-white/25 outline-none text-[15px]"
          />
          <button onClick={onClose} className="w-8 h-8 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Results */}
        <div className="mt-3 glass-dark rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          {query.trim() === '' ? (
            <div className="p-6 text-center text-white/30">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Start typing to search our collection</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {['Gown', 'Club & Party', 'Midi', 'Black'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1.5 glass rounded-xl text-[11px] text-white/50 hover:text-white border border-white/10 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-white/30">
              <p className="text-sm">No pieces found for "<span className="text-white/50">{query}</span>"</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              <div className="px-4 py-2.5 border-b border-white/5">
                <p className="text-[10px] tracking-[0.2em] text-white/30 uppercase">{results.length} piece{results.length !== 1 ? 's' : ''} found</p>
              </div>
              {results.map(product => (
                <div key={product.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/5 transition-colors group">
                  <img
                    src={product.img}
                    alt={product.imgAlt}
                    className="w-12 h-16 rounded-xl object-cover object-top flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm font-semibold text-white/90 truncate">{product.name}</p>
                    <p className="text-[11px] text-white/40 mt-0.5 truncate">{product.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${product.tagColor}`}>{product.tag}</span>
                      <span className="text-xs font-semibold text-[#e8a0a8]">{product.priceDisplay}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { addToCart(product, 'M'); onClose() }}
                    className="w-9 h-9 rounded-xl btn-liquid flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                  >
                    <ShoppingBag className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
