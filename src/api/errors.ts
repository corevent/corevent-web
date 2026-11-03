// The API uses the default NestJS error body: { statusCode, message, error? }.
// `message` is an array for ValidationPipe errors and a string otherwise, and it
// is always in English, so known messages are translated here.

type Translation = [RegExp | string, string | ((match: RegExpMatchArray) => string)]

const TRANSLATIONS: Translation[] = [
  ['Invalid credentials', 'E-mail ou senha incorretos.'],
  ['Unauthorized', 'Sua sessão expirou. Entre novamente.'],
  ['Invalid refresh token', 'Sua sessão expirou. Entre novamente.'],
  ['Refresh token expired', 'Sua sessão expirou. Entre novamente.'],
  ['Email already used by another user', 'Este e-mail já está cadastrado.'],
  ['Document already used by another user', 'Este documento já está cadastrado em outra conta.'],
  ['Invalid CPF', 'CPF inválido.'],
  ['Invalid CNPJ', 'CNPJ inválido.'],
  [/^Invalid code, (\d+) attempts left$/, (m) => `Código incorreto. Restam ${m[1]} tentativa(s).`],
  ['Invalid code', 'Código inválido ou já utilizado. Solicite um novo código.'],
  ['Code expired due to maximum attempts reached', 'Código bloqueado por excesso de tentativas. Solicite um novo.'],
  ['Code expired', 'Código expirado. Solicite um novo.'],
  ['User not found', 'Usuário não encontrado.'],
  ['Password must be at least 8 characters long', 'A senha deve ter pelo menos 8 caracteres.'],
  ['Password must contain at least one lowercase letter', 'A senha deve conter uma letra minúscula.'],
  ['Password must contain at least one uppercase letter', 'A senha deve conter uma letra maiúscula.'],
  ['Password must contain at least one number', 'A senha deve conter um número.'],
  ['Password must contain at least one special character', 'A senha deve conter um símbolo (!@#$%^&*).'],
  ['Invalid current password provided', 'A senha atual está incorreta.'],
  ['User is not a organizer', 'Cadastre seus dados de recebimento antes de criar eventos.'],
  ['User must be at least 18 years old', 'É necessário ter 18 anos ou mais para cadastrar dados de recebimento.'],
  [
    'Inform a complete payment method: bank data or PIX data (or both).',
    'Informe um meio de recebimento completo: PIX e/ou dados bancários.',
  ],
  [/^Bank data incomplete\./, 'Dados bancários incompletos: preencha banco, agência, dígito, conta e dígito.'],
  [/^PIX data incomplete\./, 'Dados PIX incompletos: informe o tipo e a chave.'],
  [/^Invalid (cpf|cnpj|email|phone|random) key/, 'Chave PIX inválida para o tipo selecionado.'],
  ['Organizer payment info not found', 'Dados de recebimento não encontrados.'],
  ['You do not own this payment info', 'Estes dados de recebimento pertencem a outro usuário.'],
  ['Start date must be after today', 'A data de início deve estar no futuro.'],
  ['Start date must be before end date', 'A data de início deve ser anterior à data de término.'],
  [/^Address fields are required/, 'Preencha todos os campos de endereço do evento presencial.'],
  ['Online events cannot be updated to physical address', 'Eventos presenciais não podem ser convertidos em online.'],
  ['You are not the organizer of this event', 'Você não é o organizador deste evento.'],
  ['Event cannot be updated because it has already started', 'O evento já começou e não pode mais ser alterado.'],
  [/^Event cannot be updated because it has already/, 'Este evento não pode mais ser alterado.'],
  ['Event cannot be updated to draft because it is published', 'Eventos publicados não podem voltar a rascunho.'],
  ['Event cannot be deleted because it is not draft', 'Apenas rascunhos podem ser excluídos.'],
  ['Event cannot be cancelled because it is draft, delete instead', 'Rascunhos não são cancelados: exclua o evento.'],
  ['Event cannot be cancelled because it is finished', 'Eventos encerrados não podem ser cancelados.'],
  ['Event already cancelled', 'Este evento já foi cancelado.'],
  ['Event not found', 'Evento não encontrado.'],
  ['Event capacity is not enough for the ticket types', 'A soma dos lotes ultrapassa a capacidade máxima do evento.'],
  ['Ticket type dates must be within the event dates', 'O período de vendas do lote deve terminar até o início do evento.'],
  [/^Cannot (create|update|delete) because event is not draft$/, 'Lotes só podem ser alterados enquanto o evento é rascunho.'],
  ['Ticket type not found', 'Lote não encontrado.'],
  ['You do not have permission to access this event', 'Você não tem permissão para acessar este evento.'],
  ['Unsupported image content type', 'Formato de imagem não suportado. Use JPG, PNG ou WebP.'],
  ['Uploaded image not found in storage', 'A imagem não foi encontrada no armazenamento. Tente enviar novamente.'],
  ['Invalid avatar upload key', 'Envio de imagem inválido. Tente novamente.'],
  ['Invalid event banner upload key', 'Envio de imagem inválido. Tente novamente.'],
  ['Page number is out of range', 'Página fora do intervalo.'],
  [/ThrottlerException/, 'Muitas tentativas. Aguarde um minuto e tente novamente.'],
  ['Internal server error', 'Erro interno no servidor. Tente novamente em instantes.'],
]

