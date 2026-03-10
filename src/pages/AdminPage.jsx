import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import {
  ShieldCheck, Lock, ArrowLeft, Plus, Edit2, Trash2,
  Save, X, Package, Eye, EyeOff, UploadCloud,
  CheckCircle, AlertTriangle, ToggleLeft, ToggleRight,
  RefreshCw, IndianRupee, Tag, Mail, KeyRound, Shirt,
} from 'lucide-react'
import { DEMO_MODE, getProducts, upsertProduct, deleteProduct } from '../lib/supabase'

// ── Admin config ──────────────────────────────────────────────
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '123456'
const DEFAULT_PIN = !import.meta.env.VITE_ADMIN_PIN || import.meta.env.VITE_ADMIN_PIN === '123456'
const ADMIN_SESSION_KEY = 'ellaura_admin_session'
const ADMIN_PRODUCTS_KEY = 'ellaura_admin_products'
const ADMIN_ACCOUNTS_KEY = 'ellaura_admin_accounts'
const SESSION_TTL = 60 * 60 * 1000 // 1 hour

// Default admin credentials (override via VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD in .env)
const DEFAULT_ADMIN = {
  email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@ellaura.in',
  password: import.meta.env.VITE_ADMIN_PASSWORD || 'Ellaura@2026',
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

// Load/save admin accounts
const loadAdminAccounts = () => {
  try {
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY)
    return raw ? JSON.parse(raw) : [DEFAULT_ADMIN]
  } catch { return [DEFAULT_ADMIN] }
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
}

// ── Styles ────────────────────────────────────────────────────
const inputCls = 'w-full bg-transparent text-white placeholder-white/20 outline-none text-[13px] py-2.5'
const wrapCls = 'glass rounded-xl border border-white/10 px-3.5 flex items-center gap-2.5 focus-within:border-[#b76e79]/40 transition-all'

