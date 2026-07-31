import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

export default function ProductCard({ product }) {
  const { addItem } = useCart()

  return (
    <div style={styles.card}>
      {/* Product image */}
      <Link to={`/product/${product.id}`}>
        <div style={styles.imageWrap}>
          <div style={styles.imagePlaceholder}>
            <span style={styles.imageIcon}>📦</span>
          </div>
        </div>
      </Link>

      {/* Product info */}
      <div style={styles.body}>
        <span style={styles.category}>{product.category}</span>
        <Link to={`/product/${product.id}`}>
          <h3 style={styles.name}>{product.name}</h3>
        </Link>
        <p style={styles.description}>{product.description}</p>

        <div style={styles.footer}>
          <span style={styles.price}>${product.price.toFixed(2)}</span>
          <button
            style={styles.addBtn}
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    transition: 'box-shadow 0.2s, transform 0.2s',
    cursor: 'pointer',
  },
  imageWrap: { width: '100%', aspectRatio: '4/3', overflow: 'hidden' },
  imagePlaceholder: {
    width: '100%', height: '100%',
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  imageIcon: { fontSize: 48 },
  body: { padding: '16px' },
  category: {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
    textTransform: 'uppercase', color: '#6366f1',
  },
  name: {
    fontSize: 15, fontWeight: 600, color: '#0f172a',
    margin: '4px 0 6px', lineHeight: 1.4,
  },
  description: {
    fontSize: 13, color: '#64748b',
    lineHeight: 1.5, marginBottom: 16,
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 18, fontWeight: 700, color: '#0f172a' },
  addBtn: {
    background: '#4f46e5', color: '#ffffff',
    fontSize: 13, fontWeight: 600,
    padding: '7px 14px', borderRadius: 6,
    border: 'none', cursor: 'pointer',
    transition: 'background 0.15s',
  },
}
