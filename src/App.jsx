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
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  const { searchOpen, setSearchOpen, toast } = useUI()

  return (
    <div className="neon-bg min-h-screen relative">
      {/* Ambient desktop glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[15%] left-[5%] w-96 h-96 rounded-full bg-[#b76e79]/6 blur-3xl" />
        <div className="absolute bottom-[20%] right-[5%] w-80 h-80 rounded-full bg-[#6366f1]/6 blur-3xl" />
        <div className="absolute top-[60%] left-[50%] w-64 h-64 rounded-full bg-[#e8a0a8]/4 blur-3xl" />
      </div>

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
        <Route path="/lookbook" element={<LookbookPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <AIStylist />
    </div>
  )
}
