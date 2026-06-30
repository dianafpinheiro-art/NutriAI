# Relatório de Hardening — Estágio 1

**Data:** 2026-07-02
**Projeto:** PersonalDiet (NutriAI)
**Responsável:** Seguranca_Engineer
**Objetivo:** Deixar o app tecnicamente seguro e pronto para produção, mantendo a funcionalidade existente.

---

## 1. package.json

### Mudanças realizadas
- **`dotenv`**: corrigida versão inexistente `^17.2.3` → `^16.4.7` (última estável).
- **Adicionadas dependências de produção:**
  - `zod: ^3.24.0` — validação de schema nos endpoints POST.
  - `helmet: ^8.0.0` — headers de segurança HTTP.
  - `cors: ^2.8.5` — controle de CORS.
- **Adicionadas dependências de desenvolvimento:**
  - `@types/cors: ^2.8.17` — tipos para CORS.
- **Tipos do React:**
  - `@types/react` e `@types/react-dom` instalados para compatibilidade com TS strict e React 19.
- Atualizado `package-lock.json` via `npm install`.

---

## 2. TypeScript strict (`tsconfig.json`)

### Mudanças realizadas
- Adicionados flags ao `compilerOptions`:
  - `"strict": true`
  - `"noImplicitAny": true`
  - `"strictNullChecks": true`
  - `"noUnusedLocals": true`
  - `"noUnusedParameters": true`
- Adicionado `"types": ["vite/client"]` para resolver tipos de `import.meta.env`.

### Correções nos arquivos críticos
- **`server.ts`**: todos os `catch (err: any)` convertidos para `catch (err: unknown)` com type guard (`err instanceof Error`). Removidas variáveis não utilizadas (`diet`, `filename`).
- **`src/App.tsx`**: `session` tipado como `Session | null` (do `@supabase/supabase-js`); casts `as any` nos `<select>` convertidos para `as ClinicalTreatment` e `as DietType`; callbacks de erro tipados como `unknown`.
- **`src/components/Auth.tsx`**: props `onSession` e `locale` tipadas corretamente (`Session | null`, `Locale`); `catch` com type guard.
- **`src/components/PantryScanner.tsx`**: removidos `any` das props (`dietType`, `clinicalRestrictions`, `clinicalTreatment` tipados corretamente); `parsedPrescription` e `labelResult` tipados como `Record<string, unknown>`; mapeamentos de array com tipos explícitos.
- **`src/components/MealPlanner.tsx`**: variáveis `day`, `meal`, `ing` tipadas como `DayMealPlan`, `Meal`, `{ name: string; quantity: string }`; logs CSV com casts seguros para `Record<string, unknown>`.
- **`src/components/MounjaroMonitor.tsx`**: cast `as any` removido; uso de `as DoseLog['injectionSite']`.
- **`src/components/SymptomTracker.tsx`**: `catch` tipado como `unknown`.
- **`src/components/WhoAmI.tsx`, `HydrationTracker.tsx`, `InstallPwaBanner.tsx`**: removidos imports e variáveis não utilizadas.

---

## 3. Segurança no `server.ts`

### Middlewares adicionados
- **`helmet()`**: ativado com configuração customizada de `Content-Security-Policy`:
  - `defaultSrc: ["'self'"]`
  - `scriptSrc`, `styleSrc`, `fontSrc`, `imgSrc`, `connectSrc` configurados com domínios necessários (incluindo `fonts.googleapis.com`, `images.unsplash.com`, Supabase).
- **`HSTS`**: via helmet, `maxAge: 31536000`, `includeSubDomains: true`, `preload: true`.
- **`cors()`**: origin configurado via `process.env.ALLOWED_ORIGIN || "*"`, com `credentials: true`.
- Headers de segurança manuais preservados: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- `express.json({ limit: "15mb" })` mantido.
- `app.disable("x-powered-by")` preservado.

### Rate limiting com TTL
- Substituído o `Map` em memória sem limpeza por um Map com TTL (`{ count, resetAt }`).
- Adicionada limpeza periódica: a cada 100 requests, entradas expiradas (`resetAt <= Date.now()`) são removidas do Map.
- Limite mantido: 30 requests por janela de 15 minutos.

### Proteção do fallback mock
- **Regra anterior**: mock ativado quando `!apiKey` ou `apiKey.startsWith("MY_")`.
- **Regra nova**: mock só é ativado se `USE_MOCK_AI=true` estiver explicitamente configurado.
- Se `GEMINI_API_KEY` não estiver setada e `USE_MOCK_AI` não for `true`, retorna **HTTP 500** com mensagem clara: `"Servico de IA nao configurado."`.
- Isso evita que o app rode em modo mock acidentalmente em produção.

### Validação de schema (Zod)
Criados schemas e aplicados via `validateBody()`:
- **`/api/gemini/generate-menu`**: valida `preferences`, `pantry`, `actionType`, `locale`, `languageInstruction`.
- **`/api/gemini/parse-prescription`**: valida `filename` (max 255 chars) e `fileContent`.
- **`/api/gemini/analyze-pantry-image`**: valida `image`.
- **`/api/gemini/analyze-labels`**: valida `labelText` (max 10000 chars) e `restrictionType` (enum `celiac` | `lactose`).

### Limite de tamanho de payload base64
- Implementado `validateBase64Size(base64)` usando `Buffer.from`.
- Limite: **5MB decodificado** (`5 * 1024 * 1024`).
- Rejeição com **HTTP 400** se exceder.

### Sanitização de inputs
- Criada função `sanitizeString(input, maxLength)`:
  - Limita string ao `maxLength`.
  - Escapa backticks (`` ` `` → `'` ) para evitar prompt injection.
- Dados do usuário não são mais concatenados diretamente no prompt. Estruturados via `JSON.stringify(userData)` e passados como contexto no prompt.
- `systemInstruction` do Gemini mantido como texto fixo, sem interpolação de dados do usuário.

### Logger simples
- Substituídos todos os `console.log`/`console.error`/`console.warn` por `logger(level, message, meta?)`.
- Formato estruturado: `[ISO timestamp] [LEVEL] message {"key":"value"}`.
- Preservada a simplicidade (não foi adicionado Pino/Winston para não aumentar bundle).

---

## 4. Correção de `.gitignore`

Alterado de `.env*` (padrão genérico) para entradas explícitas:
```
.env
.env.local
.env.*
!.env.example
```

Isso garante que nenhum arquivo de ambiente sensível seja commitado acidentalmente.

---

## 5. Teste de qualidade

- Comando `npm run lint` (=`tsc --noEmit`) executado ao final.
- **Resultado: 0 erros de TypeScript.**
- O app continua em pt-BR.
- O contrato de request/response dos endpoints foi preservado.

---

## 6. Observações para próximos estágios

- **Deploy no Vercel**: garantir que a variável `USE_MOCK_AI` não esteja setada em produção, e que `GEMINI_API_KEY` esteja configurada nos secrets.
- **CSP**: se novos domínios de imagem/fonte forem adicionados no front-end, lembrar de atualizar a diretiva `connectSrc`/`imgSrc` no `helmet()` do `server.ts`.
- **Rate limit**: o atual é em memória (funciona para single instance). Se escalar para múltiplas instâncias, considerar Redis ou store distribuído.
- **Zod**: os schemas usam `.passthrough()` no `preferences` para manter flexibilidade; se o formato de preferências mudar, revisar o schema.

---

**Status:** ✅ Concluído sem erros.
