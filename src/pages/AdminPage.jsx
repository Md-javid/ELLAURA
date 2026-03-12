import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import {
  ShieldCheck, Lock, ArrowLeft, Plus, Edit2, Trash2,
  Save, X, Package, Eye, EyeOff, UploadCloud,
  CheckCircle, AlertTriangle, ToggleLeft, ToggleRight,
  RefreshCw, IndianRupee, Tag, Mail, KeyRound, Shirt,
  ClipboardList, Truck, Clock, ChevronDown, MapPin, User as UserIcon, Heart,
} from 'lucide-react'
import { DEMO_MODE, getProducts, upsertProduct, deleteProduct, getAllOrders, updateOrderStatus, getWishlistSummaryDB } from '../lib/supabase'

// ── Admin config ──────────────────────────────────────────────
const ADMIN_SESSION_KEY = 'ellaura_admin_session'
const ADMIN_PRODUCTS_KEY = 'ellaura_admin_products'
const ADMIN_ACCOUNTS_KEY = 'ellaura_admin_accounts_v2' // v2 = SHA-256 hashes
const SESSION_TTL = 60 * 60 * 1000 // 1 hour

// Default admin credentials (set via VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD in .env)
const DEFAULT_ADMIN = {
  email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@ellaura.in',
  password: import.meta.env.VITE_ADMIN_PASSWORD || '',
}

// SHA-256 password hash via Web Crypto API — collision-resistant, not reversible.
const hashPasswordAsync = async (pw) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

import { PRODUCTS as DEFAULT_PRODUCTS } from '../lib/products'

const loadAdminProducts = () => {
  try {
    const raw = localStorage.getItem(ADMIN_PRODUCTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

const saveAdminProducts = (prods) =>
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(prods))

// Load/save admin accounts — passwords are stored hashed, not plaintext
const loadAdminAccountsAsync = async () => {
  try {
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Re-seed if the stored default email no longer matches (credentials changed in .env)
      const hasDefault = parsed.some(a => a.email === DEFAULT_ADMIN.email)
      if (!hasDefault) {
        const hash = await hashPasswordAsync(DEFAULT_ADMIN.password)
        const seed = [{ email: DEFAULT_ADMIN.email, password: hash }]
        localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(seed))
        return seed
      }
      return parsed
    }
  } catch { }
  // First run — seed with SHA-256 hashed default credentials
  const hash = await hashPasswordAsync(DEFAULT_ADMIN.password)
  const seed = [{ email: DEFAULT_ADMIN.email, password: hash }]
  localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(seed))
  return seed
}

const saveAdminAccounts = (accs) =>
  localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(accs))

const EMPTY_PRODUCT = {
  id: '', name: '', price: '', priceDisplay: '',
  category: 'midi', vibe: ['cocktail'],
  tag: '', tagColor: 'from-[#b76e79] to-[#8b4f5a]',
  badge: 'New', rating: 4.9, reviews: 0,
  img: '', images: [], imgAlt: '',
  description: '', material: '', careInstructions: '',
  sizes: ['S', 'M', 'L'],
  colors: ['Black'], deliveryDays: 48, stock: 5,
  instagramUrl: '',
}

// ── Styles ────────────────────────────────────────────────────
const inputCls = 'w-full bg-transparent text-white placeholder-white/20 outline-none text-[13px] py-2.5'
const wrapCls = 'glass rounded-xl border border-white/10 px-3.5 flex items-center gap-2.5 focus-within:border-[#b76e79]/40 transition-all'

// ── Brute-force guard ────────────────────────────────────────
const LOCKOUT_KEY = 'ellaura_admin_lockout'
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 5 * 60 * 1000
// Lockout in localStorage so it persists across tab closes
const getAttemptData = () => { try { return JSON.parse(localStorage.getItem(LOCKOUT_KEY) || '{}') } catch { return {} } }
const recordFail = () => {
  const d = getAttemptData()
  const attempts = (d.attempts || 0) + 1
  const lockedUntil = attempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : (d.lockedUntil || 0)
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ attempts, lockedUntil }))
  return { attempts, lockedUntil }
}
const clearAttempts = () => localStorage.removeItem(LOCKOUT_KEY)
const getLockRemaining = () => { const d = getAttemptData(); return d.lockedUntil ? Math.max(0, Math.ceil((d.lockedUntil - Date.now()) / 1000)) : 0 }

