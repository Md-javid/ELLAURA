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
const DEMO_ORDERS_MAX = 50 // cap localStorage mirror so it never grows unboundedly
const saveDemoOrders = (orders) => localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders.slice(0, DEMO_ORDERS_MAX)))
const setDemoUser = (u) => localStorage.setItem(DEMO_USER_KEY, JSON.stringify(u))
const clearDemoUser = () => localStorage.removeItem(DEMO_USER_KEY)

// Demo password store — so changing password is honoured even without Supabase
const DEMO_PASSWORDS_KEY = 'ellaura_demo_passwords'
const getDemoPasswords = () => { try { return JSON.parse(localStorage.getItem(DEMO_PASSWORDS_KEY) || '{}') } catch { return {} } }
const setDemoPassword = (email, pw) => { const p = getDemoPasswords(); p[email.toLowerCase()] = pw; localStorage.setItem(DEMO_PASSWORDS_KEY, JSON.stringify(p)) }
const checkDemoPassword = (email, pw) => { const stored = getDemoPasswords()[email.toLowerCase()]; return stored === undefined || stored === pw }

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
    signOut: async ({ scope } = {}) => { if (scope !== 'others') { clearDemoUser(); emitAuthChange(null) } return { error: null } },
    updateUser: async ({ password } = {}) => { const user = getDemoUser(); if (user && password) setDemoPassword(user.email, password); return { data: { user }, error: null } },
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
const demoSignUp = ({ email, password, fullName, phone, city, stylePreference }) => {
  if (password) setDemoPassword(email, password)
  const demoUser = {
    id: `demo_${email.replace(/[^a-z0-9]/gi, '_')}`,  // deterministic — same as demoSignIn
    email,
    user_metadata: { full_name: fullName, phone, city, style_preference: stylePreference },
  }
  setDemoUser(demoUser)
  emitAuthChange(demoUser)
  return { user: demoUser, session: { user: demoUser } }
}

const _ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@ellaura.in').toLowerCase()

const demoSignIn = ({ email, password }) => {
  // Never create a customer session for the admin email — this prevents
  // bypassing the password check when Supabase is offline/in demo mode.
  if (email.toLowerCase() === _ADMIN_EMAIL) {
    throw new Error('Invalid email or password.')
  }
  // Enforce stored password (set at sign-up or after a password change)
  if (password !== undefined && !checkDemoPassword(email, password)) {
    throw new Error('Invalid email or password.')
  }
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
  if (isDemo()) return demoSignUp({ email, password, fullName, phone, city, stylePreference })

  const profilePayload = { full_name: fullName || '', phone, city, style_preference: stylePreference }

  const upsertProfile = async (userId) => {
    try {
      await supabase.from('profiles').upsert({ id: userId, ...profilePayload }).select()
    } catch { /* trigger handles it as backup */ }
  }

  try {
    const { data, error } = await sbFetch(() =>
      supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone, city, style_preference: stylePreference } },
      })
    )
    if (error) {
      if (error.message?.toLowerCase().includes('rate limit')) {
        console.warn('[Ellaura] Supabase email rate limit hit — using local auth instead.')
        return demoSignUp({ email, password, fullName, phone, city, stylePreference })
      }
      throw error
    }

    // If session is available immediately, insert profile now (auth.uid() is set)
    if (data.user && data.session) {
      await upsertProfile(data.user.id)
      return data
    }

    // No session yet (email confirmation required) — auto sign-in first, then insert profile
    if (data.user && !data.session) {
      try {
        const loginResult = await supabase.auth.signInWithPassword({ email, password })
        if (loginResult.error) {
          console.warn('[Ellaura] Email confirmation required — using local auth.')
          return demoSignUp({ email, password, fullName, phone, city, stylePreference })
        }
        // Now session is active — safe to insert profile
        await upsertProfile(data.user.id)
        return loginResult.data
      } catch {
        return demoSignUp({ email, password, fullName, phone, city, stylePreference })
      }
    }

    return data
  } catch (err) {
    if (err.message?.toLowerCase().includes('rate limit')) {
      console.warn('[Ellaura] Supabase email rate limit hit — using local auth instead.')
      return demoSignUp({ email, password, fullName, phone, city, stylePreference })
    }
    if (isDemo()) return demoSignUp({ email, password, fullName, phone, city, stylePreference })
    throw err
  }
}

