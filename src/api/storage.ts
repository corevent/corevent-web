import { apiRequest } from './client'
import type { ApiData, ImageContentType, PresignData, UploadPurpose } from './types'

export const ALLOWED_IMAGE_TYPES: ImageContentType[] = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
/** Direct uploads of up to 5 MB can be slow on mobile connections. */
const UPLOAD_TIMEOUT_MS = 120_000

export function isAllowedImage(file: File): file is File & { type: ImageContentType } {
  return (ALLOWED_IMAGE_TYPES as string[]).includes(file.type)
}

function presign(purpose: UploadPurpose, contentType: ImageContentType, eventId?: string): Promise<ApiData<PresignData>> {
  return apiRequest('/storage/presign', {
    method: 'POST',
    body: eventId ? { purpose, contentType, eventId } : { purpose, contentType },
  })
}

/**
 * Presign → direct PUT to Cloud Storage → returns the object key, which must then be
 * confirmed (PATCH /users/me/avatar or PATCH /events/:id/banner).
 */
export async function uploadImage(file: File, purpose: UploadPurpose, eventId?: string): Promise<string> {
  if (!isAllowedImage(file)) throw new Error('Formato de imagem não suportado. Use JPG, PNG ou WebP.')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('A imagem deve ter no máximo 5 MB.')

  const { data } = await presign(purpose, file.type, eventId)

  let response: Response
  try {
    // The signed URL was generated for this exact Content-Type.
    response = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('O envio da imagem demorou demais. Verifique sua conexão e tente novamente.')
    }
    throw new Error('Não foi possível enviar a imagem ao armazenamento. Tente novamente.')
  }
  if (!response.ok) throw new Error(`O armazenamento recusou o envio da imagem (HTTP ${response.status}).`)
  return data.key
}
