# Estágio: Camada de Pagamento Backend — NutriAI

**Data:** 2026-07-11  
**Agente:** Backend_Engineer  
**Status:** ✅ Concluído  
**Lint:** `tsc --noEmit` — **0 erros**

---

## 1. Resumo Executivo

Implementamos a camada completa de pagamentos via **Mercado Pago** no backend Express + Supabase do NutriAI, preservando a arquitetura existente (controllers → services → middlewares). O sistema suporta:

- **Plano Mensal:** R$ 19,90  
- **Plano Anual:** R$ 149,90  
- **Trial:** 7 dias  
- **Webhook:** notificações do Mercado Pago com tratamento seguro (sempre 200)  
- **Histórico de pagamentos:** tabela `payments` para auditoria

---

## 2. Arquivos Criados

| Arquivo | Propósito |
|---------|-----------|
| `supabase/migrations/002_subscription_schema.sql` | Schema de subscription + tabela `payments` |
| `src/server/utils/supabaseAdmin.ts` | Client Supabase com **Service Role Key** (bypass RLS no backend) |
| `src/server/services/paymentService.ts` | Integração REST com Mercado Pago (sem SDK) |
| `src/server/controllers/paymentController.ts` | Rotas de subscription, webhook e status |

---

## 3. Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/server/utils/schemas.ts` | Adicionado `CreateSubscriptionSchema` e `WebhookSchema` |
| `server.ts` | Registro das rotas `/api/payments/*` (webhook sem auth, demais protegidas) |
| `src/dataHooks.ts` | Adicionado `getSubscriptionStatus`, `startTrial`, `activateSubscription` |
| `.env.example` | Variáveis `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_PUBLIC_KEY`, `APP_BASE_URL` |

---

## 4. Endpoints da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/api/payments/subscription` | ✅ Supabase Session | Cria preference no MP e retorna URL de checkout |
| `POST` | `/api/payments/webhook` | ❌ Nenhuma | Recebe notificações do MP (sempre retorna 200) |
| `GET`  | `/api/payments/status` | ✅ Supabase Session | Retorna status, plano e datas de expiração/trial |

---

## 5. Decisões Técnicas

### 5.1. Supabase Admin Client (`supabaseAdmin.ts`)
O backend não pode usar o client anon para escrita em `user_profiles` (RLS exige `auth.uid()`). Criamos um client separado usando `SUPABASE_SERVICE_ROLE_KEY`, permitindo operações seguras de servidor sem violar RLS no frontend.

### 5.2. Webhook Sempre 200
O Mercado Pago reenvia webhooks em loop se receber qualquer status diferente de 200. Nosso handler captura **todos** os erros internamente e retorna `200 { received: true }`, mesmo em falhas. Logs são gravados via `logger` para rastreabilidade.

### 5.3. Sem SDK do Mercado Pago
Usamos a API REST diretamente (`fetch`) para evitar adicionar nova dependência ao `package.json`, mantendo o bundle enxuto.

### 5.4. Email do Usuário
O `CreateSubscriptionSchema` aceita `email` opcional no body. Se omitido, o controller busca via `supabaseAdmin.auth.admin.getUserById(userId)`. Isso dá flexibilidade ao frontend.

### 5.5. TypeScript Strict — Zero `any`
Todos os tipos novos são interfaces explícitas. Usamos `unknown` + narrowing (`instanceof Error`) para tratamento de erros. Nenhum `any` foi introduzido no código novo.

---

## 6. Schema SQL (Resumo)

```sql
-- Colunas adicionadas a user_profiles
subscription_status      text default 'free'
subscription_plan        text
subscription_expires_at  timestamptz
mercado_pago_preference_id text
mercado_pago_payment_id  text
trial_ends_at            timestamptz

-- Nova tabela: payments (auditoria)
public.payments (
  id uuid primary key,
  user_id uuid references auth.users,
  mercado_pago_payment_id text unique,
  amount decimal(10,2),
  status text,
  plan text,
  ...
)
```

RLS habilitada em `payments` com políticas `own` (select/insert/update/delete).

---

## 7. Próximos Passos (Frontend / Integração)

1. **Tela de Assinatura:** chamar `POST /api/payments/subscription` com `{ plan: "monthly" | "annual" }` e redirecionar para `checkoutUrl`.
2. **Tela de Sucesso:** após retorno do MP (`/subscription/success`), chamar `GET /api/payments/status` para confirmar ativação.
3. **Trial:** no primeiro login, chamar `startTrial(userId)` do `dataHooks.ts`.
4. **Guardas de Rota:** usar `getSubscriptionStatus` para bloquear funcionalidades premium quando `status !== "active" && status !== "trial"`.

---

## 8. Variáveis de Ambiente Necessárias

```env
MERCADO_PAGO_ACCESS_TOKEN=your_mp_access_token
MERCADO_PAGO_PUBLIC_KEY=your_mp_public_key
APP_BASE_URL=https://seu-dominio.vercel.app
```

Nota: `APP_BASE_URL` deve ser a URL pública do app (usada nos `back_urls` e `notification_url` do MP).

---

## 9. Verificação de Qualidade

- ✅ `tsc --noEmit` passou (0 erros, 0 warnings novos)  
- ✅ Arquitetura em camadas preservada (controllers → services → middlewares)  
- ✅ Webhook seguro (sempre 200)  
- ✅ Mensagens de erro em português brasileiro  
- ✅ Zero `any` no código novo  
- ✅ RLS protegida (admin client no backend, anon client no frontend)
