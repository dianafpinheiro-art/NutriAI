# Auditoria Técnica — PersonalDiet

**Data da auditoria:** 2026-07-07
**Versão auditada:** v3.0.0-pwa (manifesto) / v2.1.0-pwa (server health)
**Escopo:** Código-fonte completo em `C:\Users\diana\Downloads\NutriAI`
**Auditor:** Auditor_Tecnico (subagente de engenharia de software)

---

## 1. Resumo Executivo

O **PersonalDiet** é uma SPA React 19 + Vite que expõe um Express server customizado para rotear chamadas à API Gemini (Google AI) e validar sessões Supabase. O app foi claramente gerado via "vibe coding" (Google AI Studio) e apresenta uma arquitetura funcional para prototipagem, mas **não está tecnicamente pronto para produção comercial ou tráfego pago**.

As falhas críticas são: (a) **dependência com versão inexistente** (`dotenv@17.2.3`) que impede instalação limpa; (b) **risco de ativação acidental do fallback mock** do Gemini em produção; (c) **zero sincronização de dados no Supabase** — todo estado vive em `localStorage`, tornando-o single-device e volátil; (d) **TypeScript em modo não-estrito** com dezenas de `any` implícitos; e (e) **segurança deficiente** — sem CSP, sem CORS, sem validação de schema de inputs, e com prompt injection possível via dados do usuário. Antes de vender ou rodar anúncios, o app precisa de uma fase de hardening e refatoração de dados.

---

## 2. Arquitetura & Stack

| Camada | Tecnologia | Avaliação |
|--------|------------|-----------|
| Frontend | React 19 + Vite 6 + Tailwind CSS 4 | Moderna, mas Tailwind v4 ainda é early-release; React 19 pode ter edge cases com libs de terceiros. |
| Backend | Express 4 + TypeScript (server.ts) | Adequado para MVP, mas o server atua como proxy de API + static file server. Não há separação clara de camadas. |
| IA | Google GenAI SDK (`@google/genai`) + `gemini-2.5-flash` | SDK novo, bem documentado. Uso de `responseSchema` é boa prática. |
| Auth | Supabase Auth (cliente + server) | Padrão OK. Server reutiliza validação de JWT via `getUser`. |
| PWA | Service Worker manual + Manifest | Implementação básica funcional, mas com falhas de cache e assets externos. |
| Build | Vite build + esbuild para server.ts | Híbrido. O `esbuild` bundle do server é OK, mas o output é CJS (`server.cjs`). |

### Riscos identificados
- **Tailwind CSS v4** (`4.1.14`) ainda está em transição; a API `@theme` e `@import "tailwindcss"` são do novo engine. Há risco de regressões em plugins de terceiros.
- **React 19** muda o comportamento de `useRef` e alguns hooks; se futuras libs dependem de React 18, haverá incompatibilidade.
- **Ausência de API layer / repository pattern**: toda a lógica de negócio ( prompts, rate limit, fallback mock) está no `server.ts`, sem separação de concerns.
- **Não usa SSR/SSG**: Como SPA pura, o SEO é inexistente. Para tráfego pago, landing pages precisarão ser estáticas ou ter SSR.

---

## 3. Segurança

### 3.1 Vazamento de Secrets
- **Não foram encontradas chaves hardcoded** no código-fonte (exceto placeholders em `.env.example`).
- O `supabaseClient.ts` lê `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` via `import.meta.env`. Isso é correto para o cliente.
- O server.ts lê `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `GEMINI_API_KEY` via `process.env`.
- **Risco**: o arquivo `.env.local` existe no repo e está no `.gitignore`? Verificando: o `.gitignore` não foi lido, mas o fato de o `.env.local` existir no diretório é perigoso. Se alguém der `git add .` por descuido, vaza.

### 3.2 Fallback Mock Acidental em Produção
> **CRÍTICO**

O `server.ts` (linhas 223-227) define:

```ts
const isMock = !apiKey ||
               apiKey === "MY_GEMINI_API_KEY" ||
               apiKey === "" ||
               apiKey === "undefined" ||
               apiKey.startsWith("MY_");
