import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ChevronRight, Landmark, Plus, RefreshCw, Trash2, Wallet } from 'lucide-react'
import { getErrorMessage } from '../../api/errors'
import {
  createPaymentInfo,
  deletePaymentInfo,
  getPaymentInfo,
  listPaymentInfo,
  updatePaymentInfo,
} from '../../api/paymentInfo'
import type { PaymentInfoListItem, PaymentInfoPayload, PixType } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Field, SelectInput, TextInput } from '../../components/ui/Field'
import { Spinner } from '../../components/ui/Spinner'
import {
  ageFromIsoDate,
  isValidCellphone,
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  isValidPixRandomKey,
  onlyDigits,
} from '../../utils/validators'

const PIX_TYPES: { value: PixType; label: string; placeholder: string; digitsOnly: boolean }[] = [
  { value: 'cpf', label: 'CPF', placeholder: 'Somente números', digitsOnly: true },
  { value: 'cnpj', label: 'CNPJ', placeholder: 'Somente números', digitsOnly: true },
  { value: 'email', label: 'E-mail', placeholder: 'voce@email.com', digitsOnly: false },
  { value: 'phone', label: 'Celular', placeholder: 'DDD + número (11 dígitos)', digitsOnly: true },
  { value: 'random', label: 'Chave aleatória', placeholder: '00000000-0000-0000-0000-000000000000', digitsOnly: false },
]

const PIX_VALIDATORS: Record<PixType, (value: string) => boolean> = {
  cpf: isValidCpf,
  cnpj: isValidCnpj,
  email: isValidEmail,
  phone: isValidCellphone,
  random: isValidPixRandomKey,
}

interface FormState {
  description: string
  pixType: PixType | ''
  pixKey: string
  bankCode: string
  branchNumber: string
  branchDigit: string
  accountNumber: string
  accountDigit: string
}

const EMPTY_FORM: FormState = {
  description: '',
  pixType: '',
  pixKey: '',
  bankCode: '',
  branchNumber: '',
  branchDigit: '',
  accountNumber: '',
  accountDigit: '',
}

type Editing = { mode: 'create' } | { mode: 'edit'; id: string } | null

