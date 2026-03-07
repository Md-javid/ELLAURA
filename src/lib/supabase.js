import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Demo mode: forced via env flag, or when real credentials are not yet configured
// Real Supabase anon keys are long JWT tokens (~170+ chars starting with "eyJ")
const isValidKey = supabaseAnonKey &&
  supabaseAnonKey.length > 100 &&
  supabaseAnonKey.startsWith('eyJ') &&
  !supabaseAnonKey.includes('placeholder')

export const DEMO_MODE =
  import.meta.env.VITE_DEMO_MODE === 'true' ||
  !supabaseUrl ||
  !supabaseAnonKey ||
  !isValidKey ||
  supabaseUrl.includes('placeholder')

// ── Runtime offline detection ─────────────────────────────────
// Flips to true when Supabase is unreachable (paused project, no network, etc.)
// All auth/data helpers check this alongside DEMO_MODE.
let _supabaseOffline = false
export const isSupabaseOffline = () => _supabaseOffline

// Wraps a promise with a timeout; rejects with a network-style error on expiry.
const withTimeout = (promise, ms = 8000) => {
  const timer = new Promise((_, reject) =>
    setTimeout(() => reject(new TypeError('Supabase request timed out')), ms)
  )
  return Promise.race([promise, timer])
}

// Helper: run a Supabase call; on network / timeout error mark offline and throw.
const sbFetch = async (fn) => {
  try {
    return await withTimeout(fn())
  } catch (err) {
    if (err instanceof TypeError || err.message?.includes('timed out')) {
      if (!_supabaseOffline) {
        _supabaseOffline = true
        console.warn(
          '%c[Ellaura] Supabase unreachable — switching to offline/demo mode.\n' +
          'If your project is paused, visit https://app.supabase.com and resume it.',
          'color:#b76e79;font-weight:bold'
        )
      }
    }
    throw err
  }
}

// Convenience: are we operating in any non-live mode?
const isDemo = () => DEMO_MODE || _supabaseOffline

if (DEMO_MODE) {
  console.info(
    '%c[Ellaura] DEMO MODE — auth & orders are stored locally.\n' +
    'To connect Supabase, update .env with your real project credentials:\n' +
    '  VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=eyJhbGciOi... (long JWT key from Project Settings → API)',
    'color:#b76e79;font-weight:bold'
  )
}

// ── Demo user helpers (localStorage) ─────────────────────────
const DEMO_USER_KEY = 'ellaura_demo_user'
const DEMO_ORDERS_KEY = 'ellaura_demo_orders'

const getDemoUser = () => {
  try { return JSON.parse(localStorage.getItem(DEMO_USER_KEY)) } catch { return null }
}
const getDemoOrders = () => {
  try {
    const raw = localStorage.getItem(DEMO_ORDERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
const saveDemoOrders = (orders) => localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders))
const setDemoUser = (u) => localStorage.setItem(DEMO_USER_KEY, JSON.stringify(u))
const clearDemoUser = () => localStorage.removeItem(DEMO_USER_KEY)
const emitAuthChange = (user) =>
  window.dispatchEvent(new CustomEvent('ellaura_auth_change', { detail: user }))

// ── Mock Supabase client (used when DEMO_MODE = true) ─────────
const mockSupabase = {
  auth: {
    getSession: async () => ({
      data: { session: getDemoUser() ? { user: getDemoUser() } : null },
      error: null,
    }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    signOut: async () => { clearDemoUser(); emitAuthChange(null); return { error: null } },
  },
  from: (table) => ({
    select: (cols) => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        order: () => ({ data: null, error: null }),
      }),
      order: () => ({ data: null, error: null }),
    }),
    insert: () => ({ select: () => ({ single: async () => ({ data: { id: `demo_order_${Date.now()}` }, error: null }) }) }),
    upsert: async () => ({ error: null, data: null }),
    update: () => ({ eq: async () => ({ error: null }) }),
    delete: () => ({ eq: async () => ({ error: null }) }),
  }),
}

