import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import { useCart, useAuth } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

export default function CartSidebar() {
  const { items, cartCount, cartTotal, cartOpen, setCartOpen, removeFromCart, updateQty, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleCheckout = () => {
    setCartOpen(false)
    if (!user) {
      navigate('/login?redirect=checkout')
    } else {
      navigate('/checkout')
    }
  }

  const formatPrice = (paise) =>
    `₹${paise.toLocaleString('en-IN')}`

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-500 ${cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />

        {/* Sidebar */}
        <div className={`absolute top-0 right-0 h-full w-full max-w-md flex flex-col glass-dark border-l border-white/10 shadow-2xl transition-transform duration-500 ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 flex-shrink-0">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-[#e8a0a8]" />
              <h2 className="font-serif text-lg font-semibold text-white">Your Bag</h2>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#e8a0a8] to-[#b76e79] text-[10px] font-bold text-white flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-white/20" />
                </div>
                <div>
                  <p className="font-serif text-lg text-white/40 mb-1">Your bag is empty</p>
                  <p className="text-[13px] text-white/25">Add pieces to get started</p>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="btn-liquid rounded-2xl px-6 py-3 text-sm font-medium text-white mt-2"
                >
                  Explore Collection →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {items.map(({ product, size, qty }) => (
                  <div key={`${product.id}-${size}`} className="glass rounded-2xl border border-white/8 p-4 flex gap-4">
                    <img
                      src={product.img}
                      alt={product.imgAlt}
                      className="w-20 h-24 rounded-xl object-cover object-top flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-serif text-sm font-semibold text-white/90 leading-tight">{product.name}</p>
                          <button
                            onClick={() => removeFromCart(product.id, size)}
                            className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-white/35">Size: <span className="text-white/60 font-medium">{size}</span></span>
                          <span className="text-white/20">·</span>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${product.tagColor}`}>{product.tag}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {/* Qty controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(product.id, size, qty - 1)}
                            className="w-7 h-7 rounded-lg glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
                          >
                            <Minus className="w-3 h-3 text-white/60" />
                          </button>
                          <span className="text-[13px] font-medium text-white/80 w-4 text-center">{qty}</span>
                          <button
                            onClick={() => updateQty(product.id, size, qty + 1)}
                            disabled={qty >= product.stock}
                            className="w-7 h-7 rounded-lg glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3 text-white/60" />
                          </button>
                        </div>
                        <p className="text-[#e8a0a8] font-semibold text-sm">
                          {formatPrice(product.price * qty)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="flex-shrink-0 px-6 py-5 border-t border-white/8 space-y-4">
              {/* Order summary */}
              <div className="glass-rose rounded-2xl border border-[#b76e79]/15 px-4 py-3.5 space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-white/50">Subtotal</span>
                  <span className="text-white/80">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-white/50">Custom stitching</span>
                  <span className="text-emerald-400 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-white/50">Express Delivery</span>
                  <span className="text-emerald-400 font-medium">Free</span>
                </div>
                <div className="border-t border-white/8 pt-2 flex justify-between">
                  <span className="font-semibold text-white text-sm">Total</span>
                  <span className="font-bold text-[#e8a0a8] text-base">{formatPrice(cartTotal)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full btn-liquid rounded-2xl py-4 text-[15px] font-semibold text-white flex items-center justify-center gap-2 tracking-wide active:scale-[0.98] transition-all"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={clearCart}
                className="w-full text-center text-[12px] text-white/25 hover:text-white/50 transition-colors py-1"
              >
                Clear bag
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
