import { apiFetch, apiFetchBlob } from './api'
import type { BaseDetail, BaseListItem } from './types'

export function listBases(params?: { area_id?: string; status_atual?: string }) {
  const query = new URLSearchParams()
  if (params?.area_id) query.set('area_id', params.area_id)
  if (params?.status_atual) query.set('status_atual', params.status_atual)
  const qs = query.toString()
  return apiFetch<BaseListItem[]>(`/bases${qs ? `?${qs}` : ''}`)
}

export function getBase(id: string) {
  return apiFetch<BaseDetail>(`/bases/${id}`)
}

interface SubmitFilesArgs {
  dadosFormulario: Record<string, unknown>
  arquivoRecurso?: File | null
  arquivoDicionario?: File | null
}

function buildFormData({ dadosFormulario, arquivoRecurso, arquivoDicionario }: SubmitFilesArgs): FormData {
  const fd = new FormData()
  fd.append('dados_formulario', JSON.stringify(dadosFormulario))
  if (arquivoRecurso) fd.append('arquivo_recurso', arquivoRecurso)
  if (arquivoDicionario) fd.append('arquivo_dicionario', arquivoDicionario)
  return fd
}

export function createBase(args: SubmitFilesArgs) {
  return apiFetch<BaseDetail>('/bases', { method: 'POST', body: buildFormData(args) })
}

export function reenviarBase(baseId: string, args: SubmitFilesArgs) {
  return apiFetch<BaseDetail>(`/bases/${baseId}/reenviar`, { method: 'PUT', body: buildFormData(args) })
}

export async function downloadArquivo(arquivoId: string, fallbackName: string): Promise<void> {
  const { blob, filename } = await apiFetchBlob(`/arquivos/${arquivoId}/download`)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? fallbackName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
