import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Perfil } from '../lib/types'
import { useAuth } from '../lib/auth-context'

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gov-bg">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-gov-blue border-t-transparent" />
    </div>
  )
}

/** Gates a route behind an active session, and (unless allowProvisional) behind
 * having already replaced the provisional password — mirrored server-side by
 * `get_current_user` vs `get_current_user_any` in the backend. */
export function RequireAuth({
  children,
  allowProvisional = false,
  roles,
}: {
  children: ReactNode
  allowProvisional?: boolean
  roles?: Perfil[]
}) {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullScreenSpinner />

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.senha_provisoria && !allowProvisional) {
    return <Navigate to="/trocar-senha" replace />
  }

  if (!user.senha_provisoria && allowProvisional) {
    return <Navigate to="/" replace />
  }

  if (roles && !roles.includes(user.perfil)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
