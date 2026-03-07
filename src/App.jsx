import { Routes, Route } from 'react-router-dom'
import { useUI } from './context/AppContext'
import Header from './components/Header'
import AIStylist from './components/AIStylist'
import SearchModal from './components/SearchModal'
import CartSidebar from './components/CartSidebar'
import Toast from './components/Toast'
import ProductModal from './components/ProductModal'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import AdminPage from './pages/AdminPage'
import LookbookPage from './pages/LookbookPage'
import OrdersPage from './pages/OrdersPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  const { searchOpen, setSearchOpen, toast } = useUI()

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
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/lookbook" element={<LookbookPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <AIStylist />
    </div>
  )
}
