// The two Corevent mobile apps promoted by the web portal. Store links are optional
// env vars: while they are not set, the download dialog says the app is coming soon.

export type MobileAppKind = 'participant' | 'organizer'

export interface MobileAppInfo {
  name: string
  audience: string
  summary: string
  steps: string[]
  storeUrl: string | null
}

export const MOBILE_APPS: Record<MobileAppKind, MobileAppInfo> = {
  participant: {
    name: 'Corevent',
    audience: 'App para participantes',
    summary: 'Encontre eventos, compre ingressos e leve seus passes no celular.',
    steps: [
      'Baixe o app Corevent no seu celular.',
      'Entre com a mesma conta deste site (ou crie uma, se ainda não tiver).',
      'Compre ingressos e apresente o QR Code na entrada do evento.',
    ],
    storeUrl: import.meta.env.VITE_PARTICIPANT_APP_URL || null,
  },
  organizer: {
    name: 'Corevent Colaboradores',
    audience: 'App para colaboradores · check-in na entrada',
    summary: 'Valide os ingressos dos participantes na entrada dos eventos que você criou.',
    steps: [
      'Baixe o app para colaboradores (Corevent Colaboradores) no celular que será usado na entrada.',
      'Entre com o mesmo e-mail e senha que você usa neste site.',
      'Selecione o evento e leia o QR Code dos ingressos para liberar o acesso.',
    ],
    storeUrl: import.meta.env.VITE_ORGANIZER_APP_URL || null,
  },
}
