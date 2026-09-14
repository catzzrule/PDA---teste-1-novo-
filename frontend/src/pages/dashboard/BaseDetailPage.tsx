import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppLayout } from '../../components/AppLayout'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'
import { downloadArquivo, getBase } from '../../lib/bases-api'
import { FORM_FIELDS, MOTIVOS_REJEICAO } from '../../lib/form-schema'
import { STATUS_COLORS, STATUS_LABELS, type BaseDetail, type VersaoBase } from '../../lib/types'

export function BaseDetailPage() {
  const { baseId } = useParams<{ baseId: string }>()
  const { user } = useAuth()

  const [base, setBase] = useState<BaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!baseId) return
    setLoading(true)
    getBase(baseId)
      .then((b) => {
        setBase(b)
        setExpanded(b.versao_atual.id)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar a base.'))
      .finally(() => setLoading(false))
  }, [baseId])

  async function handleDownload(arquivoId: string, nome: string) {
    try {
      await downloadArquivo(arquivoId, nome)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao baixar arquivo.')
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <p className="text-sm text-gov-text-muted">Carregando…</p>
      </AppLayout>
    )
  }

  if (error && !base) {
    return (
      <AppLayout>
        <Alert>{error}</Alert>
      </AppLayout>
    )
  }

  if (!base) return null

  const podeReenviar = user?.perfil === 'area' && user.area?.id === base.area.id && base.status_atual === 'rejeitada'

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gov-text">{base.titulo}</h2>
          <p className="text-sm text-gov-text-muted">
            {base.area.nome} • criada em {new Date(base.criado_em).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[base.status_atual]}`}>
            {STATUS_LABELS[base.status_atual]}
          </span>
          {podeReenviar && (
            <Link to={`/formulario/${base.id}/reenviar`}>
              <Button variant="danger">Reenviar</Button>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <h3 className="mb-3 text-sm font-bold text-gov-text">Histórico de versões</h3>
      <div className="flex flex-col gap-3">
        {[...base.versoes].reverse().map((versao) => (
          <VersaoCard
            key={versao.id}
            versao={versao}
            expanded={expanded === versao.id}
            onToggle={() => setExpanded((prev) => (prev === versao.id ? null : versao.id))}
            onDownload={handleDownload}
          />
        ))}
      </div>
    </AppLayout>
  )
}

function VersaoCard({
  versao,
  expanded,
  onToggle,
  onDownload,
}: {
  versao: VersaoBase
  expanded: boolean
  onToggle: () => void
  onDownload: (id: string, nome: string) => void
}) {
  const motivoLabel = versao.motivo_rejeicao_categoria
    ? MOTIVOS_REJEICAO.find((m) => m.value === versao.motivo_rejeicao_categoria)?.label
    : null

  return (
    <Card>
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between text-left">
        <span className="text-sm font-semibold text-gov-text">
          Versão {versao.numero_versao} — enviada em {new Date(versao.enviado_em).toLocaleString('pt-BR')}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[versao.status]}`}>
          {STATUS_LABELS[versao.status]}
        </span>
      </button>

      {versao.status === 'rejeitada' && (
        <div className="mt-3">
          <Alert>
            <strong>Motivo{motivoLabel ? ` — ${motivoLabel}` : ''}:</strong>{' '}
            {versao.motivo_rejeicao_detalhe || 'Nenhum detalhe adicional informado.'}
          </Alert>
        </div>
      )}

      {expanded && (
        <div className="mt-4 border-t border-gov-border pt-4">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {FORM_FIELDS.filter((f) => f.type !== 'file' && (!f.showIf || f.showIf(versao.dados_formulario))).map(
              (f) => {
                const raw = versao.dados_formulario[f.key]
                const display = Array.isArray(raw) ? raw.join(', ') || '—' : (raw as string) || '—'
                return (
                  <div key={f.key}>
                    <dt className="text-xs font-semibold text-gov-text-muted">
                      {f.numero}. {f.label}
                    </dt>
                    <dd className="text-gov-text">{display}</dd>
                  </div>
                )
              },
            )}
          </dl>

          {versao.arquivos.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {versao.arquivos.map((a) => (
                <Button key={a.id} variant="outline" onClick={() => onDownload(a.id, a.nome_original)}>
                  Baixar {a.tipo === 'recurso' ? 'recurso' : 'dicionário'}: {a.nome_original}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
