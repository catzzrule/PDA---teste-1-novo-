import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { GovStripe } from '../../components/GovStripe'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { apiFetch } from '../../lib/api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await apiFetch<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        skipAuthRetry: true,
      })
      setMessage(data.message)
    } catch {
      setMessage('Se esse e-mail estiver cadastrado, enviamos um link para redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <GovStripe />
      <div className="flex flex-1 items-center justify-center bg-gov-bg px-4">
        <Card className="w-full max-w-md">
          <h1 className="mb-1 text-lg font-bold text-gov-text">Esqueci minha senha</h1>
          <p className="mb-6 text-sm text-gov-text-muted">
            Informe o e-mail cadastrado. Se ele existir no sistema, enviaremos um link para redefinir sua senha.
          </p>

          {message ? (
            <Alert variant="success">{message}</Alert>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="email"
                label="E-mail"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esporte.gov.br"
              />
              <Button type="submit" loading={loading} className="w-full">
                Enviar link de redefinição
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