// Export the right client
export const supabase = DEMO_MODE ? mockSupabase : createClient(supabaseUrl, supabaseAnonKey)

// ── Demo auth helpers (shared by DEMO_MODE and offline fallback) ──
const demoSignUp = ({ email, fullName, phone, city, stylePreference }) => {
  const demoUser = {
    id: `demo_${Date.now()}`,
    email,
    user_metadata: { full_name: fullName, phone, city, style_preference: stylePreference },
  }
  setDemoUser(demoUser)
  emitAuthChange(demoUser)
  return { user: demoUser, session: { user: demoUser } }
}

const demoSignIn = ({ email }) => {
  const demoUser = {
    id: `demo_${email.replace(/[^a-z0-9]/gi, '_')}`,
    email,
    user_metadata: { full_name: email.split('@')[0] },
  }
  setDemoUser(demoUser)
  emitAuthChange(demoUser)
  return { user: demoUser, session: { user: demoUser } }
}

// ── Auth helpers ──────────────────────────────────────────────

export const signUp = async ({ email, password, fullName, phone, city, stylePreference }) => {
  if (isDemo()) return demoSignUp({ email, fullName, phone, city, stylePreference })
  try {
    const { data, error } = await sbFetch(() =>
      supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone, city, style_preference: stylePreference } },
      })
    )
    if (error) {
      // Rate-limited by Supabase — fall back to local demo auth
      if (error.message?.toLowerCase().includes('rate limit')) {
        console.warn('[Ellaura] Supabase email rate limit hit — using local auth instead.')
        return demoSignUp({ email, fullName, phone, city, stylePreference })
      }
      throw error
    }
    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          phone,
          city,
          style_preference: stylePreference,
        }).select()
      } catch { /* non-critical */ }
    }

    // If Supabase has email confirmation enabled, data.session will be null.
    // Auto-login with the same credentials so the user doesn't have to confirm email.
    if (data.user && !data.session) {
      try {
        const loginResult = await supabase.auth.signInWithPassword({ email, password })
        if (loginResult.error) {
          // Email confirmation is strictly required — fall back to local auth
          console.warn('[Ellaura] Email confirmation required — using local auth.')
          return demoSignUp({ email, fullName, phone, city, stylePreference })
        }
        return loginResult.data
      } catch {
        return demoSignUp({ email, fullName, phone, city, stylePreference })
      }
    }
    return data
  } catch (err) {
    if (err.message?.toLowerCase().includes('rate limit')) {
      console.warn('[Ellaura] Supabase email rate limit hit — using local auth instead.')
      return demoSignUp({ email, fullName, phone, city, stylePreference })
    }
    if (isDemo()) return demoSignUp({ email, fullName, phone, city, stylePreference })
    throw err
  }
}

export const signIn = async ({ email, password }) => {
  if (isDemo()) return demoSignIn({ email })
  try {
    const { data, error } = await sbFetch(() =>
      supabase.auth.signInWithPassword({ email, password })
    )
    if (error) {
      if (error.message?.toLowerCase().includes('rate limit')) {
        console.warn('[Ellaura] Supabase rate limit hit — using local auth instead.')
        return demoSignIn({ email })
      }
      throw error
    }
    return data
  } catch (err) {
    if (err.message?.toLowerCase().includes('rate limit')) {
      console.warn('[Ellaura] Supabase rate limit hit — using local auth instead.')
      return demoSignIn({ email })
    }
    if (isDemo()) return demoSignIn({ email })
    throw err
  }
}

export const signOut = async () => {
  if (isDemo()) { clearDemoUser(); emitAuthChange(null); return }
  try {
    const { error } = await sbFetch(() => supabase.auth.signOut())
    if (error) throw error
  } catch (err) {
    // Always clear local session even if network fails
    clearDemoUser(); emitAuthChange(null)
  }
}

export const getProfile = async (userId) => {
  if (isDemo()) return null
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('profiles').select('*').eq('id', userId).single()
    )
    if (error) return null
    return data
  } catch { return null }
}

