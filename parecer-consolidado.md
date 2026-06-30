# Parecer Consolidado — PersonalDiet: Auditoria Técnica + Viabilidade de Tráfego Pago

**Data:** julho de 2026
**Versão auditada:** v3.0.0-pwa
**Elaborado por:** Kimi (Orquestradora) + Time de Especialistas

---

## Veredito Final em Uma Frase

> **O app NÃO está pronto para produção comercial e MUITO MENOS para tráfego pago.** Ele é um MVP visualmente atraente, mas precisa de hardening técnico, monetização e retenção antes de qualquer investimento em anúncios. A janela de oportunidade no mercado é real — mas a janela se fecha se o produto não estiver pronto para receber os usuários.

---

## 1. Resumo da Auditoria Técnica (NO-GO)

| Área | Status | Principais Problemas |
|------|--------|---------------------|
| **Arquitetura** | ⚠️ MVP | Stack moderna (React 19 + Vite + Gemini + Supabase), mas sem separação de camadas. SPA pura sem SSR prejudica SEO para tráfego pago. |
| **Segurança** | ❌ **CRÍTICO** | Sem CSP, sem CORS, sem validação de inputs, risco de **fallback mock acidental** em produção, **prompt injection** possível via dados do usuário, e **memory leak** no rate limit em memória. |
| **Performance** | ⚠️ Fraco | Sem lazy loading/code splitting. Bundle monolítico. PWA com ícones externos (Icons8) e cache de arquivos fonte inútil. |
| **UX/Acessibilidade** | ❌ **PROBLEMAS** | Viewport bloqueia zoom (proibido WCAG). Touch targets pequenos. Zero ARIA. `alert()` usado em vez de toasts. |
| **Bugs/Código** | ❌ **CRÍTICO** | `tsconfig.json` sem `strict: true`. Dezenas de `any`. TypeScript inútil na prática. Dados 100% em `localStorage` (sem persistência na nuvem). |
| **Dependências** | ❌ **CRÍTICO** | `dotenv@17.2.3` **não existe no npm** — impede deploy limpo. Tailwind v4 ainda é early-release. |
| **Custo** | ✅ Baixo | ~$0-30/mês para começar, mas Vercel Hobby tem timeout de 10s que pode estourar com Gemini. |
| **Produção** | ❌ **NO-GO** | O app é um MVP visualmente atraente, mas não está pronto para vender ou receber tráfego pago. |

### Top 5 Bloqueadores Técnicos (Resolver antes de TUDO)
1. **`dotenv` com versão inexistente** no `package.json` — impede `npm install` limpo
2. **Fallback mock do Gemini** pode ser acionado acidentalmente — usuários pagantes recebem receitas fake
3. **Todos os dados de saúde ficam em `localStorage`** — single-device, volátil, inaceitável para app pago
4. **TypeScript em modo não-estrito** (`strict: false`) — codebase frágil
5. **Segurança incompleta** — sem CSP, sem CORS, sem validação de inputs, prompt injection possível

---

## 2. Resumo da Viabilidade de Tráfego Pago (NO-GO com Ressalvas)

| Critério | Status | O que Falta |
|----------|--------|-------------|
| **Monetização** | ❌ **CRÍTICO** | Zero sistema de pagamento. Sem receita, tráfego pago = queimar dinheiro. |
| **Gateway de Pagamento** | ❌ **CRÍTICO** | Precisa de Mercado Pago, Stripe ou Pagar.me com assinatura recorrente. |
| **Trial/Paywall** | ❌ **CRÍTICO** | Sem trial de 7 dias, sem gate de conversão. Funil de ads não gera receita. |
| **Onboarding Otimizado** | ⚠️ **PARCIAL** | Auth Supabase padrão não é onboarding. Precisa de fluxo de valor em < 2 minutos. |
| **Gameficação** | ❌ **IMPORTANTE** | Sem retenção, o CAC não se paga. Apps de saúde têm churn catastrófico sem engajamento. |
| **Landing Page** | ❌ **IMPORTANTE** | Precisa de página de destino profissional, rápida, com prova social e disclaimers. |
| **Pixel / Tracking** | ⚠️ **PARCIAL** | Pixel Meta, GA4, eventos de conversão (install, trial, purchase) precisam estar configurados. |
| **Compliance Legal** | ⚠️ **PARCIAL** | LGPD, disclaimers médicos, termos de uso, DPO nomeado — obrigatório para dados de saúde. |
| **Conta de Anúncios** | ⚠️ **PARCIAL** | Conta nova em nicho de saúde = maior escrutínio. Precisa de verificação, domínio, warm-up. |

### A Matemática do Tráfego Pago (Cenário Realista)

| Métrica | Valor |
|---------|-------|
| Ticket médio mensal | R$ 19,90 |
| % que escolhe anual | 50% |
| Ticket médio ponderado | R$ 198/ano |
| Margem bruta | 75% |
| Churn mensal de assinantes | 8% |
| **LTV** | **R$ 247** |
| **CAC (Meta Ads)** | **R$ 350** |
| **LTV / CAC** | **0,7x** ❌ |

