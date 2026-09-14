import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '../../components/AppLayout'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ApiError } from '../../lib/api'
import { listBases } from '../../lib/bases-api'
import { useAuth } from '../../lib/auth-context'
import { STATUS_COLORS, STATUS_LABELS, type BaseListItem } from '../../lib/types'

export function DashboardPage() {
  const { user } = useAuth()
  const isArea = user?.perfil === 'area'

  const [bases, setBases] = useState<BaseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [onlyMinhas, setOnlyMinhas] = useState(isArea)

  async function reload() {
    setLoading(true)
    try {
      const params = onlyMinhas && user?.area ? { area_id: user.area.id } : undefined
      setBases(await listBases(params))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar as bases.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyMinhas])

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gov-text">
            {isArea ? `Bases de ${user?.area?.nome ?? 'sua área'}` : 'Todas as bases'}
          </h2>
          <p className="text-sm text-gov-text-muted">
            Acompanhe o status de cada base no fluxo de aprovação do Plano de Dados Abertos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={onlyMinhas ? 'primary' : 'outline'}
            onClick={() => setOnlyMinhas((v) => !v)}
            disabled={!user?.area}
          >
            {onlyMinhas ? 'Ver todas as áreas' : 'Ver só minha área'}
          </Button>
          {isArea && (
            <Link to="/formulario/nova">
              <Button>Nova base</Button>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <Card>
        {loading ? (
          <p className="text-sm text-gov-text-muted">Carregando…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gov-border text-xs uppercase text-gov-text-muted">
                  <th className="py-2 pr-4">Título</th>
                  <th className="py-2 pr-4">Área</th>
                  <th className="py-2 pr-4">Versão</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Atualizado em</th>
                  <th className="py-2 pr-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {bases.map((b) => (
                  <tr key={b.id} className="border-b border-gov-border/60">
                    <td className="py-2 pr-4 font-medium">{b.titulo}</td>
                    <td className="py-2 pr-4">{b.area.nome}</td>
                    <td className="py-2 pr-4">v{b.versao_atual.numero_versao}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status_atual]}`}>
                        {STATUS_LABELS[b.status_atual]}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gov-text-muted">
                      {new Date(b.atualizado_em).toLocaleString('pt-BR')}
                    </td>
                    <td className="flex gap-2 py-2 pr-4">
                      <Link to={`/bases/${b.id}`}>
                        <Button variant="outline">Ver</Button>
                      </Link>
                      {isArea && b.status_atual === 'rejeitada' && b.area.id === user?.area?.id && (
                        <Link to={`/formulario/${b.id}/reenviar`}>
                          <Button variant="danger">Reenviar</Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {bases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gov-text-muted">
                      Nenhuma base encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
