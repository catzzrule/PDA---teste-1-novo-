import { useEffect, useState } from 'react'
import { AppLayout } from '../../components/AppLayout'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import {
  createArea,
  createUsuario,
  listAreas,
  listUsuarios,
  resetarSenhaUsuario,
  updateArea,
  updateUsuario,
} from '../../lib/admin-api'
import { ApiError } from '../../lib/api'
import { PERFIL_LABELS, type Area, type Perfil, type Usuario } from '../../lib/types'

function randomPassword(): string {
  return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2).toUpperCase()
}

export function CgtiHomePage() {
  const [tab, setTab] = useState<'usuarios' | 'areas'>('usuarios')

  return (
    <AppLayout>
      <div className="mb-6 flex gap-2">
        <Button variant={tab === 'usuarios' ? 'primary' : 'outline'} onClick={() => setTab('usuarios')}>
          Usuários
        </Button>
        <Button variant={tab === 'areas' ? 'primary' : 'outline'} onClick={() => setTab('areas')}>
          Áreas
        </Button>
      </div>
      {tab === 'usuarios' ? <UsuariosSection /> : <AreasSection />}
    </AppLayout>
  )
}

function UsuariosSection() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastResetPassword, setLastResetPassword] = useState<{ email: string; senha: string } | null>(null)

  async function reload() {
    setLoading(true)
    try {
      const [u, a] = await Promise.all([listUsuarios(), listAreas()])
      setUsuarios(u)
      setAreas(a)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  async function handleToggleAtivo(u: Usuario) {
    try {
      await updateUsuario(u.id, { ativo: !u.ativo })
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao atualizar usuário.')
    }
  }

  async function handleResetPassword(u: Usuario) {
    try {
      const { senha_provisoria } = await resetarSenhaUsuario(u.id)
      setLastResetPassword({ email: u.email, senha: senha_provisoria })
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao redefinir senha.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <Alert>{error}</Alert>}
      {lastResetPassword && (
        <Alert variant="success">
          Nova senha provisória para <strong>{lastResetPassword.email}</strong>:{' '}
          <code className="rounded bg-white/60 px-1">{lastResetPassword.senha}</code> — repasse com segurança, ela não
          será mostrada novamente.
        </Alert>
      )}

      <NovoUsuarioForm areas={areas} onCreated={reload} onError={setError} />

      <Card>
        <h2 className="mb-4 text-base font-bold text-gov-text">Usuários cadastrados</h2>
        {loading ? (
          <p className="text-sm text-gov-text-muted">Carregando…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gov-border text-xs uppercase text-gov-text-muted">
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">E-mail</th>
                  <th className="py-2 pr-4">Perfil</th>
                  <th className="py-2 pr-4">Área</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-b border-gov-border/60">
                    <td className="py-2 pr-4">{u.nome}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">{PERFIL_LABELS[u.perfil]}</td>
                    <td className="py-2 pr-4">{u.area?.nome ?? '—'}</td>
                    <td className="py-2 pr-4">
                      <span className={u.ativo ? 'text-gov-green' : 'text-gov-error'}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                        {u.senha_provisoria ? ' • senha provisória' : ''}
                      </span>
                    </td>
                    <td className="flex gap-2 py-2 pr-4">
                      <Button variant="outline" onClick={() => void handleToggleAtivo(u)}>
                        {u.ativo ? 'Desativar' : 'Reativar'}
                      </Button>
                      <Button variant="outline" onClick={() => void handleResetPassword(u)}>
                        Resetar senha
                      </Button>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gov-text-muted">
                      Nenhum usuário cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function NovoUsuarioForm({
  areas,
  onCreated,
  onError,
}: {
  areas: Area[]
  onCreated: () => Promise<void>
  onError: (msg: string) => void
}) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [perfil, setPerfil] = useState<Perfil>('area')
  const [areaId, setAreaId] = useState('')
  const [senha, setSenha] = useState(randomPassword())
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createUsuario({
        nome,
        email,
        perfil,
        area_id: perfil === 'area' ? areaId || null : null,
        senha_provisoria_valor: senha,
      })
      setNome('')
      setEmail('')
      setAreaId('')
      setSenha(randomPassword())
      await onCreated()
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Erro ao cadastrar usuário.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-base font-bold text-gov-text">Cadastrar novo usuário</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <Input label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gov-text">Perfil</label>
          <select
            className="rounded-md border border-gov-border bg-white px-3 py-2 text-sm"
            value={perfil}
            onChange={(e) => setPerfil(e.target.value as Perfil)}
          >
            {Object.entries(PERFIL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {perfil === 'area' && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gov-text">Área</label>
            <select
              className="rounded-md border border-gov-border bg-white px-3 py-2 text-sm"
              required
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
            >
              <option value="">Selecione a área…</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="md:col-span-2">
          <Input
            label="Senha provisória"
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <p className="mt-1 text-xs text-gov-text-muted">
            Repasse esta senha à pessoa por um canal seguro — o sistema vai exigir a troca no primeiro login.
          </p>
        </div>

        <div className="md:col-span-2">
          <Button type="submit" loading={submitting}>
            Cadastrar usuário
          </Button>
        </div>
      </form>
    </Card>
  )
}

function AreasSection() {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [sigla, setSigla] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function reload() {
    setLoading(true)
    try {
      setAreas(await listAreas())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar áreas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createArea({ nome, sigla: sigla || null })
      setNome('')
      setSigla('')
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao cadastrar área.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <Alert>{error}</Alert>}

      <Card>
        <h2 className="mb-4 text-base font-bold text-gov-text">Cadastrar área</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_auto] md:items-end">
          <Input
            label="Nome da área"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Secretaria Nacional de Esporte de Alto Rendimento"
          />
          <Input label="Sigla" value={sigla} onChange={(e) => setSigla(e.target.value)} placeholder="Ex: SNEAR" />
          <Button type="submit" loading={submitting}>
            Adicionar
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-bold text-gov-text">Áreas cadastradas</h2>
        {loading ? (
          <p className="text-sm text-gov-text-muted">Carregando…</p>
        ) : (
          <ul className="divide-y divide-gov-border/60">
            {areas.map((a) => (
              <AreaListItem key={a.id} area={a} onSaved={reload} onError={setError} />
            ))}
            {areas.length === 0 && <li className="py-6 text-center text-gov-text-muted">Nenhuma área cadastrada ainda.</li>}
          </ul>
        )}
      </Card>
    </div>
  )
}

function AreaListItem({
  area,
  onSaved,
  onError,
}: {
  area: Area
  onSaved: () => Promise<void>
  onError: (msg: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [nome, setNome] = useState(area.nome)
  const [sigla, setSigla] = useState(area.sigla ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateArea(area.id, { nome, sigla })
      setEditing(false)
      await onSaved()
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Erro ao atualizar área.')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <li className="flex flex-wrap items-end gap-3 py-3">
        <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="min-w-48 flex-1" />
        <Input label="Sigla" value={sigla} onChange={(e) => setSigla(e.target.value)} className="w-28" />
        <Button onClick={() => void handleSave()} loading={saving}>
          Salvar
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setNome(area.nome)
            setSigla(area.sigla ?? '')
            setEditing(false)
          }}
        >
          Cancelar
        </Button>
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between py-2 text-sm">
      <span>
        <span className="font-medium">{area.nome}</span>
        {area.sigla && <span className="ml-2 text-gov-text-muted">({area.sigla})</span>}
      </span>
      <Button variant="outline" onClick={() => setEditing(true)}>
        Editar
      </Button>
    </li>
  )
}
