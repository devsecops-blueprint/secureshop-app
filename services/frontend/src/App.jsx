import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/layout/Navbar'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import LoginPage from './pages/LoginPage'
import CartPage from './pages/CartPage'
import OrdersPage from './pages/OrdersPage'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-white">
          <Navbar />
          <main>
            <Routes>
              <Route path="/"         element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/cart"     element={<CartPage />} />
              <Route path="/orders"   element={<OrdersPage />} />
            </Routes>
          </main>
        </div>
      </CartProvider>
    </AuthProvider>
  )
}