export function PaymentInfoTab() {
  const { user, reloadOrganizerStatus } = useAuth()
  const [items, setItems] = useState<PaymentInfoListItem[] | null>(null)
  const [listError, setListError] = useState('')
  const [editing, setEditing] = useState<Editing>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [toDelete, setToDelete] = useState<PaymentInfoListItem | null>(null)

  const isMinor = user ? ageFromIsoDate(user.birthDate) < 18 : false

  const loadList = useCallback(async () => {
    try {
      const { data } = await listPaymentInfo()
      setItems(data)
      setListError('')
    } catch (err) {
      setListError(getErrorMessage(err))
    }
  }, [])

  useEffect(() => {
    void loadList()
  }, [loadList])

  const set = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value }))

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setMessage(null)
    setEditing({ mode: 'create' })
  }

  const openEdit = async (id: string) => {
    setMessage(null)
    setLoadingDetails(true)
    setEditing({ mode: 'edit', id })
    try {
      const { data } = await getPaymentInfo(id)
      setForm({
        description: data.description ?? '',
        pixType: data.pixType ?? '',
        pixKey: data.pixKey ?? '',
        bankCode: data.bankCode ?? '',
        branchNumber: data.branchNumber ?? '',
        branchDigit: data.branchDigit ?? '',
        accountNumber: data.accountNumber ?? '',
        accountDigit: data.accountDigit ?? '',
      })
    } catch (err) {
      setMessage({ tone: 'error', text: getErrorMessage(err) })
      setEditing(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  const validate = (): string | null => {
    if (!form.description.trim()) return 'Informe uma descrição (ex.: "Conta principal").'

    const pixFilled = [form.pixType, form.pixKey.trim()].filter(Boolean).length
    if (pixFilled === 1) return 'Dados PIX incompletos: informe o tipo e a chave.'
    if (pixFilled === 2 && !PIX_VALIDATORS[form.pixType as PixType](form.pixKey.trim())) {
      return 'Chave PIX inválida para o tipo selecionado.'
    }

    const bank = [form.bankCode, form.branchNumber, form.branchDigit, form.accountNumber, form.accountDigit]
    const bankFilled = bank.filter(Boolean).length
    if (bankFilled > 0 && bankFilled < bank.length) return 'Dados bancários incompletos: preencha todos os campos bancários.'
    if (bankFilled === bank.length) {
      if (form.bankCode.length !== 3) return 'O código do banco deve ter 3 dígitos.'
      if (form.branchNumber.length !== 4) return 'A agência deve ter 4 dígitos.'
      if (form.accountNumber.length < 5 || form.accountNumber.length > 10) return 'A conta deve ter de 5 a 10 dígitos.'
    }

    if (pixFilled === 0 && bankFilled === 0) return 'Informe um meio de recebimento: PIX e/ou dados bancários.'
    return null
  }

  const buildPayload = (): PaymentInfoPayload => {
    const pixType = form.pixType || null
    const digitsOnly = PIX_TYPES.find((type) => type.value === pixType)?.digitsOnly
    const pixKey = form.pixKey.trim() ? (digitsOnly ? onlyDigits(form.pixKey) : form.pixKey.trim()) : null
    const orNull = (value: string) => value || null
    const payload: PaymentInfoPayload = {
      description: form.description.trim(),
      pixType,
      pixKey,
      bankCode: orNull(form.bankCode),
      branchNumber: orNull(form.branchNumber),
      branchDigit: orNull(form.branchDigit),
      accountNumber: orNull(form.accountNumber),
      accountDigit: orNull(form.accountDigit),
    }
    // On create, empty groups are simply omitted; on update, null clears them.
    if (editing?.mode === 'create') {
      return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null)) as PaymentInfoPayload
    }
    return payload
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const validation = validate()
    if (validation) return setMessage({ tone: 'error', text: validation })

    setSaving(true)
    setMessage(null)
    try {
      if (editing?.mode === 'edit') {
        await updatePaymentInfo(editing.id, buildPayload())
        setMessage({ tone: 'success', text: 'Dados de recebimento atualizados.' })
      } else {
        await createPaymentInfo(buildPayload())
        setMessage({ tone: 'success', text: 'Dados de recebimento cadastrados. Você já pode criar eventos.' })
      }
      setEditing(null)
      await Promise.all([loadList(), reloadOrganizerStatus()])
    } catch (err) {
      setMessage({ tone: 'error', text: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const pixMeta = PIX_TYPES.find((type) => type.value === form.pixType)

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-zinc-200 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-950 uppercase">Dados de recebimento</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Necessários apenas para criar eventos e receber os valores das vendas. Sua conta continua a mesma: você
              segue comprando ingressos de outros eventos pelo app Corevent.
            </p>
          </div>
          {!editing && (
            <Button size="sm" onClick={openCreate} disabled={isMinor} icon={<Plus className="w-3.5 h-3.5" />}>
              Adicionar
            </Button>
          )}
        </div>

        {isMinor && (
          <Alert tone="warning">É necessário ter 18 anos ou mais para cadastrar dados de recebimento e criar eventos.</Alert>
        )}
        {message && !editing && <Alert tone={message.tone}>{message.text}</Alert>}

        {listError ? (
          <Alert
            action={
              <button onClick={() => void loadList()} className="flex items-center gap-1 font-semibold">
                <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
              </button>
            }
          >
            {listError}
          </Alert>
        ) : items === null ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          !editing && (
            <div className="p-6 text-center rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500">
              <Wallet className="w-5 h-5 text-brand mx-auto mb-2" />
              Nenhum dado de recebimento cadastrado.
            </div>
          )
        ) : (
          <ul className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-3.5 py-3 bg-white">
                <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                  <Landmark className="w-4 h-4" />
                </span>
                <span className="flex-1 text-xs font-semibold text-zinc-900 truncate">{item.description}</span>
                <button
                  onClick={() => setToDelete(item)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                  aria-label={`Excluir ${item.description}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => void openEdit(item.id)}
                  className="flex items-center gap-0.5 text-xs font-bold text-brand hover:underline"
                >
                  Editar <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-zinc-200 space-y-4" noValidate>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-950 uppercase">
              {editing.mode === 'create' ? 'Novo meio de recebimento' : 'Editar meio de recebimento'}
            </h3>
            <button type="button" onClick={() => setEditing(null)} disabled={saving} className="text-xs font-semibold text-zinc-500 hover:text-zinc-800">
              Cancelar
            </button>
          </div>

          {message && <Alert tone={message.tone}>{message.text}</Alert>}

          {loadingDetails ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : (
            <>
              <Field label="Descrição *" htmlFor="pay-description">
                <TextInput id="pay-description" compact value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Ex: Conta principal" />
              </Field>

              <fieldset className="space-y-3">
                <legend className="text-xs font-bold text-zinc-900 mb-2">PIX</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Tipo da chave" htmlFor="pay-pix-type">
                    <SelectInput id="pay-pix-type" compact value={form.pixType} onChange={(e) => set('pixType', e.target.value)}>
                      <option value="">Sem PIX</option>
                      {PIX_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Chave" htmlFor="pay-pix-key" className="sm:col-span-2">
                    <TextInput
                      id="pay-pix-key"
                      compact
                      value={form.pixKey}
                      onChange={(e) => set('pixKey', e.target.value)}
                      placeholder={pixMeta?.placeholder ?? 'Selecione o tipo'}
                      disabled={!form.pixType}
                      className="font-mono"
                    />
                  </Field>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-xs font-bold text-zinc-900 mb-2">Conta bancária</legend>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(
                    [
                      ['bankCode', 'Banco', 3, '000'],
                      ['branchNumber', 'Agência', 4, '0000'],
                      ['branchDigit', 'Dígito', 1, '0'],
                      ['accountNumber', 'Conta', 10, '00000'],
                      ['accountDigit', 'Dígito', 1, '0'],
                    ] as const
                  ).map(([field, label, max, placeholder]) => (
                    <Field key={field} label={label} htmlFor={`pay-${field}`}>
                      <TextInput
                        id={`pay-${field}`}
                        compact
                        inputMode="numeric"
                        maxLength={max}
                        value={form[field]}
                        onChange={(e) => set(field, onlyDigits(e.target.value).slice(0, max))}
                        placeholder={placeholder}
                        className="font-mono"
                      />
                    </Field>
                  ))}
                </div>
              </fieldset>

              <Button type="submit" size="sm" loading={saving}>
                Salvar
              </Button>
            </>
          )}
        </form>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Excluir dados de recebimento?"
          description={
            <>
              <p>
                <strong>{toDelete.description}</strong> será removido.
              </p>
              {items?.length === 1 && <p>Sem dados de recebimento, você não poderá criar novos eventos.</p>}
            </>
          }
          confirmLabel="Excluir"
          tone="danger"
          onConfirm={async () => {
            await deletePaymentInfo(toDelete.id)
            if (editing?.mode === 'edit' && editing.id === toDelete.id) setEditing(null)
            setMessage({ tone: 'success', text: 'Dados de recebimento excluídos.' })
            await Promise.all([loadList(), reloadOrganizerStatus()])
          }}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