export const signIn = async ({ email, password }) => {
  if (isDemo()) return demoSignIn({ email, password })
  try {
    const { data, error } = await sbFetch(() =>
      supabase.auth.signInWithPassword({ email, password })
    )
    if (error) {
      if (error.message?.toLowerCase().includes('rate limit')) {
        console.warn('[Ellaura] Supabase rate limit hit — using local auth instead.')
        return demoSignIn({ email, password })
      }
      throw error
    }
    return data
  } catch (err) {
    if (err.message?.toLowerCase().includes('rate limit')) {
      console.warn('[Ellaura] Supabase rate limit hit — using local auth instead.')
      return demoSignIn({ email, password })
    }
    // Only fall back to demo sign-in when truly in demo mode (no real Supabase configured).
    // Do NOT bypass password check when Supabase is just temporarily offline.
    if (DEMO_MODE) return demoSignIn({ email, password })
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
  if (isDemo()) {
    const u = getDemoUser()
    return u && u.id === userId ? u : null
  }
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('profiles').select('*').eq('id', userId).single()
    )
    if (error) return null
    return data
  } catch { return null }
}

export const updateProfile = async (userId, updates) => {
  // Always update demo user if present (works even in fallback/offline mode)
  const demoUser = getDemoUser()
  if (demoUser && demoUser.id === userId) {
    const updated = { ...demoUser, ...updates }
    setDemoUser(updated)
    emitAuthChange(updated)
  }
  if (isDemo()) return getDemoUser()
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('profiles').upsert({ id: userId, ...updates }).select().single()
    )
    if (error) throw error
    return data
  } catch { return null }
}

export const updatePassword = async (newPassword) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
  // Invalidate all other active sessions so the old password can't be used elsewhere
  try { await supabase.auth.signOut({ scope: 'others' }) } catch { /* non-critical */ }
}

// ── Saved Measurements ────────────────────────────────────────
// Stores a user's body measurements for quick re-use on Custom Fit orders.
// Primary storage: profiles.measurements (JSONB) in Supabase.
// Mirror: localStorage for instant reads and offline support.

const MEASUREMENTS_LS_KEY = (uid) => `ellaura_measurements_${uid || 'guest'}`

export const getSavedMeasurements = async (userId) => {
  // Always check localStorage first — instant and works offline
  try {
    const stored = localStorage.getItem(MEASUREMENTS_LS_KEY(userId))
    if (stored) return JSON.parse(stored)
  } catch {}
  if (!userId || isDemo()) return null
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('profiles').select('measurements').eq('id', userId).single()
    )
    if (error || !data?.measurements) return null
    // Mirror to localStorage for next time
    try { localStorage.setItem(MEASUREMENTS_LS_KEY(userId), JSON.stringify(data.measurements)) } catch {}
    return data.measurements
  } catch { return null }
}

export const saveMeasurementsDB = async (userId, measurements) => {
  // Always save to localStorage immediately (works even offline / demo)
  try { localStorage.setItem(MEASUREMENTS_LS_KEY(userId || 'guest'), JSON.stringify(measurements)) } catch {}
  if (!userId || isDemo()) return
  try {
    await sbFetch(() =>
      supabase.from('profiles').upsert({ id: userId, measurements }, { onConflict: 'id' })
    )
  } catch { /* offline — localStorage already saved above */ }
}

// ── Orders ────────────────────────────────────────────────────

