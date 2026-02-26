import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Demo mode: true when real credentials are not yet configured
// Real Supabase anon keys are long JWT tokens (~170+ chars starting with "eyJ")
const isValidKey = supabaseAnonKey &&
  supabaseAnonKey.length > 100 &&
  supabaseAnonKey.startsWith('eyJ') &&
  !supabaseAnonKey.includes('placeholder')

export const DEMO_MODE =
  !supabaseUrl ||
  !supabaseAnonKey ||
  !isValidKey ||
  supabaseUrl.includes('placeholder')

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

// ── Auth helpers ──────────────────────────────────────────────

export const signUp = async ({ email, password, fullName, phone, city, stylePreference }) => {
  if (DEMO_MODE) {
    const demoUser = {
      id: `demo_${Date.now()}`,
      email,
      user_metadata: { full_name: fullName, phone, city, style_preference: stylePreference },
    }
    setDemoUser(demoUser)
    emitAuthChange(demoUser)
    return { user: demoUser, session: { user: demoUser } }
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone, city, style_preference: stylePreference } },
  })
  if (error) throw error
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      phone,
      city,
      style_preference: stylePreference,
    })
  }
  return data
}

export const signIn = async ({ email, password }) => {
  if (DEMO_MODE) {
    const demoUser = {
      id: `demo_${email.replace(/[^a-z0-9]/gi, '_')}`,
      email,
      user_metadata: { full_name: email.split('@')[0] },
    }
    setDemoUser(demoUser)
    emitAuthChange(demoUser)
    return { user: demoUser, session: { user: demoUser } }
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export const signOut = async () => {
  if (DEMO_MODE) { clearDemoUser(); emitAuthChange(null); return }
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

// ── Orders ────────────────────────────────────────────────────

export const createOrder = async ({ userId, items, total, shippingAddress, stripePaymentIntentId }) => {
  const { data, error } = await supabase.from('orders').insert({
    user_id: userId,
    items,
    total,
    shipping_address: shippingAddress,
    stripe_payment_intent: stripePaymentIntentId,
    status: 'pending',
  }).select().single()
  if (error) throw error
  return data
}

export const getUserOrders = async (userId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const updateOrderStatus = async (orderId, status) => {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
  if (error) throw error
}

// ── Products ──────────────────────────────────────────────────
// Reads the live product catalogue from Supabase.
// Returns null in DEMO_MODE — callers fall back to localStorage.
export const getProducts = async () => {
  if (DEMO_MODE) return null
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  // Map snake_case DB columns back to camelCase used in the app
  return data.map(dbProductToApp)
}

export const upsertProduct = async (product) => {
  if (DEMO_MODE) return null
  const { data, error } = await supabase
    .from('products')
    .upsert(appProductToDB(product))
    .select()
    .single()
  if (error) throw error
  return dbProductToApp(data)
}

export const deleteProduct = async (id) => {
  if (DEMO_MODE) return null
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// ── Reviews ───────────────────────────────────────────────────
export const getProductReviews = async (productId) => {
  if (DEMO_MODE) return []
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const submitReview = async ({ productId, userId, guestName, rating, body }) => {
  if (DEMO_MODE) return { id: `demo_review_${Date.now()}` }
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id: productId,
      user_id: userId || null,
      guest_name: guestName || null,
      rating,
      body,
      verified: !!userId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Coupons ───────────────────────────────────────────────────
export const validateCoupon = async (code, orderTotal) => {
  if (DEMO_MODE) {
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
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .single()
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
}

export const incrementCouponUse = async (code) => {
  if (DEMO_MODE) return
  await supabase.rpc('increment_coupon_use', { coupon_code: code })
}

// ── Column mappers ────────────────────────────────────────────
function appProductToDB(p) {
  return {
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
}

function dbProductToApp(r) {
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
    img: r.img,
    imgAlt: r.img_alt,
    description: r.description,
    sizes: r.sizes || [],
    colors: r.colors || [],
    deliveryDays: r.delivery_days,
    stock: r.stock,
    active: r.active,
  }
}
