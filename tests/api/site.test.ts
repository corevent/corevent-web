// Supertest: HTTP tests of the production build served like a static host
// (`vite build` + `vite preview`, started in global-setup.ts).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { BASE_URL } from './server'

const api = request(BASE_URL)

/** Public API URL configured for production builds (.env.production). */
const productionApiUrl = readFileSync('.env.production', 'utf8').match(/^VITE_API_URL=(.+)$/m)?.[1]?.trim()

async function mainScriptPath(): Promise<string> {
  const { text } = await api.get('/')
  const src = text.match(/<script type="module"[^>]*src="([^"]+)"/)?.[1]
  if (!src) throw new Error('module script not found in index.html')
  return src
}

describe('GET / (página inicial)', () => {
  it('responde 200 com o HTML da aplicação', async () => {
    const res = await api.get('/')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/html/)
    expect(res.text).toContain('<div id="root"></div>')
    expect(res.text).toContain('<html lang="pt-BR">')
    expect(res.text).toContain('<title>Corevent - Crie e gerencie seus eventos</title>')
  })

  it('referencia o favicon e o bundle JavaScript compilado', async () => {
    const res = await api.get('/')

    expect(res.text).toContain('href="/favicon.webp"')
    expect(res.text).toMatch(/<script type="module" crossorigin src="\/assets\/index-[\w-]+\.js"><\/script>/)
  })
})

describe('rotas da aplicação (SPA)', () => {
  it.each(['/conta', '/conta/seguranca', '/conta/recebimentos', '/rota-inexistente'])(
    'GET %s devolve o app para o roteamento no navegador',
    async (path) => {
      const res = await api.get(path)

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toMatch(/text\/html/)
      expect(res.text).toContain('<div id="root"></div>')
    },
  )
})

describe('arquivos estáticos', () => {
  it.each([
    ['/favicon.webp', /image\/webp/],
    ['/apple-touch-icon.png', /image\/png/],
  ])('GET %s responde com o tipo correto', async (path, type) => {
    const res = await api.get(path)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(type)
    expect(Number(res.headers['content-length'])).toBeGreaterThan(0)
  })

  it('serve o bundle JavaScript principal', async () => {
    const res = await api.get(await mainScriptPath())

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/javascript/)
  })

  it('serve a folha de estilos', async () => {
    const { text } = await api.get('/')
    const href = text.match(/<link rel="stylesheet"[^>]*href="([^"]+\.css)"/)?.[1]
    expect(href).toBeDefined()

    const res = await api.get(href!)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/css/)
  })
})

describe('configuração do build de produção', () => {
  it('usa a URL absoluta da API definida em .env.production', async () => {
    expect(productionApiUrl).toMatch(/^https:\/\//)

    const res = await api.get(await mainScriptPath())

    expect(res.text).toContain(productionApiUrl)
  })

  it('não publica source maps', async () => {
    const script = await mainScriptPath()
    const res = await api.get(script)

    expect(res.text).not.toContain('sourceMappingURL')
    const map = await api.get(`${script}.map`)
    expect(map.headers['content-type']).not.toMatch(/json/)
  })

  it('não expõe arquivos de ambiente', async () => {
    const res = await api.get('/.env')

    expect(res.text).not.toContain('VITE_API_PROXY_TARGET')
    expect(res.text).toContain('<div id="root"></div>')
  })
})
