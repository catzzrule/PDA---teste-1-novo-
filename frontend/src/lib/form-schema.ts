export type FieldType = 'radio' | 'text' | 'email' | 'textarea' | 'select' | 'checkbox-group' | 'date' | 'file'

export interface FieldDef {
  key: string
  numero: number
  label: string
  type: FieldType
  section: 1 | 2
  required?: boolean
  options?: string[]
  placeholder?: string
  description?: string
  showIf?: (data: Record<string, unknown>) => boolean
}

const TEMAS = [
  'Abastecimento', 'Administração', 'Agropecuária, Pesca e Extrativismo', 'Comunicações',
  'Comércio e Serviços', 'Cultura', 'Defesa Nacional', 'Economia e Finanças', 'Educação',
  'Energia', 'Esporte e Lazer', 'Habitação', 'Indústria', 'Infraestrutura e Fomento',
  'Meio Ambiente', 'Pesquisa e Desenvolvimento', 'Planejamento e Gestão', 'Previdência Social',
  'Proteção Social', 'Relações Internacionais', 'Saneamento', 'Saúde', 'Segurança e Ordem Pública',
  'Trabalho', 'Transportes', 'Urbanismo',
]

const ODS = [
  'Erradicação da Pobreza', 'Fome Zero e Agricultura Sustentável', 'Saúde e Bem-Estar',
  'Educação de Qualidade', 'Igualdade de Gênero', 'Água Limpa e Saneamento',
  'Energia Limpa e Acessível', 'Trabalho Decente e Crescimento Econômico',
  'Indústria, Inovação e Infraestrutura', 'Redução das Desigualdades',
  'Cidades e Comunidades Sustentáveis', 'Consumo e Produção Sustentáveis',
  'Ação contra a Mudança Global do Clima', 'Vida na Água', 'Vida Terrestre',
  'Paz, Justiça e Instituições Eficazes', 'Parcerias e Meios de Implementação',
]

export const FORM_FIELDS: FieldDef[] = [
  { key: 'q1_dados_abertos', numero: 1, label: 'Dados abertos', type: 'radio', section: 1, required: true, options: ['Aberto', 'Não aberto'], description: 'Escolha a condição de abertura dos dados' },
  { key: 'q2_titulo_base', numero: 2, label: 'Título da base de dados', type: 'text', section: 1, required: true, placeholder: 'Ex: Folha de Pagamento aos Atletas do Bolsa Atleta', description: 'Escreva por extenso conforme o nome da base cadastrada junto à CGU' },
  { key: 'q3_descricao', numero: 3, label: 'Descrição', type: 'textarea', section: 1, placeholder: 'Descrição detalhada do conteúdo e abrangência da base de dados' },
  { key: 'q4_area_tecnica', numero: 4, label: 'Área técnica responsável', type: 'text', section: 1, placeholder: 'Ex: Secretaria Nacional de Esporte de Alto Rendimento (SNEAR)' },
  { key: 'q5_email_area', numero: 5, label: 'E-mail da área técnica responsável', type: 'email', section: 1, placeholder: 'Ex: bolsa.atleta@esporte.gov.br' },
  { key: 'q6_periodicidade', numero: 6, label: 'Periodicidade de atualização', type: 'select', section: 1, options: ['Semanal', 'Mensal', 'Trimestral', 'Semestral', 'Anual', 'Sob Demanda'], description: 'Conforme o Plano de Dados Abertos' },
  { key: 'q7_temas', numero: 7, label: 'Temas', type: 'select', section: 1, options: TEMAS },
  { key: 'q8_relacao_ods', numero: 8, label: 'Possui relação com ODS?', type: 'radio', section: 1, options: ['SIM', 'NÃO'] },
  { key: 'q9_ods', numero: 9, label: 'Objetivos de Desenvolvimento Sustentável (ODS)', type: 'checkbox-group', section: 1, options: ODS, required: true, description: 'Selecione todos os Objetivos da Agenda 2030 associados a este conjunto de dados', showIf: (d) => d.q8_relacao_ods === 'SIM' },
  { key: 'q10_raca', numero: 10, label: 'Possui dados de raça/etnia?', type: 'radio', section: 1, options: ['Sim', 'Não', 'Não se aplica'] },
  { key: 'q11_genero', numero: 11, label: 'Possui dados de gênero?', type: 'radio', section: 1, options: ['Sim', 'Não', 'Não se aplica'] },
  { key: 'q12_palavras_chave', numero: 12, label: 'Palavras-chave', type: 'text', section: 1, placeholder: 'esporte, bolsa atleta, pagamentos', description: 'Separe por vírgulas' },
  { key: 'q13_cobertura_inicio', numero: 13, label: 'Cobertura temporal — início', type: 'date', section: 1 },
  { key: 'q14_cobertura_fim', numero: 14, label: 'Cobertura temporal — fim', type: 'date', section: 1 },
  { key: 'q15_cobertura_espacial', numero: 15, label: 'Cobertura espacial', type: 'radio', section: 1, options: ['Federal', 'Estadual / Distrital', 'Municipal'] },
  { key: 'q16_granularidade_espacial', numero: 16, label: 'Granularidade espacial', type: 'radio', section: 1, options: ['Federal', 'Estadual / Distrital', 'Municipal'] },
  { key: 'q17_versao', numero: 17, label: 'Versão (numérica)', type: 'text', section: 1, placeholder: 'Ex: 1.0' },
  { key: 'q18_atualizacao_versao', numero: 18, label: 'Atualização da versão?', type: 'radio', section: 1, options: ['Sim', 'Não'] },
  { key: 'q19_descontinuado', numero: 19, label: 'Descontinuado?', type: 'radio', section: 1, options: ['Sim', 'Não'] },

  { key: 'q20_titulo_recurso', numero: 20, label: 'Título do Recurso', type: 'text', section: 2, placeholder: 'Ex: Tabela de Pagamentos Bolsa Atleta 2024' },
  { key: 'q21_descricao_recurso', numero: 21, label: 'Descrição do Recurso', type: 'textarea', section: 2, placeholder: 'Descreva os metadados do recurso disponibilizado...' },
  { key: 'q22_arquivo_recurso', numero: 22, label: 'Arquivo do Recurso', type: 'file', section: 2, description: 'Limite: 1 arquivo (até 10MB). Word, Excel, PPT, PDF, Imagem, Vídeo ou Áudio' },
  { key: 'q23_titulo_dicionario', numero: 23, label: 'Título do dicionário de dados', type: 'text', section: 2, placeholder: 'Ex: Dicionário de Dados - Bolsa Atleta' },
  { key: 'q24_descricao_dicionario', numero: 24, label: 'Descrição resumida do dicionário de dados', type: 'textarea', section: 2, placeholder: 'Detalhamento do significado das colunas e tipos de dados...' },
  { key: 'q25_arquivo_dicionario', numero: 25, label: 'Arquivo do Dicionário de dados', type: 'file', section: 2, description: 'Limite: 1 arquivo (até 10MB). Word, Excel, PPT, PDF, Imagem, Vídeo ou Áudio' },
]

export const MOTIVOS_REJEICAO: { value: string; label: string }[] = [
  { value: 'contem_cpf', label: 'Contém CPF' },
  { value: 'contem_dado_terceiro', label: 'Contém dado de terceiro' },
  { value: 'informacao_incompleta', label: 'Informação incompleta' },
  { value: 'outro', label: 'Outro' },
]