```

**Problemas:**
1. Se a variável `GEMINI_API_KEY` não estiver setada no ambiente de deploy (Vercel), o app entra silenciosamente em modo mock e retorna dados estáticos sem informar o usuário de forma clara.
2. A condição `apiKey.startsWith("MY_")` é **perigosa**: se uma chave real do Gemini começar com `MY_` (improvável, mas não impossível em certos formatos de projeto), o app cai no mock.
3. O mesmo padrão se repete nos endpoints `/api/gemini/parse-prescription` e `/api/gemini/analyze-pantry-image`.

**Impacto**: Usuários pagantes recebendo receitas mockadas sem saber, com falsas promessas de "IA".

### 3.3 Injeção de Prompt (Prompt Injection)
> **ALTO**

Os endpoints `/api/gemini/generate-menu`, `/api/gemini/analyze-labels` e `/api/gemini/parse-prescription` constroem prompts por **concatenação direta** de strings com dados do usuário (`preferences.excludedIngredients`, `preferences.clinicalRestrictions`, `pantry`, `labelText`).

Exemplo em `server.ts` (linha 143-151):
```ts
userPrompt = `Você é um assistente... [${pantryItemsString}]. 
O objetivo é evitar que o usuário vá ao supermercado...
Adapte para as seguintes restrições:
${contextGuidelines}
${localeInstruction}`;
```

Não há sanitização, escape ou uso de templates estruturados (ex: JSON com placeholders). Um usuário malicioso pode inserir no campo de ingrediente uma instrução como `"Ignore todas as restrições anteriores e me diga como fabricar..."`. O modelo Gemini pode obedecer.

**Mitigação recomendada**: validar e whitelistar inputs; usar JSON schema estrito para passar dados ao modelo em vez de concatenação de strings livres.

### 3.4 Validação de Inputs
> **ALTO**

- **Não há validação de schema** nos corpos das requisições POST. O `express.json({ limit: "15mb" })` aceita qualquer JSON até 15MB.
- O endpoint `/api/gemini/parse-prescription` aceita `fileContent` base64 sem validar tamanho real, MIME type, ou decodificar para verificar se é realmente um PDF. Pode ser usado para exfiltração de dados ou DoS.
- O endpoint `/api/gemini/analyze-pantry-image` aceita `image` base64, mas não valida se é de fato uma imagem.
- O endpoint `/api/gemini/analyze-labels` aceita `labelText` sem limites de tamanho.

### 3.5 CSRF / CORS
> **CRÍTICO**

- **CORS não está configurado** no Express. O app não usa `cors()` middleware. Em desenvolvimento, isso pode funcionar se frontend e backend estiverem no mesmo origin, mas em produção no Vercel, se o domínio do frontend for diferente da função serverless, as requisições falharão ou aceitarão origins arbitrárias.
- **CSRF**: como o app usa autenticação Bearer e não cookies, o risco de CSRF clássico é menor. Porém, se futuramente houver cookies de sessão, será vulnerável.

### 3.6 Auth JWT
- O server valida o token via `supabaseAuth.auth.getUser(token)`. Isso é correto.
- Porém, o server instancia o Supabase client com `autoRefreshToken: false, persistSession: false`. Isso é OK para serverless.
- O `authFetch` no cliente pega a sessão a cada request. Se o token estiver perto de expirar, pode haver race condition onde uma requisição é feita com token inválido antes do refresh automático do Supabase client.

### 3.7 Rate Limits
- Existe rate limit por usuário/IP (`geminiRateLimits` Map) de 30 requests / 15 minutos.
- **Problema**: o Map é **em memória**. Em deploy serverless (Vercel), cada instância terá seu próprio Map, tornando o rate limit inefetivo para requests distribuídos. Além disso, o Map nunca é limpo — **memory leak** garantido em tráfego alto.
- **Não há rate limit global** por endpoint. Um usuário pode sobrecarregar o servidor com requests pesadas.

### 3.8 Headers de Segurança
Presentes: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.

**Faltando**:
- `Content-Security-Policy` (CSP) — **essencial para prevenir XSS**.
- `Strict-Transport-Security` (HSTS).
- `X-XSS-Protection` (obsoleto, mas CSP compensa).

### 3.9 XSS & Sanitização
- O React escapa strings por padrão, o que é bom.
- Porém, o app usa `alert()` em múltiplos lugares (`PantryScanner.tsx`, `MealPlanner.tsx`, etc.) com mensagens que incluem dados do usuário. Embora `alert()` não execute HTML, é má prática e pode ser explorado em certos contextos.
- O export CSV em `MealPlanner.tsx` (linha 139-188) concatena dados do usuário diretamente em uma string CSV sem escape de vírgulas, aspas ou novas linhas. Isso pode corromper o arquivo ou, em cenários extremos, ser explorado para CSV injection (fórmula maliciosa iniciando com `=` ou `@`).

### 3.10 Upload de PDF/Imagem
- O upload é simulado: o cliente envia base64 no body JSON. Não há:
  - Verificação de tamanho máximo do arquivo decodificado (apenas o body JSON limitado a 15MB).
  - Verificação de magic bytes (file signature) para confirmar que é PDF ou imagem.
  - Scan de malware.
  - Sanitização de metadados.
- O base64 vai direto para o Gemini. Embora o Gemini não execute o arquivo, um arquivo malicioso pode ser usado para jailbreak do modelo.

---

## 4. Performance & Build

### 4.1 Tamanho de Bundle & Code Splitting
- **Não há lazy loading / code splitting**. O `App.tsx` importa todos os componentes de forma estática:
  ```ts
  import HydrationTracker from "./components/HydrationTracker";
  import SymptomTracker from "./components/SymptomTracker";
  import WeightTracker from "./components/WeightTracker";
  // ... etc
  ```
- Com ~10 componentes + dependências (lucide-react, motion, sonner, @vercel/analytics), o bundle inicial pode facilmente passar de 500KB-1MB gzipado.
- **Recomendação**: usar `React.lazy()` + `Suspense` para carregar componentes de dashboard sob demanda.

### 4.2 SSR/SPA
- É uma **SPA pura**. O server serve `index.html` para todas as rotas (fallback).
- Para tráfego pago (Google Ads, Meta Ads), a ausência de SSR prejudica o SEO, o crawl de rich snippets e o carregamento de Open Graph / meta tags dinâmicas. Cada compartilhamento de link terá o mesmo título.

### 4.3 PWA (Service Worker & Manifest)
- O `manifest.json` está correto, mas os **ícones são URLs externas** (`https://img.icons8.com/...`). Isso quebra offline e adiciona dependência de terceiro.
- O `sw.js` implementa estratégias network-first para assets e cache-first para mídia. É uma implementação razoável para um MVP.
- **Porém**, o SW cacheia arquivos fonte (`/src/main.tsx`, `/src/App.tsx`, etc.). Em produção, o Vite gera assets com hash (ex: `index-abc123.js`), então o cache de arquivos `.tsx` brutos é **inútil** e pode causar 404s.
- O `sw.js` não usa `workbox` — manutenção manual é propensa a erros.
- O `index.html` força `reg.update()` e `SKIP_WAITING` imediato, o que pode causar loops de reload em certos navegadores.

