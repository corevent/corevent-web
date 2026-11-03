import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { ApiError, getErrorMessage } from '../../api/errors'
import { confirmEventBanner, createEvent, updateEvent } from '../../api/events'
import { listCities, listStates } from '../../api/locations'
import { uploadImage } from '../../api/storage'
import { createTicketType } from '../../api/ticketTypes'
import type { City, CreateEventPayload, EventCategory, EventLocationType, State } from '../../api/types'
import { useOrganizerEvents } from '../../app/useOrganizerEvents'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, SelectInput, TextArea, TextInput } from '../../components/ui/Field'
import { Modal, ModalCloseButton } from '../../components/ui/Modal'
import { CATEGORY_LABELS, LOCATION_TYPE_LABELS } from '../../utils/categories'
import { dateTimeLocalToIso, formatInteger, maskZipCode, toDateTimeLocal } from '../../utils/format'
import { onlyDigits } from '../../utils/validators'
import { ImagePicker } from './ImagePicker'

type Step = 1 | 2 | 3

interface LotDraft {
  key: number
  name: string
  price: string
  quantity: string
}

const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: '1. Informações' },
  { step: 2, label: '2. Data & Local' },
  { step: 3, label: '3. Lotes' },
]

function defaultStart(): string {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  date.setHours(19, 0, 0, 0)
  return toDateTimeLocal(date)
}

function plusHours(local: string, hours: number): string {
  const date = new Date(local)
  date.setHours(date.getHours() + hours)
  return toDateTimeLocal(date)
}