> **Conclusão:** Para cada R$ 1,00 investido em anúncios, você recupera R$ 0,70 em receita vitalícia. A operação **queima caixa**.

### O que precisa acontecer para fechar a conta?

| Alavanca | Ação | Impacto |
|----------|------|---------|
| **Reduzir CAC** | Melhorar landing page (conversão 12% → 18%), otimizar criativos, usar lookalike audiences | CAC de R$ 350 → R$ 200 |
| **Aumentar LTV** | Reduzir churn (8% → 5% mensal) via gameficação + comunidade | LTV de R$ 247 → R$ 400 |
| **Combinado** | CAC R$ 200 + LTV R$ 400 | **LTV/CAC = 2,0x** — ainda abaixo do ideal, mas palpável |
| **Alavanca final** | Orgânico + indicação viral (gameficação) reduzindo CAC médio para R$ 120 | **LTV/CAC = 3,3x** ✅ |

---

## 3. O Mercado é Bom (A Oportunidade é Real)

- O mercado de agonistas GLP-1 (Ozempic, Mounjaro) movimentou **R$ 10 bilhões no Brasil em 2025**.
- Os concorrentes são genéricos globais (MyFitnessPal, Lifesum) que **não entendem o contexto brasileiro** (feijoada, açaí, pão de queijo, prescrição médica de GLP-1).
- Os softwares nacionais (Dietbox, Nutrium) são **B2B** — o paciente não compra o app, o nutricionista compra.
- **Janela de oportunidade:** "O único app de nutrição clínica inteligente feito para quem usa GLP-1 e tem restrições alimentares no Brasil."

---

## 4. Riscos Legais para Tráfego Pago (Alto)

| Risco | Nível | Mitigação |
|-------|-------|-----------|
| **Meta reprovar anúncios** | **ALTO** | Não use "Ozempic", "Mounjaro", "semaglutida" no texto do anúncio. Use eufemismos: "caneta para controle de peso", "tratamento médico para obesidade". |
| **ANVISA** | **ALTO** | Ozempic e Mounjaro são medicamentos de prescrição. O app **não pode anunciar o remédio**, nem vender, nem fazer claims sobre eficácia. |
| **CONAR** | **MÉDIO** | Proíbe publicidade enganosa. Não prometa "perda de peso rápida" sem comprovação. |
| **LGPD / ANPD** | **ALTO** | Dados de saúde (peso, sintomas, medicamentos) são **dados sensíveis**. Precisa de consentimento explícito, política de privacidade robusta, DPO nomeado. |
| **CDC** | **MÉDIO** | Se o app prometer algo que não entrega (ex: "diagnóstico automático de alergia"), é passível de ação civil e multa do Procon. |
| **Marco Legal de IA** | **MÉDIO** | Conteúdo gerado por IA precisa ser identificado. A IA do app não pode fazer "diagnóstico". |

---

## 5. Roadmap Consolidado: O Que Fazer nos Próximos 90 Dias

### **Dias 1–30: Hardening Técnico + Fundação de Negócio (NO-GO para tráfego)**

| # | Ação | Prioridade | Área |
|---|------|------------|------|
| 1 | Corrigir `dotenv` para versão real (`^16.4.7`) ou remover | 🔴 Crítico | Técnico |
| 2 | Proteger/remover fallback mock do Gemini (flag explícita, nunca por ausência de API key) | 🔴 Crítico | Técnico |
| 3 | Migrar dados de `localStorage` para Supabase PostgreSQL com Row Level Security (RLS) | 🔴 Crítico | Técnico |
| 4 | Habilitar `strict: true` no `tsconfig.json` e corrigir todos os `any` | 🔴 Crítico | Técnico |
| 5 | Implementar validação de schema nos endpoints (Zod ou Joi) | 🔴 Crítico | Técnico |
| 6 | Adicionar CSP, CORS, HSTS, Helmet ao Express | 🔴 Crítico | Técnico |
| 7 | Implementar gateway de pagamento (Mercado Pago ou Stripe) com assinatura recorrente | 🔴 Crítico | Negócio |
| 8 | Definir planos Free vs. Premium e implementar paywall/trial de 7 dias | 🔴 Crítico | Negócio |
| 9 | Reescrever onboarding para mostrar valor em < 2 minutos (perguntas → cardápio de amostra → cadastro) | 🔴 Crítico | Negócio |
| 10 | Criar landing page (1 página, mobile-first, hero, demo, preço, FAQ, disclaimers) | 🟡 Importante | Negócio |
| 11 | Configurar pixel Meta + GA4 com eventos de conversão | 🟡 Importante | Negócio |
| 12 | Redigir Termos de Uso + Política de Privacidade (compliance LGPD) | 🟡 Importante | Legal |
| 13 | Testar com 20 usuários beta (amigos, familiares, grupos de GLP-1 no Facebook) | 🟡 Importante | Negócio |
| 14 | Remover `alert()`, usar toasts não-bloqueantes; corrigir ARIA e touch targets | 🟡 Importante | Técnico |