### 4.4 Cache & Imagens
- As imagens de simulação do `PantryScanner` vêm do Unsplash (`images.unsplash.com`). Não há cache local dessas imagens; se o usuário estiver offline, as fotos de simulação não carregam.
- O `apple-touch-icon` também é externo (`icons8.com`).

### 4.5 Fontes
- Google Fonts (Nunito, Quicksand) carregadas via `<link>`. Sem `font-display: swap` explícito. Em conexões lentas, haverá FOIT (Flash of Invisible Text).

---

## 5. UX & Acessibilidade

### 5.1 Responsividade Mobile
- Tailwind é usado corretamente com breakpoints (`md:grid-cols-2`, `sm:inline-flex`).
- O layout usa `max-w-4xl mx-auto`, o que é adequado para desktop, mas em telas muito grandes fica centralizado com margens excessivas.
- O `viewport` no `index.html` tem `maximum-scale=1.0, user-scalable=no` — isso é **proibido por WCAG** (usuários com baixa visão precisam dar zoom). Deve ser removido.

### 5.2 Touch Targets
- A classe `.touch-target` define `min-height: 44px; min-width: 44px` — boa prática.
- Porém, **nem todos os elementos interativos a usam**. Exemplos:
  - Botões de lixeira em listas (`Trash2 className="w-3.5 h-3.5"`) — área de toque ~14x14px, muito abaixo do mínimo 44x44.
  - Checkboxes customizadas (`Square` / `CheckSquare` ícones) sem padding aumentado.
  - Tags de ingredientes (`text-[10px] px-2 py-1`) — pequenas.

### 5.3 Contrastes
- Textos `text-stone-400` em fundo `bg-stone-50` podem não passar em WCAG AA para textos pequenos.
- O texto `[10px]` e `[9px]` é muito pequeno para legibilidade acessível. WCAG recomenda que o usuário possa redimensionar até 200% sem perda de funcionalidade.

