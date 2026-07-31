import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { count }        = useCart()
  const navigate         = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>⬡</span>
          SecureShop
        </Link>

        {/* Nav links */}
        <div style={styles.links}>
          <Link to="/" style={styles.link}>Products</Link>
          {user && <Link to="/orders" style={styles.link}>Orders</Link>}
        </div>

        {/* Right side */}
        <div style={styles.right}>
          <Link to="/cart" style={styles.cartBtn}>
            <span>Cart</span>
            {count > 0 && <span style={styles.badge}>{count}</span>}
          </Link>

          {user ? (
            <div style={styles.userMenu}>
              <span style={styles.userName}>{user.name}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Sign out
              </button>
            </div>
          ) : (
            <div style={styles.authLinks}>
              <Link to="/login" style={styles.loginBtn}>Sign in</Link>
              <Link to="/register" style={styles.registerBtn}>Get started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    background: '#0f172a',
    borderBottom: '1px solid #1e293b',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 32,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '-0.3px',
  },
  logoIcon: { fontSize: 20, color: '#6366f1' },
  links: { display: 'flex', gap: 24, flex: 1 },
  link: { color: '#94a3b8', fontSize: 14, fontWeight: 500,
          transition: 'color 0.15s' },
  right: { display: 'flex', alignItems: 'center', gap: 16 },
  cartBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    color: '#94a3b8', fontSize: 14, fontWeight: 500,
    padding: '6px 12px', borderRadius: 6,
    border: '1px solid #1e293b',
    transition: 'all 0.15s',
  },
  badge: {
    background: '#4f46e5', color: '#fff',
    borderRadius: '999px', fontSize: 11,
    fontWeight: 700, padding: '1px 6px',
    minWidth: 18, textAlign: 'center',
  },
  userMenu: { display: 'flex', alignItems: 'center', gap: 12 },
  userName: { color: '#e2e8f0', fontSize: 14, fontWeight: 500 },
  logoutBtn: {
    background: 'transparent', color: '#94a3b8',
    fontSize: 14, padding: '6px 12px', borderRadius: 6,
    border: '1px solid #1e293b', cursor: 'pointer',
  },
  authLinks: { display: 'flex', alignItems: 'center', gap: 8 },
  loginBtn: {
    color: '#94a3b8', fontSize: 14, fontWeight: 500,
    padding: '6px 14px', borderRadius: 6,
  },
  registerBtn: {
    background: '#4f46e5', color: '#ffffff',
    fontSize: 14, fontWeight: 600,
    padding: '7px 16px', borderRadius: 6,
    transition: 'background 0.15s',
  },
}
