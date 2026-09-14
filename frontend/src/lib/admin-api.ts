import { apiFetch } from './api'
import type { Area, Perfil, Usuario } from './types'

export function listUsuarios() {
  return apiFetch<Usuario[]>('/usuarios')
}

export function createUsuario(payload: {
  nome: string
  email: string
  perfil: Perfil
  area_id: string | null
  senha_provisoria_valor: string
}) {
  return apiFetch<Usuario>('/usuarios', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateUsuario(id: string, payload: { ativo?: boolean; nome?: string; area_id?: string }) {
  return apiFetch<Usuario>(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function resetarSenhaUsuario(id: string) {
  return apiFetch<{ senha_provisoria: string }>(`/usuarios/${id}/resetar-senha`, { method: 'POST' })
}

export function listAreas() {
  return apiFetch<Area[]>('/areas')
}

export function createArea(payload: { nome: string; sigla: string | null }) {
  return apiFetch<Area>('/areas', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateArea(id: string, payload: { nome?: string; sigla?: string }) {
  return apiFetch<Area>(`/areas/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}