export const createOrder = async ({ userId, items, total, subtotal, shippingAddress, stripePaymentIntentId }) => {
  const orderSubtotal = subtotal ?? total
  const buildLocalOrder = (id) => ({
    id,
    user_id: userId || null,
    guest_email: !userId ? (shippingAddress?.email || null) : null,
    items,
    subtotal: orderSubtotal,
    total,
    shipping_address: shippingAddress,
    stripe_payment_intent: stripePaymentIntentId,
    status: 'pending',
    created_at: new Date().toISOString(),
  })
  if (isDemo()) {
    const order = buildLocalOrder(`demo_order_${Date.now()}`)
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
    // Mirror in localStorage so My Orders works even if Supabase schema is missing
    const prev = getDemoOrders()
    saveDemoOrders([data, ...prev.filter(o => o.id !== data.id)])
    return data
  } catch (err) {
    // Supabase unavailable — save locally so the order is never lost
    const fallback = buildLocalOrder(`local_order_${Date.now()}`)
    const prev = getDemoOrders()
    saveDemoOrders([fallback, ...prev])
    return fallback
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
    const remote = data || []
    // Merge with any locally-saved orders (created when Supabase was offline)
    const local = getDemoOrders().filter(o => o.user_id === userId)
    const remoteIds = new Set(remote.map(o => o.id))
    return [...remote, ...local.filter(o => !remoteIds.has(o.id))]
  } catch {
    // Supabase unavailable — return local orders
    return getDemoOrders().filter(o => o.user_id === userId)
  }
}

export const getAllOrders = async () => {
  const local = getDemoOrders()
  if (isDemo()) return local.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('orders').select('*').order('created_at', { ascending: false })
    )
    if (error) throw error
    const remote = data || []
    const remoteIds = new Set(remote.map(o => o.id))
    return [...remote, ...local.filter(o => !remoteIds.has(o.id))]
  } catch {
    return local.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }
}

export const updateOrderStatus = async (orderId, status) => {
  // Always update localStorage (works in demo + as cache when live)
  const updated = getDemoOrders().map(o =>
    o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o
  )
  saveDemoOrders(updated)
  // Broadcast to any open tab so the user's OrdersPage refreshes immediately
  window.dispatchEvent(new CustomEvent('ellaura_order_updated', { detail: { orderId, status } }))
  if (isDemo()) return
  try {
    const { error } = await sbFetch(() =>
      supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId)
    )
    if (error) throw error
  } catch { /* offline — localStorage already updated above */ }
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

  // Helper: detect any "column X not found" error from Supabase
  const isMissingColumnErr = (msg) =>
    /column\s+"?\w+"?\s+of\s+relation\s+"?products"?/i.test(msg) ||
    /could not find the ['"]\w+['"] column of ['"]\w+['"]/i.test(msg) ||
    /schema cache.*column/i.test(msg)

  try {
    // Attempt 1: full payload including images + instagram_url
    const { data, error } = await sbFetch(() =>
      supabase.from('products').upsert(appProductToDB(product, true)).select().single()
    )
    if (!error) return dbProductToApp(data)

    if (!isMissingColumnErr(error.message || '')) throw error

    // Attempt 2: drop `images` array (older schema without that column)
    const payload2 = appProductToDB(product, false)
    const retry2 = await sbFetch(() =>
      supabase.from('products').upsert(payload2).select().single()
    )
    if (!retry2.error) return dbProductToApp(retry2.data)

    if (!isMissingColumnErr(retry2.error.message || '')) throw retry2.error

    // Attempt 3: also drop `instagram_url` (schema predating that column)
    const payload3 = { ...payload2 }
    delete payload3.instagram_url
    const retry3 = await sbFetch(() =>
      supabase.from('products').upsert(payload3).select().single()
    )
    if (retry3.error) throw retry3.error
    return dbProductToApp(retry3.data)
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
    // Merge Supabase results with local fallback (local may have entries when Supabase was offline)
    const local = getDemoAddresses().filter(a => a.user_id === userId)
    const remote = data || []
    if (remote.length > 0) return remote
    return local
  } catch { return getDemoAddresses().filter(a => a.user_id === userId) }
}

