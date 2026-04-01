import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Mail, User, LogOut, ShoppingBag, ChevronRight, Search, RefreshCw, Trash2, Plus, Edit2, Save, X, Phone, Building2 } from 'lucide-react'
import { useAuth, useUI } from '../context/AppContext'
import { getUserOrders, signOut, getSavedAddresses, deleteAddress, updateProfile, saveAddress, updatePassword } from '../lib/supabase'

const STATUS_MAP = {
  pending:    { label: 'Order Placed',  color: 'text-amber-600',   bg: 'bg-amber-500/10 border-amber-400/25',  icon: Clock },
  confirmed:  { label: 'Confirmed',     color: 'text-blue-600',    bg: 'bg-blue-500/10 border-blue-400/25',    icon: CheckCircle },
  processing: { label: 'Processing',    color: 'text-purple-600',  bg: 'bg-purple-500/10 border-purple-400/25', icon: Package },
  shipped:    { label: 'Shipped',       color: 'text-indigo-600',  bg: 'bg-indigo-500/10 border-indigo-400/25', icon: Truck },
  delivered:  { label: 'Delivered',     color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-400/25', icon: CheckCircle },
  cancelled:  { label: 'Cancelled',    color: 'text-red-600',     bg: 'bg-red-500/10 border-red-400/25',      icon: Clock },
}

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

function OrderTimeline({ status }) {
  const currentIdx = STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-0 w-full mt-4">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx
        const info = STATUS_MAP[step]
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${done ? `${info.bg} ${info.color}` : 'bg-white/60 border-[#b76e79]/12 text-[#2d1b1e]/20'}`}>
                <info.icon className="w-3.5 h-3.5" />
              </div>
              <p className={`text-[9px] mt-1.5 text-center ${done ? 'text-[#2d1b1e]/55' : 'text-[#2d1b1e]/20'}`}>{info.label}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mx-1 rounded-full transition-all ${i < currentIdx ? 'bg-gradient-to-r from-emerald-500/50 to-emerald-500/25' : 'bg-[#b76e79]/8'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_MAP[order.status] || STATUS_MAP.pending
  const StatusIcon = status.icon

  const date = new Date(order.created_at || order.createdAt || Date.now())
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const shortId = String(order.id).slice(-8).toUpperCase()

  const items = order.items || []
  const addr = order.shipping_address || order.shippingAddress || {}

  return (
    <div className="bg-white/70 rounded-[24px] border border-[#b76e79]/12 overflow-hidden transition-all duration-300 hover:border-[#b76e79]/25 shadow-sm">
      {/* Header row */}
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/50 transition-all">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${status.bg} ${status.color} flex-shrink-0`}>
          <StatusIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono text-[13px] font-bold text-[#b76e79]">#{shortId}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${status.bg} ${status.color}`}>{status.label}</span>
          </div>
          <p className="text-[11px] text-[#2d1b1e]/35 mt-0.5">{dateStr} · {items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[14px] font-bold text-[#2d1b1e]/80">₹{(order.total || 0).toLocaleString('en-IN')}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-[#2d1b1e]/20 flex-shrink-0 transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#b76e79]/8 px-5 py-4 space-y-4 animate-slideDown">
          {/* Timeline */}
          <OrderTimeline status={order.status || 'pending'} />

          {/* Items */}
          {items.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-[10px] tracking-[0.2em] text-[#2d1b1e]/30 uppercase">Items</p>
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/60 rounded-xl border border-[#b76e79]/10 px-3 py-2.5">
                  {item.product?.img && (
                    <img src={item.product.img} alt="" className="w-10 h-12 rounded-lg object-cover object-top flex-shrink-0 border border-[#b76e79]/10" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-[#2d1b1e]/80 truncate">{item.product?.name || 'Product'}</p>
                    <p className="text-[10px] text-[#2d1b1e]/35">Size: {item.size} · Qty: {item.qty}</p>
                  </div>
                  <p className="text-[12px] font-bold text-[#b76e79] flex-shrink-0">₹{((item.product?.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}

          {/* Shipping address */}
          {addr && (addr.line1 || addr.city) && (
            <div className="bg-white/60 rounded-xl border border-[#b76e79]/10 px-4 py-3">
              <p className="text-[10px] tracking-[0.2em] text-[#2d1b1e]/30 uppercase mb-1.5">Delivery Address</p>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#b76e79] flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#2d1b1e]/55 leading-relaxed">
                  {[addr.line1, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { showToast } = useUI()
  const [tab, setTab] = useState(searchParams.get('tab') || 'orders')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [addresses, setAddresses] = useState([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [showAddAddrForm, setShowAddAddrForm] = useState(false)
  const [addrSaving, setAddrSaving] = useState(false)
  const EMPTY_ADDR = { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' }
  const [newAddr, setNewAddr] = useState(EMPTY_ADDR)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [pwForm, setPwForm] = useState({ newPw: '', confirmPw: '' })
  const [pwSaving, setPwSaving] = useState(false)

  const getName = (u) => u?.full_name || u?.user_metadata?.full_name || ''
  const getPhone = (u) => u?.phone || u?.user_metadata?.phone || ''
  const getCity = (u) => u?.city || u?.user_metadata?.city || ''

  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', city: '' })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadOrders()
    loadAddresses()
  }, [user])

  const loadAddresses = async () => {
    if (!user?.id) return
    setAddrLoading(true)
    const addrs = await getSavedAddresses(user.id)
    setAddresses(addrs || [])
    setAddrLoading(false)
  }

  const handleDeleteAddress = async (addressId) => {
    await deleteAddress(user.id, addressId)
    setAddresses(prev => prev.filter(a => a.id !== addressId))
  }

  const handleAddAddress = async (e) => {
    e.preventDefault()
    if (!newAddr.name.trim()) return showToast('Name is required.', 'error')
    if (!newAddr.line1.trim()) return showToast('Address line 1 is required.', 'error')
    if (!newAddr.city.trim()) return showToast('City is required.', 'error')
    if (!newAddr.state.trim()) return showToast('State is required.', 'error')
    if (!/^\d{6}$/.test(newAddr.pincode.trim())) return showToast('Enter a valid 6-digit PIN code.', 'error')
    setAddrSaving(true)
    try {
      await saveAddress(user.id, newAddr)
      await loadAddresses()
      setNewAddr(EMPTY_ADDR)
      setShowAddAddrForm(false)
      showToast('Address saved!', 'success')
    } catch {
      showToast('Failed to save address.', 'error')
    } finally {
      setAddrSaving(false)
    }
  }

  const startEditProfile = () => {
    setProfileForm({
      full_name: getName(user),
      phone: getPhone(user),
      city: getCity(user),
    })
    setEditingProfile(true)
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPw.length < 8) return showToast('Password must be at least 8 characters.', 'error')
    if (pwForm.newPw !== pwForm.confirmPw) return showToast('Passwords do not match.', 'error')
    setPwSaving(true)
    try {
      await updatePassword(pwForm.newPw)
      setPwForm({ newPw: '', confirmPw: '' })
      setShowChangePassword(false)
      showToast('Password updated!', 'success')
    } catch (err) {
      const msg = err?.message || ''
      if (msg.toLowerCase().includes('session missing') || msg.toLowerCase().includes('session')) {
        showToast('Session expired — please log out and log back in, then try again.', 'error')
      } else {
        showToast(msg || 'Failed to update password.', 'error')
      }
    } finally {
      setPwSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profileForm.full_name.trim()) return showToast('Name cannot be empty.', 'error')
    setProfileSaving(true)
    await updateProfile(user.id, {
      full_name: profileForm.full_name.trim(),
      phone: profileForm.phone.trim(),
      city: profileForm.city.trim(),
    })
    setProfileSaving(false)
    setEditingProfile(false)
    showToast('Profile updated! ✨', 'success')
  }

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await getUserOrders(user?.id)
      setOrders(data || [])
    } catch { setOrders([]) }
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    const onOrderUpdated = () => loadOrders()
    window.addEventListener('ellaura_order_updated', onOrderUpdated)
    const interval = setInterval(loadOrders, 30000)
    return () => {
      window.removeEventListener('ellaura_order_updated', onOrderUpdated)
      clearInterval(interval)
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const filtered = orders.filter(o => {
    if (!searchQ.trim()) return true
    const q = searchQ.toLowerCase()
    return String(o.id).toLowerCase().includes(q) || (o.status || '').toLowerCase().includes(q)
  })

  if (!user) return null

  // ── Shared light-mode style tokens ──
  const inputCls = "w-full bg-transparent text-[#2d1b1e] placeholder-[#2d1b1e]/35 outline-none text-[13px] py-2.5"
  const fieldWrap = "bg-white/60 rounded-xl border border-[#b76e79]/15 px-3.5 flex items-center gap-2.5 focus-within:border-[#b76e79]/45 transition-all shadow-sm"
  const labelCls = "text-[10px] tracking-[0.2em] text-[#2d1b1e]/35 uppercase block mb-1.5"
  const iconCls = "w-4 h-4 text-[#2d1b1e]/30 flex-shrink-0"

  return (
    <div className="min-h-screen pt-16" style={{ background: 'linear-gradient(135deg, #fff9fb 0%, #fef9f5 48%, #f7f3ff 100%)' }}>
      {/* Header strip */}
      <div className="glass-liquid border-b border-[#b76e79]/12 px-5 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl bg-white/60 border border-[#b76e79]/18 flex items-center justify-center hover:bg-[#f5c6d0]/30 transition-all active:scale-90"
          >
            <ArrowLeft className="w-4 h-4 text-[#4d3439]" />
          </button>
          <div className="flex-1">
            <h1 className="font-serif text-xl font-bold text-[#2d1b1e]">My Account</h1>
            <p className="text-[10px] text-[#8b6269] tracking-widest uppercase">Orders & Profile</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="bg-white/70 rounded-xl p-1 flex gap-1 mb-6 border border-[#b76e79]/10 shadow-sm">
          {[
            { key: 'orders', label: 'My Orders', icon: Package },
            { key: 'addresses', label: 'Addresses', icon: MapPin },
            { key: 'account', label: 'Account', icon: User },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                tab === t.key
                  ? 'bg-gradient-to-r from-[#b76e79]/60 to-[#e8a0a8]/60 text-white shadow-md'
                  : 'text-[#2d1b1e]/40 hover:text-[#2d1b1e]/65'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="space-y-4">
            {/* Search & refresh */}
            <div className="flex gap-3">
              <div className="flex-1 bg-white/60 rounded-xl border border-[#b76e79]/15 px-3 flex items-center gap-2 focus-within:border-[#b76e79]/40 transition-all shadow-sm">
                <Search className="w-4 h-4 text-[#2d1b1e]/25" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  className="w-full bg-transparent text-[#2d1b1e] placeholder-[#2d1b1e]/30 outline-none text-[13px] py-2.5"
                />
              </div>
              <button onClick={loadOrders} className="bg-white/60 rounded-xl border border-[#b76e79]/15 px-3 py-2.5 text-[#2d1b1e]/40 hover:text-[#2d1b1e]/70 transition-all shadow-sm" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <RefreshCw className="w-6 h-6 text-[#2d1b1e]/20 animate-spin mx-auto mb-3" />
                <p className="text-[13px] text-[#2d1b1e]/35">Loading orders...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-white/60 rounded-[24px] border border-[#b76e79]/12 shadow-sm">
                <ShoppingBag className="w-10 h-10 text-[#2d1b1e]/12 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-semibold text-[#2d1b1e]/50 mb-1">
                  {searchQ ? 'No matching orders' : 'No orders yet'}
                </h3>
                <p className="text-[12px] text-[#2d1b1e]/30 mb-5">
                  {searchQ ? 'Try a different search term' : 'Start shopping to see your orders here'}
                </p>
                {!searchQ && (
                  <Link to="/" className="btn-liquid inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-[13px] font-semibold text-white">
                    <ShoppingBag className="w-4 h-4" /> Browse Collection
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {tab === 'addresses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#2d1b1e]">Saved Addresses</h2>
                <p className="text-[11px] text-[#2d1b1e]/35 mt-0.5">Used for faster checkout</p>
              </div>
              <button
                onClick={() => { setShowAddAddrForm(v => !v); setNewAddr(EMPTY_ADDR) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/60 border border-[#b76e79]/15 text-[12px] text-[#2d1b1e]/50 hover:text-[#2d1b1e] hover:border-[#b76e79]/40 transition-all shadow-sm"
              >
                {showAddAddrForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddAddrForm ? 'Cancel' : 'Add Address'}
              </button>
            </div>

            {/* Add Address Form */}
            {showAddAddrForm && (
              <form onSubmit={handleAddAddress} className="bg-white/70 rounded-[20px] border border-[#b76e79]/18 px-5 py-5 space-y-4 mb-2 shadow-sm">
                <p className="font-serif text-[14px] font-semibold text-[#2d1b1e] mb-1">New Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <div className={fieldWrap}>
                      <User className={iconCls} />
                      <input type="text" placeholder="Your name" value={newAddr.name} onChange={e => setNewAddr(a => ({ ...a, name: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <div className={fieldWrap}>
                      <Phone className={iconCls} />
                      <input type="tel" placeholder="+91 XXXXXXXXXX" value={newAddr.phone} onChange={e => setNewAddr(a => ({ ...a, phone: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Address Line 1 *</label>
                    <div className={fieldWrap}>
                      <MapPin className={iconCls} />
                      <input type="text" placeholder="Flat / House no., Street" value={newAddr.line1} onChange={e => setNewAddr(a => ({ ...a, line1: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Address Line 2</label>
                    <div className={fieldWrap}>
                      <Building2 className={iconCls} />
                      <input type="text" placeholder="Landmark, Area (optional)" value={newAddr.line2} onChange={e => setNewAddr(a => ({ ...a, line2: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>City *</label>
                    <div className={fieldWrap}>
                      <input type="text" placeholder="City" value={newAddr.city} onChange={e => setNewAddr(a => ({ ...a, city: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>State *</label>
                    <div className={fieldWrap}>
                      <input type="text" placeholder="State" value={newAddr.state} onChange={e => setNewAddr(a => ({ ...a, state: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>PIN Code *</label>
                    <div className={fieldWrap}>
                      <input type="text" placeholder="6-digit PIN" maxLength={6} value={newAddr.pincode} onChange={e => setNewAddr(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '') }))} className={inputCls + " font-mono"} />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={addrSaving} className="w-full btn-liquid rounded-xl py-3 text-[13px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60">
                  {addrSaving ? 'Saving...' : 'Save Address'}
                </button>
              </form>
            )}

            {addrLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-5 h-5 text-[#2d1b1e]/20 animate-spin mx-auto mb-2" />
                <p className="text-[12px] text-[#2d1b1e]/30">Loading addresses...</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="bg-white/60 rounded-[24px] border border-[#b76e79]/12 p-8 text-center shadow-sm">
                <MapPin className="w-10 h-10 text-[#2d1b1e]/12 mx-auto mb-3" />
                <p className="text-[14px] font-semibold text-[#2d1b1e]/45 mb-1">No saved addresses</p>
                <p className="text-[11px] text-[#2d1b1e]/25 mb-5">Add an address or it will be saved automatically after your first order</p>
                <button
                  onClick={() => { setShowAddAddrForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="btn-liquid inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-semibold text-white"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Address
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map(addr => (
                  <div key={addr.id} className="bg-white/70 rounded-[20px] border border-[#b76e79]/12 px-5 py-4 flex items-start gap-4 shadow-sm">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#b76e79]/15 to-[#e8a0a8]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-[#b76e79]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-semibold text-[#2d1b1e]/80">{addr.name || '—'}</p>
                        {addr.is_default && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#b76e79]/15 text-[#b76e79] border border-[#b76e79]/20">Default</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#2d1b1e]/45 mt-1 leading-relaxed">
                        {[addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                      </p>
                      {addr.phone && <p className="text-[11px] text-[#2d1b1e]/35 mt-0.5">{addr.phone}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-[#2d1b1e]/20 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <p className="text-[10px] text-[#2d1b1e]/25 text-center mt-2">Addresses are also auto-saved when you place an order</p>
              </div>
            )}
          </div>
        )}

        {/* Account Tab */}
        {tab === 'account' && (
          <div className="space-y-4">
            {/* Profile card */}
            <div className="bg-white/70 rounded-[24px] border border-[#b76e79]/12 p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#b76e79] to-[#e8a0a8] flex items-center justify-center shadow-lg shadow-[#b76e79]/20">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-serif text-lg font-bold text-[#2d1b1e]">{getName(user) || 'Your Profile'}</h2>
                  <p className="text-[12px] text-[#2d1b1e]/40 truncate">{user.email}</p>
                </div>
                {!editingProfile ? (
                  <button
                    onClick={startEditProfile}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/60 border border-[#b76e79]/15 text-[12px] text-[#2d1b1e]/50 hover:text-[#2d1b1e] hover:border-[#b76e79]/40 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="w-8 h-8 rounded-xl bg-white/60 border border-[#b76e79]/15 flex items-center justify-center text-[#2d1b1e]/40 hover:text-[#2d1b1e] transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!editingProfile ? (
                <div className="space-y-3">
                  <div className="bg-white/60 rounded-xl border border-[#b76e79]/8 px-4 py-3 flex items-center gap-3">
                    <Mail className="w-4 h-4 text-[#b76e79] flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-[#2d1b1e]/30 uppercase tracking-widest">Email</p>
                      <p className="text-[13px] text-[#2d1b1e]/65">{user.email}</p>
                    </div>
                  </div>
                  {getPhone(user) && (
                    <div className="bg-white/60 rounded-xl border border-[#b76e79]/8 px-4 py-3 flex items-center gap-3">
                      <Phone className="w-4 h-4 text-[#b76e79] flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#2d1b1e]/30 uppercase tracking-widest">Phone</p>
                        <p className="text-[13px] text-[#2d1b1e]/65">{getPhone(user)}</p>
                      </div>
                    </div>
                  )}
                  {getCity(user) && (
                    <div className="bg-white/60 rounded-xl border border-[#b76e79]/8 px-4 py-3 flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-[#b76e79] flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#2d1b1e]/30 uppercase tracking-widest">City</p>
                        <p className="text-[13px] text-[#2d1b1e]/65">{getCity(user)}</p>
                      </div>
                    </div>
                  )}
                  <div className="bg-white/60 rounded-xl border border-[#b76e79]/8 px-4 py-3 flex items-center gap-3">
                    <Package className="w-4 h-4 text-[#b76e79] flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-[#2d1b1e]/30 uppercase tracking-widest">Total Orders</p>
                      <p className="text-[13px] text-[#2d1b1e]/65">{orders.length}</p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-xl border border-[#b76e79]/8 px-4 py-3 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-[#b76e79] flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-[#2d1b1e]/30 uppercase tracking-widest">Member Since</p>
                      <p className="text-[13px] text-[#2d1b1e]/65">
                        {new Date(user.created_at || user.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className={labelCls + " mb-3"}>Edit Profile</p>
                  {[
                    { key: 'full_name', label: 'Full Name', icon: User, placeholder: 'Your name' },
                    { key: 'phone', label: 'Phone', icon: Phone, placeholder: '+91 XXXXXXXXXX' },
                    { key: 'city', label: 'City', icon: Building2, placeholder: 'Your city' },
                  ].map(({ key, label, icon: Icon, placeholder }) => (
                    <div key={key}>
                      <label className={labelCls}>{label}</label>
                      <div className={fieldWrap}>
                        <Icon className={iconCls} />
                        <input
                          type="text"
                          placeholder={placeholder}
                          value={profileForm[key]}
                          onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                          className={inputCls}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="bg-white/40 rounded-xl border border-[#b76e79]/8 px-3.5 py-2.5 flex items-center gap-2.5 opacity-50">
                    <Mail className={iconCls} />
                    <p className="text-[13px] text-[#2d1b1e]/45">{user.email}</p>
                    <span className="ml-auto text-[10px] text-[#2d1b1e]/25">cannot change</span>
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    className="w-full btn-liquid rounded-xl py-3 text-[13px] font-semibold text-white flex items-center justify-center gap-2 mt-1 disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>

                  {/* Change Password */}
                  <div className="border-t border-[#b76e79]/10 pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => { setShowChangePassword(v => !v); setPwForm({ newPw: '', confirmPw: '' }) }}
                      className="w-full flex items-center justify-between text-[12px] text-[#2d1b1e]/45 hover:text-[#2d1b1e]/75 transition-colors"
                    >
                      <span className="flex items-center gap-2"><X className="w-3.5 h-3.5 rotate-45" />Change Password</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showChangePassword ? 'rotate-90' : ''}`} />
                    </button>
                    {showChangePassword && (
                      <form onSubmit={handleChangePassword} className="mt-3 space-y-3">
                        <div>
                          <label className={labelCls}>New Password *</label>
                          <div className={fieldWrap}>
                            <input
                              type="password"
                              placeholder="Min. 8 characters"
                              value={pwForm.newPw}
                              onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                              className={inputCls}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Confirm Password *</label>
                          <div className={fieldWrap}>
                            <input
                              type="password"
                              placeholder="Re-enter new password"
                              value={pwForm.confirmPw}
                              onChange={e => setPwForm(f => ({ ...f, confirmPw: e.target.value }))}
                              className={inputCls}
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={pwSaving}
                          className="w-full btn-liquid rounded-xl py-3 text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          <Save className="w-4 h-4" />
                          {pwSaving ? 'Updating...' : 'Update Password'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-white/70 rounded-[24px] border border-[#b76e79]/12 overflow-hidden shadow-sm">
              <Link to="/" className="flex items-center gap-3 px-5 py-4 hover:bg-white/60 transition-all border-b border-[#b76e79]/8">
                <ShoppingBag className="w-4 h-4 text-[#2d1b1e]/35" />
                <span className="text-[13px] text-[#2d1b1e]/65 flex-1">Continue Shopping</span>
                <ChevronRight className="w-4 h-4 text-[#2d1b1e]/18" />
              </Link>
              <Link to="/lookbook" className="flex items-center gap-3 px-5 py-4 hover:bg-white/60 transition-all border-b border-[#b76e79]/8">
                <Package className="w-4 h-4 text-[#2d1b1e]/35" />
                <span className="text-[13px] text-[#2d1b1e]/65 flex-1">Lookbook</span>
                <ChevronRight className="w-4 h-4 text-[#2d1b1e]/18" />
              </Link>
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition-all text-left">
                <LogOut className="w-4 h-4 text-red-400/60" />
                <span className="text-[13px] text-red-500/70">Sign Out</span>
              </button>
            </div>

            {/* WhatsApp support */}
            <div className="bg-white/70 rounded-[24px] border border-[#b76e79]/12 p-6 text-center shadow-sm">
              <p className="text-[10px] text-[#2d1b1e]/25 tracking-[0.2em] uppercase mb-2">Need Help?</p>
              <p className="text-[13px] text-[#2d1b1e]/45 mb-4">Reach out to us for any order-related queries</p>
              <a
                href="https://wa.me/919087915193"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-liquid inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-[13px] font-semibold text-white"
              >
                WhatsApp Support
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