// ── Admin Login (Email/Password) ──────────────────────────────
function AdminLogin({ onVerify }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockSeconds, setLockSeconds] = useState(getLockRemaining)
  const locked = lockSeconds > 0

  // Countdown timer
  useEffect(() => {
    if (!locked) return
    const id = setInterval(() => {
      const r = getLockRemaining()
      setLockSeconds(r)
      if (r <= 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [locked])

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    if (locked) return
    setLoading(true)
    setError('')
    const accounts = await loadAdminAccountsAsync()
    const hash = await hashPasswordAsync(password)
    const match = accounts.find(a => a.email === email && a.password === hash)
    if (match) {
      clearAttempts()
      const session = { ts: Date.now(), email: match.email }
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
      onVerify()
    } else {
      const { attempts, lockedUntil } = recordFail()
      if (lockedUntil > Date.now()) {
        setLockSeconds(getLockRemaining())
        setError('Too many failed attempts. Locked for 5 minutes.')
      } else {
        const rem = MAX_ATTEMPTS - attempts
        setError(rem > 0 ? `Invalid credentials. ${rem} attempt${rem !== 1 ? 's' : ''} remaining.` : 'Too many failed attempts.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#b76e79] to-[#6366f1] flex items-center justify-center shadow-lg shadow-[#b76e79]/20">
        <ShieldCheck className="w-8 h-8 text-white" />
      </div>
      <div>
        <h2 className="font-serif text-2xl font-bold text-white/90 text-center mb-1">Admin Access</h2>
        <p className="text-[13px] text-white/35 text-center">
          Sign in with your admin credentials
        </p>
        {locked && (
          <div className="w-full glass rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-center gap-2.5 mt-3">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-[12px] text-red-400 font-semibold">Too many failed attempts</p>
              <p className="text-[11px] text-red-400/70">Try again in {Math.floor(lockSeconds / 60)}:{String(lockSeconds % 60).padStart(2, '0')}</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleEmailLogin} className="w-full max-w-xs space-y-4">
        <div>
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Email</label>
          <div className={wrapCls}>
            <Mail className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputCls}
              required
              autoFocus
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Password</label>
          <div className={wrapCls}>
            <KeyRound className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={inputCls}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/30 hover:text-white/50">
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || locked}
          className="w-full btn-liquid rounded-xl py-3 text-[14px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {loading ? 'Signing in...' : locked ? `Locked (${lockSeconds}s)` : 'Sign In'}
        </button>
      </form>

      {error && (
        <p className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2 flex items-center gap-2 w-full max-w-xs">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  )
}

// ── Change Credentials Modal ──────────────────────────────────
function ChangeCredentialsModal({ currentEmail, onClose, onChanged }) {
  const [email, setEmail] = useState(currentEmail || '')
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Email is required.')
    const accounts = await loadAdminAccountsAsync()
    const currentHash = await hashPasswordAsync(currentPass)
    const acc = accounts.find(a => a.email === currentEmail)
    if (!acc || acc.password !== currentHash) return setError('Current password is incorrect.')
    if (newPass.length < 8) return setError('New password must be at least 8 characters.')
    if (newPass !== confirmPass) return setError('Passwords do not match.')
    const newHash = await hashPasswordAsync(newPass)
    const updated = accounts.map(a =>
      a.email === currentEmail ? { email: email.trim(), password: newHash } : a
    )
    saveAdminAccounts(updated)
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ ts: Date.now(), email: email.trim() }))
    setSaved(true)
    setTimeout(() => { onChanged(email.trim()); onClose() }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-dark rounded-[24px] border border-white/10 p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound className="w-4 h-4 text-[#b76e79]" />
          <h3 className="font-serif text-base font-bold text-white/90">Change Credentials</h3>
          <button onClick={onClose} className="ml-auto text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {saved ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            <p className="text-[13px] text-emerald-400/80 font-medium">Credentials updated!</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Admin Email</label>
              <div className={wrapCls}>
                <Mail className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required autoFocus />
              </div>
            </div>
            <div>
              <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Current Password</label>
              <div className={wrapCls}>
                <KeyRound className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Current password"
                  value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)}
                  className={inputCls}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="text-white/30 hover:text-white/50 flex-shrink-0">
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">New Password</label>
              <div className={wrapCls}>
                <KeyRound className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Confirm New Password</label>
              <div className={wrapCls}>
                <KeyRound className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
            </div>
            {error && (
              <p className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button type="submit" className="flex-1 btn-liquid rounded-xl py-2.5 text-[13px] font-semibold text-white flex items-center justify-center gap-1.5">
                <Save className="w-3.5 h-3.5" /> Save
              </button>
              <button type="button" onClick={onClose} className="flex-1 glass rounded-xl border border-white/10 py-2.5 text-[13px] text-white/50 hover:text-white/80 transition-all">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Product Form ──────────────────────────────────────────────
function ProductForm({ initial = EMPTY_PRODUCT, onSave, onCancel }) {
  const normalizedInitialImages = [...new Set([initial.img, ...(initial.images || [])].filter(Boolean))]
  const [form, setForm] = useState({
    ...initial,
    img: normalizedInitialImages[0] || '',
    images: normalizedInitialImages,
  })
  const [preview, setPreview] = useState(normalizedInitialImages[0] || '')
  const [imgError, setImgError] = useState(false)
  const [imgMode, setImgMode] = useState('upload') // 'upload' | 'url'
  const [uploading, setUploading] = useState(false)
  const [galleryInput, setGalleryInput] = useState(normalizedInitialImages.slice(1).join('\n'))
  const fileInputRef = useRef(null)
  const galleryFileRef = useRef(null)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  // Raw text for comma-separated fields — only parsed to arrays on blur
  const [rawSizes, setRawSizes] = useState((initial.sizes || []).join(', '))
  const [rawColors, setRawColors] = useState((initial.colors || []).join(', '))

  const handleGalleryFilesUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploadingGallery(true)
    let loaded = 0
    const dataUrls = []
    files.forEach(file => {
      if (!file.type.startsWith('image/')) { loaded++; if (loaded === files.length) finalize(); return }
      const reader = new FileReader()
      reader.onload = (ev) => {
        dataUrls.push(ev.target.result)
        loaded++
        if (loaded === files.length) finalize()
      }
      reader.onerror = () => { loaded++; if (loaded === files.length) finalize() }
      reader.readAsDataURL(file)
    })
    const finalize = () => {
      setForm(f => {
        const merged = [...new Set([...( f.images || []), ...dataUrls].filter(Boolean))]
        return { ...f, images: merged }
      })
      setUploadingGallery(false)
      e.target.value = ''
    }
  }

  const set = (k) => (e) => {
    const v = e.target.value
    setForm(f => ({
      ...f,
      [k]: v,
      ...(k === 'price' ? { priceDisplay: v ? `₹${Number(v).toLocaleString('en-IN')}` : '' } : {}),
    }))
  }

  const [customCategoryMode, setCustomCategoryMode] = useState(
    !['midi', 'slip', 'gown', 'bodycon', 'mini', 'maxi', 'co-ord'].includes(initial.category)
  )
  const [customVibeInput, setCustomVibeInput] = useState('')

  const toggleVibe = (v) =>
    setForm(f => ({
      ...f,
      vibe: f.vibe.includes(v) ? f.vibe.filter(x => x !== v) : [...f.vibe, v],
    }))

  const removeVibe = (v) =>
    setForm(f => ({ ...f, vibe: f.vibe.filter(x => x !== v) }))

  const addCustomVibe = () => {
    const v = customVibeInput.trim().toLowerCase()
    if (!v) return
    setForm(f => ({ ...f, vibe: f.vibe.includes(v) ? f.vibe : [...f.vibe, v] }))
    setCustomVibeInput('')
  }

  const setSizes = (e) => {
    const vals = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
    setForm(f => ({ ...f, sizes: vals }))
  }

  const setColors = (e) => {
    const vals = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
    setForm(f => ({ ...f, colors: vals }))
  }

  const handleImgChange = (val) => {
    setForm(f => {
      const nextImages = [val, ...(f.images || []).filter(img => img && img !== val)]
      return { ...f, img: val, images: nextImages }
    })
    setPreview(val)
    setImgError(false)
  }

  const handleGalleryChange = (raw) => {
    setGalleryInput(raw)
    const parsed = raw
      .split(/[\n,]/)
      .map(s => s.trim())
      .filter(Boolean)

    setForm(f => {
      const merged = [...new Set([f.img, ...parsed].filter(Boolean))]
      return {
        ...f,
        images: merged,
      }
    })
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return alert('Please select an image file')
    if (file.size > 5 * 1024 * 1024) return alert('Image must be under 5MB')
    setUploading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      handleImgChange(dataUrl)
      setUploading(false)
    }
    reader.onerror = () => { setUploading(false); alert('Failed to read file') }
    reader.readAsDataURL(file)
  }

  // Convert Google Drive share link to direct image URL
  const convertDriveLink = (url) => {
    // Match patterns like: https://drive.google.com/file/d/FILE_ID/view
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (driveMatch) {
      return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`
    }
    // Match: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
    if (openMatch) {
      return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`
    }
    return url
  }

  const handleUrlInput = (val) => {
    const converted = convertDriveLink(val)
    handleImgChange(converted)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return alert('Product name is required')
    if (!form.price) return alert('Price is required')
    if (!form.img.trim()) return alert('Product image is required')

    const finalImages = [...new Set([form.img, ...(form.images || [])].filter(Boolean))]
    const finalId = form.id || `EL${String(Date.now()).slice(-4)}`
    const addedAt = form.addedAt || new Date().toISOString()
    onSave({
      ...form,
      id: finalId,
      img: finalImages[0],
      images: finalImages,
      price: Number(form.price),
      reviewCount: form.reviews,
      addedAt,
    })
  }

  const inputClass = inputCls + ' text-[13px]'
  const wClass = wrapCls + ' py-0'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Image section */}
      <div className="space-y-3">
        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase">Primary Product Image *</label>
          <div className="ml-auto glass rounded-lg p-0.5 flex gap-0.5">
            <button
              type="button"
              onClick={() => setImgMode('upload')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${imgMode === 'upload' ? 'bg-gradient-to-r from-[#b76e79]/60 to-[#8b4f5a]/60 text-white shadow' : 'text-white/35'}`}
            >
              Upload
            </button>
            <button
              type="button"
              onClick={() => setImgMode('url')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${imgMode === 'url' ? 'bg-gradient-to-r from-[#b76e79]/60 to-[#8b4f5a]/60 text-white shadow' : 'text-white/35'}`}
            >
              URL / Drive
            </button>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          {/* Preview */}
          <div
            className="w-24 h-32 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-white/5 cursor-pointer hover:border-[#b76e79]/30 transition-all"
            onClick={() => imgMode === 'upload' && fileInputRef.current?.click()}
          >
            {preview && !imgError ? (
              <img src={preview} alt="" className="w-full h-full object-cover object-top" onError={() => setImgError(true)} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-white/20">
                <UploadCloud className={`w-6 h-6 ${uploading ? 'animate-bounce' : ''}`} />
                <p className="text-[9px]">{uploading ? 'Loading...' : imgMode === 'upload' ? 'Click to upload' : 'No image'}</p>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            {imgMode === 'upload' ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full glass rounded-xl border border-dashed border-white/15 hover:border-[#b76e79]/40 px-4 py-5 text-center transition-all group"
                >
                  <UploadCloud className={`w-5 h-5 mx-auto mb-1.5 transition-all ${uploading ? 'text-[#b76e79] animate-bounce' : 'text-white/25 group-hover:text-[#b76e79]/60'}`} />
                  <p className="text-[12px] text-white/40 group-hover:text-white/60">
                    {uploading ? 'Processing...' : 'Click to upload image'}
                  </p>
                  <p className="text-[10px] text-white/15 mt-0.5">JPG, PNG, WebP · Max 5MB</p>
                </button>
              </>
            ) : (
              <>
                <div className={wClass}>
                  <input
                    type="url"
                    placeholder="https://... or Google Drive link"
                    value={form.img?.startsWith('data:') ? '' : form.img}
                    onChange={e => handleUrlInput(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <p className="text-[10px] text-white/20">Paste any image URL, Unsplash link, or Google Drive share link</p>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Additional Images</label>

          {/* Multi-file upload button */}
          <div className="mb-2">
            <input
              ref={galleryFileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryFilesUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => galleryFileRef.current?.click()}
              disabled={uploadingGallery}
              className="w-full glass rounded-xl border border-dashed border-white/15 hover:border-[#b76e79]/40 px-4 py-3 text-center transition-all group"
            >
              <UploadCloud className={`w-4 h-4 mx-auto mb-1 transition-all ${uploadingGallery ? 'text-[#b76e79] animate-bounce' : 'text-white/25 group-hover:text-[#b76e79]/60'}`} />
              <p className="text-[11px] text-white/40 group-hover:text-white/60">
                {uploadingGallery ? 'Uploading...' : 'Upload multiple images'}
              </p>
              <p className="text-[10px] text-white/15 mt-0.5">Select several files at once</p>
            </button>
          </div>

          {/* URL textarea */}
          <div className={`${wClass} items-start py-2`}>
            <textarea
              value={galleryInput}
              onChange={e => handleGalleryChange(e.target.value)}
              rows={2}
              placeholder="Or paste image URLs, one per line"
              className={`${inputClass} resize-y min-h-[52px]`}
            />
          </div>

          {/* Thumbnails of all gallery images (skip primary) */}
          {(form.images || []).length > 1 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {(form.images || []).slice(1).map((url, i) => (
                <div key={i} className="relative w-14 h-18 rounded-xl overflow-hidden border border-white/10 group">
                  <img src={url} alt="" className="w-full h-full object-cover object-top" />
                  <button
                    type="button"
                    onClick={() => {
                      const next = (form.images || []).filter((_, idx) => idx !== i + 1)
                      setForm(f => ({ ...f, images: next }))
                      setGalleryInput(next.slice(1).filter(u => !u.startsWith('data:')).join('\n'))
                    }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-white/20 mt-1.5">
            {(form.images || []).length} image{(form.images || []).length !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Product Name *</label>
          <div className={wClass}><input type="text" placeholder="e.g. Velvet Luxe Midi" value={form.name} onChange={set('name')} className={inputClass} required /></div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Price (₹) *</label>
          <div className={`${wClass} gap-1`}>
            <IndianRupee className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <input type="number" placeholder="9800" value={form.price} onChange={set('price')} className={inputClass} required min="0" />
          </div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Category</label>
          {!customCategoryMode ? (
            <div className="flex gap-2">
              <div className={`${wClass} flex-1`}>
                <select value={form.category} onChange={set('category')} className={`${inputClass} bg-transparent`}>
                  {['midi', 'slip', 'gown', 'bodycon', 'mini', 'maxi', 'co-ord'].map(c => (
                    <option key={c} value={c} className="bg-neutral-900">{c}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={() => { setCustomCategoryMode(true); setForm(f => ({ ...f, category: '' })) }}
                className="glass rounded-xl border border-white/10 px-3 text-[11px] text-white/40 hover:text-white/70 transition-all whitespace-nowrap">
                + Custom
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className={`${wClass} flex-1`}>
                <input type="text" placeholder="e.g. jumpsuit" value={form.category} onChange={set('category')} className={inputClass} required />
              </div>
              <button type="button" onClick={() => { setCustomCategoryMode(false); setForm(f => ({ ...f, category: 'midi' })) }}
                className="glass rounded-xl border border-white/10 px-3 text-[11px] text-white/40 hover:text-white/70 transition-all whitespace-nowrap">
                Presets
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Stock Count</label>
          <div className={wClass}>
            <input type="number" placeholder="10" value={form.stock} onChange={set('stock')} className={inputClass} min="0" />
          </div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Tag Label</label>
          <div className={`${wClass} gap-1`}>
            <Tag className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <input type="text" placeholder="e.g. Bestseller" value={form.tag} onChange={set('tag')} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Badge</label>
          <div className={wClass}>
            <select value={form.badge} onChange={set('badge')} className={`${inputClass} bg-transparent`}>
              {['New', 'Bestseller', 'Limited', 'Hot', 'Signature', 'Sold Out'].map(b => (
                <option key={b} value={b} className="bg-neutral-900">{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Delivery Days</label>
          <div className={wClass}>
            <input type="number" placeholder="48" value={form.deliveryDays} onChange={set('deliveryDays')} className={inputClass} min="1" />
          </div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Sizes (comma-separated)</label>
          <div className={wClass}>
            <input
              type="text"
              placeholder="XS, S, M, L, XL"
              value={rawSizes}
              onChange={e => setRawSizes(e.target.value)}
              onBlur={e => {
                const vals = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                setForm(f => ({ ...f, sizes: vals }))
                setRawSizes(vals.join(', '))
              }}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Colors (comma-separated)</label>
          <div className={wClass}>
            <input
              type="text"
              placeholder="Jet Black, Blush Rose"
              value={rawColors}
              onChange={e => setRawColors(e.target.value)}
              onBlur={e => {
                const vals = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                setForm(f => ({ ...f, colors: vals }))
                setRawColors(vals.join(', '))
              }}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Material & Fabric</label>
          <div className={`${wClass} gap-1`}>
            <Shirt className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <input type="text" placeholder="e.g. Silk Satin • 100% Polyester" value={form.material || ''} onChange={set('material')} className={inputClass} />
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">
          Instagram Post Link <span className="normal-case text-white/20">(optional)</span>
        </label>
        <div className={`${wClass} gap-1`}>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white/30 flex-shrink-0" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <input
            type="url"
            placeholder="https://www.instagram.com/p/..."
            value={form.instagramUrl || ''}
            onChange={set('instagramUrl')}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Description</label>
        <div className={`${wClass} items-start py-2`}>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={2}
            placeholder="One-line product story…"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Vibe Toggle */}
      <div>
        <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-2">Vibe</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {['cocktail', 'club'].map(v => (
            <button
              key={v} type="button"
              onClick={() => toggleVibe(v)}
              className={`px-4 py-1.5 rounded-xl text-[12px] font-medium border transition-all ${form.vibe.includes(v)
                  ? 'bg-gradient-to-r from-[#b76e79]/60 to-[#8b4f5a]/60 border-[#b76e79]/60 text-white'
                  : 'glass border-white/10 text-white/40'
                }`}
            >
              {v === 'cocktail' ? '🍸 Cocktail' : '🌙 Club'}
            </button>
          ))}
          {/* Custom vibe tags */}
          {form.vibe.filter(v => v !== 'cocktail' && v !== 'club').map(v => (
            <span key={v} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-medium border bg-gradient-to-r from-[#6366f1]/40 to-[#4f46e5]/40 border-[#6366f1]/40 text-white">
              {v}
              <button type="button" onClick={() => removeVibe(v)} className="ml-0.5 text-white/50 hover:text-white leading-none">&times;</button>
            </span>
          ))}
        </div>
        {/* Add custom vibe */}
        <div className="flex gap-2">
          <div className={`${wClass} flex-1`}>
            <input
              type="text"
              placeholder="Add custom vibe…"
              value={customVibeInput}
              onChange={e => setCustomVibeInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomVibe() } }}
              className={inputClass}
            />
          </div>
          <button type="button" onClick={addCustomVibe}
            className="glass rounded-xl border border-white/10 px-3 text-[11px] text-white/40 hover:text-white/70 transition-all">
            + Add
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="flex-1 btn-liquid rounded-xl py-3 text-[14px] font-semibold text-white flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Save Product
        </button>
        <button type="button" onClick={onCancel} className="glass rounded-xl border border-white/10 px-5 py-3 text-[13px] text-white/50 hover:text-white/80 transition-all">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Stock Quick-Edit ──────────────────────────────────────────
function StockBadge({ stock, onChange }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(stock)
  const submit = () => { onChange(Number(val)); setEditing(false) }
  if (editing) return (
    <div className="flex items-center gap-1.5">
      <input type="number" value={val} onChange={e => setVal(e.target.value)} min="0"
        className="w-14 glass rounded-lg border border-[#b76e79]/40 text-center text-[12px] text-white py-0.5 outline-none" />
      <button onClick={submit} className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30">
        <CheckCircle className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => setEditing(false)} className="w-6 h-6 rounded-lg glass text-white/30 flex items-center justify-center">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
  return (
    <button onClick={() => setEditing(true)}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all hover:scale-105 ${stock === 0 ? 'bg-red-500/15 border-red-500/30 text-red-400'
          : stock <= 3 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}
    >
      <Package className="w-3 h-3" />
      {stock === 0 ? 'Out of stock' : `${stock} left`}
    </button>
  )
}

// ── Order Status Management ───────────────────────────────────
const ORDER_STATUSES = [
  { value: 'pending',    label: 'Order Placed',  color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/30' },
  { value: 'confirmed',  label: 'Confirmed',     color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/30' },
  { value: 'processing', label: 'Processing',    color: 'text-purple-400',  bg: 'bg-purple-400/10 border-purple-400/30' },
  { value: 'shipped',    label: 'Shipped',       color: 'text-indigo-400',  bg: 'bg-indigo-400/10 border-indigo-400/30' },
  { value: 'delivered',  label: 'Delivered',     color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  { value: 'cancelled',  label: 'Cancelled',     color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/30' },
]

function StatusDropdown({ orderId, current, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const curr = ORDER_STATUSES.find(s => s.value === current) || ORDER_STATUSES[0]

  const handleSelect = async (val) => {
    if (val === current) { setOpen(false); return }
    setSaving(true)
    setOpen(false)
    await updateOrderStatus(orderId, val)
    onUpdate(orderId, val)
    setSaving(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${curr.bg} ${curr.color} ${saving ? 'opacity-50' : 'hover:opacity-80'}`}
      >
        {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
        {curr.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-20 glass-dark rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-w-[150px]">
          {ORDER_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => handleSelect(s.value)}
              className={`w-full text-left px-4 py-2.5 text-[12px] font-medium transition-all hover:bg-white/5 flex items-center gap-2 ${s.color} ${s.value === current ? 'bg-white/5' : ''}`}
            >
              {s.value === current && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
              {s.value !== current && <span className="w-3 h-3 flex-shrink-0" />}
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminOrdersTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const loadOrders = async () => {
    setLoading(true)
    const all = await getAllOrders()
    setOrders(all || [])
    setLoading(false)
  }

  useEffect(() => { loadOrders() }, [])

  const handleUpdate = (orderId, status) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
  }

  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus)

  const statusCounts = ORDER_STATUSES.reduce((acc, s) => {
    acc[s.value] = orders.filter(o => o.status === s.value).length
    return acc
  }, {})

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {ORDER_STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(prev => prev === s.value ? 'all' : s.value)}
            className={`glass-dark rounded-2xl border px-3 py-3 text-center transition-all hover:opacity-80 ${filterStatus === s.value ? 'border-white/20 scale-[1.02]' : 'border-white/5'}`}
          >
            <p className={`font-bold text-xl ${s.color}`}>{statusCounts[s.value] || 0}</p>
            <p className="text-[9px] text-white/25 mt-0.5 leading-tight">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-base font-semibold text-white/80">
          {filterStatus === 'all' ? `All Orders (${orders.length})` : `${ORDER_STATUSES.find(s=>s.value===filterStatus)?.label} (${filtered.length})`}
        </h2>
        <button
          onClick={loadOrders}
          className="glass rounded-xl border border-white/10 px-3 py-1.5 text-[11px] text-white/40 hover:text-white/70 flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-6 h-6 text-white/20 animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-white/25">Loading orders...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-white/20 text-[13px]">No orders found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const shortId = String(order.id).slice(-8).toUpperCase()
            const date = new Date(order.created_at || Date.now())
            const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            const items = order.items || []
            const addr = order.shipping_address || order.shippingAddress || {}
            const expanded = expandedId === order.id
            const statusInfo = ORDER_STATUSES.find(s => s.value === order.status) || ORDER_STATUSES[0]

            return (
              <div key={order.id} className="glass-dark rounded-[20px] border border-white/8 overflow-hidden transition-all">
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${statusInfo.bg} ${statusInfo.color}`}>
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[12px] font-bold text-[#e8a0a8]">#{shortId}</span>
                        <span className="text-[10px] text-white/30">{dateStr}</span>
                        <span className="text-[9px] text-white/20">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                      </div>
                      {addr.name && (
                        <p className="text-[11px] text-white/35 mt-0.5 truncate flex items-center gap-1">
                          <UserIcon className="w-3 h-3 flex-shrink-0" /> {addr.name}
                          {addr.phone && <span className="text-white/20 ml-1">{addr.phone}</span>}
                        </p>
                      )}
                    </div>
                    <p className="text-[13px] font-bold text-white/70 flex-shrink-0 ml-auto mr-2">
                      ₹{(order.total || 0).toLocaleString('en-IN')}
                    </p>
                  </button>
                  {/* Status dropdown */}
                  <StatusDropdown orderId={order.id} current={order.status || 'pending'} onUpdate={handleUpdate} />
                </div>

                {/* Expanded */}
                {expanded && (
                  <div className="border-t border-white/5 px-4 py-3 space-y-3">
                    {/* Items */}
                    {items.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[9px] tracking-[0.2em] text-white/20 uppercase">Items</p>
                        {items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 glass rounded-xl border border-white/5 px-3 py-2">
                            {item.product?.img && (
                              <img src={item.product.img} alt="" className="w-9 h-11 rounded-lg object-cover object-top flex-shrink-0 border border-white/8" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-white/70 truncate">{item.product?.name || 'Product'}</p>
                              <p className="text-[10px] text-white/30">Size: {item.size} · Qty: {item.qty}</p>
                            </div>
                            <p className="text-[11px] font-bold text-[#e8a0a8]">₹{((item.product?.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Delivery address */}
                    {(addr.line1 || addr.city) && (
                      <div className="glass rounded-xl border border-white/5 px-3 py-2.5 flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#b76e79] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[9px] tracking-[0.2em] text-white/20 uppercase mb-0.5">Delivery Address</p>
                          <p className="text-[11px] text-white/45 leading-relaxed">
                            {[addr.line1, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Admin Wishlist Tab ────────────────────────────────────────
function AdminWishlistTab() {
  const [aggregate, setAggregate] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getWishlistSummaryDB().then(dbData => {
      if (dbData !== null) {
        setAggregate(dbData)
      } else {
        // Offline fallback: read from localStorage aggregate cache
        try {
          const raw = localStorage.getItem('ellaura_wishlist_aggregate')
          if (raw) setAggregate(JSON.parse(raw))
        } catch {}
      }
      setLoading(false)
    })
  }, [])

  const entries = Object.values(aggregate)
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count)

  const totalWishes = entries.reduce((n, e) => n + e.count, 0)
  const uniqueUsers = new Set(entries.flatMap(e => e.users || [])).size

  return (
    <div>
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-6 h-6 text-white/20 animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-white/25">Loading wishlist data...</p>
        </div>
      ) : (
      <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Wishlisted Products', val: entries.length },
          { label: 'Total Wishes', val: totalWishes },
          { label: 'Unique Users', val: uniqueUsers },
        ].map(({ label, val }) => (
          <div key={label} className="glass-dark rounded-2xl border border-white/8 px-4 py-3 text-center">
            <p className="font-serif text-2xl font-bold text-[#e8a0a8]">{val}</p>
            <p className="text-[10px] text-white/25 tracking-widest uppercase mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="py-16 text-center glass-dark rounded-[24px] border border-white/8">
          <Heart className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-[13px] text-white/25">No wishlist data yet.</p>
          <p className="text-[11px] text-white/15 mt-1">Products hearted by users will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => {
            const p = entry.product || {}
            const userList = (entry.users || [])
            return (
              <div key={p.id} className="glass-dark rounded-[20px] border border-white/8 flex items-center gap-4 px-4 py-3">
                {/* Rank */}
                <span className="font-serif text-[13px] text-white/20 w-5 flex-shrink-0 text-center">{i + 1}</span>
                {/* Image */}
                {p.img && (
                  <img src={p.img} alt="" className="w-12 h-14 rounded-xl object-cover object-top border border-white/8 flex-shrink-0" />
                )}
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white/80 truncate">{p.name || 'Unknown Product'}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {p.category && (
                      <span className="text-[9px] uppercase tracking-widest text-white/30 glass rounded-lg px-1.5 py-0.5 border border-white/8">{p.category}</span>
                    )}
                    {p.price > 0 && (
                      <span className="text-[10px] text-white/30">₹{p.price.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  {userList.length > 0 && (
                    <p className="text-[10px] text-white/20 mt-1 truncate">
                      {userList.map(u => u === 'guest' ? 'Guest' : `User …${String(u).slice(-6)}`).join(', ')}
                    </p>
                  )}
                </div>
                {/* Count badge */}
                <div className="flex items-center gap-1.5 flex-shrink-0 bg-[#b76e79]/15 border border-[#b76e79]/25 rounded-xl px-3 py-2">
                  <Heart className="w-3.5 h-3.5 fill-[#e8a0a8] text-[#e8a0a8]" />
                  <span className="font-bold text-[#e8a0a8] text-[15px]">{entry.count}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </>
      )}
    </div>
  )
}

// ── Main Admin Page ───────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY) || 'null')
      return !!(s && Date.now() - s.ts < SESSION_TTL)
    } catch { return false }
  })
  const [adminEmail, setAdminEmail] = useState(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY) || 'null')
      if (s && Date.now() - s.ts < SESSION_TTL) return s.email || ''
    } catch { }
    return ''
  })
  const [adminTab, setAdminTab] = useState('products') // 'products' | 'orders' | 'wishlist'
  const [products, setProducts] = useState([])
  const [mode, setMode] = useState('list') // 'list' | 'add' | 'edit'
  const [editTarget, setEditTarget] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showPinClear, setShowPinClear] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [dbSyncing, setDbSyncing] = useState(false)
  const [dbError, setDbError] = useState('')

  // Session is read synchronously in useState initializers above.
  // Cleanup: wipe the session the instant the user leaves /admin.
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY) || 'null')
      if (s && Date.now() - s.ts < SESSION_TTL) {
        setAuthed(true)
        setAdminEmail(s.email || '')
      }
    } catch { }
    return () => {
      sessionStorage.removeItem(ADMIN_SESSION_KEY)
    }
  }, [])

  // Load products once authed
  useEffect(() => {
    if (!authed) return
    const load = async () => {
      try {
        const dbProducts = await getProducts()
        if (dbProducts && dbProducts.length > 0) {
          setProducts(dbProducts)
          saveAdminProducts(dbProducts)
        } else {
          setProducts(loadAdminProducts())
        }
      } catch (err) {
        console.warn('[Admin] DB load failed, using localStorage:', err.message)
        setProducts(loadAdminProducts())
      }
    }
    load()
  }, [authed])

  const handleAuth = () => {
    try {
      const s = JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY) || '{}')
      setAdminEmail(s.email || 'PIN Login')
    } catch { }
    setAuthed(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    setAuthed(false)
    setAdminEmail('')
  }

  const handleSave = async (product) => {
    let updated
    const isNew = mode === 'add'
    if (mode === 'edit') {
      updated = products.map(p => p.id === product.id ? product : p)
    } else {
      // Mark as new arrival with timestamp
      product.badge = product.badge || 'New'
      product.addedAt = product.addedAt || new Date().toISOString()
      updated = [...products, product]
    }
    setProducts(updated)
    saveAdminProducts(updated)
    setMode('list')
    setEditTarget(null)

    // Dispatch event for New Arrivals notification
    if (isNew) {
      window.dispatchEvent(new CustomEvent('ellaura_new_product', { detail: product }))
    }

    // Persist to Supabase if connected
    setDbSyncing(true)
    setDbError('')
    try {
      const result = await upsertProduct(product)
      if (result === null) {
        setDbError('Product saved locally but could not sync to database. Check your Supabase connection.')
      }
    } catch (e) {
      setDbError(`DB sync failed: ${e.message}`)
    } finally {
      setDbSyncing(false)
    }
  }

  const handleDelete = async (id) => {
    const updated = products.filter(p => p.id !== id)
    setProducts(updated)
    saveAdminProducts(updated)
    setDeleteConfirm(null)
    try { await deleteProduct(id) } catch (e) { console.warn('DB delete failed:', e.message) }
  }

  const handleStockChange = async (id, stock) => {
    const updated = products.map(p => p.id === id ? { ...p, stock } : p)
    setProducts(updated)
    saveAdminProducts(updated)
    const prod = updated.find(p => p.id === id)
    try { if (prod) await upsertProduct(prod) } catch (e) { console.warn('DB stock sync failed:', e.message) }
  }

  const handleToggleActive = async (id) => {
    const updated = products.map(p => p.id === id ? { ...p, active: !(p.active !== false) } : p)
    setProducts(updated)
    saveAdminProducts(updated)
    const prod = updated.find(p => p.id === id)
    try { if (prod) await upsertProduct(prod) } catch (e) { console.warn('DB toggle sync failed:', e.message) }
  }

  const resetToDefaults = async () => {
    if (!confirm('Reset products to default launch collection? Custom additions will be lost.')) return
    const reset = [...DEFAULT_PRODUCTS]
    setProducts(reset)
    saveAdminProducts(reset)
    try {
      for (const p of reset) { await upsertProduct(p).catch(() => { }) }
    } catch { }
  }

  // ── Auth Gate — redirect to login if no valid session ────────
  if (!authed) {
    return <Navigate to="/login" replace />
  }

  // ── Dashboard ─────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#b76e79] to-[#6366f1] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <h1 className="font-serif text-2xl font-bold text-white/90">Admin Panel</h1>
              {DEMO_MODE && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 tracking-widest uppercase">
                  Demo
                </span>
              )}
            </div>
            <div className="ml-10.5 flex items-center gap-2">
              <p className="text-[12px] text-white/30">Manage products, stock & pricing</p>
              {adminEmail && (
                <span className="text-[10px] text-[#b76e79]/60 glass rounded-lg px-2 py-0.5 border border-[#b76e79]/20">
                  {adminEmail}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetToDefaults} className="glass rounded-xl border border-white/10 px-3 py-2 text-[11px] text-white/40 hover:text-white/70 flex items-center gap-1.5 transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
            <button onClick={() => setShowCredentials(true)} className="glass rounded-xl border border-white/10 px-3 py-2 text-[11px] text-white/40 hover:text-[#b76e79]/80 flex items-center gap-1.5 transition-all">
              <KeyRound className="w-3.5 h-3.5" /> Credentials
            </button>
            <button onClick={handleLogout} className="glass rounded-xl border border-white/10 px-3 py-2 text-[11px] text-white/40 hover:text-red-400 flex items-center gap-1.5 transition-all">
              <Lock className="w-3.5 h-3.5" /> Lock
            </button>
          </div>
        </div>

        {/* DB sync status */}
        {dbSyncing && (
          <div className="mb-4 flex items-center gap-2 text-[11px] text-[#b76e79]/70">
            <RefreshCw className="w-3 h-3 animate-spin" /> Syncing with database...
          </div>
        )}
        {dbError && (
          <div className="mb-4 flex items-start gap-2 glass rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-400">{dbError}</p>
          </div>
        )}


        {/* Tab switcher */}
        <div className="flex gap-1 glass rounded-2xl p-1 mb-8 w-fit">
          <button
            onClick={() => setAdminTab('products')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${adminTab === 'products' ? 'bg-gradient-to-r from-[#b76e79]/60 to-[#8b4f5a]/60 text-white shadow' : 'text-white/40 hover:text-white/70'}`}
          >
            <Shirt className="w-4 h-4" /> Products
          </button>
          <button
            onClick={() => setAdminTab('orders')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${adminTab === 'orders' ? 'bg-gradient-to-r from-[#b76e79]/60 to-[#8b4f5a]/60 text-white shadow' : 'text-white/40 hover:text-white/70'}`}
          >
            <ClipboardList className="w-4 h-4" /> Orders
          </button>
          <button
            onClick={() => setAdminTab('wishlist')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${adminTab === 'wishlist' ? 'bg-gradient-to-r from-[#b76e79]/60 to-[#8b4f5a]/60 text-white shadow' : 'text-white/40 hover:text-white/70'}`}
          >
            <Heart className="w-4 h-4" /> Wishlist
          </button>
        </div>

        {adminTab === 'orders' && <AdminOrdersTab />}
        {adminTab === 'wishlist' && <AdminWishlistTab />}

        {adminTab === 'products' && <>
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total Products', val: products.length },
            { label: 'In Stock', val: products.filter(p => (p.stock || 0) > 0).length },
            { label: 'Total Stock', val: products.reduce((n, p) => n + (p.stock || 0), 0) },
          ].map(({ label, val }) => (
            <div key={label} className="glass-dark rounded-2xl border border-white/8 px-4 py-3 text-center">
              <p className="font-serif text-2xl font-bold text-[#e8a0a8]">{val}</p>
              <p className="text-[10px] text-white/25 tracking-widest uppercase mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Add / Edit Form */}
        {(mode === 'add' || mode === 'edit') && (
          <div className="glass-dark rounded-[24px] border border-white/10 p-6 mb-8 shadow-xl">
            <h2 className="font-serif text-lg font-semibold text-white/90 mb-5">
              {mode === 'add' ? '+ Add New Product' : `Edit: ${editTarget?.name}`}
            </h2>
            <ProductForm
              initial={mode === 'edit' ? editTarget : EMPTY_PRODUCT}
              onSave={handleSave}
              onCancel={() => { setMode('list'); setEditTarget(null) }}
            />
          </div>
        )}

        {/* Products list */}
        <div className="glass-dark rounded-[24px] border border-white/10 overflow-hidden shadow-xl">
          {/* Table header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="font-serif text-base font-semibold text-white/80">
              Collection ({products.length})
            </h2>
            {mode === 'list' && (
              <button
                onClick={() => setMode('add')}
                className="btn-liquid rounded-xl px-4 py-2 text-[13px] font-semibold text-white flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            )}
          </div>

          {products.length === 0 && (
            <div className="py-16 text-center text-white/25 text-[13px]">
              No products. Click "Add Product" to start.
            </div>
          )}

          <div className="divide-y divide-white/[0.04]">
            {products.map((p) => (
              <div key={p.id} className={`flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/[0.02] ${p.active === false ? 'opacity-40' : ''}`}>
                {/* Image */}
                <img
                  src={p.img}
                  alt={p.imgAlt}
                  className="w-12 h-16 rounded-xl object-cover object-top flex-shrink-0 border border-white/8"
                  onError={e => e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&q=60&auto=format'}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-serif text-[14px] font-semibold text-white/90 truncate">{p.name}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/30 font-mono">{p.id}</span>
                    {p.addedAt && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/15">
                        New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[12px] text-[#e8a0a8] font-semibold">{p.priceDisplay || `₹${p.price?.toLocaleString('en-IN')}`}</span>
                    <span className="text-[10px] text-white/25 capitalize">{p.category}</span>
                    <span className="text-[10px] text-white/25">{p.vibe?.join(' + ')}</span>
                    {p.material && <span className="text-[9px] text-white/20 truncate max-w-[120px]">🧵 {p.material.split('•')[0]?.trim()}</span>}
                  </div>
                </div>

                {/* Stock badge */}
                <div className="flex-shrink-0">
                  <StockBadge stock={p.stock ?? 0} onChange={(s) => handleStockChange(p.id, s)} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(p.id)}
                    title={p.active === false ? 'Hidden from store' : 'Visible in store'}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${p.active === false ? 'glass text-white/20' : 'glass text-emerald-400/70 hover:text-emerald-400'}`}
                  >
                    {p.active === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => { setEditTarget(p); setMode('edit') }}
                    className="w-8 h-8 rounded-xl glass text-white/40 hover:text-white/80 flex items-center justify-center transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(p.id)}
                    className="w-8 h-8 rounded-xl glass text-white/30 hover:text-red-400 flex items-center justify-center transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Change credentials modal */}
        {showCredentials && (
          <ChangeCredentialsModal
            currentEmail={adminEmail}
            onClose={() => setShowCredentials(false)}
            onChanged={(newEmail) => setAdminEmail(newEmail)}
          />
        )}

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <div className="relative glass-dark rounded-[24px] border border-white/10 p-6 max-w-xs w-full text-center shadow-2xl">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h3 className="font-serif text-base font-bold text-white/90 mb-2">Delete Product?</h3>
              <p className="text-[12px] text-white/35 mb-5">This will remove the product from the store. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-500/80 hover:bg-red-500 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-all">
                  Delete
                </button>
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 glass rounded-xl border border-white/10 py-2.5 text-[13px] text-white/50 hover:text-white/80 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Note about DB sync status */}
        {DEMO_MODE && (
          <div className="mt-6 glass rounded-2xl border border-amber-400/15 px-5 py-4 text-[12px] text-amber-400/60 leading-relaxed">
            <strong className="text-amber-400/80">Demo mode:</strong> Product changes are saved in your browser only. Connect Supabase (add <code className="font-mono text-amber-300/60">VITE_SUPABASE_URL</code> + <code className="font-mono text-amber-300/60">VITE_SUPABASE_ANON_KEY</code>) and run <code className="font-mono text-amber-300/60">supabase_schema.sql</code> to persist to the database.
          </div>
        )}
        </>}
      </div>
    </div>
  )
}