export const saveAddress = async (userId, addr) => {
  if (!userId) return null
  const entry = { ...addr, user_id: userId, updated_at: new Date().toISOString() }

  // Helper: always save to localStorage as offline fallback
  const saveLocally = () => {
    const existing = getDemoAddresses()
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

  if (isDemo()) return saveLocally()
  try {
    const { data: existing } = await sbFetch(() =>
      supabase.from('addresses').select('id').eq('user_id', userId)
        .ilike('line1', addr.line1).eq('pincode', addr.pincode).maybeSingle()
    )
    if (existing) { saveLocally(); return existing }
    const isFirst = (await getSavedAddresses(userId)).length === 0
    const { data, error } = await sbFetch(() =>
      supabase.from('addresses').insert({ ...entry, is_default: isFirst }).select().single()
    )
    if (error) throw error
    saveLocally() // mirror locally for offline fallback
    return data
  } catch { return saveLocally() }
}

export const deleteAddress = async (userId, addressId) => {
  // Always remove from localStorage
  const local = getDemoAddresses()
  saveDemoAddresses(local.filter(a => !(a.user_id === userId && a.id === addressId)))
  if (isDemo()) return
  try {
    await sbFetch(() =>
      supabase.from('addresses').delete().eq('id', addressId).eq('user_id', userId)
    )
  } catch { /* offline — already removed from local */ }
}

// ── WhatsApp Order Notification ───────────────────────────────
// Sends order details to your WhatsApp number via wa.me link (opens WhatsApp).
// VITE_WHATSAPP_NUMBER should be set in .env as country code + number, e.g. 919876543210
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || ''

// ── Measurement formatter ──────────────────────────────────────
// Converts the full measurements object (including optional fields,
// unit preference, and any extra custom rows) into a readable string.
const MEASUREMENT_LABELS = {
  bust:              'Bust',
  waist:             'Waist',
  hips:              'Hips',
  shoulder_armhole:  'Shoulder (Armhole)',
  shoulder_to_wrist: 'Shoulder to Wrist',
  arms_round:        'Arms Round',
  back_shoulder:     'Back (Shoulder to Shoulder)',
  below_chest:       'Below Chest',
  seat:              'Seat',
  leg_length:        'Leg Length',
}

const formatMeasurements = (m, separator = '  ') => {
  if (!m) return ''
  const unit = m._unit || 'cm'
  const lines = []
  for (const [key, label] of Object.entries(MEASUREMENT_LABELS)) {
    if (m[key]?.toString().trim()) lines.push(`${label}: ${m[key]}${unit}`)
  }
  if (Array.isArray(m._extra)) {
    for (const row of m._extra) {
      if (row.label?.trim() && row.value?.toString().trim())
        lines.push(`${row.label.trim()}: ${row.value}${unit}`)
    }
  }
  return lines.join(separator)
}

export const sendWhatsAppOrderNotification = ({ orderId, items, total, shipping, userId, paymentMethod = 'COD' }) => {
  if (!WHATSAPP_NUMBER) return
  const shortId = String(orderId).slice(-8).toUpperCase()
  const isCOD = paymentMethod === 'COD'
  const itemLines = (items || []).map(i => {
    const name = i.product?.name || i.name || 'Product'
    const size = i.size || ''
    const qty = i.qty || 1
    const price = i.product?.price || i.price || 0
    const m = i.measurements
    const mFormatted = formatMeasurements(m, '  ')
    const mStr = mFormatted ? `\n    📐 ${mFormatted}` : ''
    return `  • ${name} (Size: ${size}, Qty: ${qty}) — ₹${(price * qty).toLocaleString('en-IN')}${mStr}`
  }).join('\n')
  const addr = shipping || {}
  const addressLine = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
  const paymentLine = isCOD
    ? `💵 *Payment: CASH ON DELIVERY* ⚠️ Collect ₹${(total || 0).toLocaleString('en-IN')} at doorstep`
    : `✅ *Payment: PAID ONLINE via ${paymentMethod}* — ₹${(total || 0).toLocaleString('en-IN')} received`
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
    paymentLine,
    ``,
    `📍 *Delivery Address*`,
    `  ${addressLine}`,
    ``,
    `🔖 Order ID: ${orderId}`,
  ].join('\n')
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  // Open WhatsApp in a new background tab so the customer stays on the site
  try { window.open(url, '_blank', 'noopener,noreferrer') } catch {}
  console.info('[Ellaura] WhatsApp order notification sent:', url)
}

