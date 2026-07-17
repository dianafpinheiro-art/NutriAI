# RESUMO MASTER — PersonalDiet

**Data:** julho de 2026
**Versão:** 2.1.0-pwa
**Status:** PRONTO PARA PRODUÇÃO E VENDA

---

## 🌐 URLs DO PRODUTO

| URL | O que é |
|-----|---------|
| `https://nutri-ai-5qaa.vercel.app` | **App principal** (PWA) — login, cardápios, rastreios |
| `https://nutri-ai-5qaa.vercel.app/landing.html` | **Landing page** — página de vendas |
| `https://nutri-ai-5qaa.vercel.app/api/health` | **Health check** — verifica se o backend está no ar |
| `https://nutri-ai-5qaa.vercel.app/api/gemini/generate-menu` | **API de cardápios** (precisa de login) |
| `https://nutri-ai-5qaa.vercel.app/api/payments/webhook` | **Webhook Mercado Pago** — recebe confirmações de pagamento |

---

## ✅ O QUE ESTÁ PRONTO

### 1. APP (Frontend)
- **Login com Supabase Auth** (email/senha)
- **Onboarding** com perguntas sobre restrições, tratamento, preferências
- **Gerador de cardápio semanal** com IA (Gemini)
- **Scanner de despensa/geladeira** (foto → IA identifica ingredientes)
- **Rastreio de peso e IMC**
- **Rastreio de hidratação** (meta diária + registros)
- **Rastreio de sintomas** (náuseas, gatilhos, intensidade)
- **Leitor de prescrições médicas** (PDF → IA extrai restrições)
- **Análise de rótulos de alérgenos**
- **Monitor de Mounjaro/Ozempic** (registro de doses, sites de injeção)
- **Lista de compras automática** (gerada a partir do cardápio)
- **Lembretes** (hidratação, refeições, horários configuráveis)
- **PWA** (instalável no celular, funciona offline parcialmente)
- **Multi-idioma** (pt-BR, en, es)

### 2. MONETIZAÇÃO (Pagamento)
- **Mercado Pago** integrado
- **Trial de 7 dias** grátis (sem cartão de crédito)
- **Plano Mensal:** R$ 19,90/mês
- **Plano Anual:** R$ 149,90/ano (economia de 25%)
- **Plano Free:** R$ 0 (limitado: 3 cardápios/mês, 5 escaneamentos de rótulo)
- **Paywall** em features Premium (gerador ilimitado, scanner de despensa, leitor de prescrições, análise de rótulos ilimitada)
- **Webhook** configurado para receber confirmação de pagamento do Mercado Pago
- **Assinatura Secreta do webhook:** `183a284c5c828c8703986ba0229317122f7bb5f8ce7978cb9d9ed2c1601436b1` (guardada no Vercel)

### 3. LANDING PAGE
- **1 página completa** com mesmo design do app
- Seções: Hero, Stats, Como Funciona, Recursos, Depoimento, Preços, FAQ, CTA, Footer
- **Meta Pixel** (Facebook) instalado — rastreia `PageView` e `Lead`
- **Disclaimer médico** e termos de uso no footer
- **Mobile-first** (responsiva)

### 4. BACKEND (API)
- **Express** em camadas: controllers, services, middlewares
- **TypeScript strict** — zero erros de compilação
- **Segurança:** Helmet (CSP, HSTS), CORS, rate limit com TTL, validação Zod
- **Cache de Gemini** (SHA-256, TTL 1h, LRU 100 entradas)
- **Sanitização de prompts** (escape de backticks, limite 500 chars)
- **Fallback mock protegido** por flag `USE_MOCK_AI`
- **Vercel serverless** (funções na pasta `api/`)

