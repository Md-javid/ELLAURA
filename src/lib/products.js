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
  // Named colours (as typed in admin)
  'Black': '#0a0a0a',
  'black': '#0a0a0a',
  'White': '#f5f5f5',
  'white': '#f5f5f5',
  'Red': '#c0392b',
  'red': '#c0392b',
  'Pink': '#e91e8c',
  'pink': '#e91e8c',
  'Blush': '#e8a0a8',
  'blush': '#e8a0a8',
  'Rose': '#b76e79',
  'rose': '#b76e79',
  'Maroon': '#800000',
  'maroon': '#800000',
  'Beige': '#f5deb3',
  'beige': '#f5deb3',
  'Cream': '#fffdd0',
  'cream': '#fffdd0',
  'Ivory': '#fffff0',
  'ivory': '#fffff0',
  'Brown': '#795548',
  'brown': '#795548',
  'Tan': '#d2b48c',
  'tan': '#d2b48c',
  'Camel': '#c19a6b',
  'camel': '#c19a6b',
  'Gold': '#ffd700',
  'gold': '#ffd700',
  'Silver': '#c0c0c0',
  'silver': '#c0c0c0',
  'Grey': '#9e9e9e',
  'grey': '#9e9e9e',
  'Gray': '#9e9e9e',
  'gray': '#9e9e9e',
  'Green': '#2e7d32',
  'green': '#2e7d32',
  'Olive': '#808000',
  'olive': '#808000',
  'Mint': '#98ff98',
  'mint': '#98ff98',
  'Blue': '#1565c0',
  'blue': '#1565c0',
  'Navy': '#001f5b',
  'navy': '#001f5b',
  'Sky Blue': '#87ceeb',
  'sky blue': '#87ceeb',
  'Purple': '#6a1b9a',
  'purple': '#6a1b9a',
  'Lavender': '#967bb6',
  'lavender': '#967bb6',
  'Violet': '#7f00ff',
  'violet': '#7f00ff',
  'Indigo': '#3f51b5',
  'indigo': '#3f51b5',
  'Orange': '#e65100',
  'orange': '#e65100',
  'Peach': '#ffcba4',
  'peach': '#ffcba4',
  'Yellow': '#f9a825',
  'yellow': '#f9a825',
  // Original named colours
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