const STATUS_FALLBACK: Record<number, string> = {
  0: 'Não foi possível conectar à API. Verifique sua conexão.',
  400: 'Dados inválidos. Revise as informações e tente novamente.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Recurso não encontrado.',
  409: 'Conflito com o estado atual do recurso.',
  429: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
}

export function translateMessage(message: string): string | null {
  for (const [pattern, translation] of TRANSLATIONS) {
    if (typeof pattern === 'string') {
      if (message === pattern) return typeof translation === 'string' ? translation : null
      continue
    }
    const match = message.match(pattern)
    if (match) return typeof translation === 'string' ? translation : translation(match)
  }
  return null
}

export class ApiError extends Error {
  readonly status: number
  /** Raw messages returned by the API (English). */
  readonly rawMessages: string[]
  /** Messages ready to show to the user (Portuguese when known). */
  readonly messages: string[]

  constructor(status: number, rawMessages: string[], overrideMessage?: string) {
    const messages = overrideMessage ? [overrideMessage] : buildMessages(status, rawMessages)
    super(messages.join(' '))
    this.name = 'ApiError'
    this.status = status
    this.rawMessages = rawMessages
    this.messages = messages
  }

  /** A 2xx answer that is not the API's JSON (e.g. an HTML page from the host). */
  static unexpectedResponse(status: number): ApiError {
    return new ApiError(status, [], 'Resposta inesperada do servidor. Tente novamente em instantes.')
  }

  static timeout(): ApiError {
    return new ApiError(0, [], 'O servidor demorou demais para responder. Verifique sua conexão e tente novamente.')
  }

  hasRawMessage(pattern: string | RegExp): boolean {
    return this.rawMessages.some((message) =>
      typeof pattern === 'string' ? message === pattern : pattern.test(message),
    )
  }
}

function buildMessages(status: number, rawMessages: string[]): string[] {
  if (status === 0) return [STATUS_FALLBACK[0]]
  if (status >= 500) return ['Erro interno no servidor. Tente novamente em instantes.']
  if (rawMessages.length === 0) return [STATUS_FALLBACK[status] ?? 'Algo deu errado. Tente novamente.']

  const translated = rawMessages.map((message) => translateMessage(message))
  if (translated.every((message) => message !== null)) {
    return [...new Set(translated as string[])]
  }

  // Unknown messages (e.g. class-validator output) are internal details: users get a generic
  // sentence; the raw text is only shown in development to help debugging.
  const fallback = STATUS_FALLBACK[status] ?? 'Algo deu errado. Tente novamente.'
  const known = translated.filter((message): message is string => message !== null)
  const unknown = rawMessages.filter((_, index) => translated[index] === null)
  const generic = import.meta.env.DEV ? `${fallback} (${unknown.join('; ')})` : fallback
  return [...new Set([...known, generic])]
}

export function parseErrorBody(body: unknown): string[] {
  if (body && typeof body === 'object' && 'message' in body) {
    const { message } = body as { message: unknown }
    if (Array.isArray(message)) return message.map(String)
    if (typeof message === 'string') return [message]
  }
  return []
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.messages.join(' ')
  if (error instanceof Error && error.message) return error.message
  return 'Algo deu errado. Tente novamente.'
}