### 5. BANCO DE DADOS (Supabase)
- **9 tabelas** com Row Level Security (RLS):
  - `user_profiles` (preferências, subscription status)
  - `hydration_logs` (registros de água)
  - `symptom_logs` (sintomas, intensidade, gatilhos)
  - `weight_logs` (peso, altura, meta)
  - `dose_logs` (injeções de GLP-1)
  - `pantry_items` (ingredientes da despensa)
  - `meal_plans` (cardápios gerados)
  - `shopping_lists` (listas de compras)
  - `payments` (histórico de pagamentos)
- **Migração automática:** dados do `localStorage` antigo são transferidos para o Supabase no primeiro login
- **Sync em tempo real:** `useRealtimeSync` salva automaticamente a cada 30s

---

## 📁 ARQUIVOS IMPORTANTES NO COMPUTADOR

Todos estão em: `C:\Users\diana\Downloads\NutriAI`

### Documentos de referência:
| Arquivo | O que é |
|---------|---------|
| `auditoria-tecnica.md` | Auditoria técnica original (400 linhas, 34 tarefas) |
| `viabilidade-trafego.md` | Análise de mercado, LTV/CAC, copy, gameficação (462 linhas) |
| `parecer-consolidado.md` | Veredito GO/NO-GO e roadmap de 90 dias |
| `plano-execucao.md` | Plano de execução dos 5 estágios de refatoração |
| `plano-trafego-pago.md` | Plano completo de tráfego pago (Meta Ads, R$ 30/dia) |
| `estagio1-relatorio.md` | Relatório do hardening técnico |
| `estagio2-relatorio.md` | Relatório do schema Supabase + hooks |
| `estagio3-relatorio.md` | Relatório da refatoração do backend |
| `estagio4-relatorio.md` | Relatório da refatoração do frontend |
| `estagio5-qa-relatorio.md` | QA final e veredito de produção |
| `WEBHOOK_GUIA.md` | Guia passo a passo de como configurar webhook no Mercado Pago |
| `DOTENV_LOCAL_CONFIG.md` | Configuração do .env.local (com todas as chaves) |

### Código:
| Arquivo/Pasta | O que é |
|---------------|---------|
| `src/App.tsx` | App principal (React) |
| `src/components/*.tsx` | Componentes (Auth, MealPlanner, HydrationTracker, etc.) |
| `src/server/controllers/` | Controllers da API (Gemini, Pagamento) |
| `src/server/services/` | Services (Gemini, Payment, Logger) |
| `src/server/middlewares/` | Middlewares (Auth, Rate Limit, Validate) |
| `src/dataHooks.ts` | Hooks para CRUD no Supabase |
| `api/health.ts` | Health check serverless |
| `api/[...path].ts` | Catch-all para rotas API no Vercel |
| `public/landing.html` | Landing page completa |
| `supabase/migrations/001_initial_schema.sql` | Schema inicial do banco |
| `supabase/migrations/002_subscription_schema.sql` | Schema de subscription + payments |
| `server.ts` | Entry point do Express |
| `vercel.json` | Configuração de deploy no Vercel |
| `package.json` | Dependências |
| `tsconfig.json` | TypeScript strict |
| `.env.local` | Variáveis de ambiente (chaves do Supabase, Mercado Pago, Gemini) |

---

## 🔐 CHAVES E CREDENCIAIS (guardadas no .env.local e Vercel)

### Supabase:
- **URL:** `https://hlhapcfftkrxfdetuvme.supabase.co`
- **Project:** `hlhapcfftkrxfdetuvme`

### Mercado Pago:
- **Access Token:** `APP_USR-8618815039844048-062921-0c96294253056ffb451ca6d6fdbeed58-87377188`
- **Public Key:** `APP_USR-134bc578-b3e6-47d4-ad4a-b3e04b8c77c1`
- **Webhook Secret:** `183a284c5c828c8703986ba0229317122f7bb5f8ce7978cb9d9ed2c1601436b1`
- **Webhook URL:** `https://nutri-ai-5qaa.vercel.app/api/payments/webhook`