// ── Orders ────────────────────────────────────────────────────

export const createOrder = async ({ userId, items, total, subtotal, shippingAddress, stripePaymentIntentId }) => {
  const orderSubtotal = subtotal ?? total
  if (isDemo()) {
    const order = {
      id: `demo_order_${Date.now()}`,
      user_id: userId || null,
      guest_email: !userId ? (shippingAddress?.email || null) : null,
      items,
      subtotal: orderSubtotal,
      total,
      shipping_address: shippingAddress,
      stripe_payment_intent: stripePaymentIntentId,
      status: 'pending',
      created_at: new Date().toISOString(),
    }
    const prev = getDemoOrders()
    saveDemoOrders([order, ...prev])
    return order
  }
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('orders').insert({
        user_id: userId,
        items,
        subtotal: orderSubtotal,
        total,
        shipping_address: shippingAddress,
        stripe_payment_intent: stripePaymentIntentId,
        status: 'pending',
      }).select().single()
    )
    if (error) throw error
    return data
  } catch (err) {
    if (isDemo()) return { id: `demo_order_${Date.now()}` }
    throw err
  }
}

export const getUserOrders = async (userId) => {
  if (isDemo()) {
    if (!userId) return []
    return getDemoOrders().filter(o => o.user_id === userId)
  }
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('orders').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false })
    )
    if (error) throw error
    return data || []
  } catch { return [] }
}

export const updateOrderStatus = async (orderId, status) => {
  if (isDemo()) {
    const updated = getDemoOrders().map(o =>
      o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o
    )
    saveDemoOrders(updated)
    return
  }
  try {
    const { error } = await sbFetch(() =>
      supabase.from('orders').update({ status }).eq('id', orderId)
    )
    if (error) throw error
  } catch { /* offline — skip */ }
}

// Decrements a product's stock by `qty` units (floor: 0).
export const decrementProductStock = async (productId, qty) => {
  if (isDemo()) {
    try {
      const raw = localStorage.getItem('ellaura_admin_products')
      const products = raw ? JSON.parse(raw) : []
      const updated = products.map(p =>
        p.id === productId ? { ...p, stock: Math.max(0, (p.stock ?? 0) - qty) } : p
      )
      if (updated.some(p => p.id === productId)) {
        localStorage.setItem('ellaura_admin_products', JSON.stringify(updated))
      }
    } catch { /* ignore */ }
    return
  }
  try {
    // Fetch current stock then update — safe for low-concurrency stores
    const { data } = await sbFetch(() =>
      supabase.from('products').select('stock').eq('id', productId).single()
    )
    if (data != null) {
      await sbFetch(() =>
        supabase.from('products')
          .update({ stock: Math.max(0, (data.stock ?? 0) - qty) })
          .eq('id', productId)
      )
    }
  } catch { /* non-critical — ignore */ }
}

// ── Products ──────────────────────────────────────────────────
// Reads the live product catalogue from Supabase.
// Returns null in DEMO_MODE — callers fall back to localStorage.
export const getProducts = async () => {
  if (isDemo()) return null
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('products').select('*').order('created_at', { ascending: true })
    )
    if (error) throw error
    return data.map(dbProductToApp)
  } catch { return null }
}

export const upsertProduct = async (product) => {
  if (isDemo()) return null
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('products').upsert(appProductToDB(product, true)).select().single()
    )
    if (error) {
      // Backward compatibility when DB schema doesn't yet have products.images.
      const errMsg = error.message || ''
      const missingImagesColumn =
        /column\s+"?images"?\s+of\s+relation\s+"?products"?/i.test(errMsg) ||
        /could not find the ['"]images['"] column of ['"]products['"]/i.test(errMsg)
      if (!missingImagesColumn) throw error

      const retry = await sbFetch(() =>
        supabase.from('products').upsert(appProductToDB(product, false)).select().single()
      )
      if (retry.error) throw retry.error
      return dbProductToApp(retry.data)
    }
    return dbProductToApp(data)
  } catch { return null }
}

