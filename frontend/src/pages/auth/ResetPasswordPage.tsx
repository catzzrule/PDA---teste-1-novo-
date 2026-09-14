import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GovStripe } from '../../components/GovStripe'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { ApiError, apiFetch } from '../../lib/api'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('Link de redefinição inválido. Solicite um novo.')
      return
    }
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
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, nova_senha: novaSenha }),
        skipAuthRetry: true,
      })
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <GovStripe />
      <div className="flex flex-1 items-center justify-center bg-gov-bg px-4">
        <Card className="w-full max-w-md">
          <h1 className="mb-1 text-lg font-bold text-gov-text">Redefinir senha</h1>
          <p className="mb-6 text-sm text-gov-text-muted">Escolha uma nova senha para acessar o sistema.</p>

          {done ? (
            <Alert variant="success">Senha redefinida com sucesso! Redirecionando para o login…</Alert>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="password"
                label="Nova senha"
                required
                minLength={6}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
              <Input
                type="password"
                label="Confirmar nova senha"
                required
                minLength={6}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
              />
              {error && <Alert>{error}</Alert>}
              <Button type="submit" loading={loading} className="w-full">
                Redefinir senha
              </Button>
            </form>
          )}

          <Link to="/login" className="mt-6 inline-block text-sm font-medium text-gov-blue hover:underline">
            Voltar ao login
          </Link>
        </Card>
      </div>
    </div>
  )
}
