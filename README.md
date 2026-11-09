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

Outros scripts: `pnpm build` (typecheck + build), `pnpm lint`, `pnpm preview`.

Arquivos de ambiente: `.env` é local e ignorado pelo Git (copie de `.env.example`); `.env.production` é versionado e contém apenas valores públicos usados no build de produção (CI).

> **CORS:** em desenvolvimento o proxy do Vite evita o CORS. Em produção, a API precisa liberar a origem do site na variável `CORS_ORIGINS` (lista separada por vírgulas, ex.: `https://corevent-7e05e.web.app,https://corevent-7e05e.firebaseapp.com`). Sem ela, o CORS continua desativado e o site publicado não consegue chamar a API.

> **Hosting:** `firebase.json` define CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy` e cache (`no-cache` nas páginas, cache longo nos assets com hash). Se a URL da API mudar, atualize o `connect-src` da CSP.

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