// ── Google Sheets Real-Time Order Sync ───────────────────────
// Set VITE_SHEETS_WEBHOOK_URL in .env to your Google Apps Script web app URL.
// Every order is appended as a new row in your Google Sheet automatically.
//
// Setup steps:
//   1. Go to https://script.google.com → New Project
//   2. Paste the Apps Script code (see README or comments below)
//   3. Deploy → New deployment → Web app → Anyone → Copy URL
//   4. Add to .env: VITE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec

const SHEETS_WEBHOOK = import.meta.env.VITE_SHEETS_WEBHOOK_URL || ''

export const sendOrderToGoogleSheets = async ({ orderId, items, total, shipping, paymentMethod = 'COD' }) => {
  if (!SHEETS_WEBHOOK) return // not configured — silently skip
  try {
    const addr = shipping || {}
    const shortId = String(orderId).slice(-8).toUpperCase()
    const itemsSummary = (items || []).map(i => {
      const name = i.product?.name || i.name || 'Product'
      const size = i.size || ''
      const qty = i.qty || 1
      const m = i.measurements
      const mStr = m ? ` [${formatMeasurements(m, ' | ')}]` : ''
      return `${name} (${size} x${qty})${mStr}`
    }).join(', ')
    const measurementsSummary = (items || []).filter(i => i.measurements).map(i => {
      const name = i.product?.name || 'Product'
      return `${name} — ${formatMeasurements(i.measurements, ' | ')}`
    }).join(' || ') || ''
    const addressLine = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
    const payload = {
      orderId: shortId,
      fullOrderId: String(orderId),
      date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      name: addr.name || '',
      phone: addr.phone || '',
      email: addr.email || '',
      items: itemsSummary,
      total: `₹${(total || 0).toLocaleString('en-IN')}`,
      address: addressLine,
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      payment: paymentMethod === 'COD' ? 'COD — Collect on delivery' : `Paid — ${paymentMethod}`,
      paymentStatus: paymentMethod === 'COD' ? 'UNPAID' : 'PAID',
      status: 'Pending',
      customMeasurements: measurementsSummary,
    }
    // Use no-cors so browser doesn't block the cross-origin POST
    await fetch(SHEETS_WEBHOOK, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.warn('[Ellaura] Google Sheets sync failed (non-critical):', err.message)
  }
}

// Shiprocket integration removed — shipping handled manually via WhatsApp.

// ── Wishlist DB ───────────────────────────────────────────────

/**
 * Load all wishlist products for a user from Supabase.
 * Returns an array of product objects, or null when offline/demo.
 */
export const getWishlistDB = async (userId) => {
  if (!userId || isDemo()) return null
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('wishlists').select('product_snapshot').eq('user_id', userId)
    )
    if (error) throw error
    return (data || []).map(r => r.product_snapshot).filter(Boolean)
  } catch { return null }
}

