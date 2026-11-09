import { useEffect, useId, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, isAllowedImage } from '../../api/storage'

interface ImagePickerProps {
  file: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}

export function ImagePicker({ file, onChange, disabled = false }: ImagePickerProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState<{ file: File; dataUrl: string } | null>(null)
  const preview = file && loaded?.file === file ? loaded.dataUrl : null

  useEffect(() => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setLoaded({ file, dataUrl: reader.result })
    }
    reader.readAsDataURL(file)
    return () => reader.abort()
  }, [file])

  const handleFile = (selected: File | undefined) => {
    setError('')
    if (!selected) return
    if (!isAllowedImage(selected)) return setError('Use uma imagem JPG, PNG ou WebP.')
    if (selected.size > MAX_IMAGE_BYTES) return setError('A imagem deve ter no máximo 5 MB.')
    onChange(selected)
  }

  return (
    <div>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      {preview ? (
        <div className="relative aspect-[3/1] rounded-lg overflow-hidden border-2 border-brand">
          <img src={preview} alt="Pré-visualização da capa" className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-white/90 text-[11px] font-semibold text-zinc-800 hover:bg-white"
            >
              Trocar
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(null)}
              className="p-1 rounded-lg bg-white/90 text-zinc-700 hover:bg-white"
              aria-label="Remover imagem"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            if (!disabled) handleFile(event.dataTransfer.files?.[0])
          }}
          className="flex flex-col items-center justify-center gap-1.5 aspect-[3/1] rounded-lg border-2 border-dashed border-zinc-200 hover:border-brand/60 bg-zinc-50 text-zinc-500 cursor-pointer transition-colors"
        >
          <ImagePlus className="w-5 h-5 text-brand" />
          <span className="text-xs font-semibold text-zinc-700">Clique ou arraste uma imagem</span>
          <span className="text-[11px] text-zinc-400">JPG, PNG ou WebP · até 5 MB · opcional</span>
        </label>
      )}
      {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
    </div>
  )
}
