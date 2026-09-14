import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FieldRenderer } from '../../components/form/FieldRenderer'
import { AppLayout } from '../../components/AppLayout'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { createBase, getBase, reenviarBase } from '../../lib/bases-api'
import { ApiError } from '../../lib/api'
import { FORM_FIELDS, MOTIVOS_REJEICAO } from '../../lib/form-schema'
import type { BaseDetail } from '../../lib/types'

const STEP_TITLES = ['Identificação do Conjunto', 'Recursos e Dicionário', 'Revisão e Envio']

export function DatasetFormWizard() {
  const { baseId } = useParams<{ baseId: string }>()
  const navigate = useNavigate()
  const isResend = Boolean(baseId)

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [existingBase, setExistingBase] = useState<BaseDetail | null>(null)
  const [loading, setLoading] = useState(isResend)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!baseId) return
    setLoading(true)
    getBase(baseId)
      .then((base) => {
        setExistingBase(base)
        setFormData(base.versao_atual.dados_formulario)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar a base.'))
      .finally(() => setLoading(false))
  }, [baseId])

  function handleChange(key: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function handleFileChange(key: string, file: File | null) {
    setFiles((prev) => ({ ...prev, [key]: file }))
  }

  function validateStep1(): string | null {
    if (!formData.q1_dados_abertos) return 'Responda a pergunta 1 (Dados abertos).'
    if (!(formData.q2_titulo_base as string)?.trim()) return 'Informe o título da base de dados (pergunta 2).'
    if (formData.q8_relacao_ods === 'SIM') {
      const ods = formData.q9_ods as string[] | undefined
      if (!ods || ods.length === 0) return 'Escolha ao menos um ODS (pergunta 9).'
    }
    return null
  }

  function goToStep(target: number) {
    if (target > step) {
      const err = validateStep1()
      if (step === 1 && err) {
        setError(err)
        return
      }
    }
    setError(null)
    setStep(target)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    const err = validateStep1()
    if (err) {
      setError(err)
      setStep(1)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const args = {
        dadosFormulario: formData,
        arquivoRecurso: files.q22_arquivo_recurso,
        arquivoDicionario: files.q25_arquivo_dicionario,
      }
      if (isResend && baseId) {
        await reenviarBase(baseId, args)
      } else {
        await createBase(args)
      }
      navigate('/dashboard')
    } catch (err2) {
      setError(err2 instanceof ApiError ? err2.message : 'Erro ao enviar o formulário.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <p className="text-sm text-gov-text-muted">Carregando…</p>
      </AppLayout>
    )
  }

  const rejectedVersion = existingBase?.versao_atual
  const motivoLabel = rejectedVersion?.motivo_rejeicao_categoria
    ? MOTIVOS_REJEICAO.find((m) => m.value === rejectedVersion.motivo_rejeicao_categoria)?.label
    : null

  const sectionFields = (section: 1 | 2) =>
    FORM_FIELDS.filter((f) => f.section === section).filter((f) => !f.showIf || f.showIf(formData))

  return (
    <AppLayout>
      <div className="mb-6">
        <nav className="mb-4 flex gap-2">
          {STEP_TITLES.map((title, idx) => {
            const n = idx + 1
            const active = n === step
            const done = n < step
            return (
              <button
                key={title}
                type="button"
                onClick={() => goToStep(n)}
                className={`flex-1 rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors ${
                  active
                    ? 'border-gov-blue bg-gov-blue text-white'
                    : done
                      ? 'border-gov-green bg-green-50 text-gov-green-hover'
                      : 'border-gov-border bg-white text-gov-text-muted'
                }`}
              >
                <span className="block text-[10px] opacity-80">Etapa {n}</span>
                {title}
              </button>
            )
          })}
        </nav>

        {isResend && rejectedVersion && (
          <Alert>
            <strong>Motivo da rejeição{motivoLabel ? ` — ${motivoLabel}` : ''}:</strong>{' '}
            {rejectedVersion.motivo_rejeicao_detalhe || 'Nenhum detalhe adicional informado.'}
          </Alert>
        )}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          {sectionFields(1).map((field) => (
            <FieldRenderer key={field.key} field={field} value={formData[field.key]} onChange={handleChange} />
          ))}
          <div className="flex justify-end">
            <Button onClick={() => goToStep(2)}>Avançar</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          {sectionFields(2).map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={formData[field.key]}
              onChange={handleChange}
              onFileChange={handleFileChange}
              existingFileName={
                existingBase?.versao_atual.arquivos.find((a) =>
                  field.key === 'q22_arquivo_recurso' ? a.tipo === 'recurso' : a.tipo === 'dicionario',
                )?.nome_original ?? null
              }
            />
          ))}
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => goToStep(1)}>
              Voltar
            </Button>
            <Button onClick={() => goToStep(3)}>Revisar dados</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="mb-3 text-sm font-bold text-gov-text">Resumo do envio</h3>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {FORM_FIELDS.filter((f) => !f.showIf || f.showIf(formData)).map((f) => {
                const raw = formData[f.key]
                const display =
                  f.type === 'file'
                    ? files[f.key]?.name ?? (existingBase ? 'Mantido da versão anterior' : 'Não enviado')
                    : Array.isArray(raw)
                      ? raw.join(', ') || '—'
                      : (raw as string) || '—'
                return (
                  <div key={f.key}>
                    <dt className="text-xs font-semibold text-gov-text-muted">
                      {f.numero}. {f.label}
                    </dt>
                    <dd className="text-gov-text">{display}</dd>
                  </div>
                )
              })}
            </dl>
          </Card>

          {error && <Alert>{error}</Alert>}

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => goToStep(2)}>
              Voltar
            </Button>
            <Button onClick={() => void handleSubmit()} loading={submitting}>
              {isResend ? 'Reenviar formulário' : 'Enviar formulário'}
            </Button>
          </div>
        </div>
      )}

      {step < 3 && error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}
    </AppLayout>
  )
}
