import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, LogOut, Package } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-navy sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Package className="text-primary-500" size={24} />
            <span className="text-white font-semibold text-lg tracking-tight">
              SecureShop
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/products"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
              Products
            </Link>
            {isAuthenticated && (
              <Link to="/orders"
                className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                Orders
              </Link>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-slate-300 hover:text-white transition-colors">
              <ShoppingCart size={20} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white
                                 text-xs font-bold rounded-full w-5 h-5
                                 flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-slate-300 text-sm hidden md:block">
                  {user?.name}
                </span>
                <button onClick={handleLogout}
                  className="p-2 text-slate-300 hover:text-white transition-colors">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login"
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700
                           text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                <User size={16} />
                Sign in
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}