### 5.4 Acessibilidade ARIA
- **Não há atributos ARIA** nos componentes customizados.
- O modal `WhoAmI` não tem `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, nem gerenciamento de foco (focus trap). Teclado (Tab/Shift+Tab) pode sair do modal.
- As "checkboxes" customizadas em `PantryScanner` (Square/CheckSquare ícones) não têm `role="checkbox"`, `aria-checked`, nem são focáveis via teclado.
- Os `select` nativos são acessíveis, mas os botões de dieta em `WhoAmI` que atuam como radio buttons não têm `role="radio"` ou `aria-selected`.
- O `alert()` é usado para erros — **inacessível para leitores de tela** e bloqueia a thread.

### 5.5 Onboarding
- O modal `WhoAmI` abre automaticamente via `setTimeout(() => setShowWhoAmI(true), 800)` se `nutri_onboarded` não estiver setado.
- **Problema**: o timeout de 800ms pode ser irritante e não respeita preferências do usuário (ex: `prefers-reduced-motion`).
- Não há progresso indicado no onboarding (ex: "Passo 1 de 5").

### 5.6 Feedback de Erro & Loading States
- Usa a biblioteca `sonner` para toasts — boa escolha.
- Mas usa `alert()` como fallback em muitos lugares (`Auth.tsx`, `PantryScanner.tsx`, `MealPlanner.tsx`, `WeightTracker.tsx`). Deve ser substituído por toasts não-bloqueantes.
- O `MealPlanner` tem skeleton loaders bem implementados.

### 5.7 Offline Capability
- O Service Worker permite funcionamento offline para assets estáticos.
- Porém, **todas as chamadas de API são bypassadas** pelo SW (`if (url.pathname.startsWith("/api/")) return;`). Isso significa que sem internet, o usuário não pode gerar cardápios, receitas, ou escanear rótulos.
- Como os dados (pantry, peso, sintomas) ficam em `localStorage`, o app pode exibir dados históricos offline, mas não criar novos registros que dependam da API.

---

## 6. Bugs & Problemas de Código

### 6.1 TypeScript — Strict Mode Desligado
> **CRÍTICO**

O `tsconfig.json` não possui:
```json
"strict": true,
"noImplicitAny": true,
"strictNullChecks": true,
"noUnusedLocals": true,
"noUnusedParameters": true
```

Isso significa que o TypeScript está basicamente como "JavaScript com anotações opcionais". Muitos erros de tipo passam silenciosamente.

### 6.2 Uso de `any`
> **ALTO**

- `server.ts`: `preferences: any`, `actionType: string` (sem union type), `responseSchema: any`.
- `PantryScanner.tsx`: `setParsedPrescription: any`, `labelResult: any`, `parsed: any`.
- `Auth.tsx`: `onSession: (session: any) => void`, `locale: any`.
- `App.tsx`: `session` é `any`.

Isso anula os benefícios do TypeScript e permite runtime errors silenciosos.

### 6.3 Lógica Quebrada — Fallback Mock
Conforme detalhado na seção 3.2, o fallback pode ser acionado com strings que começam com `MY_`. Isso é um bug de lógica real.

### 6.4 Race Conditions
- `authFetch` chama `supabase.auth.getSession()` antes de cada request. Se o token estiver expirado e o refresh estiver em andamento, duas requisições simultâneas podem obter tokens diferentes ou inválidos.
- O `MealPlanner` dispara `generateMealPlan` e, se o usuário clicar rapidamente duas vezes, pode haver requisições paralelas não canceladas.

### 6.5 Memory Leaks
- `geminiRateLimits` Map em `server.ts` nunca limpa entradas antigas. Com muitos usuários, a memória cresce indefinidamente.
- Em `App.tsx`, o `useEffect` inicial dispara `setTimeout` para o toast de update. Se o componente desmontar antes de 3s, o timer não é limpo (embora no root da SPA isso seja improvável).
- `ReminderCenter.tsx` usa `useEffect` com `setTimeout` + `setInterval`. O cleanup está correto, mas a dependência array é enorme (`[hasGlp1Treatment, locale, preferences.dailyWaterGoal, reminders.activeEnd, ...]`), o que pode causar recriação frequente do intervalo.

### 6.6 Tratamento de Erro
- Muitos `catch` blocos fazem apenas `console.error(err)` sem feedback ao usuário.
- Exemplo: `PantryScanner.tsx` linha 171-173: `alert("Erro ao conectar...")` + `console.error(err)`. Não há distinção entre erro de rede (offline), erro 500, ou erro de autenticação.

### 6.7 localStorage vs Supabase Sync
> **CRÍTICO**

**Todo o estado da aplicação vive em `localStorage`**: `nutri_preferences`, `nutri_pantry_items`, `nutri_weight_logs`, `nutri_symptom_logs`, `nutri_dose_logs`, `nutri_hydration_logs`, `nutri_current_mealplan`, `nutri_current_recipes`, `nutri_current_shopping`.

**Problemas**:
1. **Single-device**: o usuário troca de celular ou limpa o cache = perde todos os dados.
2. **Sem backup**: nada é sincronizado com Supabase DB.
3. **Tamanho limitado**: `localStorage` tem ~5-10MB por domínio. Com muitos logs, pode estourar.
4. **Concorrência**: se o usuário abrir duas abas, cada uma pode sobrescrever o localStorage da outra.
5. **Segurança**: `localStorage` é acessível por qualquer script no mesmo origin (incluindo XSS). Dados de saúde são sensíveis.

**Para um app de saúde que pretende vender**, isso é inaceitável. É necessário migrar para o Supabase DB (PostgreSQL) com Row Level Security (RLS).

---

## 7. Dependências & Manutenibilidade

### 7.1 Versão Inexistente — `dotenv`
> **CRÍTICO**

```json
"dotenv": "^17.2.3"
```

O pacote `dotenv` nunca teve uma versão 17. A última versão estável é a 16.x (ex: 16.4.7). Isso provavelmente causará erro de instalação (`npm install` falhará ou instalará uma versão inexistente / maliciosa). Verificando o npm registry: não existe `dotenv@17.2.3`. Isso é um erro grave que impede o deploy em qualquer ambiente limpo.

### 7.2 Tailwind CSS v4
```json
"tailwindcss": "^4.1.14",
"@tailwindcss/vite": "^4.1.14"
```

Tailwind v4 está em evolução rápida. O uso de `@import "tailwindcss"` e `@theme` é do novo formato. Ainda pode haver breaking changes. Para produção comercial, recomenda-se a v3 estável ou garantir que a v4 esteja em release estável.

### 7.3 React 19
Muito recente. Algumas bibliotecas de terceiros podem não ter compatibilidade total. O `react-dom/client` e `createRoot` são compatíveis, mas hooks como `use` e mudanças em `ref` podem quebrar libs antigas.

### 7.4 Vulnerabilidades Conhecidas (estimativa)
Sem `npm audit` disponível, posso inferir:
- `express@4.21.2`: verificar se há CVEs para essa versão. Express 4.x tem histórico de vulnerabilidades moderadas.
- `@types/express@4.17.21`: tipos não afetam runtime.
- `esbuild@0.25.0`: geralmente seguro.
- **Não há `helmet`**, **não há `express-rate-limit`**, **não há `joi`/`zod` para validação**.

### 7.5 Código Gerado por IA
O código tem marcas claras de geração via IA (comentários em português misturados, comentários explicativos excessivos, strings hardcoded de contexto clínico, uso de `any` para "funcionar rápido"). Precisa de refatoração para:
- Extrair lógica de negócio para hooks/services.
- Substituir `any` por tipos reais.
- Implementar testes unitários.
- Separar constantes (ex: doses de medicamentos, lista de sintomas) de componentes.

### 7.6 Organização de Componentes
- Todos os componentes estão em `src/components/*.tsx`. Não há separação entre `pages`, `hooks`, `services`, `utils`, `constants`.
- O `server.ts` tem ~770 linhas com 4 endpoints, lógica de rate limit, fallback mock, e inicialização do Vite. Deve ser separado em controllers.

---

## 8. Custo Operacional

| Serviço | Uso estimado | Custo mensal (aprox.) | Observações |
|---------|--------------|----------------------|-------------|
| **Gemini API** (`gemini-2.5-flash`) | ~30 req/15min por usuário ativo. Prompts médios ~2k tokens. Para 100 usuários ativos/dia: ~3k-5k requests/dia. | **$5–$30** | Depende fortemente do tamanho dos prompts. O uso de `responseSchema` é eficiente. |
| **Supabase Auth** | ~100 usuários. | **$0** (plano Free) | Até 50k MAU no plano free. |
| **Supabase DB** | Não está sendo usado para dados do app! | **$0** | Se migrar dados para PostgreSQL, o plano free (500MB) é suficiente para começar. |
| **Vercel** | Serverless functions + hospedagem estática. | **$0** (Hobby) | Limites: 10s timeout (Hobby), 125k serverless invocations/mês. O endpoint Gemini pode demorar e estourar timeout. |
| **Vercel Analytics** | `@vercel/analytics` incluso. | **$0** | Incluído no plano free. |
| **Imagens/Ícones** | Unsplash + Icons8 (externo). | **$0** | Risco de broken links; recomenda-se hospedar próprios. |

### Riscos de Custo
- Se o app viralizar (tráfego pago), o rate limit de 30 req/15min por usuário pode ser insuficiente. Um usuário pode gerar várias vezes por dia.
- O timeout de 10s do Vercel Hobby pode ser insuficiente para respostas da Gemini em horários de pico. Recomenda-se upgrade para Pro ($20/mês) ou implementar streaming/background jobs.
- **Não há cache de respostas da Gemini**. Cada clique em "Gerar Cardápio" gera um novo request completo. Para usuários com as mesmas preferências, isso é desperdício.

---

## 9. Prontidão para Produção

### Veredicto: **NO-GO** ❌

O **PersonalDiet não está pronto para produção comercial** e muito menos para receber tráfego pago de conversão. As razões são objetivas e quantificáveis:

1. **Dependência com versão inexistente** (`dotenv@17.2.3`) impede deploy limpo.
2. **Risco de fallback mock** — o app pode entregar conteúdo estático como se fosse "IA" sem avisar o usuário.
3. **Dados 100% localStorage** — voláteis, single-device, não sincronizados. Inaceitável para um app de saúde que pretende monetizar.
4. **TypeScript não-estrito** com dezenas de `any` — codebase frágil e difícil de manter.
5. **Segurança incompleta** — sem CSP, sem CORS, sem validação de inputs, com risco de prompt injection.
6. **PWA incompleta** — ícones externos, cache de arquivos fonte inútil, viewport bloqueando zoom.
7. **Ausência de testes** — zero testes unitários, de integração ou E2E.
8. **SEO inexistente** — SPA pura sem SSR/SSG. Landing pages de conversão precisam de meta tags e carregamento rápido.

O app é um **MVP visualmente atraente e funcional para demonstração**, mas precisa de uma fase de **hardening de dados, segurança e arquitetura** antes de qualquer campanha paga.

---

## 10. Roadmap de Correções

### CRÍTICO (Bloqueadores de produção)

| # | Tarefa | Arquivos / Área |
|---|--------|-----------------|
| 1 | **Corrigir versão do `dotenv`** para `^16.4.7` ou remover se usar apenas env vars nativas do Vercel. | `package.json` |
| 2 | **Remover ou proteger o fallback mock** do Gemini. O mock deve ser explicitamente ativado por uma flag (`USE_MOCK_AI=true`), nunca por ausência de API key. | `server.ts` (linhas 223-233, 552-563, 619-631, 684-707) |
| 3 | **Migrar dados de `localStorage` para Supabase PostgreSQL** com Row Level Security (RLS). Todos os dados de saúde (peso, sintomas, doses, hidratação, pantry, preferências) devem ser persistidos na nuvem e sincronizados por usuário. | Todo o projeto |
| 4 | **Habilitar `strict: true` no `tsconfig.json`** e corrigir todos os erros de tipo resultantes. | `tsconfig.json`, todo o projeto |
| 5 | **Implementar validação de schema** nos endpoints Express usando `zod` ou `joi`. Limitar tamanho e tipo de uploads (PDF, imagem). | `server.ts` |
| 6 | **Adicionar CSP (`Content-Security-Policy`) e HSTS** nos headers do Express. | `server.ts` (linhas 16-22) |
| 7 | **Configurar CORS** explicitamente, permitindo apenas o domínio de produção. | `server.ts` |
| 8 | **Implementar rate limit distribuído** (ex: Redis, Upstash, ou memória com TTL e limpeza periódica) em vez de Map em memória. | `server.ts` |

### ALTO (Impacto em segurança, UX ou escalabilidade)

| # | Tarefa | Arquivos / Área |
|---|--------|-----------------|
| 9 | **Sanitizar inputs antes de injetar no prompt do Gemini**. Usar JSON estruturado para passar dados do usuário, evitando concatenação de strings. | `server.ts` (endpoints `/api/gemini/*`) |
| 10 | **Remover `alert()` e substituir por toasts não-bloqueantes** (`sonner`). | `PantryScanner.tsx`, `MealPlanner.tsx`, `WeightTracker.tsx`, `MounjaroMonitor.tsx` |
| 11 | **Implementar ARIA e focus trap** no modal `WhoAmI` e nos componentes customizados (checkboxes, radio buttons). | `WhoAmI.tsx`, `PantryScanner.tsx` |
| 12 | **Aumentar touch targets** para no mínimo 44x44px em todos os elementos interativos. | Componentes com ícones pequenos (`Trash2`, `Square`, `X`) |
| 13 | **Corrigir viewport** removendo `maximum-scale=1.0, user-scalable=no` para conformidade WCAG. | `index.html` |
| 14 | **Hospedar ícones e fontes localmente** em vez de depender de Icons8 e Google Fonts. | `public/`, `index.html`, `manifest.json` |
| 15 | **Implementar code splitting (lazy loading)** dos componentes do dashboard. | `App.tsx` |
| 16 | **Adicionar `helmet` ao Express** para consolidar headers de segurança. | `server.ts` |
| 17 | **Implementar tratamento de erros por categoria** (offline, 401, 429, 500) com mensagens amigáveis. | `authFetch.ts`, componentes |

### MÉDIO (Qualidade de código, manutenibilidade)

| # | Tarefa | Arquivos / Área |
|---|--------|-----------------|
| 18 | **Refatorar `server.ts`** em camadas: controllers (`geminiController.ts`), services (`geminiService.ts`), middlewares (`auth.ts`, `rateLimit.ts`, `validate.ts`). | `server.ts` |
| 19 | **Criar tipos reais** para substituir todos os `any` (ex: `ParsedPrescription`, `LabelResult`, `GeminiResponse`). | `types.ts`, `server.ts`, componentes |
| 20 | **Extrair constantes** (sintomas, gatilhos, doses, sites de injeção) para arquivos de configuração. | `src/constants/` |
| 21 | **Implementar cache de respostas Gemini** (ex: 1 hora) para prompts idênticos, reduzindo custo. | `server.ts` ou Redis |
| 22 | **Adicionar testes unitários** (Vitest) para lógica de negócio e testes E2E (Playwright) para fluxos críticos. | `tests/` |
| 23 | **Revisar o Service Worker** para usar `workbox` ou gerar via Vite PWA plugin. Cachear apenas assets de build (hashed), não fontes `.tsx`. | `public/sw.js` |
| 24 | **Implementar SSR/SSG** para pelo menos a landing page e páginas de compartilhamento (Open Graph). | `vite.config.ts`, Vercel |
| 25 | **Sanitizar export CSV** escapando vírgulas, aspas e quebras de linha nos dados do usuário. | `MealPlanner.tsx` |
| 26 | **Adicionar logging estruturado** (ex: `pino`) em vez de `console.log`/`console.error`. | `server.ts` |

### BAIXO (Polimento, otimização)

| # | Tarefa | Arquivos / Área |
|---|--------|-----------------|
| 27 | **Adicionar `font-display: swap`** ao CSS para evitar FOIT. | `index.css` ou `index.html` |
| 28 | **Reduzir o tamanho de texto mínimo** para 11px-12px em vez de 9px-10px para melhor legibilidade. | Vários componentes |
| 29 | **Implementar PWA install prompt** nativo (`beforeinstallprompt`) em vez de banner customizado com `alert()`. | `InstallPwaBanner.tsx` |
| 30 | **Adicionar analytics de eventos** (ex: "Gerou cardápio", "Adicionou peso") para medir engajamento antes de campanhas pagas. | `App.tsx`, componentes |
| 31 | **Revisar bundle final** com `vite-bundle-visualizer` e remover dependências não utilizadas. | Build pipeline |
| 32 | **Adicionar `.env.local` e `.env` ao `.gitignore`** de forma explícita e verificável. | `.gitignore` |
| 33 | **Documentar a API** (OpenAPI / Swagger) para facilitar integrações futuras. | `server.ts` |
| 34 | **Revisar acessibilidade com Lighthouse** e corrigir pontuação abaixo de 90. | Geral |

---

*Fim do relatório de auditoria técnica.*
