import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getClient } from '../graphql/client'
import { MY_ORDERS_QUERY } from '../graphql/queries'

const STATUS_COLORS = {
  pending:   { bg: '#fef9c3', text: '#854d0e' },
  completed: { bg: '#dcfce7', text: '#166534' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
  refunded:  { bg: '#f3e8ff', text: '#6b21a8' },
}

export default function OrdersPage() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const { user }              = useAuth()
  const navigate              = useNavigate()

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchOrders()
  }, [user])

  async function fetchOrders() {
    try {
      const client = getClient()
      const data = await client.request(MY_ORDERS_QUERY)
      setOrders(data.myOrders)
    } catch (err) {
      setError('Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={styles.center}>Loading orders...</div>

  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        <h1 style={styles.title}>Your Orders</h1>

        {error && <div style={styles.error}>{error}</div>}

        {orders.length === 0 && !error && (
          <div style={styles.empty}>
            <span style={{ fontSize: 48 }}>📋</span>
            <p style={{ color: '#64748b', marginTop: 12 }}>No orders yet.</p>
            <button style={styles.shopBtn} onClick={() => navigate('/')}>
              Start shopping
            </button>
          </div>
        )}

        <div style={styles.list}>
          {orders.map(order => {
            const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.pending
            return (
              <div key={order.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <p style={styles.orderId}>Order #{order.id.slice(0, 8).toUpperCase()}</p>
                    <p style={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div style={styles.cardRight}>
                    <span style={{ ...styles.statusBadge, background: statusStyle.bg, color: statusStyle.text }}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <p style={styles.orderTotal}>${order.total.toFixed(2)}</p>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div style={styles.items}>
                    {order.items.map((item, i) => (
                      <div key={i} style={styles.item}>
                        <span style={styles.itemName}>{item.productName}</span>
                        <span style={styles.itemMeta}>
                          ×{item.quantity} · ${item.unitPrice.toFixed(2)} each
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', padding: '40px 24px' },
  inner: { maxWidth: 720, margin: '0 auto' },
  title: { fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 32 },
  center: { display: 'flex', justifyContent: 'center', padding: 80, color: '#64748b' },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#b91c1c', padding: '12px 16px', borderRadius: 8, marginBottom: 24,
  },
  empty: { textAlign: 'center', padding: '64px 0' },
  shopBtn: {
    marginTop: 16, background: '#4f46e5', color: '#ffffff',
    padding: '10px 24px', borderRadius: 8, fontSize: 15,
    fontWeight: 600, border: 'none', cursor: 'pointer',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: '#ffffff', border: '1px solid #e2e8f0',
    borderRadius: 12, overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
  },
  orderId: { fontSize: 15, fontWeight: 700, color: '#0f172a' },
  orderDate: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  cardRight: { textAlign: 'right' },
  statusBadge: {
    display: 'inline-block', padding: '3px 10px',
    borderRadius: 999, fontSize: 12, fontWeight: 600,
  },
  orderTotal: { fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 6 },
  items: { padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 14, color: '#374151', fontWeight: 500 },
  itemMeta: { fontSize: 13, color: '#94a3b8' },
}