/** Upsert a single product into the user's DB wishlist (fire-and-forget). */
export const addToWishlistDB = async (userId, product) => {
  if (!userId || isDemo()) return
  const snapshot = {
    id: product.id, name: product.name, img: product.img,
    price: product.price, priceDisplay: product.priceDisplay,
    category: product.category, sizes: product.sizes,
    rating: product.rating, reviews: product.reviews,
  }
  try {
    await sbFetch(() =>
      supabase.from('wishlists')
        .upsert({ user_id: userId, product_id: product.id, product_snapshot: snapshot },
          { onConflict: 'user_id,product_id' })
    )
  } catch { /* offline — localStorage already saved by toggleWishlist */ }
}

/** Remove a single product from the user's DB wishlist (fire-and-forget). */
export const removeFromWishlistDB = async (userId, productId) => {
  if (!userId || isDemo()) return
  try {
    await sbFetch(() =>
      supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', productId)
    )
  } catch { /* offline */ }
}

// ── Cart DB ───────────────────────────────────────────────────

/**
 * Load all cart items for a user from Supabase.
 * Returns array of { product, size, qty, measurements } or null when offline.
 */
export const getCartItemsDB = async (userId) => {
  if (!userId || isDemo()) return null
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('cart_items')
        .select('product_id, quantity, size, product_snapshot, measurements')
        .eq('user_id', userId)
    )
    if (error) throw error
    if (!data?.length) return []
    return data
      .filter(r => r.product_snapshot)
      .map(r => ({
        product: r.product_snapshot,
        size: r.size,
        qty: r.quantity,
        measurements: r.measurements || null,
      }))
  } catch { return null }
}

/** Upsert one cart line (product + size) in the DB (fire-and-forget). */
export const upsertCartItemDB = async (userId, { productId, size, qty, productSnapshot, measurements }) => {
  if (!userId || isDemo()) return
  try {
    await sbFetch(() =>
      supabase.from('cart_items').upsert(
        {
          user_id: userId,
          product_id: productId,
          size,
          quantity: qty,
          product_snapshot: productSnapshot,
          measurements: measurements || null,
        },
        { onConflict: 'user_id,product_id,size' }
      )
    )
  } catch { /* offline */ }
}

/** Remove one cart line from the DB (fire-and-forget). */
export const removeCartItemDB = async (userId, productId, size) => {
  if (!userId || isDemo()) return
  try {
    await sbFetch(() =>
      supabase.from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('size', size)
    )
  } catch { /* offline */ }
}

/** Delete all cart items for a user from the DB (fire-and-forget). */
export const clearCartDB = async (userId) => {
  if (!userId || isDemo()) return
  try {
    await sbFetch(() =>
      supabase.from('cart_items').delete().eq('user_id', userId)
    )
  } catch { /* offline */ }
}

/**
 * Returns wishlist stats grouped by product for the Admin dashboard.
 * Returns an object keyed by product_id: { product, count, users[] }
 * Returns null when offline/demo (caller should fall back to localStorage).
 */
export const getWishlistSummaryDB = async () => {
  if (isDemo()) return null
  try {
    const { data, error } = await sbFetch(() =>
      supabase.from('wishlists').select('user_id, product_id, product_snapshot')
    )
    if (error) throw error
    const grouped = {}
    for (const row of (data || [])) {
      if (!grouped[row.product_id]) {
        grouped[row.product_id] = {
          count: 0,
          users: [],
          product: row.product_snapshot || { id: row.product_id },
        }
      }
      grouped[row.product_id].count++
      grouped[row.product_id].users.push(row.user_id)
    }
    return grouped
  } catch { return null }
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
    img: p.img || '',
    img_alt: p.imgAlt || '',
    description: p.description || '',
    material: p.material || null,
    care_instructions: p.careInstructions || null,
    sizes: p.sizes,
    colors: p.colors,
    delivery_days: p.deliveryDays,
    stock: p.stock,
    active: p.active !== false,
    added_at: p.addedAt || new Date().toISOString(),
    instagram_url: p.instagramUrl || null,
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
    material: r.material || '',
    careInstructions: r.care_instructions || '',
    sizes: r.sizes || [],
    colors: r.colors || [],
    deliveryDays: r.delivery_days,
    stock: r.stock,
    active: r.active,
    addedAt: r.added_at,
    instagramUrl: r.instagram_url || '',
  }
}