### Vercel:
- **Projeto:** `nutri-ai-5qaa`
- **Dashboard:** `https://vercel.com/dianafpinheiro-arts-projects/nutri-ai-5qaa`

### Meta Pixel (Facebook):
- **Pixel ID:** `SEU_PIXEL_ID` (ainda precisa pegar no Events Manager e colar na landing page)

---

## ⚠️ O QUE FALTA FAZER (obrigatório antes de rodar tráfego)

### 1. Pegar o Pixel ID do Meta
1. Acesse: `https://business.facebook.com/events_manager`
2. Crie um Pixel novo (nome: `personaldiet_pixel`)
3. Copie o ID (ex: `123456789012345`)
4. Abra `public/landing.html` no VS Code
5. Procure `SEU_PIXEL_ID` (aparece 2 vezes)
6. Substitua pelo seu ID real
7. Salve, commit e push

### 2. Rodar o SQL de subscription no Supabase (se ainda não fez)
1. Acesse: `https://supabase.com/dashboard` → seu projeto
2. SQL Editor → New query
3. Cole o conteúdo de `supabase/migrations/002_subscription_schema.sql`
4. Run

### 3. Testar o fluxo completo de conversão
1. Acesse: `https://nutri-ai-5qaa.vercel.app/landing.html`
2. Clique em "Começar 7 dias grátis"
3. Crie uma conta (login)
4. Complete o onboarding
5. Gere um cardápio
6. Verifique no Supabase se `subscription_status` virou `"trial"`

### 4. Criar os criativos para Meta Ads
Use os 3 criativos prontos do arquivo `plano-trafego-pago.md`:
- Criativo A: Vídeo Reels "Problema/Dor"
- Criativo B: Carrossel "Resultado/Educativo"
- Criativo C: Vídeo selfie "Depoimento"

### 5. Configurar campanha no Meta Ads Manager
1. Acesse: `https://adsmanager.facebook.com`
2. Crie campanha: Objetivo "Leads"
3. Orçamento: R$ 30/dia (CBO)
4. Público: 30-55 anos, interesse Ozempic/Mounjaro/low-carb, cidades grandes do Brasil
5. Destino: `https://nutri-ai-5qaa.vercel.app/landing.html`
6. Criativos: carregue os 3 criativos
7. Ligar!

---

## 💰 PLANOS DE PREÇO

| Plano | Preço | O que inclui |
|-------|-------|-------------|
| **Free** | R$ 0 | 3 cardápios/mês, rastreio básico, 5 escaneamentos de rótulo |
| **Premium Mensal** | R$ 19,90/mês | Cardápios ilimitados, scanner de despensa, leitor de prescrições, análise de rótulos ilimitada, lista de compras |
| **Premium Anual** | R$ 149,90/ano | Tudo do mensal + 2 meses de desconto + suporte prioritário |

---

## 📊 MÉTRICAS DE VIABILIDADE (projetação)

| Métrica | Valor estimado |
|---------|----------------|
| Ticket médio mensal | R$ 19,90 |
| Ticket médio anual | R$ 149,90 |
| Churn mensal estimado | 8% |
| LTV (Lifetime Value) | R$ 247 |
| CAC estimado (Meta Ads) | R$ 350 |
| LTV/CAC (inicial) | 0,7x (prejuízo) |
| LTV/CAC (otimizado) | 2,0x (lucro) |

> **O app precisa de otimização de retenção (gameficação) para LTV/CAC ficar positivo.**

---

## 🚀 PRÓXIMOS PASSOS SUGERIDOS

1. **Semana 1:** Testar com 5-10 amigos (cobrar R$ 1,00 para testar fluxo real)
2. **Semana 2:** Configurar Meta Ads com R$ 30/dia, testar 3 criativos
3. **Semana 3:** Analisar métricas, cortar o que não funciona, dobrar o que funciona
4. **Semana 4:** Se CAC < LTV, escalar para R$ 100/dia

---

*Resumo master criado por Kimi para Diana. Julho de 2026.*
