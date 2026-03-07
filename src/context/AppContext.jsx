import { createContext, useContext, useReducer, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ── Cart Context ───────────────────────────────────────────────

const CartContext = createContext(null)
const AuthContext = createContext(null)
const UIContext = createContext(null)

// Cart reducer
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find(
        i => i.product.id === action.product.id && i.size === action.size
      )
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.product.id === action.product.id && i.size === action.size
              ? { ...i, qty: i.qty + 1 }
              : i
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, { product: action.product, size: action.size || 'M', qty: 1 }],
      }
    }
    case 'REMOVE':
      return {
        ...state,
        items: state.items.filter(
          i => !(i.product.id === action.productId && i.size === action.size)
        ),
      }
    case 'UPDATE_QTY':
      if (action.qty < 1) {
        return {
          ...state,
          items: state.items.filter(
            i => !(i.product.id === action.productId && i.size === action.size)
          ),
        }
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.product.id === action.productId && i.size === action.size
            ? { ...i, qty: action.qty }
            : i
        ),
      }
    case 'CLEAR':
      return { ...state, items: [] }
    case 'HYDRATE':
      return { ...state, items: action.items }
    default:
      return state
  }
}

// ── Providers ──────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, { items: [] })
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // UI state
  const [searchOpen, setSearchOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState(null) // { message, type }
  const [toastTimer, setToastTimer] = useState(null)
  const [productModal, setProductModal] = useState(null) // product object or null

  // Hydrate cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ellaura_cart')
      if (saved) dispatch({ type: 'HYDRATE', items: JSON.parse(saved) })
    } catch { }
  }, [])

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem('ellaura_cart', JSON.stringify(cart.items))
    } catch { }
  }, [cart.items])

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    // Listen for custom auth events dispatched by supabase.js helpers
    // (fires in demo mode AND when runtime fallback to local auth occurs)
    const onDemoAuth = (e) => {
      setUser(e.detail ?? null)
      setAuthLoading(false)
    }
    window.addEventListener('ellaura_auth_change', onDemoAuth)
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('ellaura_auth_change', onDemoAuth)
    }
  }, [])

  // Cart helpers
  const cartCount = cart.items.reduce((n, i) => n + i.qty, 0)
  const cartTotal = cart.items.reduce((n, i) => n + i.product.price * i.qty, 0)

  const addToCart = (product, size = 'M') => {
    dispatch({ type: 'ADD', product, size })
    showToast(`${product.name} (${size}) added to bag!`, 'success')
  }

  const removeFromCart = (productId, size) => {
    dispatch({ type: 'REMOVE', productId, size })
  }

  const updateQty = (productId, size, qty) => {
    dispatch({ type: 'UPDATE_QTY', productId, size, qty })
  }

  const clearCart = () => dispatch({ type: 'CLEAR' })

  // Toast helper
  const showToast = (message, type = 'info') => {
    if (toastTimer) clearTimeout(toastTimer)
    setToast({ message, type })
    const t = setTimeout(() => setToast(null), 3000)
    setToastTimer(t)
  }

  return (
    <AuthContext.Provider value={{ user, profile, authLoading }}>
      <CartContext.Provider value={{
        items: cart.items, cartCount, cartTotal,
        addToCart, removeFromCart, updateQty, clearCart,
        cartOpen, setCartOpen,
      }}>
        <UIContext.Provider value={{
          searchOpen, setSearchOpen,
          toast, showToast,
          productModal, setProductModal,
        }}>
          {children}
        </UIContext.Provider>
      </CartContext.Provider>
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export const useCart = () => useContext(CartContext)
export const useUI = () => useContext(UIContext)
