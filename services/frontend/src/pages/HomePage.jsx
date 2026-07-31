import React, { useState, useEffect } from 'react'
import { getClient } from '../graphql/client'
import { PRODUCTS_QUERY, SEARCH_PRODUCTS_QUERY } from '../graphql/queries'
import ProductCard from '../components/ui/ProductCard'

const CATEGORIES = ['All', 'electronics', 'footwear', 'bags', 'kitchen', 'furniture', 'fitness']

export default function HomePage() {
  const [products, setProducts]   = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('All')
  const [error, setError]         = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [category])

  async function fetchProducts() {
    setLoading(true)
    setError(null)
    try {
      const client = getClient()
      const data = await client.request(PRODUCTS_QUERY, {
        page: 1,
        pageSize: 20,
        category: category === 'All' ? null : category,
      })
      setProducts(data.products.products)
      setTotal(data.products.total)
    } catch (err) {
      setError('Failed to load products. Is the api-gateway running?')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!search.trim()) { fetchProducts(); return }
    setLoading(true)
    try {
      const client = getClient()
      const data = await client.request(SEARCH_PRODUCTS_QUERY, { query: search })
      setProducts(data.searchProducts.products)
      setTotal(data.searchProducts.total)
    } catch (err) {
      setError('Search failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Everything you need,<br />delivered fast.</h1>
        <p style={styles.heroSub}>Browse our curated catalogue of premium products.</p>

        {/* Search */}
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            style={styles.searchInput}
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" style={styles.searchBtn}>Search</button>
        </form>
      </div>

      <div style={styles.content}>
        {/* Category filter */}
        <div style={styles.filters}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              style={{ ...styles.filterBtn, ...(category === cat ? styles.filterBtnActive : {}) }}
              onClick={() => { setCategory(cat); setSearch('') }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!loading && (
          <p style={styles.resultCount}>
            {total} {total === 1 ? 'product' : 'products'}
          </p>
        )}

        {/* Error */}
        {error && <div style={styles.error}>{error}</div>}

        {/* Loading */}
        {loading && (
          <div style={styles.loadingGrid}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={styles.skeleton} />
            ))}
          </div>
        )}

        {/* Product grid */}
        {!loading && !error && (
          <div style={styles.grid}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
            {products.length === 0 && (
              <p style={styles.empty}>No products found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc' },
  hero: {
    background: '#0f172a',
    padding: '72px 24px',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 'clamp(28px, 5vw, 48px)',
    fontWeight: 800, color: '#ffffff',
    lineHeight: 1.2, marginBottom: 16,
    letterSpacing: '-0.5px',
  },
  heroSub: { fontSize: 18, color: '#94a3b8', marginBottom: 32 },
  searchForm: {
    display: 'flex', gap: 8, maxWidth: 480,
    margin: '0 auto',
  },
  searchInput: {
    flex: 1, padding: '12px 16px',
    borderRadius: 8, border: '1px solid #334155',
    background: '#1e293b', color: '#ffffff',
    fontSize: 15,
  },
  searchBtn: {
    padding: '12px 24px', background: '#4f46e5',
    color: '#ffffff', fontWeight: 600, fontSize: 15,
    borderRadius: 8, border: 'none', cursor: 'pointer',
  },
  content: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  filters: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 },
  filterBtn: {
    padding: '6px 16px', borderRadius: 999,
    border: '1px solid #e2e8f0', background: '#ffffff',
    fontSize: 13, fontWeight: 500, color: '#64748b',
    cursor: 'pointer', transition: 'all 0.15s',
  },
  filterBtnActive: {
    background: '#4f46e5', color: '#ffffff',
    border: '1px solid #4f46e5',
  },
  resultCount: { fontSize: 13, color: '#94a3b8', marginBottom: 20 },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#b91c1c', padding: '12px 16px',
    borderRadius: 8, marginBottom: 24, fontSize: 14,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 24,
  },
  loadingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 24,
  },
  skeleton: {
    height: 320, borderRadius: 12,
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
  empty: { color: '#94a3b8', gridColumn: '1/-1', textAlign: 'center', padding: 48 },
}
