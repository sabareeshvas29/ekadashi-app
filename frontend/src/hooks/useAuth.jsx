import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ekadashi_token')
    if (token) {
      api.get('/auth/me')
        .then(res => setAdmin(res.data))
        .catch(() => localStorage.removeItem('ekadashi_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    const res = await api.post('/auth/login', form)
    localStorage.setItem('ekadashi_token', res.data.access_token)
    setAdmin(res.data.admin)
    return res.data.admin
  }

  const logout = () => {
    localStorage.removeItem('ekadashi_token')
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)