> **Investimento mês 1:** R$ 0 em tráfego pago. R$ 0–500 em ferramentas (domínio, hosting, gateway). Tempo: 40–60h de desenvolvimento.

### **Dias 31–60: Engajamento & Retenção (Ainda NO-GO para escala)**

| # | Ação | Prioridade | Área |
|---|------|------------|------|
| 1 | Implementar gameficação v1: Streaks, NutriPoints, 10 badges, 3 níveis | 🔴 Crítico | Produto |
| 2 | Implementar push notifications contextualizados | 🔴 Crítico | Produto |
| 3 | Lançar desafio semanal (ex: "7 dias de proteína em todas as refeições") | 🟡 Importante | Produto |
| 4 | Criar 3 vídeos de demo para futuros anúncios | 🟡 Importante | Marketing |
| 5 | Iniciar 1 canal orgânico (TikTok ou Instagram Reels): 3 posts/semana | 🟡 Importante | Marketing |
| 6 | Testar preço com beta users: R$ 19,90/mês vs. R$ 149,90/ano | 🟡 Importante | Negócio |
| 7 | Implementar sistema de indicação ("Indique uma amiga e ganhe 1 mês grátis") | 🟡 Importante | Produto |
| 8 | Refatorar `server.ts` em camadas (controllers, services, middlewares) | 🟢 Preparatório | Técnico |
| 9 | Implementar rate limit distribuído (Redis/Upstash) | 🟢 Preparatório | Técnico |

> **Investimento mês 2:** R$ 0–300 em tráfego (teste de R$ 10/dia no Meta para validar criativo, se quiser). Tempo: 30–40h.

### **Dias 61–90: Validação & Pré-Escala (Transição para GO)**

| # | Ação | Prioridade | Área |
|---|------|------------|------|
| 1 | Analisar métricas de retenção: day-1, day-7, day-30. Meta: day-7 > 15%, day-30 > 8% | 🔴 Crítico | Produto |
| 2 | Medir LTV real: ticket médio, churn mensal, receita dos 50 primeiros pagantes | 🔴 Crítico | Negócio |
| 3 | Rodar teste de tráfego pago piloto: R$ 30–50/dia no Meta (R$ 900–1.500/mês) | 🔴 Crítico | Marketing |
| 4 | Medir CAC real: custo por install, custo por trial, custo por assinatura | 🔴 Crítico | Negócio |
| 5 | Se LTV/CAC > 1,5x: aumentar budget para R$ 2.000–3.000/mês | 🟡 Importante | Marketing |
| 6 | Se LTV/CAC < 1,0x: pausar tráfego, voltar para otimização de produto | 🟡 Importante | Negócio |
| 7 | Criar comunidade (grupo de WhatsApp ou Discord) para os 100 primeiros usuários pagantes | 🟡 Importante | Produto |
| 8 | Preparar campanha de Remarketing para quem instalou mas não assinou | 🟢 Preparatório | Marketing |

> **Investimento mês 3:** R$ 1.500–3.000 em tráfego pago (teste). Tempo: 20–30h.

---

## 6. Recomendação Final para Diana

> **Não gaste em tráfego pago agora.** Gaste tempo em tornar o app vendável primeiro. Depois, o tráfego pago é um acelerador — não um salvador.

### O que você tem hoje:
- Um **MVP bonito e funcional** que prova um conceito.
- Um **mercado em expansão** (GLP-1, celíacos, low-carb) com pouca concorrência B2C no Brasil.
- Uma **stack moderna** que, com hardening, pode escalar.

### O que você NÃO tem hoje:
- Um **produto vendável** (sem pagamento, sem trial, sem paywall).
- Um **produto confiável** (dados em localStorage, segurança fraca, código frágil).
- Um **funil de conversão** (sem landing page, sem onboarding de valor, sem tracking).
- **Proteção legal** (sem LGPD, sem disclaimers, sem termos de uso).

### Decisão:
Se você quer transformar o PersonalDiet em um **produto digital real** que gere renda, os próximos 90 dias precisam de foco intenso em:
1. **Hardening técnico** (dados na nuvem, segurança, código limpo)
2. **Monetização** (gateway, trial, planos Free/Premium)
3. **Retenção** (gameficação, push, comunidade)

Se o objetivo é um **projeto paralelo** para aprendizado, o caminho é:
- Canal orgânico (TikTok/Reels) sobre "o que comer com GLP-1"
- Testes de mercado com usuários beta
- Tráfego pago só depois de monetização + retenção validadas

---

## Documentos Detalhados

- [`auditoria-tecnica.md`](./auditoria-tecnica.md) — 400 linhas, 10 seções, 34 tarefas priorizadas
- [`viabilidade-trafego.md`](./viabilidade-trafego.md) — 462 linhas, análise de mercado, LTV/CAC, copy, gameficação, roadmap legal

---

*Parecer consolidado elaborado por Kimi (Orquestradora) e time de especialistas.*
