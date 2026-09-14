export type Perfil = 'area' | 'ouv_analista' | 'adm_ouv' | 'master_cgti'

export const PERFIL_LABELS: Record<Perfil, string> = {
  area: 'Área',
  ouv_analista: 'Ouvidoria (Analista)',
  adm_ouv: 'Administrador da Ouvidoria',
  master_cgti: 'Master CGTI',
}

export interface Area {
  id: string
  nome: string
  sigla: string | null
}

export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: Perfil
  area: Area | null
  senha_provisoria: boolean
  ativo: boolean
}

export type StatusVersao = 'pendente' | 'em_analise' | 'aprovada' | 'rejeitada'

export const STATUS_LABELS: Record<StatusVersao, string> = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
}

export const STATUS_COLORS: Record<StatusVersao, string> = {
  pendente: 'bg-slate-100 text-slate-600',
  em_analise: 'bg-blue-50 text-gov-blue',
  aprovada: 'bg-green-50 text-gov-green-hover',
  rejeitada: 'bg-red-50 text-gov-error',
}

export interface Arquivo {
  id: string
  tipo: 'recurso' | 'dicionario'
  nome_original: string
  tamanho_bytes: number
  content_type: string | null
  enviado_em: string
}

export interface VersaoBase {
  id: string
  numero_versao: number
  dados_formulario: Record<string, unknown>
  enviado_por: string
  enviado_em: string
  status: StatusVersao
  analisado_por: string | null
  analisado_em: string | null
  motivo_rejeicao_categoria: string | null
  motivo_rejeicao_detalhe: string | null
  arquivos: Arquivo[]
}

export interface BaseListItem {
  id: string
  area: Area
  titulo: string
  status_atual: StatusVersao
  criado_em: string
  atualizado_em: string
  versao_atual: VersaoBase
}

export interface BaseDetail extends BaseListItem {
  versoes: VersaoBase[]
}
