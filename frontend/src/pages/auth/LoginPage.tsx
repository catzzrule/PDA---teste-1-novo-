import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  LockKeyhole,
  Mail,
  Network,
  ShieldCheck,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { OpenDataViz } from '../../components/auth/OpenDataViz'
import { ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

const FEATURES = [
  { icon: BarChart3, label: 'Dados atualizados' },
  { icon: Globe2, label: 'Acesso público' },
  { icon: ShieldCheck, label: 'Padrão dados.gov.br' },
]

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, senha)
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-shell min-h-screen bg-[var(--color-brand-bg)]">
      <div aria-hidden="true" className="flex h-1.5 w-full">
        <div className="flex-1" style={{ background: '#008c45' }} />
        <div className="flex-1" style={{ background: '#ffdf00' }} />
        <div className="flex-1" style={{ background: '#002776' }} />
      </div>

      <div className="grid grid-cols-1 md:min-h-[calc(100vh-6px)] md:grid-cols-2">
        {/* Brand panel */}
        <div
          className="relative isolate flex flex-col justify-between overflow-hidden px-8 py-10 text-white sm:px-12 sm:py-14"
          style={{
            background: 'linear-gradient(135deg, var(--color-brand-dark-1), var(--color-brand-dark-2), var(--color-brand-dark-3))',
          }}
        >
          <OpenDataViz />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <div className="login-heading text-sm font-bold leading-tight">Base de Dados MEsp</div>
              <div className="text-[11px] font-semibold tracking-wide text-[var(--color-brand-light-blue)]">
                MINISTÉRIO DO ESPORTE
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-md">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <span
                className="status-dot h-1.5 w-1.5 rounded-full"
                style={{ background: 'var(--color-brand-success-light)' }}
              />
              Plano de Dados Abertos
            </span>
            <h1 className="login-heading text-[clamp(1.5rem,3vw,2.1rem)] font-extrabold leading-tight">
              Transparência que conecta dados e sociedade
            </h1>
            <p className="mt-3 text-sm text-white/75">
              Preencha e consulte os conjuntos de dados abertos do Ministério do Esporte publicados em
              dados.gov.br, em um único ambiente integrado.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {FEATURES.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-white/85">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <p className="relative z-10 hidden text-xs text-white/50 md:block">
            Ministério do Esporte • Governo Federal do Brasil
          </p>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="form-wrap w-full max-w-[405px]">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-brand-border)] px-3 py-1 text-xs font-medium text-[var(--color-brand-text-muted)]">
              <LockKeyhole className="h-3.5 w-3.5" />
              Acesso restrito
            </span>

            <h2 className="login-heading text-2xl font-bold text-[var(--color-brand-text)]">
              Acesso ao Sistema PDA
            </h2>
            <p className="mt-1.5 text-sm text-[var(--color-brand-text-muted)]">
              Entre com o e-mail e senha cadastrados pela CGTI para preencher ou consultar os dados do Plano
              de Dados Abertos.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-4">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-[var(--color-brand-text)]">
                  E-mail
                </label>
                <div
                  className="input-wrap flex h-[49px] items-center gap-2.5 rounded-lg border px-3.5 transition-colors focus-within:border-[var(--color-brand-primary)]"
                  style={{ borderColor: 'var(--color-brand-border)' }}
                >
                  <Mail className="h-4 w-4 shrink-0" style={{ color: 'var(--color-brand-icon)' }} />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@esporte.gov.br"
                    className="h-full w-full bg-transparent text-sm text-[var(--color-brand-text)] outline-none placeholder:text-[var(--color-brand-icon)]"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="login-senha" className="block text-sm font-medium text-[var(--color-brand-text)]">
                    Senha
                  </label>
                  <Link
                    to="/esqueci-senha"
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--color-brand-primary)' }}
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <div
                  className="input-wrap flex h-[49px] items-center gap-2.5 rounded-lg border px-3.5 transition-colors focus-within:border-[var(--color-brand-primary)]"
                  style={{ borderColor: 'var(--color-brand-border)' }}
                >
                  <KeyRound className="h-4 w-4 shrink-0" style={{ color: 'var(--color-brand-icon)' }} />
                  <input
                    id="login-senha"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    className="h-full w-full bg-transparent text-sm text-[var(--color-brand-text)] outline-none placeholder:text-[var(--color-brand-icon)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="shrink-0 text-[var(--color-brand-icon)] hover:text-[var(--color-brand-text-muted)]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-[#b42318]">
                  {error}
                </div>
              )}

              {isSubmitted && !error && (
                <div
                  role="status"
                  className="success-message flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium"
                  style={{ borderColor: '#bfe6cf', background: '#f1faf4', color: 'var(--color-brand-success)' }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Acesso validado
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="submit-button mt-1 flex h-[49px] w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                style={{ background: 'var(--color-brand-primary)' }}
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Verificando acesso...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[var(--color-brand-text-muted)]">
              Não tem acesso? <strong className="text-[var(--color-brand-text)]">Solicite o cadastro à CGTI</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
