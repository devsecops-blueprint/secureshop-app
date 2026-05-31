import { useNavigate } from 'react-router-dom'
import { Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { gqlClient } from '../graphql/client'
import { CREATE_ORDER_MUTATION } from '../graphql/queries'
import { useState } from 'react'

export default function CartPage() {
  const { items, removeItem, clearCart, total } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [placing, setPlacing] = useState(false)
  const [error, setError]     = useState('')

  async function handleCheckout() {
    if (!isAuthenticated) { navigate('/login'); return }
    setPlacing(true)
    setError('')
    try {
      await gqlClient.request(CREATE_ORDER_MUTATION, {
        input: {
          items: items.map(i => ({ productId: i.id, quantity: i.quantity }))
        }
      })
      clearCart()
      navigate('/orders')
    } catch (err) {
      setError('Could not place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="mx-auto text-slate-300 mb-4" size={48} />
        <h2 className="text-xl font-semibold text-slate-700">Your cart is empty</h2>
        <p className="mt-2 text-slate-500 text-sm">Add some products to get started</p>
        <button onClick={() => navigate('/products')}
          className="mt-6 bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium
                     hover:bg-primary-700 transition-colors">
          Browse Products
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Your Cart</h1>

      <div className="space-y-3 mb-8">
        {items.map(item => (
          <div key={item.id}
            className="flex items-center gap-4 bg-white border border-slate-100
                       rounded-xl p-4">
            <img
              src={`https://placehold.co/64x64/f8fafc/94a3b8?text=${encodeURIComponent(item.name[0])}`}
              alt={item.name}
              className="w-16 h-16 rounded-lg object-cover bg-slate-50"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm truncate">{item.name}</p>
              <p className="text-slate-500 text-xs mt-0.5">${item.price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-900 text-sm">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
              <button onClick={() => removeItem(item.id)}
                className="text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-slate-600 font-medium">Total</span>
          <span className="text-2xl font-bold text-slate-900">${total.toFixed(2)}</span>
        </div>
        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}
        <button onClick={handleCheckout} disabled={placing}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200
                     text-white font-semibold py-3 rounded-lg transition-colors">
          {placing ? 'Placing order...' : 'Place Order'}
        </button>
      </div>
    </div>
  )
}
