import { Routes, Route, Navigate } from 'react-router-dom'
import { useUI, useAuth } from './context/AppContext'
import Header from './components/Header'
import AIStylist from './components/AIStylist'
import SearchModal from './components/SearchModal'
import CartSidebar from './components/CartSidebar'
import Toast from './components/Toast'
import ProductModal from './components/ProductModal'
import ComingSoonPage from './pages/ComingSoonPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import AdminPage from './pages/AdminPage'
import LookbookPage from './pages/LookbookPage'
import OrdersPage from './pages/OrdersPage'
import NotFoundPage from './pages/NotFoundPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'

// ── Admin route guard ────────────────────────────────────────
// Blocks regular logged-in customers from accessing /admin.
// Only unauthenticated visitors (who will see the admin login form)
// or sessions with a valid admin sessionStorage token are allowed in.
const ADMIN_SESSION_KEY = 'ellaura_admin_session'
const ADMIN_SESSION_TTL = 60 * 60 * 1000 // 1 hour

function AdminRoute() {
  const { user, authLoading } = useAuth()
  const hasAdminSession = (() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY) || 'null')
      return !!(s && (Date.now() - s.ts < ADMIN_SESSION_TTL))
    } catch { return false }
  })()
  // Wait for auth to resolve to avoid a flash redirect
  if (authLoading) return null
  // Logged-in regular customer with no admin session → send home
  if (user && !hasAdminSession) return <Navigate to="/" replace />
  return <AdminPage />
}

// ── COMING SOON MODE ──────────────────────────────────────────
// Toggle via npm commands (automatic, no manual edit needed):
//   npm run coming-soon:on   → show Coming Soon page to visitors
//   npm run coming-soon:off  → go live (disable Coming Soon gate)
// Then redeploy / restart dev server for changes to take effect.
const COMING_SOON = false

export default function App() {
  const { searchOpen, setSearchOpen, toast } = useUI()

  // ── Coming Soon gate: only /admin bypasses it ─────────────
  if (COMING_SOON && typeof window !== 'undefined') {
    const path = window.location.pathname
    const isAdminPath = path === '/admin' || path.startsWith('/admin/')
    if (!isAdminPath) {
      return <ComingSoonPage />
    }
  }

  return (
    <div className="neon-bg min-h-screen relative">
      <Header />
      <CartSidebar />
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      {toast && <Toast message={toast.message} type={toast.type} />}
      <ProductModal />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/lookbook" element={<LookbookPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <AIStylist />
    </div>
  )
}
