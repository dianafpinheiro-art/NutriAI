# Relatorio de Refactoring - Estagio 3: Separacao em Camadas

## Resumo Executivo

O monolito `server.ts` de 983 linhas foi refatorado em uma arquitetura de camadas organizada, separando responsabilidades em controllers, services, middlewares e utilitarios. O entry point `server.ts` foi reduzido para 71 linhas, mantendo toda a seguranca, contratos de API e funcionalidade originais.

## Estrutura de Pastas Criada

```
src/server/
  middlewares/
    auth.ts
    rateLimit.ts
    validate.ts
  controllers/
    geminiController.ts
  services/
    geminiService.ts
    logger.ts
  utils/
    schemas.ts
    helpers.ts
    supabase.ts
```

## Arquivos Criados e Responsabilidades

### 1. `src/server/utils/schemas.ts`
- Define os 4 Zod schemas para validacao dos endpoints: `GenerateMenuSchema`, `ParsePrescriptionSchema`, `AnalyzePantryImageSchema`, `AnalyzeLabelsSchema`.
- Exporta tambem os tipos TypeScript inferidos (`GenerateMenuInput`, etc.).

### 2. `src/server/utils/helpers.ts`
- `validateBase64Size`: valida se base64 excede 5MB.
- `sanitizeString`: trunca strings e escapa backticks (substitui por apostrofo).
- `parseCleanJson`: remove markdown fences de respostas do Gemini e faz parse seguro.

### 3. `src/server/utils/supabase.ts`
- Inicializa o cliente Supabase com configuracoes de autenticacao.
- Le as variaveis de ambiente `SUPABASE_URL` / `VITE_SUPABASE_URL` e `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`.

### 4. `src/server/services/logger.ts`
- Exporta a funcao `logger` com timestamp e nivel (info/warn/error), preservando o formato original.

### 5. `src/server/services/geminiService.ts`
- Contem toda a logica de negocio relacionada ao Gemini:
  - `getGeminiClient()`: lazy init do `GoogleGenAI`.
  - `buildPrompt()`: constroi prompts com sanitizacao (JSON.stringify em blocos delimitados, strings limitadas a 500 chars, backticks escapados).
  - `generateMenu()`, `parsePrescription()`, `analyzePantryImage()`, `analyzeLabels()`: orquestram chamadas ao Gemini.
  - `getHealthCompliantFallback()`: fallback mock ativado por `USE_MOCK_AI=true`.
  - `analyzeLabelsFallback()`: logica de fallback local para analise de rotulos.
- **Cache de Gemini**: implementado com `Map` usando chave SHA-256 do prompt, TTL de 1 hora, limite de 100 entradas com evicao LRU (remove a entrada mais antiga do Map).

### 6. `src/server/middlewares/auth.ts`
- `requireSupabaseSession`: valida o header `Authorization: Bearer <token>`, verifica a sessao no Supabase e injeta `authUserId` em `res.locals`.

### 7. `src/server/middlewares/rateLimit.ts`
- `rateLimitGemini`: limita cada usuario a 30 requisicoes por janela de 15 minutos. Usa `Map` para armazenar contadores. Limpeza periodica a cada 100 requisicoes globais.

### 8. `src/server/middlewares/validate.ts`
- `validateBody(schema)`: retorna um middleware Express que valida `req.body` com Zod. Se falhar, retorna 400 com detalhes. Se passar, anexa `validatedBody` ao `req`.

### 9. `src/server/controllers/geminiController.ts`
- Exporta um `Router` do Express com 4 rotas:
  - `POST /generate-menu`
  - `POST /parse-prescription`
  - `POST /analyze-pantry-image`
  - `POST /analyze-labels`
- Cada handler chama o service correspondente, valida tamanho de base64 quando aplicavel, trata erros e retorna JSON.
- Sem logica de negocio — apenas orquestracao HTTP.

## Entry Point Refatorado: `server.ts`

- **71 linhas** (reducao de 983 para 71).
- Responsabilidades: configurar Express, middlewares globais (helmet, CORS, headers de seguranca), montar rotas, iniciar Vite dev server ou static production serve, e `listen` na porta 3000.
- Todas as rotas `/api/gemini` passam por `requireSupabaseSession` + `rateLimitGemini` antes do `geminiRouter`.

## Preservacao de Seguranca

- Helmet com CSP, HSTS.
- CORS com origin configuravel.
- Headers customizados: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Rate limit por usuario (30 req / 15 min).
- Validacao de sessao Supabase antes de acessar endpoints Gemini.
- Sanitizacao de strings de usuario (escape de backticks, truncamento).
- Validacao de tamanho de base64 (5MB max).

## Sanitizacao de Prompts

- Dados de usuario empacotados em `JSON.stringify` dentro de blocos delimitados por ` ```json `.
- Cada string de input truncada a 500 caracteres.
- Backticks (`) substituidos por apostrofos (') para evitar prompt injection via delimitadores de markdown.
- Nenhuma concatenacao direta de dados crus do usuario no prompt.

## Cache de Gemini

- Chave: `crypto.createHash('sha256').update(prompt).digest('hex')`.
- Valor: `{ data, expiresAt }`.
- TTL: 1 hora (3.600.000 ms).
- Limite: 100 entradas. Ao atingir o limite, remove a entrada mais antiga (primeira do `Map`, insertion order).
- Cache e consultado antes de cada chamada real ao Gemini; se hit, retorna imediatamente.

## TypeScript Strict

- Zero `any` nos novos arquivos. Todos os tipos sao explicitamente definidos ou inferidos via Zod.
- Cast `as unknown` usado apenas para compatibilidade com a SDK do Google GenAI (`responseSchema`), evitando `any`.
- Todas as funcoes assincronas tipam `Promise<void>` ou `Promise<unknown>` conforme o caso.
- Tratamento de erros com `err instanceof Error` seguido de `String(err)`.

## Teste de Compilacao

Execute `npm run lint` (alias para `tsc --noEmit`) para verificar que todos os arquivos passam sem erros.

## Contrato de API

Todos os request/response bodies permanecem identicos aos do `server.ts` original. Nenhuma alteracao no frontend e necessaria.

## Conclusao

O codigo esta agora organizado em camadas bem definidas, facilitando manutencao, testes e futura evolucao. A dona pode prosseguir com a venda do app com um backend limpo e profissional.
