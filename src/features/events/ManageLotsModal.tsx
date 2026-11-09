import { useCallback, useEffect, useId, useState, type FormEvent } from 'react'
import { Download, ImagePlus, Play, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { getErrorMessage } from '../../api/errors'
import { confirmEventBanner } from '../../api/events'
import { ALLOWED_IMAGE_TYPES, uploadImage } from '../../api/storage'
import { createTicketType, deleteTicketType, listAllTicketTypes } from '../../api/ticketTypes'
import { listAllParticipants } from '../../api/tickets'
import type { TicketType } from '../../api/types'
import type { DashboardEvent } from '../../app/eventsContext'
import { computeStats, percentOf } from '../../app/eventStats'
import { useOrganizerEvents } from '../../app/useOrganizerEvents'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { TextInput } from '../../components/ui/Field'
import { Modal, ModalCloseButton } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { STATUS_LABELS } from '../../utils/categories'
import { downloadCsv, slugify } from '../../utils/csv'
import {
  dateTimeLocalToIso,
  formatCurrency,
  formatDateTime,
  formatInteger,
  formatLongDate,
  toDateTimeLocal,
  toNumber,
} from '../../utils/format'
import { EventImage } from './EventImage'
import { describeLocation } from './eventLocation'

function lotSaleStatus(lot: TicketType, now = Date.now()): { label: string; className: string } {
  if (now < new Date(lot.startDate).getTime()) return { label: 'Agendado', className: 'bg-sky-100 text-sky-800' }
  if (now > new Date(lot.endDate).getTime()) return { label: 'Vendas encerradas', className: 'bg-zinc-100 text-zinc-500' }
  if (lot.availableQuantity <= 0) return { label: 'Esgotado', className: 'bg-amber-100 text-amber-800' }
  return { label: 'À venda', className: 'bg-emerald-100 text-emerald-800' }
}

const labelClass = 'block text-[11px] font-semibold text-zinc-700 mb-1'

interface ManageLotsModalProps {
  event: DashboardEvent
  onClose: () => void
  onPublish: () => void
}

export function ManageLotsModal({ event, onClose, onPublish }: ManageLotsModalProps) {
  const { reload } = useOrganizerEvents()
  const [lots, setLots] = useState<TicketType[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [lotToDelete, setLotToDelete] = useState<TicketType | null>(null)
  const [toast, setToast] = useState('')
  const [exportError, setExportError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [bannerError, setBannerError] = useState('')
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const bannerInputId = useId()

  const isDraft = event.status === 'draft'

  const loadLots = useCallback(async () => {
    try {
      setLots(await listAllTicketTypes(event.id))
      setLoadError('')
    } catch (err) {
      setLoadError(getErrorMessage(err))
    }
  }, [event.id])

  useEffect(() => {
    void loadLots()
  }, [loadLots])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const afterChange = async (message: string) => {
    showToast(message)
    await Promise.all([loadLots(), reload()])
  }

  const handleExport = async () => {
    setExporting(true)
    setExportError('')
    try {
      const participants = await listAllParticipants(event.id)
      if (participants.length === 0) {
        setExportError('Ainda não há participantes com ingressos pagos para exportar.')
        return
      }
      downloadCsv(
        `participantes-${slugify(event.title)}.csv`,
        ['Nome', 'E-mail', 'Ingressos'],
        participants.map((p) => [p.name, p.email, p.ticketsCount]),
      )
    } catch (err) {
      setExportError(getErrorMessage(err))
    } finally {
      setExporting(false)
    }
  }

  const handleBanner = async (file: File | undefined) => {
    if (!file) return
    setUploadingBanner(true)
    setBannerError('')
    try {
      const key = await uploadImage(file, 'event_banner', event.id)
      await confirmEventBanner(event.id, key)
      await afterChange('Imagem de capa atualizada.')
    } catch (err) {
      setBannerError(getErrorMessage(err))
    } finally {
      setUploadingBanner(false)
    }
  }

  const stats = lots ? computeStats(lots) : null
  const totalPlanned = lots?.reduce((sum, lot) => sum + lot.totalQuantity, 0) ?? 0
  const remainingCapacity = Math.max(0, event.maxParticipants - totalPlanned)

  return (
    <Modal
      onClose={onClose}
      maxWidth="max-w-3xl"
      confirmClose={
        showForm
          ? {
              title: 'Descartar o novo lote?',
              message: 'O lote que você está cadastrando ainda não foi salvo e será perdido se você fechar esta tela.',
              confirmLabel: 'Descartar e fechar',
              cancelLabel: 'Continuar editando',
            }
          : null
      }
      className="overflow-hidden flex flex-col max-h-[90vh]"
      labelledBy="lots-title"
    >
      <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between gap-4">
        <div className="relative shrink-0">
          <EventImage src={event.bannerUrl} alt={event.title} className="w-12 h-12 rounded-lg" />
          <input
            id={bannerInputId}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            className="sr-only"
            disabled={uploadingBanner}
            onChange={(e) => {
              void handleBanner(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <label
            htmlFor={bannerInputId}
            title="Alterar imagem de capa"
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-brand cursor-pointer hover:bg-brand-tint"
          >
            {uploadingBanner ? <Spinner className="w-3 h-3" /> : <ImagePlus className="w-3 h-3" />}
            <span className="sr-only">Alterar imagem de capa</span>
          </label>
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="lots-title" className="text-base font-bold text-zinc-950 truncate">
            Lotes: {event.title}
          </h2>
          <p className="text-xs text-zinc-500 truncate">
            {formatLongDate(event.startDate)} · {describeLocation(event)}
          </p>
        </div>
        <ModalCloseButton className="text-zinc-400 hover:text-zinc-700 shrink-0" />
      </div>

      <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
        {toast && <Alert tone="success">{toast}</Alert>}
        {bannerError && <Alert>{bannerError}</Alert>}

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[11px] text-zinc-500">Vendidos</span>
            <div className="text-lg font-bold text-zinc-950 font-mono mt-0.5">
              {stats ? formatInteger(stats.sold) : '—'}{' '}
              <span className="text-xs text-zinc-400 font-normal">/ {stats ? formatInteger(stats.capacity) : '—'}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[11px] text-zinc-500">Receita Bruta</span>
            <div className="text-lg font-bold text-zinc-950 font-mono mt-0.5 truncate">
              {stats ? formatCurrency(stats.revenue) : '—'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[11px] text-zinc-500">Status</span>
            <div className={`text-xs font-bold mt-1 uppercase ${event.status === 'opened' || event.status === 'going' ? 'text-emerald-600' : 'text-zinc-600'}`}>
              {event.status === 'opened' ? 'Vendas Abertas' : STATUS_LABELS[event.status]}
            </div>
          </div>
        </div>

        {!isDraft && (
          <Alert tone="info">
            Após a publicação, os lotes não podem ser criados, editados ou excluídos. Os participantes compram os ingressos
            pelo app Corevent, e o check-in na entrada é feito pelo app para colaboradores.
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900">Lotes Cadastrados ({lots?.length ?? 0})</span>
            {isDraft && (
              <button
                onClick={() => setShowForm((open) => !open)}
                className="flex items-center gap-1 text-xs font-bold text-brand hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showForm ? 'Cancelar' : 'Adicionar Lote'}</span>
              </button>
            )}
          </div>

          {showForm && lots && (
            <NewLotForm
              event={event}
              remainingCapacity={remainingCapacity}
              onCancel={() => setShowForm(false)}
              onCreated={async () => {
                setShowForm(false)
                await afterChange('Lote adicionado com sucesso.')
              }}
            />
          )}

          {loadError ? (
            <Alert
              action={
                <button onClick={() => void loadLots()} className="flex items-center gap-1 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
                </button>
              }
            >
              {loadError}
            </Alert>
          ) : lots === null ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : lots.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500">
              Nenhum lote cadastrado.{isDraft ? ' Adicione lotes antes de publicar o evento.' : ''}
            </div>
          ) : (
            <div className="space-y-2">
              {lots.map((lot) => {
                const sold = Math.max(0, lot.totalQuantity - lot.availableQuantity)
                const percent = percentOf(sold, lot.totalQuantity)
                const sale = lotSaleStatus(lot)
                const price = toNumber(lot.price)
                return (
                  <div
                    key={lot.id}
                    className="p-3.5 rounded-xl border border-zinc-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-950">{lot.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${sale.className}`}>{sale.label}</span>
                      </div>
                      <div className="text-zinc-500 font-mono">{price === 0 ? 'Gratuito' : formatCurrency(price)}</div>
                      <div className="text-[11px] text-zinc-400">
                        Vendas: {formatDateTime(lot.startDate)} até {formatDateTime(lot.endDate)}
                      </div>
                    </div>

                    <div className="w-full sm:w-40 space-y-1">
                      <div className="flex justify-between text-zinc-600">
                        <span>Vendido</span>
                        <span className="font-mono font-bold">
                          {formatInteger(sold)} / {formatInteger(lot.totalQuantity)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="h-full bg-brand rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>

                    {isDraft && (
                      <button
                        onClick={() => setLotToDelete(lot)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold border border-zinc-200 text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {exportError && <Alert tone="warning">{exportError}</Alert>}
      </div>

      <div className="p-3.5 border-t border-zinc-200 flex items-center justify-between gap-2 bg-zinc-50">
        <button
          onClick={handleExport}
          disabled={exporting || isDraft}
          title={isDraft ? 'Disponível após a publicação' : 'Exportar lista de participantes'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? <Spinner className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5 text-zinc-400" />}
          <span>Exportar CSV</span>
        </button>
        <div className="flex items-center gap-2">
          {isDraft && (
            <Button size="sm" onClick={onPublish} icon={<Play className="w-3.5 h-3.5" />}>
              Publicar Evento
            </Button>
          )}
          <ModalCloseButton className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold">
            Fechar
          </ModalCloseButton>
        </div>
      </div>

      {lotToDelete && (
        <ConfirmDialog
          title="Excluir lote?"
          description={
            <p>
              O lote <strong>{lotToDelete.name}</strong> será removido.
            </p>
          }
          confirmLabel="Excluir"
          tone="danger"
          onConfirm={async () => {
            await deleteTicketType(lotToDelete.id)
            await afterChange('Lote excluído.')
          }}
          onClose={() => setLotToDelete(null)}
        />
      )}
    </Modal>
  )
}

interface NewLotFormProps {
  event: DashboardEvent
  remainingCapacity: number
  onCancel: () => void
  onCreated: () => Promise<void>
}

function NewLotForm({ event, remainingCapacity, onCancel, onCreated }: NewLotFormProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('0')
  const [quantity, setQuantity] = useState(String(Math.min(100, remainingCapacity || 1)))
  const [salesStart, setSalesStart] = useState(() => toDateTimeLocal(new Date()))
  const [salesEnd, setSalesEnd] = useState(() => toDateTimeLocal(new Date(event.startDate)))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (formEvent: FormEvent) => {
    formEvent.preventDefault()
    const priceValue = Number(price.replace(',', '.'))
    const quantityValue = Number(quantity)

    if (!name.trim()) return setError('Informe o nome do lote.')
    if (!Number.isFinite(priceValue) || priceValue < 0) return setError('Informe um preço válido (0 para gratuito).')
    if (!Number.isInteger(quantityValue) || quantityValue < 1) return setError('A quantidade deve ser um número inteiro maior que zero.')
    if (quantityValue > remainingCapacity)
      return setError(`A capacidade restante do evento é de ${formatInteger(remainingCapacity)} ingresso(s).`)
    if (!salesStart || !salesEnd || new Date(salesStart) >= new Date(salesEnd))
      return setError('O início das vendas deve ser anterior ao fim.')
    if (new Date(salesEnd) > new Date(event.startDate)) return setError('As vendas devem terminar até o início do evento.')

    setSaving(true)
    setError('')
    try {
      await createTicketType(event.id, {
        name: name.trim(),
        price: Math.round(priceValue * 100) / 100,
        totalQuantity: quantityValue,
        startDate: dateTimeLocalToIso(salesStart),
        endDate: dateTimeLocalToIso(salesEnd),
      })
      await onCreated()
    } catch (err) {
      setError(getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3" noValidate>
      {error && <Alert>{error}</Alert>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label htmlFor="lot-name" className={labelClass}>
            Nome do Lote
          </label>
          <TextInput id="lot-name" compact value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Lote 2" />
        </div>
        <div>
          <label htmlFor="lot-price" className={labelClass}>
            Preço Unitário (R$)
          </label>
          <TextInput
            id="lot-price"
            compact
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="font-mono"
          />
        </div>
        <div>
          <label htmlFor="lot-qty" className={labelClass}>
            Quantidade <span className="font-normal text-zinc-400">(restam {formatInteger(remainingCapacity)})</span>
          </label>
          <TextInput
            id="lot-qty"
            compact
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="font-mono"
          />
        </div>
        <div>
          <label htmlFor="lot-start" className={labelClass}>
            Início das vendas
          </label>
          <TextInput id="lot-start" compact type="datetime-local" value={salesStart} onChange={(e) => setSalesStart(e.target.value)} />
        </div>
        <div>
          <label htmlFor="lot-end" className={labelClass}>
            Fim das vendas
          </label>
          <TextInput id="lot-end" compact type="datetime-local" value={salesEnd} onChange={(e) => setSalesEnd(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={saving} className="px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-200 rounded-lg">
          Cancelar
        </button>
        <Button type="submit" size="sm" loading={saving} className="py-1!">
          Salvar Lote
        </Button>
      </div>
    </form>
  )
}
