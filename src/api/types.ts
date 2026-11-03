// Contracts confirmed against the API source code (api/src/modules/**).
// Dates are ISO strings in JSON. Decimal columns may arrive as strings.

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface ApiData<T> {
  data: T
}

export interface PaginationMeta {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export interface MessageResponse {
  message: string
}

export type DocumentType = 'cpf' | 'cnpj'

export interface User {
  id: string
  name: string
  email: string
  documentType: DocumentType
  document: string
  /** YYYY-MM-DD */
  birthDate: string
  phoneNumber?: string | null
  /** Signed read URL, valid for 6 hours. */
  avatarUrl?: string | null
  createdAt: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  /** YYYY-MM-DD */
  birthDate: string
  documentType: DocumentType
  /** Digits only */
  document: string
  verifyEmailCode: string
  phoneNumber?: string
}

export type EventStatus = 'draft' | 'opened' | 'going' | 'canceled' | 'finished'
export type EventLocationType = 'online' | 'in_person' | 'hybrid'
export type EventCategory =
  | 'music'
  | 'sports'
  | 'tech'
  | 'business'
  | 'education'
  | 'art_culture'
  | 'gastronomy'
  | 'health_wellness'
  | 'family_kids'
  | 'religious_spiritual'
  | 'games'
  | 'community_social'
  | 'fashion_beauty'
  | 'other'

export interface StateInfo {
  id: number
  name: string
  acronym: string
}

/** Shape returned by GET /events/my/organizer (the API ships `city`, not cityName/stateAcronym). */
export interface EventListItem {
  id: string
  title: string
  maxParticipants: number
  locationName?: string | null
  locationType: EventLocationType
  startDate: string
  endDate: string
  category: EventCategory
  bannerUrl?: string | null
  isAdultOnly: boolean
  status: EventStatus
  organizer: { id: string; name: string; email: string; avatarUrl?: string | null }
  city: { id: number; name: string; state: StateInfo | null } | null
  averageRating: number | null
}

export interface CreateEventPayload {
  title: string
  description?: string
  maxParticipants: number
  locationType: EventLocationType
  locationName?: string
  cityId?: number
  zipCode?: string
  neighborhood?: string
  street?: string
  number?: number
  complement?: string
  /** ISO 8601 with Z or offset */
  startDate: string
  endDate: string
  category: EventCategory
  isAdultOnly: boolean
  status: 'draft' | 'opened'
}

export type UpdateEventPayload = Partial<CreateEventPayload>

export interface CreatedEvent {
  id: string
  title: string
  status: EventStatus
  startDate: string
  endDate: string
}

export interface TicketType {
  id: string
  eventId: string
  name: string
  price: number | string
  totalQuantity: number
  availableQuantity: number
  startDate: string
  endDate: string
}

export interface TicketTypePayload {
  name: string
  price: number
  totalQuantity: number
  startDate: string
  endDate: string
}

export interface State {
  id: number
  name: string
  acronym: string
}

export interface City {
  id: number
  name: string
  stateId: number
}

export type PixType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'

export interface PaymentInfo {
  id: string
  userId: string
  description: string
  branchNumber?: string | null
  branchDigit?: string | null
  accountNumber?: string | null
  accountDigit?: string | null
  bankCode?: string | null
  pixKey?: string | null
  pixType?: PixType | null
}

export interface PaymentInfoListItem {
  id: string
  description: string
}

export interface PaymentInfoPayload {
  description: string
  branchNumber?: string | null
  branchDigit?: string | null
  accountNumber?: string | null
  accountDigit?: string | null
  bankCode?: string | null
  pixKey?: string | null
  pixType?: PixType | null
}

export type UploadPurpose = 'avatar' | 'event_banner'
export type ImageContentType = 'image/jpeg' | 'image/png' | 'image/webp'

export interface PresignData {
  uploadUrl: string
  key: string
  publicUrl: string
  expiresIn: number
}

export interface EventParticipant {
  id: string
  name: string
  email: string
  ticketsCount: number
}