// ── Admin Login (Email/Password) ──────────────────────────────
function AdminLogin({ onVerify }) {
  const [mode, setMode] = useState('email') // 'email' | 'pin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // PIN mode state
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [shake, setShake] = useState(false)
  const refs = useRef([])

  const handleEmailLogin = (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      const accounts = loadAdminAccounts()
      const match = accounts.find(a => a.email === email && a.password === password)
      if (match) {
        const session = { ts: Date.now(), email: match.email }
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
        onVerify()
      } else {
        setError('Invalid email or password.')
      }
      setLoading(false)
    }, 500)
  }

  const handlePinChange = (i, val) => {
    if (!/^[0-9]?$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    setError('')
    if (val && i < 5) refs.current[i + 1]?.focus()
    if (next.every(Boolean)) {
      const pin = next.join('')
      if (pin === ADMIN_PIN) {
        const session = { ts: Date.now(), method: 'pin' }
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
        onVerify()
      } else {
        setError('Incorrect PIN. Try again.')
        setShake(true)
        setTimeout(() => { setDigits(['', '', '', '', '', '']); setShake(false); refs.current[0]?.focus() }, 600)
      }
    }
  }

  const handlePinKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
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
        {DEMO_MODE && (
          <div className="mt-2 glass rounded-xl border border-amber-400/20 px-3 py-2 text-center">
            <p className="text-[10px] text-amber-400/70">
              Demo credentials: <span className="font-mono font-bold text-amber-400">admin@ellaura.in</span>
            </p>
            <p className="text-[10px] text-amber-400/70">
              Password: <span className="font-mono font-bold text-amber-400">Ellaura@2026</span>
            </p>
          </div>
        )}
      </div>

      {/* Toggle tabs */}
      <div className="glass rounded-xl p-1 flex gap-1 w-full max-w-xs">
        <button
          onClick={() => setMode('email')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${mode === 'email' ? 'bg-gradient-to-r from-[#b76e79]/60 to-[#8b4f5a]/60 text-white shadow' : 'text-white/40'
            }`}
        >
          <Mail className="w-3 h-3" /> Email Login
        </button>
        <button
          onClick={() => setMode('pin')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${mode === 'pin' ? 'bg-gradient-to-r from-[#b76e79]/60 to-[#8b4f5a]/60 text-white shadow' : 'text-white/40'
            }`}
        >
          <KeyRound className="w-3 h-3" /> PIN Code
        </button>
      </div>

      {mode === 'email' ? (
        <form onSubmit={handleEmailLogin} className="w-full max-w-xs space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Email</label>
            <div className={wrapCls}>
              <Mail className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              <input
                type="email"
                placeholder="admin@ellaura.in"
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
            disabled={loading}
            className="w-full btn-liquid rounded-xl py-3 text-[14px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      ) : (
        <div>
          {DEMO_MODE && (
            <p className="text-[11px] text-amber-400/70 text-center mb-3">
              Demo PIN: <span className="font-mono font-bold text-amber-400">123456</span>
            </p>
          )}
          <div className={`flex gap-3 ${shake ? 'animate-[shake_0.3s_ease]' : ''}`}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => refs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handlePinChange(i, e.target.value)}
                onKeyDown={e => handlePinKeyDown(i, e)}
                className={`w-11 h-14 rounded-xl text-center text-xl font-bold font-mono transition-all outline-none
                  ${d
                    ? 'bg-gradient-to-br from-[#b76e79]/30 to-[#8b4f5a]/30 border-[#b76e79]/60 text-white border'
                    : 'glass border border-white/10 text-white/80'
                  }
                  focus:border-[#b76e79]/80 focus:shadow-lg focus:shadow-[#b76e79]/10
                `}
                autoFocus={i === 0}
              />
            ))}
          </div>
        </div>
      )}

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

  const handleSave = (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Email is required.')
    const accounts = loadAdminAccounts()
    const acc = accounts.find(a => a.email === currentEmail)
    if (!acc || acc.password !== currentPass) return setError('Current password is incorrect.')
    if (newPass.length < 8) return setError('New password must be at least 8 characters.')
    if (newPass !== confirmPass) return setError('Passwords do not match.')
    const updated = accounts.map(a =>
      a.email === currentEmail ? { email: email.trim(), password: newPass } : a
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

  const toggleVibe = (v) =>
    setForm(f => ({
      ...f,
      vibe: f.vibe.includes(v) ? f.vibe.filter(x => x !== v) : [...f.vibe, v],
    }))

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
          <div className={wClass}>
            <select value={form.category} onChange={set('category')} className={`${inputClass} bg-transparent`}>
              {['midi', 'slip', 'gown', 'bodycon', 'mini', 'maxi', 'co-ord'].map(c => (
                <option key={c} value={c} className="bg-neutral-900">{c}</option>
              ))}
            </select>
          </div>
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
            <input type="text" placeholder="XS, S, M, L, XL" value={form.sizes.join(', ')} onChange={setSizes} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Colors (comma-separated)</label>
          <div className={wClass}>
            <input type="text" placeholder="Jet Black, Blush Rose" value={(form.colors || []).join(', ')} onChange={setColors} className={inputClass} />
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
        <div className="flex gap-2">
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

// ── Main Admin Page ───────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [products, setProducts] = useState([])
  const [mode, setMode] = useState('list') // 'list' | 'add' | 'edit'
  const [editTarget, setEditTarget] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showPinClear, setShowPinClear] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [dbSyncing, setDbSyncing] = useState(false)
  const [dbError, setDbError] = useState('')

  // Check session on mount
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY) || 'null')
      if (s && Date.now() - s.ts < SESSION_TTL) {
        setAuthed(true)
        setAdminEmail(s.email || 'PIN Login')
      }
    } catch { }
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
    try { await upsertProduct(product) } catch (e) { console.warn('DB sync failed:', e.message) }
    finally { setDbSyncing(false) }
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

  // ── Auth Gate ─────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-sm">
          <AdminLogin onVerify={handleAuth} />
        </div>
      </div>
    )
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
        {!DEMO_MODE && DEFAULT_PIN && (
          <div className="mb-4 glass rounded-xl border border-red-500/20 px-4 py-3 text-[12px] text-red-400/80 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Default admin PIN is active. Set <code className="font-mono mx-1">VITE_ADMIN_PIN</code> in your environment variables before deploying.
          </div>
        )}

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
        {DEMO_MODE ? (
          <div className="mt-6 glass rounded-2xl border border-amber-400/15 px-5 py-4 text-[12px] text-amber-400/60 leading-relaxed">
            <strong className="text-amber-400/80">Demo mode:</strong> Product changes are saved in your browser only. Connect Supabase (add <code className="font-mono text-amber-300/60">VITE_SUPABASE_URL</code> + <code className="font-mono text-amber-300/60">VITE_SUPABASE_ANON_KEY</code>) and run <code className="font-mono text-amber-300/60">supabase_schema.sql</code> to persist to the database.
          </div>
        ) : (
          <div className="mt-6 glass rounded-2xl border border-emerald-500/15 px-5 py-4 text-[12px] text-emerald-400/60 leading-relaxed">
            <strong className="text-emerald-400/80">Live mode:</strong> Product changes are synced to Supabase in real time.
          </div>
        )}
      </div>
    </div>
  )
}
