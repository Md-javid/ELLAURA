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

export const PRODUCTS = [
  {
    id: 'EL001',
    name: 'Velvet Luxe Midi',
    price: 9800,
    priceDisplay: '₹9,800',
    category: 'midi',
    vibe: ['cocktail', 'club'],
    tag: 'Pub Ready',
    tagColor: 'from-[#b76e79] to-[#8b4f5a]',
    badge: 'Bestseller',
    rating: 4.9,
    reviews: 47,
    img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=85&auto=format&fit=crop&crop=top',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=85&auto=format&fit=crop&crop=top',
      'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=85&auto=format&fit=crop&crop=top',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=85&auto=format&fit=crop&crop=top',
    ],
    imgAlt: 'Velvet Luxe Midi Dress',
    description: 'Smoke-violet velvet with a fluted hem. Zero-effort elegance that commands every room it walks into.',
    material: 'Premium Italian Velvet • Silk lining • Polyester blend',
    careInstructions: 'Dry clean only',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Midnight Violet', 'Onyx Black'],
    deliveryDays: 48,
    stock: 8,
  },
  {
    id: 'EL002',
    name: 'Noir Slip Dress',
    price: 8200,
    priceDisplay: '₹8,200',
    category: 'slip',
    vibe: ['cocktail'],
    tag: 'Cocktail Pick',
    tagColor: 'from-[#6366f1] to-[#4f46e5]',
    badge: 'New',
    rating: 4.8,
    reviews: 33,
    img: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=85&auto=format&fit=crop&crop=top',
    images: [
      'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=85&auto=format&fit=crop&crop=top',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=85&auto=format&fit=crop&crop=top',
      'https://images.unsplash.com/photo-1566479179817-d79db4c64b73?w=600&q=85&auto=format&fit=crop&crop=top',
    ],
    imgAlt: 'Noir Slip Dress',
    description: 'Bias-cut silk-touch satin that moves like liquid. The dress that needs no introduction.',
    material: 'Silk-touch Satin • 95% Polyester, 5% Elastane',
    careInstructions: 'Hand wash cold or dry clean',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Jet Black', 'Deep Charcoal'],
    deliveryDays: 48,
    stock: 5,
  },
  {
    id: 'EL003',
    name: 'Rose Satin Gown',
    price: 14500,
    priceDisplay: '₹14,500',
    category: 'gown',
    vibe: ['cocktail'],
    tag: 'Rooftop Exclusive',
    tagColor: 'from-[#e8a0a8] to-[#b76e79]',
    badge: 'Limited',
    rating: 5.0,
    reviews: 22,
    img: 'https://images.unsplash.com/photo-1566479179817-d79db4c64b73?w=600&q=85&auto=format&fit=crop&crop=top',
    images: [
      'https://images.unsplash.com/photo-1566479179817-d79db4c64b73?w=600&q=85&auto=format&fit=crop&crop=top',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&q=85&auto=format&fit=crop&crop=top',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=85&auto=format&fit=crop&crop=top',
    ],
    imgAlt: 'Rose Satin Gown',
    description: 'Blush-rose duchess satin with Empire waist. The kind of gown that stops conversations.',
    material: 'Duchess Satin • 100% Premium Polyester • Tulle underskirt',
    careInstructions: 'Dry clean only',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Blush Rose', 'Dusty Mauve'],
    deliveryDays: 72,
    stock: 3,
  },
  {
    id: 'EL004',
    name: 'Electric Bodycon',
    price: 7600,
    priceDisplay: '₹7,600',
    category: 'bodycon',
    vibe: ['club'],
    tag: 'Club Night',
    tagColor: 'from-[#818cf8] to-[#6366f1]',
    badge: 'Hot',
    rating: 4.9,
    reviews: 61,
    img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=85&auto=format&fit=crop&crop=top',
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=85&auto=format&fit=crop&crop=top',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=85&auto=format&fit=crop&crop=top',
      'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=85&auto=format&fit=crop&crop=top',
    ],
    imgAlt: 'Electric Bodycon Dress',
    description: 'Asymmetric cutaway hem with electric-indigo paneling. Built for the dance floor, designed to last all night.',
    material: 'Scuba Knit • Nylon-Spandex blend • Mesh paneling',
    careInstructions: 'Machine wash cold, lay flat to dry',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Indigo Storm', 'Midnight Black'],
    deliveryDays: 48,
    stock: 10,
  },
  {
    id: 'EL005',
    name: 'The Noir Gown',
    price: 12500,
    priceDisplay: '₹12,500',
    category: 'gown',
    vibe: ['cocktail', 'club'],
    tag: 'Signature',
    tagColor: 'from-[#b76e79] to-[#6366f1]',
    badge: 'Signature',
    rating: 4.9,
    reviews: 38,
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=85&auto=format&fit=crop&crop=top',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=85&auto=format&fit=crop&crop=top',
      'https://images.unsplash.com/photo-1566479179817-d79db4c64b73?w=600&q=85&auto=format&fit=crop&crop=top',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&q=85&auto=format&fit=crop&crop=top',
    ],
    imgAlt: 'The Noir Gown',
    description: "Ellaura's hero piece. Plunging back, clean front — architectural drama that photographs like a dream.",
    material: 'Crepe Satin • 100% Silk-feel Polyester • Boned bodice',
    careInstructions: 'Dry clean recommended',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Noir Black'],
    deliveryDays: 48,
    stock: 6,
  },
]

export const getProductById = (id) => PRODUCTS.find(p => p.id === id) || null

// Returns admin-managed products from localStorage if available,
// otherwise falls back to the built-in launch collection (PRODUCTS).
// Used by ProductGallery, SearchModal etc. to reflect admin changes.
export const getLiveProducts = () => {
  try {
    const raw = localStorage.getItem('ellaura_admin_products')
    if (raw) {
      const saved = JSON.parse(raw)
      const active = saved.filter(p => p.active !== false) // hide products toggled off
      // If admin has saved products, use those; otherwise fall back to built-in collection
      return active.length > 0 ? active : PRODUCTS
    }
  } catch {}
  // No admin data yet — show the built-in launch collection
  return PRODUCTS
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
