import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { useAuth } from './lib/auth-context'
import { CgtiHomePage } from './pages/admin/CgtiHomePage'
import { ForcePasswordChangePage } from './pages/auth/ForcePasswordChangePage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { LoginPage } from './pages/auth/LoginPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { BaseDetailPage } from './pages/dashboard/BaseDetailPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { DatasetFormWizard } from './pages/form/DatasetFormWizard'

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  if (status === 'authenticated') return <Navigate to="/" replace />
  return <>{children}</>
}

function RoleHome() {
  const { user } = useAuth()
  if (user?.perfil === 'master_cgti') return <Navigate to="/cgti" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/esqueci-senha"
        element={
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/redefinir-senha"
        element={
          <PublicOnlyRoute>
            <ResetPasswordPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/trocar-senha"
        element={
          <RequireAuth allowProvisional>
            <ForcePasswordChangePage />
          </RequireAuth>
        }
      />

      <Route
        path="/"
        element={
          <RequireAuth>
            <RoleHome />
          </RequireAuth>
        }
      />

      <Route
        path="/dashboard"
        element={
          <RequireAuth roles={['area', 'ouv_analista', 'adm_ouv']}>
            <DashboardPage />
          </RequireAuth>
        }
      />

      <Route
        path="/bases/:baseId"
        element={
          <RequireAuth roles={['area', 'ouv_analista', 'adm_ouv']}>
            <BaseDetailPage />
          </RequireAuth>
        }
      />

      <Route
        path="/formulario/nova"
        element={
          <RequireAuth roles={['area']}>
            <DatasetFormWizard />
          </RequireAuth>
        }
      />

      <Route
        path="/formulario/:baseId/reenviar"
        element={
          <RequireAuth roles={['area']}>
            <DatasetFormWizard />
          </RequireAuth>
        }
      />

      <Route
        path="/cgti"
        element={
          <RequireAuth roles={['master_cgti']}>
            <CgtiHomePage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
