// ── The Ellaura Launch Collection — 5 Exclusive Pieces ────────

export const SIZE_CHART = {
  XS: { bust: '80–83', waist: '60–63', hips: '85–88', label: 'XS / 00' },
  S:  { bust: '84–87', waist: '64–67', hips: '89–92', label: 'S / 0' },
  M:  { bust: '88–91', waist: '68–71', hips: '93–96', label: 'M / 2' },
  L:  { bust: '92–95', waist: '72–75', hips: '97–100', label: 'L / 4' },
  XL: { bust: '96–99', waist: '76–79', hips: '101–104', label: 'XL / 6' },
}

// Color swatches map — hex for the visual dot
export const COLOR_SWATCHES = {
  'Midnight Violet': '#4a1942',
  'Onyx Black': '#1a1a1a',
  'Jet Black': '#0a0a0a',
  'Deep Charcoal': '#2d2d2d',
  'Blush Rose': '#e8a0a8',
  'Dusty Mauve': '#b48b9e',
  'Indigo Storm': '#6366f1',
  'Midnight Black': '#0d0d0d',
  'Noir Black': '#111111',
}

// Products are managed via the Admin panel and stored in Supabase.
// This array is intentionally empty — add products through /admin.
export const PRODUCTS = []

export const getProductById = (id) => PRODUCTS.find(p => p.id === id) || null

// Returns admin-managed products from localStorage (offline/demo fallback only).
// On live site, ProductGallery uses Supabase directly.
export const getLiveProducts = () => {
  try {
    const raw = localStorage.getItem('ellaura_admin_products')
    if (raw) {
      const saved = JSON.parse(raw)
      return saved.filter(p => p.active !== false)
    }
  } catch {}
  return []
}

// Returns products recently added by admin (badge === 'New' or added within last 7 days)
export const getNewArrivals = () => {
  const all = getLiveProducts()
  return all.filter(p => {
    if (p.badge === 'New') return true
    if (p.addedAt) {
      const addedDate = new Date(p.addedAt)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return addedDate > sevenDaysAgo
    }
    return false
  })
}

export const searchProducts = (query) => {
  const all = getLiveProducts()
  if (!query.trim()) return all
  const q = query.toLowerCase()
  return all.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      (p.tag || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.material || '').toLowerCase().includes(q)
  )
}

export const getProductsByVibe = (vibe) => {
  const all = getLiveProducts()
  if (vibe === 'all') return all
  return all.filter(p => p.vibe.includes(vibe))
}
