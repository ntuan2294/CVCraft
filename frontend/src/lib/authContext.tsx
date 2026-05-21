'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { AuthUser } from './types'
import { authApi } from './backendApi'

interface AuthContext {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<void>
  logout: () => void
  isCandidate: boolean
}

const Ctx = createContext<AuthContext | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('cvcraft_user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    localStorage.setItem('cvcraft_token', res.accessToken)
    localStorage.setItem('cvcraft_refresh', res.refreshToken)
    localStorage.setItem('cvcraft_user', JSON.stringify(res.user))
    setUser(res.user)
  }, [])

  const register = useCallback(async (data: { email: string; password: string; fullName: string; phone?: string }) => {
    const res = await authApi.register(data)
    localStorage.setItem('cvcraft_token', res.accessToken)
    localStorage.setItem('cvcraft_refresh', res.refreshToken)
    localStorage.setItem('cvcraft_user', JSON.stringify(res.user))
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cvcraft_token')
    localStorage.removeItem('cvcraft_refresh')
    localStorage.removeItem('cvcraft_user')
    setUser(null)
  }, [])

  return (
    <Ctx.Provider value={{
      user, loading, login, register, logout,
      isCandidate: user?.role === 'CANDIDATE' || user?.role === 'ADMIN',
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
