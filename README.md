# Corevent Web — Criação e gestão de eventos

Front-end React onde qualquer usuário Corevent cria e gerencia seus eventos e lotes de ingressos. **É a mesma conta usada nos apps**: quem organiza eventos continua participando de outros normalmente.

O ecossistema tem dois apps mobile, divulgados pelo site:
- **Corevent** (participantes): compra de ingressos e passes. Aparece na tela de boas-vindas, na barra de aviso para visitantes e no rodapé.
- **Corevent Colaboradores** (app para colaboradores: organizador e equipe da entrada): check-in dos ingressos na entrada. Aparece na barra de aviso para usuários logados, no botão "Check-in (app)" de cada evento e no rodapé.

O site **não** faz check-in de ingressos.

Stack: React 19 + TypeScript + Vite 8 (React Compiler), Tailwind CSS 4, React Router, lucide-react. Lint com oxlint. Deploy no Firebase Hosting (`firebase.json`).

## Como executar

```bash
pnpm install
cp .env.example .env.local   # ajuste se necessário
pnpm dev                     # http://localhost:5173
```

A API (`../api`) precisa estar rodando. Por padrão, o Vite encaminha `/api` para `http://localhost:3000`.

| Variável | Uso |
|---|---|
| `VITE_API_URL` | URL base usada pelo navegador. Em desenvolvimento: `/api` (passa pelo proxy do Vite). Em produção vem do `.env.production` e **precisa ser absoluta** (ex.: `https://api.exemplo.com/api`); o build falha com URL relativa, a menos que `VITE_ALLOW_RELATIVE_API=true` (só se `/api` for reescrito para a API no mesmo domínio). |
| `VITE_API_PROXY_TARGET` | Somente em desenvolvimento: para onde o proxy do Vite encaminha `/api`. Padrão: `http://localhost:3000`. |
| `VITE_PARTICIPANT_APP_URL` / `VITE_ORGANIZER_APP_URL` | Links de download dos apps (participantes e colaboradores). Defina no `.env` (dev) **e** no `.env.production` (site publicado). Vazios = o modal informa "disponível em breve". |

