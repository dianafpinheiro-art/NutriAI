# Plano de Auditoria + Viabilidade de Tráfego Pago — PersonalDiet

## Contexto
App PersonalDiet (PWA) desenvolvido por vibe coding. Cardápios clínicos inteligentes com IA (Gemini), scanner de despensa, rastreadores de saúde, monitor de Mounjaro/Ozempic, auth Supabase. Diana quer saber: (1) se o app está pronto para produção/venda; (2) se dá pra rodar tráfego pago gameficado para vendê-lo.

## Estágio 1 — Auditoria Técnica do App
**Objetivo:** Avaliar prontidão para produção: código, segurança, performance, UX, bugs, arquitetura, custos operacionais, compliance.
**Skill:** Nenhuma skill específica cobre auditoria técnica de vibe-coded apps — uso orientação customizada do Orchestrator.
**Sub-agente:** Auditor_Tecnico (coder)
- Ler todos os arquivos src/components/*, src/*.ts, server.ts, package.json, index.html, .env configs
- Verificar: vazamento de secrets, injeção de prompts, rate limits, fallback mock vs produção, segurança de auth, PWA config, responsividade, acessibilidade, custos de API Gemini, Supabase limits, erros de TypeScript/build
- Entregar: relatório técnico estruturado com severidade (CRÍTICO / ALTO / MÉDIO / BAIXO) e recomendações

## Estágio 2 — Viabilidade de Tráfego Pago Gameficado
**Objetivo:** Avaliar se o app é vendável via campanhas pagas (Meta Ads, Google Ads, TikTok Ads) com elemento gameficado; definir persona, precificação, funil, copy, landing page, métricas de viabilidade (LTV vs CAC).
**Skill:** `campaign-plan` (planejamento de campanha) + `copywriting` (copy de anúncios) + `pricing-strategy` (precificação)
**Sub-agentes:**
- Estrategista_Trafego (plan): Análise de mercado, persona, concorrência, viabilidade econômica, precificação, modelo de monetização, métricas (LTV, CAC, break-even)
- Copywriter_Ads (coder/plan): Ganchos gameficados, copy para anúncios (Meta, Google, TikTok), proposta de landing page, elementos de gameficação

## Estágio 3 — Integração
**Objetivo:** Consolidar auditoria + viabilidade em um documento final claro para Diana, com GO/NO-GO e roadmap de ações.
**Sub-agente:** Orchestrator (eu) integra e entrega.

## Regras
- Auditoria e tráfego são independentes → podem rodar em paralelo
- Não pule estágios sem validar o anterior
- Documento final deve ser em português, com tom direto e acionável
