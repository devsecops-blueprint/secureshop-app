import React, { createContext, useContext, useState, useEffect } from 'react'
import { getClient } from '../graphql/client'
import { LOGIN_MUTATION, REGISTER_MUTATION } from '../graphql/queries'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore user session from localStorage on page load
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  async function login(email, password) {
    const client = getClient()
    const data = await client.request(LOGIN_MUTATION, { email, password })
    const { token, user } = data.login
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }

  async function register(name, email, password) {
    const client = getClient()
    const data = await client.request(REGISTER_MUTATION, {
      input: { name, email, password }
    })
    const { token, user } = data.register
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