Outros scripts: `pnpm build` (typecheck + build), `pnpm lint`, `pnpm preview` e os testes (veja [Testes](#testes)).

Arquivos de ambiente: `.env` é local e ignorado pelo Git (copie de `.env.example`); `.env.production` é versionado e contém apenas valores públicos usados no build de produção (CI).

> **CORS:** em desenvolvimento o proxy do Vite evita o CORS. Em produção, a API libera uma única origem, definida na variável `FRONTEND_URL` do backend (hoje `https://corevent.site`, o domínio do site no Firebase Hosting). Por isso o site publicado deve ser acessado por `https://corevent.site`: os endereços padrão do Firebase (`*.web.app` / `*.firebaseapp.com`) carregam a página, mas as chamadas à API são bloqueadas pelo navegador.

> **Hosting:** `firebase.json` define CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy` e cache (`no-cache` nas páginas, cache longo nos assets com hash). Se a URL da API mudar, atualize o `connect-src` da CSP.

## Testes

Atende à prática **"Automação de Testes – Roteiro com o PI"**: o repositório tem testes **Jest**, **Supertest** e **Cypress** (incluindo o fluxo crítico `cypress/e2e/teste_pi.cy.js`), além de testes de integração em Vitest. Nenhum teste acessa a API real: ela é simulada com os mesmos contratos (rotas, formatos de resposta e erros) do backend em `../api`.

| Tipo | Ferramenta | Onde | O que cobre |
|---|---|---|---|
| **Unitário** | Jest | `tests/unit/` | Validadores (CPF/CNPJ, senha, telefone, datas), máscaras e formatação, tradução de erros da API, geração de CSV (com proteção contra fórmulas), cálculo de vendas/receita |
| **API/HTTP** | Supertest (com Jest) | `tests/api/` | O site compilado como no deploy (`vite build` + `vite preview`): página inicial, rotas do SPA, arquivos estáticos com o tipo correto, URL de produção da API no bundle, ausência de *source maps* e de arquivos `.env` expostos |
| **Integração** | Vitest + Testing Library + MSW | `tests/integration/` | Cliente HTTP (renovação única de sessão, sessão expirada, timeout, resposta inesperada) e o app renderizado: login/logout, sessão restaurada, rotas protegidas, cadastro com verificação de e-mail, confirmação ao fechar modais, painel (indicadores, filtros, publicar/excluir, erro com "Tentar novamente") |
| **E2E** | Cypress + Testing Library | `cypress/e2e/` | Fluxo crítico do PI (`teste_pi.cy.js`: entrar → painel) e jornadas completas: criar evento online e presencial com lotes, publicar, gerenciar lotes, exportar CSV, cancelar evento, conta, troca de senha, sessão expirada e cenários no layout mobile |

### Como executar

```bash
pnpm install               # uma vez (baixa também o Cypress)
pnpm exec cypress install  # só se o binário do Cypress não tiver sido baixado

pnpm test                  # unitários (Jest) + integração (Vitest) + HTTP (Supertest)
pnpm test:unit             # só unitários (Jest)
pnpm test:integration      # só integração (Vitest)
pnpm test:api              # só Supertest (faz o build e sobe o preview automaticamente)
pnpm test:watch            # integração em modo watch
pnpm test:coverage         # cobertura dos unitários (Jest) e da integração (Vitest)
pnpm test:e2e              # E2E com Cypress no Chrome, sem interface (sobe o site na porta 4174)
pnpm test:e2e:open         # abre a interface do Cypress: escolha "E2E Testing" e o navegador
pnpm test:all              # tudo
```

O `pnpm test:e2e` usa o **Google Chrome** instalado na máquina (o navegador embutido do Cypress, Electron, trava em alguns cenários com modais no modo headless). No `pnpm test:e2e:open`, selecione o Chrome, como no roteiro da disciplina.

### Onde ver os resultados

- **Jest (unitários e Supertest) e Vitest (integração):** no terminal, arquivo a arquivo, com o total de testes aprovados e reprovados.
- **Cobertura:** `pnpm test:coverage` mostra o resumo no terminal e gera relatórios navegáveis em `coverage/unit/index.html` (Jest) e `coverage/integration/index.html` (Vitest).
- **Cypress:** o terminal mostra cada cenário e uma tabela final por arquivo. No modo `test:e2e:open`, o navegador abre sozinho e cada passo aparece na tela. Em falhas, há capturas de tela em `cypress/screenshots/` (e vídeos em `cypress/videos/` no CI).
- **CI (GitHub Actions):** os workflows de PR e de deploy rodam lint, Jest, Vitest, Supertest e Cypress antes do build; se algo falhar, o deploy não acontece e as capturas do Cypress ficam disponíveis como artefato `cypress-artifacts`.

### Como os testes estão organizados

- `jest.config.js`: projetos `unit` e `api`. O TypeScript é compilado pelo Babel com configuração própria do Jest (não afeta o build do Vite).
- `tests/api/global-setup.ts`: gera o build de produção em `node_modules/.tmp/supertest-dist` e sobe o `vite preview` na porta 4175 para o Supertest.
- `vitest.config.ts`: testes de integração em jsdom. `.env.test` define a URL da API simulada.
- `tests/mocks/`: dados de exemplo (`fixtures.ts`, também usados pelo Cypress) e a API simulada com MSW (`api.ts`).
- `cypress.config.ts`, `cypress/support/`: comandos `cy.mockApi()` e `cy.visitSignedIn()`; a API é simulada com `cy.intercept` e cada teste falha se o app chamar um endpoint desconhecido. `.env.e2e` garante que nenhuma chamada saia para uma API real.

## Estrutura

```
src/
  api/          cliente HTTP (fetch), erros traduzidos, tipos dos contratos e serviços por recurso
  auth/         tokens, AuthProvider (sessão), RequireAuth
  app/          estado de UI (modais) e eventos do organizador (EventsProvider)
  components/   layout (Navbar, Footer, aviso do app) e UI base (Modal, Button, Field, Alert...)
  features/     auth, dashboard, events (criação, lotes, capa), account (dados, segurança, recebimentos)
  utils/        formatação, máscaras, validadores (espelham as regras da API), CSV
```

## Autenticação

- Login: `POST /auth/login`. O access token (JWT, 1h) fica **só em memória**; o refresh token (7 dias, rotacionado a cada uso) fica no `localStorage`.
- Ao recarregar a página, a sessão é restaurada com `POST /auth/refresh` seguido de `GET /users/me`.
- Quando uma requisição recebe 401, o cliente faz **um único refresh compartilhado** entre requisições concorrentes e repete a chamada. Se o refresh falhar, a sessão é encerrada e o aviso "sessão expirada" abre o login.
- Logout: `POST /auth/logout` revoga o refresh token. O logout é sincronizado entre abas.
- Rotas `/conta/*` são protegidas. "Organizador" significa ter dados de recebimento cadastrados, exigência da API para `POST /events`.

## Endpoints integrados

| Área | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/verify-email`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password` |
| Conta | `GET /users/me`, `PATCH /users`, `PATCH /users/pass`, `PATCH /users/me/avatar`, `POST /storage/presign` (+ PUT direto no Cloud Storage) |
| Recebimentos | `GET/POST /users/me/organizer-payment-info`, `GET/PATCH/DELETE /users/me/organizer-payment-info/:id` |
| Eventos | `GET /events/my/organizer` (uma chamada por status), `POST /events`, `PATCH /events/:id`, `POST /events/:id/cancel`, `DELETE /events/:id`, `PATCH /events/:id/banner` |
| Lotes | `GET/POST /events/:eventId/ticket-types`, `DELETE /events/ticket-types/:id` |
| Participantes | `GET /events/:eventId/participants` (exportação CSV) |
| Localidades | `GET /states`, `GET /states/:stateId/cities` |

## Diferenças em relação ao mockup e limitações

- **Cadastro:** além das 4 etapas do mockup, há uma **etapa de verificação de e-mail**, porque a API exige o código enviado por `/auth/verify-email`.
- **Recuperar senha:** a API não tem endpoint para validar o código separadamente. O código digitado só é conferido ao redefinir a senha; se estiver errado, o fluxo volta para a etapa do código.
- **Pausar evento ou lote:** a API não oferece. Rascunhos podem ser **publicados** (▶) ou **excluídos**; eventos publicados podem ser **cancelados**. Lotes só podem ser criados ou excluídos enquanto o evento é rascunho. Antes de excluir um rascunho, o front remove os lotes, pois a FK não tem cascade.
- **Métricas** (vendidos, receita, ocupação): não existe endpoint de estatísticas. Os valores são derivados dos lotes (`total − disponível` × preço) e só contam pedidos pagos.
- **Novo evento:** sem subtítulo (o campo não existe na API). Datas, endereço estruturado, estado e cidade seguem o contrato real. A capa é enviada por upload real (presign + Cloud Storage), não por imagens pré-definidas. O período de vendas vale para todos os lotes criados no assistente.
- **Check-in:** removido do site; é feito pelo app para colaboradores (Corevent Colaboradores).
- **Fechar modais:** Esc, clique fora ou "X" pedem confirmação quando há dados não salvos (login, cadastro, recuperação de senha, novo evento, novo lote).
- **Dados de recebimento:** tela nova, inexistente no mockup, necessária para que o usuário possa criar eventos.
- Os links de loja dos apps são configuráveis por variável de ambiente. Os contatos fictícios de suporte do rodapé foram removidos.
- URLs de imagem são assinadas e expiram em 6h; quando expiram, aparece um placeholder até recarregar.
