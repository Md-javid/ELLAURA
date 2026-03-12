import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Mail, User, LogOut, ShoppingBag, ChevronRight, Search, RefreshCw, Trash2, Plus, Edit2, Save, X, Phone, Building2 } from 'lucide-react'
import { useAuth, useUI } from '../context/AppContext'
import { getUserOrders, signOut, getSavedAddresses, deleteAddress, updateProfile, saveAddress, updatePassword } from '../lib/supabase'

const STATUS_MAP = {
  pending:    { label: 'Order Placed',  color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20',  icon: Clock },
  confirmed:  { label: 'Confirmed',     color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/20',    icon: CheckCircle },
  processing: { label: 'Processing',    color: 'text-purple-400',  bg: 'bg-purple-400/10 border-purple-400/20', icon: Package },
  shipped:    { label: 'Shipped',       color: 'text-indigo-400',  bg: 'bg-indigo-400/10 border-indigo-400/20', icon: Truck },
  delivered:  { label: 'Delivered',     color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle },
  cancelled:  { label: 'Cancelled',    color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/20',      icon: Clock },
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
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${done ? `${info.bg} ${info.color}` : 'bg-white/5 border-white/10 text-white/20'}`}>
                <info.icon className="w-3.5 h-3.5" />
              </div>
              <p className={`text-[9px] mt-1.5 text-center ${done ? 'text-white/50' : 'text-white/15'}`}>{info.label}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mx-1 rounded-full transition-all ${i < currentIdx ? 'bg-gradient-to-r from-emerald-500/40 to-emerald-500/20' : 'bg-white/5'}`} />
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
    <div className="glass-dark rounded-[24px] border border-white/8 overflow-hidden transition-all duration-300 hover:border-white/12">
      {/* Header row */}
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-all">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${status.bg} ${status.color} flex-shrink-0`}>
          <StatusIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono text-[13px] font-bold text-[#e8a0a8]">#{shortId}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${status.bg} ${status.color}`}>{status.label}</span>
          </div>
          <p className="text-[11px] text-white/30 mt-0.5">{dateStr} · {items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[14px] font-bold text-white/80">₹{(order.total || 0).toLocaleString('en-IN')}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-white/20 flex-shrink-0 transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/5 px-5 py-4 space-y-4 animate-slideDown">
          {/* Timeline */}
          <OrderTimeline status={order.status || 'pending'} />

          {/* Items */}
          {items.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-[10px] tracking-[0.2em] text-white/25 uppercase">Items</p>
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 glass rounded-xl border border-white/5 px-3 py-2.5">
                  {item.product?.img && (
                    <img src={item.product.img} alt="" className="w-10 h-12 rounded-lg object-cover object-top flex-shrink-0 border border-white/8" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white/80 truncate">{item.product?.name || 'Product'}</p>
                    <p className="text-[10px] text-white/30">Size: {item.size} · Qty: {item.qty}</p>
                  </div>
                  <p className="text-[12px] font-bold text-[#e8a0a8] flex-shrink-0">₹{((item.product?.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}

          {/* Shipping address */}
          {addr && (addr.line1 || addr.city) && (
            <div className="glass rounded-xl border border-white/5 px-4 py-3">
              <p className="text-[10px] tracking-[0.2em] text-white/25 uppercase mb-1.5">Delivery Address</p>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#b76e79] flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-white/50 leading-relaxed">
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
      showToast(err?.message || 'Failed to update password.', 'error')
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

  // Real-time: listen for admin status update events (same browser tab)
  // Also poll every 30s so cross-device updates propagate automatically
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

  return (
    <div className="min-h-screen pt-16" style={{ background: '#0d0d0f' }}>
      {/* Header strip */}
      <div className="glass-liquid border-b border-purple-500/10 px-5 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl glass border border-purple-500/15 flex items-center justify-center hover:bg-purple-500/10 transition-all active:scale-90"
          >
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </button>
          <div className="flex-1">
            <h1 className="font-serif text-xl font-bold text-white/90">My Account</h1>
            <p className="text-[10px] text-purple-400/40 tracking-widest uppercase">Orders & Profile</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="glass rounded-xl p-1 flex gap-1 mb-6">
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
                  ? 'bg-gradient-to-r from-[#b76e79]/50 to-[#6366f1]/50 text-white shadow-lg'
                  : 'text-white/40 hover:text-white/60'
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
              <div className="flex-1 glass rounded-xl border border-white/10 px-3 flex items-center gap-2 focus-within:border-[#b76e79]/40 transition-all">
                <Search className="w-4 h-4 text-white/25" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  className="w-full bg-transparent text-white placeholder-white/20 outline-none text-[13px] py-2.5"
                />
              </div>
              <button onClick={loadOrders} className="glass rounded-xl border border-white/10 px-3 py-2.5 text-white/40 hover:text-white/70 transition-all" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <RefreshCw className="w-6 h-6 text-white/20 animate-spin mx-auto mb-3" />
                <p className="text-[13px] text-white/30">Loading orders...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 glass-dark rounded-[24px] border border-white/8">
                <ShoppingBag className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-semibold text-white/50 mb-1">
                  {searchQ ? 'No matching orders' : 'No orders yet'}
                </h3>
                <p className="text-[12px] text-white/25 mb-5">
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
                <h2 className="font-serif text-lg font-bold text-white/90">Saved Addresses</h2>
                <p className="text-[11px] text-white/30 mt-0.5">Used for faster checkout</p>
              </div>
              <button
                onClick={() => { setShowAddAddrForm(v => !v); setNewAddr(EMPTY_ADDR) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-white/10 text-[12px] text-white/50 hover:text-white hover:border-[#b76e79]/40 transition-all"
              >
                {showAddAddrForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddAddrForm ? 'Cancel' : 'Add Address'}
              </button>
            </div>

            {/* Add Address Form */}
            {showAddAddrForm && (
              <form onSubmit={handleAddAddress} className="glass-dark rounded-[20px] border border-[#b76e79]/20 px-5 py-5 space-y-4 mb-2">
                <p className="font-serif text-[14px] font-semibold text-white/80 mb-1">New Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Full Name *</label>
                    <div className="flex items-center gap-2 glass rounded-xl border border-white/10 px-3 py-2.5">
                      <User className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      <input type="text" placeholder="Your name" value={newAddr.name} onChange={e => setNewAddr(a => ({ ...a, name: e.target.value }))} className="flex-1 bg-transparent text-[13px] text-white/80 placeholder-white/20 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Phone</label>
                    <div className="flex items-center gap-2 glass rounded-xl border border-white/10 px-3 py-2.5">
                      <Phone className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      <input type="tel" placeholder="+91 XXXXXXXXXX" value={newAddr.phone} onChange={e => setNewAddr(a => ({ ...a, phone: e.target.value }))} className="flex-1 bg-transparent text-[13px] text-white/80 placeholder-white/20 outline-none" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Address Line 1 *</label>
                    <div className="flex items-center gap-2 glass rounded-xl border border-white/10 px-3 py-2.5">
                      <MapPin className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      <input type="text" placeholder="Flat / House no., Street" value={newAddr.line1} onChange={e => setNewAddr(a => ({ ...a, line1: e.target.value }))} className="flex-1 bg-transparent text-[13px] text-white/80 placeholder-white/20 outline-none" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">Address Line 2</label>
                    <div className="flex items-center gap-2 glass rounded-xl border border-white/10 px-3 py-2.5">
                      <Building2 className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      <input type="text" placeholder="Landmark, Area (optional)" value={newAddr.line2} onChange={e => setNewAddr(a => ({ ...a, line2: e.target.value }))} className="flex-1 bg-transparent text-[13px] text-white/80 placeholder-white/20 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">City *</label>
                    <div className="flex items-center gap-2 glass rounded-xl border border-white/10 px-3 py-2.5">
                      <input type="text" placeholder="City" value={newAddr.city} onChange={e => setNewAddr(a => ({ ...a, city: e.target.value }))} className="flex-1 bg-transparent text-[13px] text-white/80 placeholder-white/20 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">State *</label>
                    <div className="flex items-center gap-2 glass rounded-xl border border-white/10 px-3 py-2.5">
                      <input type="text" placeholder="State" value={newAddr.state} onChange={e => setNewAddr(a => ({ ...a, state: e.target.value }))} className="flex-1 bg-transparent text-[13px] text-white/80 placeholder-white/20 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.2em] text-white/30 uppercase block mb-1.5">PIN Code *</label>
                    <div className="flex items-center gap-2 glass rounded-xl border border-white/10 px-3 py-2.5">
                      <input type="text" placeholder="6-digit PIN" maxLength={6} value={newAddr.pincode} onChange={e => setNewAddr(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '') }))} className="flex-1 bg-transparent text-[13px] text-white/80 placeholder-white/20 outline-none font-mono" />
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
                <RefreshCw className="w-5 h-5 text-white/20 animate-spin mx-auto mb-2" />
                <p className="text-[12px] text-white/25">Loading addresses...</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="glass-dark rounded-[24px] border border-white/8 p-8 text-center">
                <MapPin className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-[14px] font-semibold text-white/40 mb-1">No saved addresses</p>
                <p className="text-[11px] text-white/20 mb-5">Add an address or it will be saved automatically after your first order</p>
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
                  <div key={addr.id} className="glass-dark rounded-[20px] border border-white/8 px-5 py-4 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#b76e79]/20 to-[#6366f1]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-[#b76e79]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-semibold text-white/80">{addr.name || '—'}</p>
                        {addr.is_default && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#b76e79]/15 text-[#b76e79] border border-[#b76e79]/20">Default</span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                        {[addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                      </p>
                      {addr.phone && <p className="text-[11px] text-white/30 mt-0.5">{addr.phone}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <p className="text-[10px] text-white/20 text-center mt-2">Addresses are also auto-saved when you place an order</p>
              </div>
            )}
          </div>
        )}

        {/* Account Tab */}
        {tab === 'account' && (
          <div className="space-y-4">
            {/* Profile card */}
            <div className="glass-dark rounded-[24px] border border-white/8 p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#b76e79] to-[#6366f1] flex items-center justify-center shadow-lg shadow-[#b76e79]/20">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-serif text-lg font-bold text-white/90">{getName(user) || 'Your Profile'}</h2>
                  <p className="text-[12px] text-white/35 truncate">{user.email}</p>
                </div>
                {!editingProfile ? (
                  <button
                    onClick={startEditProfile}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-white/10 text-[12px] text-white/50 hover:text-white hover:border-[#b76e79]/40 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="w-8 h-8 rounded-xl glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!editingProfile ? (
                <div className="space-y-3">
                  <div className="glass rounded-xl border border-white/5 px-4 py-3 flex items-center gap-3">
                    <Mail className="w-4 h-4 text-[#b76e79] flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-white/25 uppercase tracking-widest">Email</p>
                      <p className="text-[13px] text-white/60">{user.email}</p>
                    </div>
                  </div>
                  {getPhone(user) && (
                    <div className="glass rounded-xl border border-white/5 px-4 py-3 flex items-center gap-3">
                      <Phone className="w-4 h-4 text-[#b76e79] flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-white/25 uppercase tracking-widest">Phone</p>
                        <p className="text-[13px] text-white/60">{getPhone(user)}</p>
                      </div>
                    </div>
                  )}
                  {getCity(user) && (
                    <div className="glass rounded-xl border border-white/5 px-4 py-3 flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-[#b76e79] flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-white/25 uppercase tracking-widest">City</p>
                        <p className="text-[13px] text-white/60">{getCity(user)}</p>
                      </div>
                    </div>
                  )}
                  <div className="glass rounded-xl border border-white/5 px-4 py-3 flex items-center gap-3">
                    <Package className="w-4 h-4 text-[#b76e79] flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-white/25 uppercase tracking-widest">Total Orders</p>
                      <p className="text-[13px] text-white/60">{orders.length}</p>
                    </div>
                  </div>
                  <div className="glass rounded-xl border border-white/5 px-4 py-3 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-[#b76e79] flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-white/25 uppercase tracking-widest">Member Since</p>
                      <p className="text-[13px] text-white/60">
                        {new Date(user.created_at || user.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] tracking-[0.2em] text-white/30 uppercase mb-3">Edit Profile</p>
                  {[
                    { key: 'full_name', label: 'Full Name', icon: User, placeholder: 'Your name' },
                    { key: 'phone', label: 'Phone', icon: Phone, placeholder: '+91 XXXXXXXXXX' },
                    { key: 'city', label: 'City', icon: Building2, placeholder: 'Your city' },
                  ].map(({ key, label, icon: Icon, placeholder }) => (
                    <div key={key}>
                      <label className="text-[10px] tracking-[0.2em] text-white/25 uppercase block mb-1.5">{label}</label>
                      <div className="glass rounded-xl border border-white/10 px-3.5 flex items-center gap-2.5 focus-within:border-[#b76e79]/40 transition-all">
                        <Icon className="w-4 h-4 text-white/25 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder={placeholder}
                          value={profileForm[key]}
                          onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                          className="w-full bg-transparent text-white placeholder-white/20 outline-none text-[13px] py-2.5"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="glass rounded-xl border border-white/5 px-3.5 py-2.5 flex items-center gap-2.5 opacity-50">
                    <Mail className="w-4 h-4 text-white/25 flex-shrink-0" />
                    <p className="text-[13px] text-white/40">{user.email}</p>
                    <span className="ml-auto text-[10px] text-white/20">cannot change</span>
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
                  <div className="border-t border-white/8 pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => { setShowChangePassword(v => !v); setPwForm({ newPw: '', confirmPw: '' }) }}
                      className="w-full flex items-center justify-between text-[12px] text-white/40 hover:text-white/70 transition-colors"
                    >
                      <span className="flex items-center gap-2"><X className="w-3.5 h-3.5 rotate-45" />Change Password</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showChangePassword ? 'rotate-90' : ''}`} />
                    </button>
                    {showChangePassword && (
                      <form onSubmit={handleChangePassword} className="mt-3 space-y-3">
                        <div>
                          <label className="text-[10px] tracking-[0.2em] text-white/25 uppercase block mb-1.5">New Password *</label>
                          <div className="glass rounded-xl border border-white/10 px-3.5 flex items-center gap-2.5 focus-within:border-[#b76e79]/40 transition-all">
                            <input
                              type="password"
                              placeholder="Min. 8 characters"
                              value={pwForm.newPw}
                              onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                              className="w-full bg-transparent text-white placeholder-white/20 outline-none text-[13px] py-2.5"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] tracking-[0.2em] text-white/25 uppercase block mb-1.5">Confirm Password *</label>
                          <div className="glass rounded-xl border border-white/10 px-3.5 flex items-center gap-2.5 focus-within:border-[#b76e79]/40 transition-all">
                            <input
                              type="password"
                              placeholder="Re-enter new password"
                              value={pwForm.confirmPw}
                              onChange={e => setPwForm(f => ({ ...f, confirmPw: e.target.value }))}
                              className="w-full bg-transparent text-white placeholder-white/20 outline-none text-[13px] py-2.5"
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
            <div className="glass-dark rounded-[24px] border border-white/8 overflow-hidden">
              <Link to="/" className="flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-all border-b border-white/5">
                <ShoppingBag className="w-4 h-4 text-white/30" />
                <span className="text-[13px] text-white/60 flex-1">Continue Shopping</span>
                <ChevronRight className="w-4 h-4 text-white/15" />
              </Link>
              <Link to="/lookbook" className="flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-all border-b border-white/5">
                <Package className="w-4 h-4 text-white/30" />
                <span className="text-[13px] text-white/60 flex-1">Lookbook</span>
                <ChevronRight className="w-4 h-4 text-white/15" />
              </Link>
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-500/5 transition-all text-left">
                <LogOut className="w-4 h-4 text-red-400/50" />
                <span className="text-[13px] text-red-400/60">Sign Out</span>
              </button>
            </div>

            {/* WhatsApp support */}
            <div className="glass-dark rounded-[24px] border border-white/8 p-6 text-center">
              <p className="text-[10px] text-white/20 tracking-[0.2em] uppercase mb-2">Need Help?</p>
              <p className="text-[13px] text-white/40 mb-4">Reach out to us for any order-related queries</p>
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
