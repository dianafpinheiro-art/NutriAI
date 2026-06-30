# Plano de Execução: Deixar o PersonalDiet Redondinho

## Objetivo
Corrigir todos os problemas técnicos críticos e altos identificados na auditoria para tornar o app pronto para produção comercial.

## Estágio 1: Hardening Técnico Fundacional (pode rodar em paralelo)
**Skill:** Nenhuma skill específica — orientação customizada do Orchestrator.
**Sub-agentes:**
- **Seguranca_Engineer** (coder): Fixar dependências, TypeScript strict, headers de segurança, CORS, CSP, Helmet, rate limit distribuído, corrigir dotenv, proteger fallback mock
- **Types_Typescript** (coder): Habilitar `strict: true`, criar tipos reais para substituir `any`, tipar `server.ts`, `types.ts`, componentes

**Entregas:**
- `package.json` corrigido (dotenv, deps)
- `tsconfig.json` com `strict: true` e codebase tipado
- `server.ts` com segurança reforçada (CSP, CORS, Helmet, rate limit com TTL)
- Fallback mock protegido por flag explícita
- Schema validation com Zod nos endpoints

## Estágio 2: Migração de Dados para Supabase (depende do Estágio 1)
**Sub-agente:**
- **Database_Engineer** (coder): Criar esquema PostgreSQL no Supabase, tabelas com RLS, políticas de segurança, migrar hooks de localStorage para Supabase client

**Tabelas necessárias:**
- `user_profiles` (preferências, nome, meta de água, dieta, tratamento, restrições, lembretes)
- `hydration_logs` (registros de hidratação por usuário/data)
- `symptom_logs` (sintomas, intensidade, gatilhos)
- `weight_logs` (peso, altura, meta)
- `dose_logs` (injeções de GLP-1)
- `pantry_items` (ingredientes da despensa)
- `meal_plans` (cardápios gerados)
- `shopping_lists` (listas de compras)
- `user_preferences` (preferências gerais)

**RLS:** Cada tabela com `auth.uid() = user_id`, policies SELECT/INSERT/UPDATE/DELETE

**Entregas:**
- SQL de criação das tabelas + RLS
- Hooks de dados (`useData.ts`) para substituir localStorage
- Migration do `localStorage` para Supabase no primeiro login

## Estágio 3: Refatoração do Backend (depende do Estágio 1)
**Sub-agente:**
- **Backend_Refactor** (coder): Separar `server.ts` em camadas: controllers, services, middlewares. Implementar validação Zod, cache de Gemini, logging estruturado, sanitização de prompts.

**Entregas:**
- `src/server/` com `controllers/geminiController.ts`, `services/geminiService.ts`, `middlewares/auth.ts`, `middlewares/rateLimit.ts`, `middlewares/validate.ts`
- Cache de respostas Gemini (TTL 1h)
- Sanitização de inputs antes de injetar no prompt
- Logging com `pino` (opcional, se não complicar)

## Estágio 4: Refatoração do Frontend (depende do Estágio 2)
**Sub-agente:**
- **Frontend_Refactor** (coder): Substituir TODOS os `localStorage.getItem/setItem` por chamadas ao Supabase. Implementar `useQuery`/`useMutation` pattern. Corrigir UX: alert() → toasts, touch targets, ARIA, viewport, fontes, PWA ícones locais.

**Entregas:**
- Todos os componentes usando Supabase em vez de localStorage
- `alert()` substituídos por `sonner` toasts
- Touch targets >= 44x44px
- ARIA nos modais e checkboxes customizadas
- Viewport corrigido (remover `user-scalable=no`)
- Ícones e fontes hospedados localmente

## Estágio 5: QA e Integração Final (depende dos Estágios 3 e 4)
**Sub-agente:**
- **QA_Engineer** (coder): Verificar build, TypeScript sem erros, testar fluxo completo (login → onboarding → gerar cardápio → rastrear peso → sair → logar em outro dispositivo e ver dados persistidos). Verificar PWA, offline capability, Service Worker.

**Entregas:**
- `npm run build` sem erros
- `npm run lint` (tsc --noEmit) sem erros
- Teste manual de fluxo completo documentado
- Relatório de QA

## Regras de Sequência
- Estágios 1 e 2 podem começar em paralelo (um trabalha no backend, outro no DB schema)
- Estágio 3 depende do Estágio 1 (estrutura do backend precisa estar segura)
- Estágio 4 depende do Estágio 2 (hooks de dados precisam existir)
- Estágio 5 depende dos Estágios 3 e 4

## Notas
- Manter a funcionalidade existente — não adicionar features novas, só hardening
- Preservar o visual e UX existente onde não há bugs
- O app continua em pt-BR
- Todos os arquivos ficam em `C:\Users\diana\Downloads\NutriAI`
