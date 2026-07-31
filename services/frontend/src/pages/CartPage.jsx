import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { getClient } from '../graphql/client'
import { CREATE_ORDER_MUTATION } from '../graphql/queries'

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart()
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function handleCheckout() {
    if (!user) { navigate('/login'); return }
    setLoading(true)
    setError(null)
    try {
      const client = getClient()
      await client.request(CREATE_ORDER_MUTATION, {
        input: {
          items: items.map(i => ({ productId: i.id, quantity: i.quantity }))
        }
      })
      clearCart()
      navigate('/orders')
    } catch (err) {
      setError('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div style={styles.empty}>
        <span style={styles.emptyIcon}>🛒</span>
        <h2 style={styles.emptyTitle}>Your cart is empty</h2>
        <p style={styles.emptySub}>Add some products to get started</p>
        <button style={styles.shopBtn} onClick={() => navigate('/')}>
          Browse products
        </button>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        <h1 style={styles.title}>Your Cart</h1>

        <div style={styles.layout}>
          {/* Items */}
          <div style={styles.items}>
            {items.map(item => (
              <div key={item.id} style={styles.item}>
                <div style={styles.itemImage}>📦</div>
                <div style={styles.itemInfo}>
                  <p style={styles.itemName}>{item.name}</p>
                  <p style={styles.itemPrice}>${item.price.toFixed(2)} each</p>
                </div>
                <div style={styles.itemControls}>
                  <button style={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                  <span style={styles.qty}>{item.quantity}</span>
                  <button style={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <p style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</p>
                <button style={styles.removeBtn} onClick={() => removeItem(item.id)}>✕</button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={styles.summary}>
            <h2 style={styles.summaryTitle}>Order Summary</h2>
            <div style={styles.summaryRow}>
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Shipping</span>
              <span style={{ color: '#10b981' }}>Free</span>
            </div>
            <div style={styles.summaryDivider} />
            <div style={{ ...styles.summaryRow, fontWeight: 700, fontSize: 18 }}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {error && <div style={styles.error}>{error}</div>}
            <button style={styles.checkoutBtn} onClick={handleCheckout} disabled={loading}>
              {loading ? 'Processing...' : 'Checkout'}
            </button>
            {!user && (
              <p style={styles.loginNote}>You'll need to sign in to complete your order</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', padding: '40px 24px' },
  inner: { maxWidth: 900, margin: '0 auto' },
  title: { fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 32 },
  layout: { display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' },
  items: { flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 12 },
  item: {
    background: '#ffffff', border: '1px solid #e2e8f0',
    borderRadius: 12, padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: 16,
  },
  itemImage: { fontSize: 32 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: 600, color: '#0f172a' },
  itemPrice: { fontSize: 13, color: '#64748b', marginTop: 2 },
  itemControls: { display: 'flex', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 6,
    border: '1px solid #e2e8f0', background: '#f8fafc',
    fontSize: 16, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  qty: { fontSize: 15, fontWeight: 600, minWidth: 24, textAlign: 'center' },
  itemTotal: { fontSize: 15, fontWeight: 700, color: '#0f172a', minWidth: 70, textAlign: 'right' },
  removeBtn: {
    background: 'none', border: 'none', color: '#94a3b8',
    cursor: 'pointer', fontSize: 14, padding: 4,
  },
  summary: {
    width: 280, background: '#ffffff',
    border: '1px solid #e2e8f0', borderRadius: 12, padding: 24,
    position: 'sticky', top: 80,
  },
  summaryTitle: { fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 20 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#374151', marginBottom: 12 },
  summaryDivider: { borderTop: '1px solid #e2e8f0', margin: '16px 0' },
  checkoutBtn: {
    width: '100%', background: '#4f46e5', color: '#ffffff',
    padding: '12px', borderRadius: 8, fontSize: 15,
    fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 20,
  },
  loginNote: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8 },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#b91c1c', padding: '10px', borderRadius: 8, fontSize: 13, marginTop: 12,
  },
  empty: {
    minHeight: '80vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 24, fontWeight: 700, color: '#0f172a' },
  emptySub: { fontSize: 15, color: '#64748b' },
  shopBtn: {
    marginTop: 8, background: '#4f46e5', color: '#ffffff',
    padding: '10px 24px', borderRadius: 8, fontSize: 15,
    fontWeight: 600, border: 'none', cursor: 'pointer',
  },
}
