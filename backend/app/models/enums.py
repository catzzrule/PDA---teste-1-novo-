import enum


class Perfil(str, enum.Enum):
    AREA = "area"
    OUV_ANALISTA = "ouv_analista"
    ADM_OUV = "adm_ouv"
    MASTER_CGTI = "master_cgti"


class StatusVersao(str, enum.Enum):
    PENDENTE = "pendente"
    EM_ANALISE = "em_analise"
    APROVADA = "aprovada"
    REJEITADA = "rejeitada"


class TipoArquivo(str, enum.Enum):
    RECURSO = "recurso"
    DICIONARIO = "dicionario"


class MotivoRejeicao(str, enum.Enum):
    CONTEM_CPF = "contem_cpf"
    CONTEM_DADO_TERCEIRO = "contem_dado_terceiro"
    INFORMACAO_INCOMPLETA = "informacao_incompleta"
    OUTRO = "outro"