export const deleteProduct = async (id) => {
  if (isDemo()) return null
  try {
    const { error } = await sbFetch(() =>
      supabase.from('products').delete().eq('id', id)
    )
    if (error) throw error
  } catch { /* offline — skip */ }
}

// ── Reviews ───────────────────────────────────────────────────
export const getProductReviews = async (productId) => {
  if (isDemo()) return []
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('reviews').select('*').eq('product_id', productId)
        .order('created_at', { ascending: false })
    )
    if (error) throw error
    return data || []
  } catch { return [] }
}

export const submitReview = async ({ productId, userId, guestName, rating, body }) => {
  if (isDemo()) return { id: `demo_review_${Date.now()}` }
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('reviews').insert({
        product_id: productId,
        user_id: userId || null,
        guest_name: guestName || null,
        rating,
        body,
        verified: !!userId,
      }).select().single()
    )
    if (error) throw error
    return data
  } catch { return { id: `demo_review_${Date.now()}` } }
}

// ── Coupons ───────────────────────────────────────────────────
export const validateCoupon = async (code, orderTotal) => {
  if (isDemo()) {
    // Built-in hardcoded coupons for demo
    const DEMO_COUPONS = {
      'ELLAURA10': { type: 'percent', value: 10, label: '10% off' },
      'LAUNCH20': { type: 'percent', value: 20, label: '20% off' },
      'BANDRA500': { type: 'fixed', value: 500, label: '₹500 off' },
      'VIP15': { type: 'percent', value: 15, label: '15% off' },
    }
    const c = DEMO_COUPONS[code.toUpperCase()]
    if (!c) return { valid: false, error: 'Invalid coupon code' }
    return { valid: true, ...c, code: code.toUpperCase() }
  }
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('coupons').select('*').eq('code', code.toUpperCase()).eq('active', true).single()
    )
    if (error || !data) return { valid: false, error: 'Invalid coupon code' }
    if (data.expires_at && new Date(data.expires_at) < new Date())
      return { valid: false, error: 'Coupon has expired' }
    if (data.max_uses && data.uses_count >= data.max_uses)
      return { valid: false, error: 'Coupon usage limit reached' }
    if (orderTotal < data.min_order)
      return { valid: false, error: `Minimum order ₹${data.min_order} required for this coupon` }
    return {
      valid: true,
      type: data.discount_type,
      value: data.discount_value,
      label: `${data.discount_type === 'percent' ? data.discount_value + '%' : '₹' + data.discount_value} off`,
      code: data.code,
    }
  } catch { return { valid: false, error: 'Service unavailable, try again later' } }
}

export const incrementCouponUse = async (code) => {
  if (isDemo()) return
  try { await sbFetch(() => supabase.rpc('increment_coupon_use', { coupon_code: code })) } catch { /* offline */ }
}

// ── Saved Addresses ───────────────────────────────────────────
const DEMO_ADDRESSES_KEY = 'ellaura_saved_addresses'

const getDemoAddresses = () => {
  try { return JSON.parse(localStorage.getItem(DEMO_ADDRESSES_KEY) || '[]') } catch { return [] }
}
const saveDemoAddresses = (arr) => localStorage.setItem(DEMO_ADDRESSES_KEY, JSON.stringify(arr))

export const getSavedAddresses = async (userId) => {
  if (!userId) return []
  if (isDemo()) return getDemoAddresses().filter(a => a.user_id === userId)
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('addresses').select('*').eq('user_id', userId).order('is_default', { ascending: false })
    )
    if (error) throw error
    return data || []
  } catch { return [] }
}

