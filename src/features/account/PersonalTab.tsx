import { useId, useState, type FormEvent } from 'react'
import { Edit3 } from 'lucide-react'
import { getErrorMessage } from '../../api/errors'
import { uploadImage, ALLOWED_IMAGE_TYPES } from '../../api/storage'
import { confirmAvatar, updateMe } from '../../api/users'
import { useAuth } from '../../auth/useAuth'
import { Avatar } from '../../components/Avatar'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, TextInput } from '../../components/ui/Field'
import { Spinner } from '../../components/ui/Spinner'
import { formatIsoDate, maskDocument, maskPhone } from '../../utils/format'
import { isValidPhone, onlyDigits } from '../../utils/validators'

const cardClass = 'bg-white p-5 rounded-xl border border-zinc-200'

export function PersonalTab() {
  const { user, setUser } = useAuth()
  const fileInputId = useId()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(maskPhone(user?.phoneNumber ?? ''))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  if (!user) return null

  const startEditing = () => {
    setName(user.name)
    setPhone(maskPhone(user.phoneNumber ?? ''))
    setMessage(null)
    setEditing(true)
  }

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (name.trim().length < 3) return setMessage({ tone: 'error', text: 'Informe seu nome completo.' })
    const phoneDigits = onlyDigits(phone)
    if (phoneDigits && !isValidPhone(phoneDigits)) {
      return setMessage({ tone: 'error', text: 'Informe um telefone válido com DDD.' })
    }

    setSaving(true)
    setMessage(null)
    try {
      // null clears the phone (the DTO field is optional).
      const { data } = await updateMe({ name: name.trim(), phoneNumber: phoneDigits || null })
      setUser(data)
      setEditing(false)
      setMessage({ tone: 'success', text: 'Dados de contato atualizados.' })
    } catch (err) {
      setMessage({ tone: 'error', text: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatar = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setMessage(null)
    try {
      const key = await uploadImage(file, 'avatar')
      const { data } = await confirmAvatar(key)
      setUser(data)
      setMessage({ tone: 'success', text: 'Foto de perfil atualizada.' })
    } catch (err) {
      setMessage({ tone: 'error', text: getErrorMessage(err) })
    } finally {
      setUploading(false)
    }
  }

  const documentLabel = user.documentType === 'cnpj' ? 'CNPJ' : 'CPF'

  return (
    <div className="space-y-4">
      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <div className={`${cardClass} flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <Avatar name={user.name} src={user.avatarUrl} className="w-14 h-14" textClassName="text-lg font-bold" />
          <div>
            <h4 className="text-sm font-bold text-zinc-950">Foto de perfil</h4>
            <input
              id={fileInputId}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                void handleAvatar(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <label htmlFor={fileInputId} className="text-xs text-brand font-semibold cursor-pointer hover:underline inline-flex items-center gap-1.5">
              {uploading && <Spinner className="w-3 h-3" />}
              {uploading ? 'Enviando…' : 'Alterar foto'}
            </label>
            <p className="text-[11px] text-zinc-400">JPG, PNG ou WebP até 5 MB</p>
          </div>
        </div>
      </div>

      <div className={`${cardClass} space-y-4`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-900 uppercase">Contato</span>
          {!editing ? (
            <button onClick={startEditing} className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          ) : (
            <button onClick={() => setEditing(false)} disabled={saving} className="text-xs font-semibold text-zinc-500 hover:text-zinc-800">
              Cancelar
            </button>
          )}
        </div>

        {!editing ? (
          <div className="space-y-3 text-xs">
            <div>
              <div className="text-zinc-500">Nome completo</div>
              <div className="font-bold text-zinc-900 text-sm mt-0.5">{user.name}</div>
            </div>
            <div className="pt-2 border-t border-zinc-100">
              <div className="text-zinc-500">Telefone</div>
              <div className="font-bold text-zinc-900 font-mono mt-0.5">
                {user.phoneNumber ? maskPhone(user.phoneNumber) : <span className="font-sans font-normal text-zinc-400">Não informado</span>}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3" noValidate>
            <Field label="Nome completo" htmlFor="profile-name">
              <TextInput id="profile-name" compact value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
            <Field label="Telefone" htmlFor="profile-phone" hint="Opcional · com DDD">
              <TextInput
                id="profile-phone"
                compact
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="font-mono"
                autoComplete="tel-national"
              />
            </Field>
            <Button type="submit" size="sm" loading={saving}>
              Salvar
            </Button>
          </form>
        )}
      </div>

      <div className={`${cardClass} space-y-3`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-zinc-900 uppercase">Identificação</span>
          <span className="text-[11px] text-zinc-400 text-right">Dados de cadastro · somente leitura</span>
        </div>
        <div className="space-y-2.5 text-xs">
          <div>
            <div className="text-zinc-500">E-mail</div>
            <div className="font-semibold text-zinc-900 font-mono break-all">{user.email}</div>
          </div>
          <div className="pt-2 border-t border-zinc-100">
            <div className="text-zinc-500">{documentLabel}</div>
            <div className="font-semibold text-zinc-900 font-mono">{maskDocument(user.document.trim(), user.documentType)}</div>
          </div>
          <div className="pt-2 border-t border-zinc-100">
            <div className="text-zinc-500">Data de nascimento</div>
            <div className="font-semibold text-zinc-900 font-mono">{formatIsoDate(user.birthDate)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