export function CreateEventModal({ onClose }: { onClose: () => void }) {
  const { reloadOrganizerStatus } = useAuth()
  const { reload } = useOrganizerEvents()
  const [step, setStep] = useState<Step>(1)
  const [error, setError] = useState('')

  // Step 1
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<EventCategory>('music')
  const [description, setDescription] = useState('')
  const [isAdultOnly, setIsAdultOnly] = useState(false)
  const [image, setImage] = useState<File | null>(null)

  // Step 2
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(() => plusHours(defaultStart(), 4))
  const [maxParticipants, setMaxParticipants] = useState('')
  const [locationType, setLocationType] = useState<EventLocationType>('in_person')
  const [locationName, setLocationName] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [complement, setComplement] = useState('')
  const [stateId, setStateId] = useState('')
  const [cityId, setCityId] = useState('')
  const [states, setStates] = useState<State[] | null>(null)
  const [cities, setCities] = useState<City[] | null>(null)
  const [locationsError, setLocationsError] = useState('')

  // Step 3
  const [lots, setLots] = useState<LotDraft[]>([{ key: 1, name: 'Lote 1', price: '', quantity: '' }])
  const [salesStart, setSalesStart] = useState(() => toDateTimeLocal(new Date()))
  const [salesEnd, setSalesEnd] = useState('')

  // Submission (kept across retries so nothing is created twice)
  const [submitting, setSubmitting] = useState<null | 'draft' | 'publish'>(null)
  const [progress, setProgress] = useState('')
  const [warnings, setWarnings] = useState<string[] | null>(null)
  const createdEventId = useRef<string | null>(null)
  const createdLotKeys = useRef(new Set<number>())
  const [savedLotKeys, setSavedLotKeys] = useState<number[]>([])
  const bannerSaved = useRef(false)
  const [eventSaved, setEventSaved] = useState(false)
  const nextLotKey = useRef(2)

  const isOnline = locationType === 'online'

  useEffect(() => {
    listStates()
      .then(({ data }) => setStates([...data].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))))
      .catch((err) => setLocationsError(getErrorMessage(err)))
  }, [])

  useEffect(() => {
    if (!stateId) return
    let active = true
    listCities(Number(stateId))
      .then(({ data }) => active && setCities(data))
      .catch((err) => active && setLocationsError(getErrorMessage(err)))
    return () => {
      active = false
    }
  }, [stateId])

  const validateStep1 = (): string | null => (title.trim() ? null : 'Informe o nome do evento.')

  const validateStep2 = (): string | null => {
    if (!startDate || !endDate) return 'Informe a data e o horário de início e de término.'
    if (new Date(startDate) <= new Date()) return 'A data de início deve estar no futuro.'
    if (new Date(endDate) < new Date(startDate)) return 'O término deve ser posterior ao início.'
    const capacity = Number(maxParticipants)
    if (!Number.isInteger(capacity) || capacity < 1) return 'Informe a capacidade máxima de participantes.'
    if (!isOnline) {
      if (!locationName.trim()) return 'Informe o nome do local.'
      if (onlyDigits(zipCode).length !== 8) return 'Informe um CEP válido (8 dígitos).'
      if (!street.trim()) return 'Informe a rua.'
      if (!Number.isInteger(Number(number)) || Number(number) < 1) return 'Informe o número do endereço.'
      if (!neighborhood.trim()) return 'Informe o bairro.'
      if (!stateId || !cityId) return 'Selecione o estado e a cidade.'
    }
    return null
  }

  const validateStep3 = (): string | null => {
    if (lots.length === 0) return 'Adicione pelo menos um lote de ingressos.'
    let total = 0
    for (const lot of lots) {
      if (!lot.name.trim()) return 'Informe o nome de todos os lotes.'
      const price = Number(lot.price.replace(',', '.'))
      if (lot.price === '' || !Number.isFinite(price) || price < 0) return `Informe o preço de "${lot.name}" (0 para gratuito).`
      const quantity = Number(lot.quantity)
      if (!Number.isInteger(quantity) || quantity < 1) return `Informe a quantidade de "${lot.name}".`
      total += quantity
    }
    if (total > Number(maxParticipants))
      return `A soma dos lotes (${formatInteger(total)}) ultrapassa a capacidade do evento (${formatInteger(Number(maxParticipants))}).`
    if (!salesStart || !salesEnd || new Date(salesStart) >= new Date(salesEnd)) return 'O início das vendas deve ser anterior ao fim.'
    if (new Date(salesEnd) > new Date(startDate)) return 'As vendas devem terminar até o início do evento.'
    return null
  }

  const handleNext = () => {
    const validation = step === 1 ? validateStep1() : validateStep2()
    if (validation) return setError(validation)
    setError('')
    if (step === 2 && !salesEnd) setSalesEnd(startDate)
    setStep((step + 1) as Step)
  }

  const buildPayload = (): CreateEventPayload => {
    const payload: CreateEventPayload = {
      title: title.trim(),
      maxParticipants: Number(maxParticipants),
      locationType,
      startDate: dateTimeLocalToIso(startDate),
      endDate: dateTimeLocalToIso(endDate),
      category,
      isAdultOnly,
      // Ticket types can only be created while the event is a draft.
      status: 'draft',
    }
    if (description.trim()) payload.description = description.trim()
    if (!isOnline) {
      Object.assign(payload, {
        locationName: locationName.trim(),
        zipCode: onlyDigits(zipCode),
        street: street.trim(),
        number: Number(number),
        neighborhood: neighborhood.trim(),
        cityId: Number(cityId),
        ...(complement.trim() ? { complement: complement.trim() } : {}),
      })
    }
    return payload
  }

  const handleSubmit = async (publish: boolean) => {
    const validation = validateStep3()
    if (validation) return setError(validation)
    setError('')
    setSubmitting(publish ? 'publish' : 'draft')
    const notes: string[] = []

    try {
      if (!createdEventId.current) {
        setProgress('Criando evento…')
        const { data } = await createEvent(buildPayload())
        createdEventId.current = data.id
        setEventSaved(true)
      }
      const eventId = createdEventId.current

      for (const lot of lots) {
        if (createdLotKeys.current.has(lot.key)) continue
        setProgress(`Criando lote "${lot.name}"…`)
        await createTicketType(eventId, {
          name: lot.name.trim(),
          price: Math.round(Number(lot.price.replace(',', '.')) * 100) / 100,
          totalQuantity: Number(lot.quantity),
          startDate: dateTimeLocalToIso(salesStart),
          endDate: dateTimeLocalToIso(salesEnd),
        })
        createdLotKeys.current.add(lot.key)
        setSavedLotKeys([...createdLotKeys.current])
      }

      if (image && !bannerSaved.current) {
        setProgress('Enviando imagem de capa…')
        try {
          const key = await uploadImage(image, 'event_banner', eventId)
          await confirmEventBanner(eventId, key)
          bannerSaved.current = true
        } catch (err) {
          notes.push(`A imagem de capa não foi salva: ${getErrorMessage(err)}`)
        }
      }

      if (publish) {
        setProgress('Publicando…')
        await updateEvent(eventId, { status: 'opened' })
      }

      await reload()
      if (notes.length) {
        setWarnings(notes)
        setSubmitting(null)
        return
      }
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.hasRawMessage('User is not a organizer')) void reloadOrganizerStatus()
      const savedNote = createdEventId.current
        ? ' O evento já foi salvo como rascunho: corrija os dados e tente novamente, ou conclua em "Gerenciar Lotes".'
        : ''
      setError(`${getErrorMessage(err)}${savedNote}`)
      if (createdEventId.current) void reload()
      setSubmitting(null)
    } finally {
      setProgress('')
    }
  }

  const updateLot = (key: number, field: keyof Omit<LotDraft, 'key'>, value: string) =>
    setLots((current) => current.map((lot) => (lot.key === key ? { ...lot, [field]: value } : lot)))

  const busy = submitting !== null
  const hasProgress =
    step > 1 || eventSaved || image !== null || isAdultOnly || [title, description, maxParticipants].some((value) => value.trim() !== '')
  const totalLots = lots.reduce((sum, lot) => sum + (Number(lot.quantity) || 0), 0)

  if (warnings) {
    return (
      <Modal onClose={onClose} maxWidth="max-w-md" className="p-6" labelledBy="create-done-title">
        <h2 id="create-done-title" className="text-base font-bold text-zinc-950">
          Evento salvo
        </h2>
        <div className="mt-3 space-y-2">
          {warnings.map((warning) => (
            <Alert key={warning} tone="warning">
              {warning}
            </Alert>
          ))}
          <p className="text-xs text-zinc-500">Você pode enviar a capa novamente em "Gerenciar Lotes".</p>
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="dark" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      onClose={onClose}
      maxWidth="max-w-2xl"
      dismissible={!busy}
      confirmClose={
        hasProgress
          ? {
              title: 'Sair da criação do evento?',
              message: eventSaved
                ? 'O evento já foi salvo como rascunho em Meus Eventos, mas o que você preencheu e ainda não foi enviado nesta tela será perdido.'
                : 'As informações preenchidas ainda não foram salvas e serão perdidas. Para continuar depois, avance até a etapa de lotes e use "Salvar rascunho".',
              confirmLabel: 'Sair sem salvar',
              cancelLabel: 'Continuar editando',
            }
          : null
      }
      className="overflow-hidden flex flex-col max-h-[90vh]"
      labelledBy="create-event-title"
    >
      <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between">
        <h2 id="create-event-title" className="text-base font-bold text-zinc-950">
          Novo Evento
        </h2>
        <ModalCloseButton className="text-zinc-400 hover:text-zinc-700 disabled:opacity-50" />
      </div>

      <div className="px-5 py-2 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs font-semibold text-zinc-500">
        {STEPS.map(({ step: value, label }, index) => (
          <span key={value} className="contents">
            {index > 0 && <span aria-hidden>·</span>}
            <span className={step === value ? 'text-brand font-bold' : ''} aria-current={step === value ? 'step' : undefined}>
              {label}
            </span>
          </span>
        ))}
      </div>

      <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
        {error && <Alert>{error}</Alert>}
        {eventSaved && step < 3 && (
          <Alert tone="info">O evento já foi salvo como rascunho; alterações nestes dados não serão reenviadas.</Alert>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <Field label="Nome do Evento *" htmlFor="ev-title">
              <TextInput id="ev-title" compact value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do evento" autoFocus />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Categoria" htmlFor="ev-category">
                <SelectInput id="ev-category" compact value={category} onChange={(e) => setCategory(e.target.value as EventCategory)}>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Classificação" htmlFor="ev-adult">
                <label className="flex items-center gap-2 h-[34px] px-3 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-700 cursor-pointer">
                  <input
                    id="ev-adult"
                    type="checkbox"
                    checked={isAdultOnly}
                    onChange={(e) => setIsAdultOnly(e.target.checked)}
                    className="accent-brand"
                  />
                  Evento exclusivo para maiores de 18 anos
                </label>
              </Field>
            </div>

            <Field label="Descrição" htmlFor="ev-description">
              <TextArea id="ev-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes sobre o evento" />
            </Field>

            <Field label="Imagem de Capa" hint="A capa é enviada após salvar o evento.">
              <ImagePicker file={image} onChange={setImage} disabled={busy} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Início *" htmlFor="ev-start">
                <TextInput id="ev-start" compact type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Field label="Término *" htmlFor="ev-end">
                <TextInput id="ev-end" compact type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
              <Field label="Capacidade máxima *" htmlFor="ev-capacity">
                <TextInput
                  id="ev-capacity"
                  compact
                  type="number"
                  min={1}
                  step={1}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  placeholder="Ex: 500"
                  className="font-mono"
                />
              </Field>
            </div>

            <Field label="Formato">
              <div className="grid grid-cols-3 gap-2" role="radiogroup">
                {(Object.keys(LOCATION_TYPE_LABELS) as EventLocationType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={locationType === type}
                    onClick={() => setLocationType(type)}
                    className={`py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      locationType === type ? 'border-brand bg-brand-tint text-brand' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                    }`}
                  >
                    {LOCATION_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </Field>

            {isOnline ? (
              <Alert tone="info">Eventos online não exigem endereço. Envie o link de acesso aos participantes pelo app.</Alert>
            ) : (
              <>
                {locationsError && <Alert>{locationsError}</Alert>}
                <Field label="Local / Estabelecimento *" htmlFor="ev-place">
                  <TextInput id="ev-place" compact value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Nome do local" />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <Field label="CEP *" htmlFor="ev-zip">
                    <TextInput
                      id="ev-zip"
                      compact
                      inputMode="numeric"
                      value={zipCode}
                      onChange={(e) => setZipCode(maskZipCode(e.target.value))}
                      placeholder="00000-000"
                      className="font-mono"
                    />
                  </Field>
                  <Field label="Rua *" htmlFor="ev-street" className="sm:col-span-2">
                    <TextInput id="ev-street" compact value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua / Avenida" />
                  </Field>
                  <Field label="Número *" htmlFor="ev-number">
                    <TextInput id="ev-number" compact inputMode="numeric" value={number} onChange={(e) => setNumber(onlyDigits(e.target.value))} placeholder="123" />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Bairro *" htmlFor="ev-neighborhood">
                    <TextInput id="ev-neighborhood" compact value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" />
                  </Field>
                  <Field label="Complemento" htmlFor="ev-complement">
                    <TextInput id="ev-complement" compact value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Opcional" />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Estado *" htmlFor="ev-state">
                    <SelectInput
                      id="ev-state"
                      compact
                      value={stateId}
                      disabled={!states}
                      onChange={(e) => {
                        setStateId(e.target.value)
                        setCityId('')
                        setCities(null)
                      }}
                    >
                      <option value="">{states ? 'Selecione' : 'Carregando…'}</option>
                      {states?.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.name} ({state.acronym})
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Cidade *" htmlFor="ev-city">
                    <SelectInput id="ev-city" compact value={cityId} disabled={!cities} onChange={(e) => setCityId(e.target.value)}>
                      <option value="">{!stateId ? 'Selecione o estado' : cities ? 'Selecione' : 'Carregando…'}</option>
                      {cities?.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900">Lotes de Ingressos</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const key = nextLotKey.current++
                  setLots((current) => [...current, { key, name: `Lote ${current.length + 1}`, price: '', quantity: '' }])
                }}
                className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Lote</span>
              </button>
            </div>

            <div className="space-y-2">
              {lots.map((lot, index) => {
                const saved = savedLotKeys.includes(lot.key)
                return (
                  <div key={lot.key} className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-800">
                        Setor {index + 1}
                        {saved && <span className="ml-2 text-[10px] font-bold text-emerald-700">salvo</span>}
                      </span>
                      {lots.length > 1 && !saved && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setLots((current) => current.filter((item) => item.key !== lot.key))}
                          className="text-rose-500 hover:text-rose-700"
                          aria-label={`Remover ${lot.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <TextInput
                        compact
                        aria-label="Nome do lote"
                        value={lot.name}
                        disabled={saved || busy}
                        onChange={(e) => updateLot(lot.key, 'name', e.target.value)}
                        placeholder="Nome do lote"
                        className="px-2.5 py-1.5"
                      />
                      <TextInput
                        compact
                        aria-label="Preço em reais"
                        type="number"
                        min={0}
                        step="0.01"
                        value={lot.price}
                        disabled={saved || busy}
                        onChange={(e) => updateLot(lot.key, 'price', e.target.value)}
                        placeholder="Preço (R$)"
                        className="px-2.5 py-1.5 font-mono"
                      />
                      <TextInput
                        compact
                        aria-label="Quantidade"
                        type="number"
                        min={1}
                        step={1}
                        value={lot.quantity}
                        disabled={saved || busy}
                        onChange={(e) => updateLot(lot.key, 'quantity', e.target.value)}
                        placeholder="Quantidade"
                        className="px-2.5 py-1.5 font-mono"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-[11px] text-zinc-500">
              Total: <strong className="font-mono">{formatInteger(totalLots)}</strong> de{' '}
              <strong className="font-mono">{formatInteger(Number(maxParticipants) || 0)}</strong> vagas do evento. Use preço 0 para lotes gratuitos.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Field label="Início das vendas" htmlFor="ev-sales-start">
                <TextInput id="ev-sales-start" compact type="datetime-local" value={salesStart} disabled={busy} onChange={(e) => setSalesStart(e.target.value)} />
              </Field>
              <Field label="Fim das vendas" htmlFor="ev-sales-end" hint="Até o início do evento.">
                <TextInput id="ev-sales-end" compact type="datetime-local" value={salesEnd} disabled={busy} onChange={(e) => setSalesEnd(e.target.value)} />
              </Field>
            </div>

            <Alert tone="info">
              Publicar libera as vendas no app. Depois de publicado, os lotes não podem mais ser alterados. Salve como
              rascunho para revisar antes.
            </Alert>
          </div>
        )}
      </div>

      <div className="p-3.5 border-t border-zinc-200 flex items-center justify-between gap-2 bg-zinc-50">
        {step > 1 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setError('')
              setStep((step - 1) as Step)
            }}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-100 flex items-center gap-1 disabled:opacity-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar</span>
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {progress && <span className="text-[11px] text-zinc-500 hidden sm:inline">{progress}</span>}
          {step < 3 ? (
            <Button onClick={handleNext}>Avançar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleSubmit(false)} loading={submitting === 'draft'} disabled={busy}>
                Salvar rascunho
              </Button>
              <Button onClick={() => handleSubmit(true)} loading={submitting === 'publish'} disabled={busy}>
                Publicar Evento
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

/** Shown when a user without payment info tries to create an event (POST /events would return 404). */
export function OrganizerRequiredModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <Modal onClose={onClose} maxWidth="max-w-sm" className="p-6" labelledBy="organizer-required-title">
      <h3 id="organizer-required-title" className="text-base font-bold text-zinc-950">
        Cadastre seus dados de recebimento
      </h3>
      <p className="text-xs text-zinc-500 mt-1.5">
        Você continua usando a mesma conta: basta informar uma chave PIX ou conta bancária para receber os valores das
        vendas. É necessário ter 18 anos ou mais.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Agora não
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onClose()
            navigate('/conta/recebimentos')
          }}
        >
          Cadastrar agora
        </Button>
      </div>
    </Modal>
  )
}
