import { useState, type FormEvent } from 'react'
import { GovStripe } from '../../components/GovStripe'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

export function ForcePasswordChangePage() {
  const { changePassword, logout } = useAuth()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (novaSenha.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmar) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      await changePassword({ nova_senha: novaSenha })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao definir a nova senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <GovStripe />
      <div className="flex flex-1 items-center justify-center bg-gov-bg px-4">
        <Card className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-lg font-bold text-gov-text">Defina sua senha</h1>
            <p className="mt-1 text-sm text-gov-text-muted">
              Você está usando uma senha provisória cadastrada pela CGTI. Por segurança, defina uma nova senha, só sua,
              para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="password"
              label="Nova senha"
              autoComplete="new-password"
              required
              minLength={6}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
            <Input
              type="password"
              label="Confirmar nova senha"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repita a nova senha"
            />

            {error && <Alert>{error}</Alert>}

            <Button type="submit" loading={loading} className="mt-2 w-full">
              Definir senha e continuar
            </Button>
            <Button type="button" variant="ghost" onClick={() => void logout()}>
              Sair
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
