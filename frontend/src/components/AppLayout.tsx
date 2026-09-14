import type { ReactNode } from 'react'
import { GovStripe } from './GovStripe'
import { Button } from './ui/Button'
import { useAuth } from '../lib/auth-context'
import { PERFIL_LABELS } from '../lib/types'

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gov-bg">
      <GovStripe />
      <header className="border-b border-gov-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-bold text-gov-text">Sistema PDA — MESP</h1>
            <p className="text-xs text-gov-text-muted">Ministério do Esporte • Plano de Dados Abertos</p>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-right text-xs text-gov-text-muted">
                <span className="block font-semibold text-gov-text">{user.nome}</span>
                {PERFIL_LABELS[user.perfil]}
                {user.area ? ` • ${user.area.nome}` : ''}
              </span>
              <Button variant="outline" onClick={() => void logout()}>
                Sair
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
