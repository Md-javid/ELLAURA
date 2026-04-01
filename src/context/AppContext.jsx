import { createContext, useContext, useReducer, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  getWishlistDB, addToWishlistDB, removeFromWishlistDB,
  getCartItemsDB, upsertCartItemDB, removeCartItemDB, clearCartDB,
  getProducts,
} from '../lib/supabase'

// ── Cart Context ───────────────────────────────────────────────

const CartContext = createContext(null)
const AuthContext = createContext(null)
const UIContext = createContext(null)

// Cart reducer
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      // Custom measurements are never merged — always a new line
      const isCustom = action.size === 'Custom'
      const existing = !isCustom && state.items.find(
        i => i.product.id === action.product.id && i.size === action.size
      )
      if (existing) {
        if (existing.qty >= existing.product.stock) return state
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
        items: [...state.items, { product: action.product, size: action.size || 'M', qty: 1, measurements: action.measurements || null }],
      }
    }
    case 'REMOVE':
      return {
        ...state,
        items: state.items.filter(
          i => !(i.product.id === action.productId && i.size === action.size)
        ),
      }
    case 'UPDATE_QTY': {
      const targetItem = state.items.find(i => i.product.id === action.productId && i.size === action.size)
      if (action.qty < 1) {
        return {
          ...state,
          items: state.items.filter(
            i => !(i.product.id === action.productId && i.size === action.size)
          ),
        }
      }
      const cappedQty = targetItem ? Math.min(action.qty, targetItem.product.stock) : action.qty
      return {
        ...state,
        items: state.items.map(i =>
          i.product.id === action.productId && i.size === action.size
            ? { ...i, qty: cappedQty }
            : i
        ),
      }
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
  const [wishlistOpen, setWishlistOpen] = useState(false)

  // ── Theme (light / dark) ────────────────────────────────────
  // NOTE: Dark mode code is preserved. To re-enable, change 'light' to:
  //   localStorage.getItem('ellaura_theme') || 'light'
  // and unhide the toggle button in Header.jsx
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try { localStorage.setItem('ellaura_theme', theme) } catch {}
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  // ── Wishlist — per-user ────────────────────────────────────
  const wlKey = (uid) => `ellaura_wishlist_${uid || 'guest'}`

  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(wlKey(null)) || '[]') } catch { return [] }
  })

  // Reload wishlist whenever the logged-in user changes (login / logout / reload)
  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    const uid = user?.id

    if (!uid) {
      // Logged out — clear in-memory wishlist, user's own key is preserved in localStorage
      setWishlist([])
      return
    }

    // Try DB first; fall back to localStorage
    getWishlistDB(uid).then(dbItems => {
      if (cancelled) return
      if (dbItems !== null) {
        // Merge any items wishlisted as guest before logging in
        const guestItems = (() => {
          try { return JSON.parse(localStorage.getItem('ellaura_wishlist_guest') || '[]') } catch { return [] }
        })()
        const toMerge = guestItems.filter(p => !dbItems.some(d => d.id === p.id))
        if (toMerge.length > 0) {
          toMerge.forEach(p => addToWishlistDB(uid, p))
          localStorage.removeItem('ellaura_wishlist_guest')
        }
        const merged = [...dbItems, ...toMerge]
        try { localStorage.setItem(wlKey(uid), JSON.stringify(merged)) } catch {}
        setWishlist(merged)
      } else {
        // Offline / demo — load from user-specific key, merge any guest additions
        try {
          const userItems  = JSON.parse(localStorage.getItem(wlKey(uid)) || '[]')
          const guestItems = JSON.parse(localStorage.getItem(wlKey(null)) || '[]')
          const merged = [...userItems, ...guestItems.filter(g => !userItems.some(u => u.id === g.id))]
          if (guestItems.length > 0) localStorage.removeItem(wlKey(null))
          setWishlist(merged)
        } catch { setWishlist([]) }
      }
    })
    return () => { cancelled = true }
  }, [user?.id, authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── toggleWishlist: save synchronously so reloads never lose data ──
  const toggleWishlist = (product) => {
    const uid = user?.id || 'guest'
    const exists = wishlist.some(p => p.id === product.id)
    const next = exists
      ? wishlist.filter(p => p.id !== product.id)
      : [...wishlist, product]

    // Persist immediately to localStorage — don't rely on effects
    try { localStorage.setItem(wlKey(user?.id), JSON.stringify(next)) } catch {}

    // Sync to DB (fire-and-forget; local is already updated above)
    if (exists) {
      removeFromWishlistDB(user?.id, product.id)
    } else {
      addToWishlistDB(user?.id, product)
    }

    if (exists) {
      showToast(`${product.name} removed from wishlist`, 'info')
    } else {
      showToast(`${product.name} added to wishlist`, 'success')
    }
    setWishlist(next)
  }

  const isWishlisted = (id) => wishlist.some(p => p.id === id)

  // ── Cart — per-user ────────────────────────────────────────
  const cartKey = (uid) => `ellaura_cart_${uid || 'guest'}`

  // Reload cart whenever the logged-in user changes
  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    const uid = user?.id

    if (!uid) {
      dispatch({ type: 'HYDRATE', items: [] })
      return
    }

    // Helper: merge guest-cart items into a base list, removing the guest key after
    const mergeGuest = (base) => {
      try {
        const guest = JSON.parse(localStorage.getItem(cartKey(null)) || '[]')
        const merged = [...base]
        for (const g of guest) {
          if (!merged.some(i => i.product.id === g.product.id && i.size === g.size)) merged.push(g)
        }
        if (guest.length > 0) localStorage.removeItem(cartKey(null))
        return merged
      } catch { return base }
    }

    // Helper: remove cart items whose product no longer exists in live DB
    const validateAgainstLiveProducts = async (items) => {
      try {
        const liveProducts = await getProducts()
        if (!liveProducts || liveProducts.length === 0) return items // offline, keep as is
        const liveIds = new Set(liveProducts.map(p => p.id))
        return items.filter(i => {
          const exists = liveIds.has(i.product.id)
          if (!exists) console.info(`[Ellaura Cart] Removed deleted product: ${i.product.name}`)
          return exists
        })
      } catch { return items }
    }

    getCartItemsDB(uid).then(async dbItems => {
      if (cancelled) return
      let items
      if (dbItems !== null && dbItems.length > 0) {
        items = mergeGuest(dbItems)
      } else {
        try {
          const key = cartKey(uid)
          const stored = localStorage.getItem(key)
          const legacy = localStorage.getItem('ellaura_cart')
          const base = stored ? JSON.parse(stored) : legacy ? (() => {
            const it = JSON.parse(legacy)
            localStorage.setItem(key, legacy)
            localStorage.removeItem('ellaura_cart')
            return it
          })() : []
          items = mergeGuest(base)
          if (dbItems !== null) {
            items.forEach(i => upsertCartItemDB(uid, { productId: i.product.id, size: i.size, qty: i.qty, productSnapshot: i.product, measurements: i.measurements }))
          }
        } catch { items = [] }
      }

      // ── Validate: remove items deleted from admin panel ────────
      const validItems = await validateAgainstLiveProducts(items)
      if (cancelled) return
      dispatch({ type: 'HYDRATE', items: validItems })
      try { localStorage.setItem(cartKey(uid), JSON.stringify(validItems)) } catch {}

      // Sync merged/validated items to DB
      if (dbItems !== null) {
        validItems
          .filter(i => !dbItems.some(d => d.product.id === i.product.id && d.size === i.size))
          .forEach(i => upsertCartItemDB(uid, { productId: i.product.id, size: i.size, qty: i.qty, productSnapshot: i.product, measurements: i.measurements }))
        // Remove DB items that were deleted from admin
        dbItems
          .filter(d => !validItems.some(v => v.product.id === d.product.id && v.size === d.size))
          .forEach(d => removeCartItemDB(uid, d.product.id, d.size))
      }
    })
    return () => { cancelled = true }
  }, [user?.id, authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist cart — guard with authLoading so we never overwrite with stale state
  useEffect(() => {
    if (authLoading) return
    try {
      localStorage.setItem(cartKey(user?.id), JSON.stringify(cart.items))
    } catch { }
  }, [cart.items, authLoading, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const addToCart = (product, size = 'M', measurements = null) => {
    const label = size === 'Custom' ? 'Custom Fit' : size
    showToast(`${product.name} (${label}) added to bag!`, 'success')

    // Compute the new qty before dispatching so we pass the correct value to DB.
    // Custom-size items never merge — always qty 1.
    const existing = size !== 'Custom'
      ? cart.items.find(i => i.product.id === product.id && i.size === size)
      : null
    const newQty = existing ? Math.min(existing.qty + 1, product.stock) : 1

    dispatch({ type: 'ADD', product, size, measurements })

    // Synchronously write to localStorage so the item survives a browser close
    // before the persist effect fires (which runs after paint).
    try {
      const updatedItems = existing
        ? cart.items.map(i => i.product.id === product.id && i.size === size ? { ...i, qty: newQty } : i)
        : [...cart.items, { product, size: size || 'M', qty: 1, measurements: measurements || null }]
      localStorage.setItem(cartKey(user?.id), JSON.stringify(updatedItems))
    } catch {}

    upsertCartItemDB(user?.id, {
      productId: product.id, size, qty: newQty,
      productSnapshot: product, measurements,
    })
  }

  const removeFromCart = (productId, size) => {
    dispatch({ type: 'REMOVE', productId, size })
    removeCartItemDB(user?.id, productId, size)
  }

  const updateQty = (productId, size, qty) => {
    dispatch({ type: 'UPDATE_QTY', productId, size, qty })
    if (qty < 1) {
      removeCartItemDB(user?.id, productId, size)
    } else {
      const item = cart.items.find(i => i.product.id === productId && i.size === size)
      if (item) {
        const cappedQty = Math.min(qty, item.product.stock)
        upsertCartItemDB(user?.id, {
          productId, size, qty: cappedQty,
          productSnapshot: item.product, measurements: item.measurements,
        })
      }
    }
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR' })
    clearCartDB(user?.id)
  }

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
          wishlist, toggleWishlist, isWishlisted,
          wishlistOpen, setWishlistOpen,
          theme, toggleTheme,
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
