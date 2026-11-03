import type { EventCategory, EventLocationType, EventStatus } from '../api/types'

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  music: 'Shows & Música',
  sports: 'Esportes',
  tech: 'Tecnologia & Inovação',
  business: 'Negócios',
  education: 'Educação',
  art_culture: 'Arte & Cultura',
  gastronomy: 'Gastronomia',
  health_wellness: 'Saúde & Bem-estar',
  family_kids: 'Família & Crianças',
  religious_spiritual: 'Religioso & Espiritual',
  games: 'Games',
  community_social: 'Comunidade & Social',
  fashion_beauty: 'Moda & Beleza',
  other: 'Outros',
}

export const LOCATION_TYPE_LABELS: Record<EventLocationType, string> = {
  in_person: 'Presencial',
  online: 'Online',
  hybrid: 'Híbrido',
}

export const STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Rascunho',
  opened: 'Publicado',
  going: 'Em andamento',
  finished: 'Encerrado',
  canceled: 'Cancelado',
}

export const STATUS_BADGE_CLASSES: Record<EventStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  opened: 'bg-emerald-100 text-emerald-800',
  going: 'bg-amber-100 text-amber-800',
  finished: 'bg-zinc-200 text-zinc-700',
  canceled: 'bg-rose-100 text-rose-700',
}
