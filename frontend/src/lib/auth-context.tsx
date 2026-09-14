import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch, refreshAccessToken, registerSessionExpiredHandler, setAccessToken } from './api'
import type { Usuario } from './types'

type Status = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  user: Usuario | null
  status: Status
  login: (email: string, senha: string) => Promise<Usuario>
  logout: () => Promise<void>
  changePassword: (payload: { senha_atual?: string; nova_senha: string }) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface TokenResponse {
  access_token: string
  usuario: Usuario
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setAccessToken(null)
      setUser(null)
      setStatus('unauthenticated')
    })
    return () => registerSessionExpiredHandler(null)
  }, [])

  useEffect(() => {
    ;(async () => {
      const ok = await refreshAccessToken()
      if (!ok) {
        setStatus('unauthenticated')
        return
      }
      try {
        const me = await apiFetch<Usuario>('/auth/me')
        setUser(me)
        setStatus('authenticated')
      } catch {
        setAccessToken(null)
        setStatus('unauthenticated')
      }
    })()
  }, [])

  async function login(email: string, senha: string) {
    const data = await apiFetch<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
      skipAuthRetry: true,
    })
    setAccessToken(data.access_token)
    setUser(data.usuario)
    setStatus('authenticated')
    return data.usuario
  }

  async function logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } finally {
      setAccessToken(null)
      setUser(null)
      setStatus('unauthenticated')
    }
  }

  async function changePassword(payload: { senha_atual?: string; nova_senha: string }) {
    await apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify(payload) })
    setUser((prev) => (prev ? { ...prev, senha_provisoria: false } : prev))
  }

  async function refreshUser() {
    const me = await apiFetch<Usuario>('/auth/me')
    setUser(me)
  }

  return (
    <AuthContext.Provider value={{ user, status, login, logout, changePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