export const saveAddress = async (userId, addr) => {
  if (!userId) return null
  const entry = { ...addr, user_id: userId, updated_at: new Date().toISOString() }
  if (isDemo()) {
    const existing = getDemoAddresses()
    // Check if identical address already exists for this user
    const dup = existing.find(a =>
      a.user_id === userId &&
      a.line1?.trim().toLowerCase() === addr.line1?.trim().toLowerCase() &&
      a.pincode === addr.pincode
    )
    if (dup) return dup
    const newEntry = { ...entry, id: `addr_${Date.now()}`, is_default: existing.filter(a => a.user_id === userId).length === 0 }
    saveDemoAddresses([...existing, newEntry])
    return newEntry
  }
  try {
    const { data: existing } = await sbFetch(() =>
      supabase.from('addresses').select('id').eq('user_id', userId)
        .ilike('line1', addr.line1).eq('pincode', addr.pincode).maybeSingle()
    )
    if (existing) return existing
    const isFirst = (await getSavedAddresses(userId)).length === 0
    const { data, error } = await sbFetch(() =>
      supabase.from('addresses').insert({ ...entry, is_default: isFirst }).select().single()
    )
    if (error) throw error
    return data
  } catch { return null }
}

// ── WhatsApp Order Notification ───────────────────────────────
// Sends order details to your WhatsApp number via wa.me link (opens WhatsApp).
// VITE_WHATSAPP_NUMBER should be set in .env as country code + number, e.g. 919876543210
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || ''

export const sendWhatsAppOrderNotification = ({ orderId, items, total, shipping, userId }) => {
  if (!WHATSAPP_NUMBER) return
  const shortId = String(orderId).slice(-8).toUpperCase()
  const itemLines = (items || []).map(i => {
    const name = i.product?.name || i.name || 'Product'
    const size = i.size || ''
    const qty = i.qty || 1
    const price = i.product?.price || i.price || 0
    return `  • ${name} (Size: ${size}, Qty: ${qty}) — ₹${(price * qty).toLocaleString('en-IN')}`
  }).join('\n')
  const addr = shipping || {}
  const addressLine = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
  const message = [
    `🛍️ *New Ellaura Order — #${shortId}*`,
    ``,
    `👤 *Customer*`,
    `  Name: ${addr.name || '—'}`,
    `  Phone: ${addr.phone || '—'}`,
    `  Email: ${addr.email || '—'}`,
    ``,
    `📦 *Items Ordered*`,
    itemLines,
    ``,
    `💰 *Total: ₹${(total || 0).toLocaleString('en-IN')}*`,
    ``,
    `📍 *Delivery Address*`,
    `  ${addressLine}`,
    ``,
    `🔖 Order ID: ${orderId}`,
  ].join('\n')
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

// ── Column mappers ────────────────────────────────────────────
function appProductToDB(p, includeImages = true) {
  const payload = {
    id: p.id,
    name: p.name,
    price: p.price,
    price_display: p.priceDisplay,
    category: p.category,
    vibe: p.vibe,
    tag: p.tag,
    tag_color: p.tagColor,
    badge: p.badge,
    rating: p.rating,
    reviews: p.reviews,
    img: p.img,
    img_alt: p.imgAlt,
    description: p.description,
    sizes: p.sizes,
    colors: p.colors,
    delivery_days: p.deliveryDays,
    stock: p.stock,
    active: p.active !== false,
  }

  if (includeImages) {
    payload.images = Array.isArray(p.images) ? p.images : [p.img].filter(Boolean)
  }

  return payload
}

function dbProductToApp(r) {
  const imageList = Array.isArray(r.images) ? r.images.filter(Boolean) : []
  const primaryImage = r.img || imageList[0] || ''
  return {
    id: r.id,
    name: r.name,
    price: r.price,
    priceDisplay: r.price_display,
    category: r.category,
    vibe: r.vibe || [],
    tag: r.tag,
    tagColor: r.tag_color,
    badge: r.badge,
    rating: r.rating,
    reviews: r.reviews,
    img: primaryImage,
    images: imageList.length ? imageList : [primaryImage].filter(Boolean),
    imgAlt: r.img_alt,
    description: r.description,
    sizes: r.sizes || [],
    colors: r.colors || [],
    deliveryDays: r.delivery_days,
    stock: r.stock,
    active: r.active,
  }
}