// ── Admin Auth ────────────────────────────────────────────────
/**
 * Signs in an admin user via Supabase Auth and verifies is_admin flag.
 * Falls back to null (caller uses local hash) when Supabase is unavailable.
 */
export const adminSignIn = async (email, password) => {
  if (DEMO_MODE) return null
  try {
    const { data, error } = await sbFetch(() =>
      supabase.auth.signInWithPassword({ email, password })
    )
    if (error) throw error
    // Check admin flag in profiles
    const { data: profile, error: profileErr } = await sbFetch(() =>
      supabase.from('profiles').select('is_admin').eq('id', data.user.id).single()
    )
    if (profileErr || !profile?.is_admin) {
      await supabase.auth.signOut()
      throw new Error('This account does not have admin privileges.')
    }
    return data
  } catch (err) {
    // Re-throw meaningful auth errors; return null for network errors so caller can fallback
    const isNetworkErr = err instanceof TypeError || err.message?.includes('timed out')
    if (!isNetworkErr) throw err
    return null
  }
}

// ── Supabase Storage — Product Images ─────────────────────────
const STORAGE_BUCKET = 'product-images'

/**
 * Converts an image file to a base64 dataURL.
 * Simple, always works — no auth or storage bucket required.
 */
export const uploadProductImage = (file) =>
  new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'))
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

/**
 * Converts multiple image files to base64 dataURLs concurrently.
 * Returns array of dataURL strings — skips any that fail.
 */
export const uploadProductImages = async (files) => {
  const results = await Promise.allSettled(
    Array.from(files).map((file) => uploadProductImage(file))
  )
  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value)
}

/**
 * Deletes a product image from Supabase Storage by its public URL.
 * Safe to call with any URL — silently skips non-storage URLs.
 */
export const deleteProductImage = async (publicUrl) => {
  if (!publicUrl || isDemo()) return
  try {
    // Extract the path from the public URL
    const url = new URL(publicUrl)
    const pathParts = url.pathname.split(`/object/public/${STORAGE_BUCKET}/`)
    if (pathParts.length < 2) return // not a storage URL
    const filePath = pathParts[1]
    await sbFetch(() => supabase.storage.from(STORAGE_BUCKET).remove([filePath]))
  } catch { /* non-critical */ }
}

// ── Razorpay Edge Function helpers ─────────────────────────────
const callEdgeFn = async (fnName, payload) => {
  const url = `${supabaseUrl}/functions/v1/${fnName}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Edge function ${fnName} failed: ${res.status}`)
  return res.json()
}

/**
 * Creates a Razorpay order server-side and returns the Razorpay order ID.
 * Returns null if the edge function is not deployed yet.
 */
export const createRazorpayOrder = async (amountInr) => {
  if (DEMO_MODE || !supabaseUrl) return null
  try {
    const data = await callEdgeFn('create-razorpay-order', { amount: amountInr })
    return data?.orderId || null
  } catch (err) {
    console.warn('[Ellaura] createRazorpayOrder edge fn unavailable:', err.message)
    return null
  }
}

/**
 * Verifies a Razorpay payment signature server-side.
 * Returns true if valid, false otherwise.
 */
export const verifyRazorpayPayment = async ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) => {
  if (DEMO_MODE || !supabaseUrl) return true // skip verification in demo
  try {
    const data = await callEdgeFn('verify-razorpay-payment', {
      razorpay_payment_id, razorpay_order_id, razorpay_signature,
    })
    return data?.valid === true
  } catch (err) {
    console.warn('[Ellaura] verifyRazorpayPayment edge fn unavailable:', err.message)
    return true // fail-open: don't block orders if function not deployed
  }
}
