# Viabilidade de Tráfego Pago para o PersonalDiet
## Relatório Estratégico — Estrategista_Trafego
### Data: julho de 2026 | Mercado: Brasil

---

## 1. Análise de Mercado & Persona

### TAM / SAM / SOM Estimado (Brasil)

| Métrica | Estimativa | Base de Cálculo |
|---------|-----------|----------------|
| **TAM** | ~20 milhões de pessoas | Brasileiros em uso de GLP-1 (projeção de 15M até 2030, Itaú BBA) + celíacos, intolerantes à lactose, adeptos de low-carb/keto/mediterrânea. |
| **SAM** | ~5 milhões | Brasileiros com smartphone, renda B/C, que já pagam ou pagariam por app de saúde/nutrição e possuem condição alimentar específica ou usam GLP-1. |
| **SOM (Ano 1)** | 5.000–15.000 usuários pagantes | Meta realista para um PWA solo, sem marca estabelecida, com investimento inicial de R$ 3.000–8.000/mês em tráfego. |
| **SOM (Ano 2)** | 25.000–50.000 usuários pagantes | Se o produto atingir PMF (product-market fit) e o funnel de retenção estiver otimizado. |

> **Contexto de mercado:** O mercado de agonistas GLP-1 movimentou aproximadamente **R$ 10 bilhões no Brasil em 2025** (4% do faturamento do varejo farmacêutico), com crescimento de 77% nas importações (XP/Itaú BBA). A Novo Nordisk faturou R$ 3,7 bilhões só com Ozempic no Brasil em 2025 (+52% vs. ano anterior). A Eli Lilly chegou a ~50% de market share com Mounjaro após seu lançamento em junho/2025. Isso significa: há um público enorme, **disposto a gastar alto com saúde**, que precisa de orientação nutricional complementar ao medicamento — e ainda não existe um app brasileiro de nutrição clínica **B2C** dominante nesse nicho.

### Persona Principal: "Maria, 42 anos, usuária de Ozempic"

- **Perfil demográfico:** Mulher, 35–55 anos, classe B/C, região Sudeste/Sul (onde a penetração de GLP-1 é maior).
- **Contexto:** Iniciou Ozempic ou Mounjaro nos últimos 3–6 meses via prescrição médica. Perdeu 5–10 kg, mas sente náuseas frequentes, não sabe o que comer, está comendo muito pouco ou muito proteína.
- **Dor real:** "O remédio me deixa sem fome, mas quando eu como errado passo mal. Não sei montar cardápio. Meu médico só receitou, não me ensinou a comer."
- **Job-to-be-done:** Não é "contar calorias". É **"saber o que comer hoje para não passar mal e continuar emagrecendo com saúde"** — com uma solução que entenda as restrições do GLP-1 (proteína prioritária, baixo volume gástrico, hidratação, evitar alimentos que piores náuseas).
- **Comportamento digital:** Ativa no Instagram, busca receitas no TikTok, usa Google para "o que comer com Ozempic", já tentou MyFitnessPal mas achou genérico demais, não se sentiu compreendida.
- **Disposição a pagar:** **Alta** — já gasta R$ 800–4.000/mês com a caneta. Um app de R$ 19,90/mês é marginal no orçamento de saúde dela.

### Persona Secundária: "Carlos, 28 anos, celíaco e fitness"
- **Dor:** Dificuldade de encontrar receitas sem glúten que cabem no macro de proteína. Medo de contaminação cruzada em restaurantes.
- **Job-to-be-done:** "Encontrar receitas seguras, escanear rótulos rapidamente e ter um cardápio semanal que eu confie."
- **Disposição a pagar:** Média-alta — nicho pequeno, mas fidelidade alta quando encontra solução que funciona.

---

## 2. Análise Competitiva

### Concorrentes Diretos (B2C — app para consumidor final)

| Concorrente | Modelo | Preço | Forças | Fraquezas | Onde o PersonalDiet ganha |
|-------------|--------|-------|--------|-----------|---------------------------|
| **MyFitnessPal** | Freemium + Assinatura | Premium: US$ 79,99/ano (~R$ 480); Premium+: US$ 99,99/ano (~R$ 600) | Banco de dados gigante (14M+ alimentos); integrações com 50+ wearables; marca global forte | Genérico; não entende contexto clínico (GLP-1, alergias); UX confusa; caro no Brasil | Personalização clínica + IA geradora de cardápio + contexto GLP-1 |
| **Lifesum** | Freemium + Assinatura | ~US$ 44,99/ano (~R$ 270) | Meal plans estruturados (keto, mediterrânea, jejum); interface bonita; preço competitivo | Pouco conhecido no Brasil; sem suporte a prescrições médicas ou rastreio de sintomas | Leitura de prescrição + rastreio de injeções + análise de rótulos |
| **NutriScan** (emergente) | Freemium + Assinatura | US$ 7,49/mês ou US$ 49,99/ano (~R$ 45–300) | AI photo scanning; planos de 28 dias; voz | Banco de dados pequeno; marca desconhecida; sem comunidade | Escaner de despensa + rastreio de hidratação + gameficação |
| **Freeletics / Noom** | Assinatura | Noom: ~US$ 60/mês | Coaching humano; abordagem psicológica | Preço proibitivo no Brasil; sem foco em restrições clínicas | Preço acessível + automação com IA + foco em nichos clínicos |

### Concorrentes Indiretos (B2B — software para nutricionistas, não B2C)

| Concorrente | Modelo | Preço | Nota |
|-------------|--------|-------|------|
| **Dietbox** | SaaS para nutricionistas | R$ 49,90–91,90/mês (profissional) | B2B, não compete diretamente pelo mesmo usuário final. Mas o app do paciente é um "plus", não o produto principal. |
| **Nutrium** | SaaS para nutricionistas | R$ 480–720/ano (profissional) | Mesmo caso: o paciente acessa via nutricionista, não adquire diretamente. |
| **WebDiet** | SaaS para nutricionistas | R$ 49/mês | Acesso do paciente é um efeito colateral do atendimento nutricional. |

> **Insight chave:** O mercado brasileiro de **nutrição B2C para consumidor final** está **praticamente vazio** de players fortes. Os grandes apps (MyFitnessPal, Lifesum) são gringos, caros em real e não entendem o contexto brasileiro (feijoada, açaí, pão de queijo, GLP-1 com prescrição requerida). Os softwares nacionais (Dietbox, Nutrium) são **B2B** — o paciente não compra o app, o nutricionista compra. Isso é uma **janela de oportunidade real** para o PersonalDiet, mas exige posicionamento claro: **"o único app de nutrição clínica inteligente feito para quem usa GLP-1 e tem restrições alimentares no Brasil"**.

### Diferenciação do PersonalDiet (atual vs. necessário)

| Feature | Já existe (segundo contexto) | Status competitivo |
|---------|------------------------------|--------------------|
| Cardápios semanais com IA | Sim | Diferenciador médio (Lifesum já faz) |
| Escaner de despensa/geladeira | Sim | **Diferenciador forte** (poucos apps fazem bem no Brasil) |
| Rastreio de hidratação | Sim | Baseline |
| Rastreio de sintomas | Sim | **Diferenciador forte** (contexto clínico GLP-1) |
| Rastreio de peso + injeções de GLP-1 | Sim | **Diferenciador único** (nenhum app popular faz isso) |
| Leitura de prescrições médicas | Sim | **Diferenciador forte** (IA aplicada à clínica) |
| Análise de rótulos de alérgenos | Sim | **Diferenciador forte** (celíacos, alérgicos) |
| **Gameficação** | **Não** (elemento solicitado) | **Oportunidade de viralidade** |
| **Monetização** | **Não** (só auth Supabase) | **Bloqueador crítico** |

---

## 3. Modelo de Monetização Recomendado

### Diagnóstico Atual
> O app parece ser **freemium sem pagamento** — apenas autenticação Supabase. Isso é um **bloqueador crítico** para tráfego pago: sem receita, cada usuário custa dinheiro e não gera retorno.

### Modelo Recomendado: **Freemium com Upgrade Freemium + Assinatura**

| Plano | Preço | O que inclui | Público-alvo |
|-------|-------|-------------|------------|
| **Free** | R$ 0 | Rastreio básico de peso, hidratação, 3 cardápios IA/mês, escaner de rótulo limitado (5/mês) | Testadores, curiosos, usuários de GLP-1 no início do tratamento |
| **Premium** | **R$ 19,90/mês** ou **R$ 149,90/ano** (25% desconto) | Cardápios ilimitados, escaner de despensa/geladeira ilimitado, rastreio de sintomas + injeções, leitura de prescrições, análise de rótulos ilimitada, comunidade, suporte prioritário | Usuários engajados, em tratamento contínuo, com restrições |
| **Anual com Bônus** | **R$ 179,90/ano** (equivalente a R$ 14,99/mês) | Tudo do Premium + 1 consulta online com nutricionista parceiro/ano + desafios exclusivos | Usuários comprometidos, alto engajamento |

### Benchmark de Preços (Apps de Nutrição/Saúde no Brasil)

| App | Preço no Brasil | Observação |
|-----|----------------|------------|
| MyFitnessPal Premium | ~R$ 480/ano | Caro para padrão brasileiro; poucos pagam |
| Lifesum Premium | ~R$ 270/ano | Preço mais razoável, mas pouco conhecido |
| NutriScan | ~R$ 300/ano | Player emergente |
| Apps genéricos de fitness (Keep, etc.) | R$ 20–40/mês | Mercado chinês/br, preço agressivo |
| **PersonalDiet (recomendado)** | **R$ 149,90–179,90/ano** | **Preço competitivo para o nicho clínico**; barreira psicológica baixa para quem já gasta R$ 800+/mês com GLP-1 |

> **Justificativa do preço:** Usuários de GLP-1 já demonstram **disposição de pagar alto por saúde**. O app não compete com MyFitnessPal (tracking genérico); compete com o **custo de uma consulta nutricional** (R$ 200–500). A R$ 149,90/ano, o app custa menos que uma consulta e entrega valor diário. O preço deve ser **percebido como acessível demais para ser descartado, mas não tão barato que sinalize baixa qualidade**.

### Quando cobrar?
- **Teste A/B de preço no onboarding:** Semana 1 grátis (trial) → oferta de R$ 19,90/mês ou R$ 149,90/ano.
- **Gate de paywall:** Após o primeiro cardápio gerado, o usuário pode salvar 2 receitas. A 3ª exige Premium. Isso cria **fome pelo valor** antes de cobrar.
- **Oferta contextual:** Quando o usuário escaneia uma prescrição médica, oferecer: "Deseja que o PersonalDiet transforme essa prescrição em um cardápio de 7 dias? Ative o Premium."

---

## 4. Viabilidade Econômica: LTV vs. CAC

### Estimativa de LTV (Lifetime Value)

| Variável | Cenário Conservador | Cenário Realista | Cenário Otimista |
|----------|--------------------|-------------------|------------------|
| Ticket médio mensal | R$ 19,90 | R$ 19,90 | R$ 19,90 |
| % que escolhe anual | 30% | 50% | 60% |
| Ticket médio ponderado | R$ 216/ano | R$ 198/ano | R$ 180/ano |
| Margem bruta (após gateway, servidores, IA) | 70% | 75% | 80% |
| **Churn mensal de assinantes** | 12% | 8% | 5% |
| **LTV** | **R$ 126** | **R$ 247** | **R$ 480** |

> **Referência de benchmark:** Apps de saúde/digital health têm day-30 retention de apenas 3,5–4% (churn brutal de 96% no base de installs). Mas assinantes pagantes têm churn mensal de **5–12%** (benchmark global de subscription mobile). O melhor apps de saúde mantêm <5% mensal. Para um PWA solo, **8% mensal é realista** no primeiro ano.

### Estimativa de CAC (Customer Acquisition Cost)

| Canal | CPL Estimado | Taxa Free→Paid | CAC Estimado |
|-------|-------------|----------------|--------------|
| **Meta Ads (Facebook/Instagram)** | R$ 20–40 | 5–10% | **R$ 200–800** |
| **Google Ads (Search)** | R$ 30–60 | 8–15% | **R$ 200–750** |
| **TikTok Ads** | R$ 15–30 | 3–6% | **R$ 250–1.000** |
| **Orgânico + Indicação** | R$ 0–5 | 15–30% | **R$ 15–35** |

> **Referência de benchmark:** Em clínicas/saúde no Brasil, CPL no Meta varia de R$ 15–35 (ortopedia/fisioterapia) a R$ 20–50 (procedimentos de alto ticket). CPC médio em saúde/beleza no Google: R$ 2–8. Meta Ads CPC: R$ 0,80–2,50. TikTok: CPC R$ 0,40–1,20 (menor CPM, mas conversão mais fraca para produtos de saúde).

### Break-even de Campanha

| Métrica | Cenário Conservador | Cenário Realista | Cenário Otimista |
|---------|--------------------|-------------------|------------------|
| LTV | R$ 126 | R$ 247 | R$ 480 |
| CAC | R$ 600 | R$ 350 | R$ 200 |
| **LTV/CAC** | **0,2x** ❌ | **0,7x** ❌ | **2,4x** ⚠️ |
| **ROAS alvo** | 3x | 3x | 3x |
| **Break-even?** | **NUNCA** | **6–9 meses** | **3–4 meses** |

> **Veredicto numérico:** Com LTV realista de R$ 247 e CAC realista de R$ 350, o **LTV/CAC é 0,7x — negativo**. Isso significa que, para cada real investido em anúncios, você recupera 70 centavos em receita vitalícia. A operação queima caixa. Para o tráfego pago ser **sustentável**, o LTV/CAC precisa ser **≥ 3x**.

### O que precisa acontecer para o break-even?

| Alavanca | Ação | Impacto no LTV/CAC |
|----------|------|--------------------|
| **Reduzir CAC** | Melhorar landing page (conversão 12% → 18%), otimizar criativos, usar lookalike audiences | CAC de R$ 350 → R$ 200 |
| **Aumentar LTV** | Reduzir churn (8% → 5% mensal) via gameficação + comunidade | LTV de R$ 247 → R$ 400 |
| **Aumentar ticket** | Upsell de consulta nutricional (R$ 80) ou plano trimestral | Ticket de R$ 198 → R$ 280 |
| **Combinado** | CAC R$ 200 + LTV R$ 400 | **LTV/CAC = 2,0x** — ainda abaixo do ideal, mas palpável |
| **Alavanca final** | Orgânico + indicação viral (gameficação) reduzindo CAC médio para R$ 120 | **LTV/CAC = 3,3x** ✅ |

> **Conclusão matemática:** Tráfego pago puro, com o produto atual, **não fecha a conta**. É necessário:
> 1. Implementar monetização (sem isso, nem adianta calcular);
> 2. Reduzir churn via gameficação e engajamento;
> 3. Construir canal orgânico (TikTok/Instagram) para diluir o CAC médio;
> 4. Só então escalar tráfego pago com budget significativo.

---

## 5. Estratégia de Tráfego Pago

### Prioridade de Plataforma

| Rank | Plataforma | Por quê priorizar (ou não) | Budget sugerido |
|------|------------|---------------------------|-----------------|
| **1** | **Meta Ads** | Maior volume de leads, CPC 40–60% menor que Google, melhor para "criar demanda" (a pessoa não sabe que precisa do app até ver). Público de mulheres 35–55 anos, interesse em saúde/emagrecimento, está no Instagram/Facebook. | R$ 3.000–5.000/mês (fase de teste) |
| **2** | **Google Ads** | Captura demanda ativa: "o que comer com Ozempic", "app dieta celíaca", "cardápio low carb". CPC mais alto (R$ 2–8), mas conversão superior. Ideal para Remarketing e Search. | R$ 1.500–2.500/mês |
| **3** | **TikTok Ads** | CPM mais barato (R$ 5–15), público mais jovem (25–40), mas nicho GLP-1 ainda não está massificado lá. Alto potencial viral se o criativo for bom. Risco: conversão de saúde é baixa em TikTok. | R$ 1.500–2.000/mês (teste) |
| **4** | **LinkedIn / Twitter** | Não recomendado. Público errado, CPM altíssimo. | R$ 0 |

> **Distribuição de orçamento ideal (fase de validação):** 60% Meta Ads (criação de demanda) + 30% Google Ads (captura de demanda) + 10% TikTok Ads (teste de viralidade).

### Público-alvo para Segmentação

**Meta Ads (Lookalike + Interesse):**
- **Core:** Mulheres, 35–55 anos, Brasil, classes B/C/D (ajustar por renda estimada).
- **Interesses:** Emagrecimento, nutrição, saúde, reeducação alimentar, diabetes, obesidade, medicina funcional.
- **Comportamental:** Engajada com páginas de GLP-1 (Ozempic, Mounjaro), farmácias (Raia Drogasil, Pague Menos), clínicas de emagrecimento.
- **Lookalike:** Após 500 conversões (installs), criar LAL 1% dos melhores leads.
- **Exclusão:** Já instalou o app (para evitar pagar por usuário existente).

**Google Ads (Search):**
- **Palavras-chave:** "o que comer tomando Ozempic", "cardápio para quem usa Mounjaro", "app dieta celíaca", "controle de alergia alimentar app", "nutricionista online barato", "cardápio semanal IA".
- **Negativas:** "grátis", "receita de bolo", "concorrente" (ex: MyFitnessPal grátis).

### Funnel: Awareness → Consideration → Conversion

| Etapa | Objetivo de campanha | Criativo | Mensagem | Métrica-chave |
|-------|---------------------|----------|----------|---------------|
| **Awareness** | Alcance / Vídeo views | Vídeo 15–30s: "3 erros que 90% das pessoas cometem ao usar Ozempic" | Educação, dor, curiosidade. Sem vender ainda. | CPM < R$ 20; ThruPlay > 15% |
| **Consideration** | Tráfego para landing / Installs | Carrossel: "Como montar seu cardápio semanal em 2 minutos com IA" | Demonstração de valor, antes/depois de energia, depoimento. | CTR > 1,5%; CPC < R$ 2,00 |
| **Conversion** | App installs / Assinaturas | Vídeo 30s: "Maria perdeu 12kg com Ozempic + este app. Veja como." + oferta trial | Urgência: "7 dias grátis para os 100 primeiros" | CPA (install) < R$ 15; CPA (assinatura) < R$ 350 |
| **Retenção** | Remarketing (audience de quem instalou mas não assinou) | Push / e-mail: "Você esqueceu de gerar seu cardápio de hoje?" | Reengajamento, FOMO de streak | Taxa de reativação > 8% |

> **Regra de ouro:** O Meta precisa de **50 conversões por conjunto a cada 7 dias** para sair da fase de aprendizado. Com CPA de R$ 300 e budget de R$ 3.000/mês, isso é matematicamente impossível. Ou seja: **não dá para otimizar para "compra" com budget baixo**. A estratégia correta é otimizar para **evento intermediário** (install, trial iniciado, lead capturado) e remarketar para conversão.

---

## 6. Gameficação

### Diagnóstico
> O app atual não tem elementos gameficados. Isso é um **problema sério de retenção**: apps de saúde digital têm day-30 retention de apenas 3,5–4% sem engajamento. Gameficação bem feita pode **dobbar ou triplicar a retenção** no primeiro mês.

### Mecânicas Gameficadas Recomendadas para o Contexto Clínico/Nutricional

| Mecânica | Como funciona no PersonalDiet | Objetivo de negócio |
|----------|------------------------------|--------------------|
| **Sequência (Streak)** | "Você está com 5 dias seguidos registrando suas refeições! 🔥" Streak quebrado = mensagem de recuperação gentil: "Não desista. Todo mundo tropeça. Volte hoje e reconstrua sua sequência." | Habitoização diária; redução de churn |
| **Pontos (NutriPoints)** | Cada ação gera pontos: escanear rótulo (+10), seguir cardápio (+50), bater meta de água (+20), registrar peso (+15), marcar injeção (+25). | Engajamento com todas as funcionalidades |
| **Níveis / Ranking** | Iniciante → Disciplinado → Expert em Nutrição → Mestre do GLP-1. Cada nível desbloqueia novos recursos (ex: nível 3 libera desafios em grupo). | Progresso visível; senso de conquista |
| **Conquistas (Badges)** | "Primeira Semana Completa", "Celíaca VIP" (7 dias sem glúten), "Hidratada" (10 dias de meta de água), "Injeção em Dia" (registrou todas as injeções do mês), "Leitor de Rótulos" (escaneou 50 produtos). | Recompensa de comportamentos-chave |
| **Desafios / Missões** | Desafio semanal: "7 dias sem açúcar refinado" ou "Proteína em todas as refeições". Participação em desafios gera NutriPoints extras. | Variedade; comunidade; motivação |
| **Compartilhamento Social** | Card gerado automaticamente: "Hoje completei 7 dias de sequência no PersonalDiet! Minha meta: -5kg com saúde. 🎯" | Aquisição viral (K-factor) |
| **Liderboard (opcional)** | Ranking anônimo entre usuários do mesmo desafio (ex: top 10 do desafio "Sem Lactose"). Não expor peso ou dados sensíveis. | Competição saudável; engajamento social |
| **Recompensas Tangíveis** | Trocar NutriPoints por desconto na assinatura (ex: 500 pontos = 10% off no próximo mês) ou por conteúdo exclusivo (ebook de receitas). | Redução de churn; aumento de LTV |
| **Mascote / Companion** | Um personagem simpático (ex: "Nutri", uma gota de água ou uma folhinha) que reage ao progresso: "Você me deixou triste ontem... Mas hoje estou feliz de novo! 🌱" | Conexão emocional; lembretes não-invasivos |

### Gameficação Específica para GLP-1

- **"Jornada da Caneta"**: Timeline visual do tratamento. Semana 1: "Adaptação". Mês 1: "Primeiros Resultados". Mês 3: "Novo Hábito". Cada marco desbloqueia um badge.
- **"Sintoma Check"**: Registrar sintomas (náusea, azia) gera pontos e gera insights da IA: "Você sentiu mais náusea nas segundas. Experimente tomar café da manhã 30 min depois da injeção."
- **"Proteína Quest"**: Missão diária de bater a meta de proteína (essencial para usuários de GLP-1, que comem pouco volume). Completa = +30 pontos.

### Impacto Esperado na Retenção

| Métrica | Sem Gameficação | Com Gameficação (estimativa) |
|---------|-----------------|------------------------------|
| Day-7 retention | 8% | 15–20% |
| Day-30 retention | 3,5% | 8–12% |
| Churn mensal de assinantes | 12% | 6–8% |
| **LTV** | **R$ 126** | **R$ 250–400** |

---

## 7. Copy & Criativos para Anúncios

### Tom de Voz
- **Empático, direto, sem jargon médico.** Não fala como "app de nutrição". Fala como "alguém que entende o que você está passando".
- **Sem promessas de emagrecimento.** Sem "perca 10kg em 30 dias". Foco em **bem-estar, controle e clareza**.
- **Prova social + storytelling.** Vídeos de pessoas reais (ou bem simuladas) contando o dia a dia.

### 3 Variações de Gancho/Headline

#### **Variação A: Dor + Solução (Meta/Instagram Reels)**
> **Headline:** *"O médico receitou Ozempic. Mas ninguém me ensinou o que comer."*
> **Subheadline:** *"Até eu descobrir este app que gera meu cardápio semanal em 2 minutos — respeitando minhas náuseas e minhas restrições."*
> **CTA:** *"7 dias grátis. Sem cartão."*
> **Formato:** Vídeo 30–45s. Mulher 40+ na cozinha, mostrando a geladeira, depois a tela do app. Antes: confusão. Depois: cardápio pronto.

#### **Variação B: Educação + Curiosidade (TikTok / Reels)**
> **Headline:** *"3 coisas que você NÃO deve comer nas primeiras 4 semanas de Ozempic"*
> **Subheadline:** *"A 3ª é o que todo mundo erra. E o pior: deixa a náusea 10x pior."*
> **CTA:** *"Baixe o app e veja o cardápio ideal para a sua fase do tratamento."*
> **Formato:** Vídeo 15–30s. Rosto próximo, tom de "segredo", listagem rápida com texto na tela. Hook nos primeiros 3 segundos.

#### **Variação C: Autoridade + Facilidade (Meta Carrossel / Google Display)**
> **Headline:** *"Escaneie sua prescrição médica. Receba seu cardápio em segundos."*
> **Subheadline:** *"O PersonalDiet lê sua receita, analisa seus alérgenos e monta a lista de compras da semana. Funciona até para celíacos, intolerantes à lactose e quem faz low-carb."*
> **CTA:** *"Experimente grátis por 7 dias"*
> **Formato:** Carrossel 5 cards: (1) Problema, (2) Funcionalidade, (3) Demonstração, (4) Depoimento, (5) Oferta. Ou imagem estática com mockup do app.

### Sugestão de Formato de Criativo

| Plataforma | Formato Principal | Por quê |
|------------|-------------------|---------|
| **Meta (FB/IG)** | Vídeo 30–45s (Reels/Stories) + Carrossel | Reels tem maior alcance orgânico pago; carrossel educa antes de vender. |
| **TikTok** | Vídeo 15–30s, hook nos 3 primeiros segundos, legendas grandes | Algoritmo favorece completion rate; saúde precisa ser clara e rápida. |
| **Google (YouTube)** | Bumper 6s + In-stream 15s ( Remarketing) | Curto, direto, para quem já visitou o site. |
| **Google (Display)** | Banner 300×250 + 728×90 com mockup do app | Remarketing para quem não instalou. |

### Regra de Criativo para Nicho de Saúde
> **Nunca mostre:** agulhas, sangue, corpos emagrecidos de forma exagerada, before/after de peso sem contexto médico, menções a "emagrecimento rápido".
> **Sempre mostre:** alimentos coloridos, pessoas sorrindo comendo, interface limpa do app, texto de disclaimer pequeno na parte inferior.

---

## 8. Landing Page & Onboarding

### O que a Landing Page Precisa Ter para Converter

> **Meta de conversão:** 12–18% de visitantes → install (benchmark otimizado). Com 8% é aceitável para início.

| Elemento | O que fazer | Por quê |
|----------|-------------|---------|
| **Hero Section** | Headline clara: *"Nutrição inteligente para quem tem restrições — ou usa GLP-1"*. Subhead explicando em 1 frase. Botão CTA grande: "Baixe grátis — 7 dias". | 80% dos visitantes não rolam. A mensagem precisa estar acima da dobra. |
| **Vídeo de 60s** | Demo rápido: escaneia prescrição → app gera cardápio → mostra rótulo escaneado → rastreia injeção. | Pessoas não leem. Vídeo aumenta conversão em 30–50%. |
| **Prova Social** | Depoimentos de usuários reais (mesmo que 2–3 iniciais). ""Eu não sabia o que comer com Ozempic. Em 1 semana o app me deu segurança." — Mariana, 38". | Reduz percepção de risco; aumenta conversão. |
| **Recursos em 3 colunas** | (1) IA que gera cardápio, (2) Escaner de prescrições e rótulos, (3) Rastreio de sintomas e injeções. | Claridade sobre o que o app faz — e o que ele NÃO faz. |
| **Preços transparentes** | "Grátis para testar. Premium a partir de R$ 19,90/mês. Cancele quando quiser." | Transparência reduz fricção; esconder preço aumenta abandono. |
| **FAQ com 5 perguntas** | "O app substitui nutricionista?" (Não, é ferramenta de apoio). "Funciona offline?" (Parcialmente). "Segurança dos dados?" (LGPD, criptografia). | Remove objeções antes do install. |
| **Footer** | Disclaimer médico obrigatório. Links para Termos, Privacidade, Contato. | Proteção legal; transparência. |

### O que o Onboarding do App Precisa Mudar para Converter

> **Diagnóstico:** Onboarding atual provavelmente é fluxo de auth Supabase padrão. Isso é insuficiente.

| Problema Atual | Solução | Impacto |
|----------------|---------|---------|
| Cadastro logo de cara (sem ver valor) | **Onboarding de valor primeiro:** Pergunta 3 coisas ("Você usa GLP-1? Tem restrição alimentar? Qual seu objetivo?") → gera 1 cardápio de amostra IMEDIATAMENTE, antes de pedir e-mail. | Aumenta conversão free em 40–60%. |
| Sem demonstração de IA | Mostrar o escaner funcionando na primeira tela: "Tire uma foto de uma receita médica ou de um rótulo de alimento." | "Aha moment" no primeiro minuto. |
| Sem contexto de gameficação | Após primeiro cardápio, mostrar: "Você ganhou 50 NutriPoints! Continue registrando para subir de nível." | Primeiro gatilho de recompensa. |
| Paywall agressivo ou inexistente | Trial de 7 dias sem cartão. Após trial, gate suave: "Salvar este cardápio? Premium desbloqueia tudo." | Menos abandono que "pague agora", mais conversão que "100% grátis sem limite". |
| Sem push notifications | Pedir permissão de notificação contextualmente: "Quer que eu te lembre de registrar a água às 10h?" | Push de valor aumenta day-7 retention em 20%. |

### Onboarding Ideal (fluxo de 5 minutos)

1. **Tela 1:** "Qual é o seu maior desafio com alimentação hoje?" (Opções: Uso GLP-1 / Celíaca/Lactose / Low-carb/Keto / Outro)
2. **Tela 2:** "Você tem alguma prescrição médica ou restrição?" (Checkbox)
3. **Tela 3:** "Gerando seu primeiro cardápio com IA..." (loading animado, máximo 8 segundos)
4. **Tela 4:** Mostra o cardápio. Botão: "Quer salvar? Cadastre-se em 10 segundos." (OAuth Google/Apple, não formulário longo)
5. **Tela 5:** "Parabéns! Você ganhou o badge 'Primeiro Passo'. Amanhã te mando um lembrete para registrar a refeição."
6. **Tela 6 (após 2 dias de uso):** Oferta trial: "Você usou 2 cardápios. Os próximos 30 dias são grátis. Depois, R$ 19,90/mês."

---

## 9. Riscos & Barreiras Legais

### Regulamentação de Publicidade de Saúde no Brasil

> **Alerta: o PersonalDiet não é um produto farmacêutico, mas a publicidade dele cruza com áreas reguladas. Precisa de cuidado extremo.**

| Órgão | O que regula | Risco para o PersonalDiet |
|-------|-------------|---------------------------|
| **ANVISA** | RDC 96/2008: publicidade de medicamentos. Produtos de prescrição não podem ser anunciados ao público geral. | **RISCO ALTO:** Ozempic e Mounjaro são medicamentos de prescrição. O app **não pode anunciar o remédio**, nem vender, nem fazer claims sobre eficácia do tratamento. O app pode falar em **"acompanhamento nutricional para quem está em tratamento médico"**. |
| **CONAR** | Código Brasileiro de Autorregulamentação Publicitária (CBAP). Proíbe publicidade enganosa, abusiva, que explore medo, que prometa cura. | **RISCO MÉDIO:** Anúncios tipo "perca peso com este app" ou "seu remédio agora tem sentido" podem ser denunciados e retirados. Proibir before/after sem comprovação. |
| **CDC (Lei 8.078/90)** | Proteção do consumidor. Publicidade enganosa é crime. Responsabilidade solidária do anunciante, agência e veículo. | **RISCO MÉDIO:** Se o app prometer algo que não entrega (ex: "diagnóstico automático de alergia"), é passível de ação civil e multa do Procon. |
| **CFM (Conselho Federal de Medicina)** | Resolução 2.217/2018: código de ética médica. Proíbe médicos de fazerem publicidade de medicamentos com desconto. | **RISCO BAIXO:** Não afeta diretamente o app, mas se houver parceria com médicos/nutricionistas, precisa de cautela. |
| **LGPD / ANPD** | Proteção de dados pessoais e sensíveis (saúde = dado sensível). | **RISCO ALTO:** Dados de saúde (peso, sintomas, medicamentos, prescrições) são **dados sensíveis** sob LGPD. Precisa de consentimento explícito, política de privacidade robusta, DPO (Encarregado) nomeado. |
| **Marco Legal de IA (2026)** | Conteúdo gerado por IA precisa ser identificado. | **RISCO MÉDIO:** Se usar IA para gerar imagens de pessoas nos anúncios, precisa de selo "Criado com IA". Se a IA do app fizer "diagnóstico", é ilegal. |

### Risco Específico: Meta Ads Reprovar Anúncios por "Produto Farmacêutico"

> **Este é o risco mais imediato e real.** O algoritmo de revisão do Meta pode classificar anúncios que mencionam "Ozempic", "Mounjaro", "emagrecimento", "perda de peso" como **"produto farmacêutico não autorizado"** ou **"serviço de saúde não comprovado"**. Resultado: reprovação, bloqueio de conta, ou restrição de alcance.

| Estratégia de Mitigação | Como fazer |
|------------------------|------------|
| **Evitar keywords proibidas no anúncio** | Não usar "Ozempic", "Mounjaro", "semaglutida", "tirzepatida" no texto do anúncio. Usar eufemismos: "caneta para controle de peso", "tratamento médico para obesidade", "orientação para quem está em tratamento endócrino". |
| **Foco no comportamento, não no produto** | Anunciar: "descubra o que comer quando você tem pouca fome". Não: "app para quem toma Ozempic". |
| **Disclaimer em todos os anúncios** | "Este app não substitui orientação médica ou nutricional. Consulte um profissional de saúde antes de iniciar qualquer dieta." |
| **Landing page com disclaimers** | Página de destino precisa ter termos de uso, política de privacidade, e aviso de que o app é ferramenta de apoio, não tratamento. |
| **Conta do Meta verificada** | Verificar domínio, configurar pixels corretamente, evitar redirecionamentos. Contas novas em nicho de saúde são mais escrutinadas. |
| **Evitar before/after de corpo** | Meta proíbe imagens que promovam padrões de corpo irreais ou façam comparação de peso de forma sensacionalista. |

### Checklist Legal Mínimo para Lançar Anúncios

- [ ] Política de Privacidade publicada (compliance LGPD, dados sensíveis de saúde)
- [ ] Termos de Uso publicados (limitação de responsabilidade: "não substitui profissional de saúde")
- [ ] Disclaimer médico em todos os anúncios e landing page
- [ ] DPO (Encarregado de Dados) nomeado (obrigatório para dados sensíveis)
- [ ] Nenhuma alegação de cura, diagnóstico ou tratamento
- [ ] Conteúdo de IA identificado (se aplicável)
- [ ] Estrutura jurídica da empresa (CNPJ) para veiculação de anúncios comerciais

---

## 10. Veredito GO / NO-GO

### O App Está Pronto para Receber Tráfego Pago?

> **Veredito: NO-GO — com ressalvas.**

| Critério | Status | O que falta |
|----------|--------|-------------|
| **Monetização implementada** | ❌ **CRÍTICO** | O app não tem sistema de pagamento. Sem receita, tráfego pago = queimar dinheiro. |
| **Gateway de pagamento** | ❌ **CRÍTICO** | Precisa de Stripe, Mercado Pago, Pagar.me ou similar integrado para assinaturas recorrentes. |
| **Trial/Paywall** | ❌ **CRÍTICO** | Sem trial de 7 dias, sem gate de conversão, não há como o funel de ads gerar receita. |
| **Onboarding otimizado** | ⚠️ **PARCIAL** | Auth Supabase não é onboarding. Precisa de fluxo de valor em < 2 minutos. |
| **Gameficação** | ❌ **IMPORTANTE** | Sem retenção, o CAC não se paga. Retenção de apps de saúde é catastroficamente baixa sem engajamento. |
| **Landing page** | ❌ **IMPORTANTE** | Precisa de página de destino profissional, rápida, com prova social e disclaimers. |
| **Pixel / Tracking** | ⚠️ **PARCIAL** | Pixel Meta, Google Analytics 4, eventos de conversão (install, trial, purchase) precisam estar configurados. |
| **Compliance legal** | ⚠️ **PARCIAL** | Precisa de LGPD, disclaimers, termos de uso. |
| **Conta de anúncios** | ⚠️ **PARCIAL** | Conta nova em nicho de saúde = maior escrutínio. Precisa de verificação, domínio, warm-up. |
| **Produto minimamente maduro** | ⚠️ **PARCIAL** | As funcionalidades parecem boas, mas não sabemos se a IA gera cardápios realmente úteis e se o escaner funciona bem. Precisa de teste com 50 usuários reais. |

### Se Forçar o GO Hoje, O Que Acontece?

- **Cenário pessimista:** Gasta R$ 5.000/mês em Meta Ads. Captura 2.000 installs. 0 assinaturas (sem pagamento). R$ 5.000 viram pó. A dona desiste do digital.
- **Cenço realista:** Gasta R$ 3.000/mês. Captura 1.000 installs. Alguns engajam, mas sem retenção, 96% some em 30 dias. Nenhuma receita. App vira "catálogo de curiosos".
- **Cenário otimista (mas ainda ruim):** Gasta R$ 2.000/mês. Captura 500 e-mails. Usa isso para nutrição futura. Mas o dinheiro do tráfego não se recupera sozinho — virou investimento em branding, não em aquisição.

### Condição para virar GO

> O app vira **GO para tráfego pago** quando:
> 1. Monetização (trial + assinatura) está implementada e testada com 20 usuários beta;
> 2. Gameficação reduz churn para < 8% mensal;
> 3. LTV real medido > R$ 200;
> 4. CAC real medido < R$ 150 (via orgânico + otimização de Meta);
> 5. Landing page converte > 10% de visitantes para install.
> 
> Até lá, **orgânico + indicação + testes de mercado** são as estratégias corretas.

---

## 11. Roadmap de Ações: 30 / 60 / 90 Dias

### **Dias 1–30: Fundação (NO-GO para tráfego pago)**

| # | Ação | Prioridade | Esforço |
|---|------|------------|---------|
| 1 | **Implementar gateway de pagamento** (Mercado Pago ou Stripe) com assinatura recorrente | 🔴 Crítico | Alto |
| 2 | **Definir planos Free vs. Premium** e implementar paywall/trial de 7 dias | 🔴 Crítico | Alto |
| 3 | **Reescrever onboarding** para mostrar valor em < 2 minutos (perguntas → cardápio de amostra → cadastro) | 🔴 Crítico | Médio |
| 4 | **Criar landing page** (1 página, mobile-first, com hero, demo, preço, FAQ, disclaimers) | 🟡 Importante | Médio |
| 5 | **Configurar pixel Meta + GA4** com eventos: PageView, Lead, Install, TrialStarted, Purchase | 🟡 Importante | Médio |
| 6 | **Redigir Termos de Uso + Política de Privacidade** (compliance LGPD, dados sensíveis de saúde) | 🟡 Importante | Médio |
| 7 | **Testar com 20 usuários beta** (amigos, familiares, grupos de GLP-1 no Facebook) coletando feedback | 🟡 Importante | Baixo |
| 8 | **Reservar 1 conta de anúncios** (Meta Business Manager, verificar domínio, warm-up) | 🟢 Preparatório | Baixo |
| 9 | **Estudar concorrentes** (criar conta em Lifesum, MyFitnessPal, NutriScan; documentar UX) | 🟢 Preparatório | Baixo |

> **Investimento estimado (mês 1):** R$ 0 em tráfego pago. R$ 0–500 em ferramentas (domínio, hosting, gateway). Tempo: 40–60h de desenvolvimento.

### **Dias 31–60: Engajamento & Retenção (Ainda NO-GO para escala)**

| # | Ação | Prioridade | Esforço |
|---|------|------------|---------|
| 1 | **Implementar gameficação v1:** Streaks, NutriPoints, 10 badges, 3 níveis | 🔴 Crítico | Alto |
| 2 | **Implementar push notifications** contextualizados (lembrete de refeição, água, injeção, streak) | 🔴 Crítico | Médio |
| 3 | **Lançar desafio semanal** (ex: "7 dias de proteína em todas as refeições") | 🟡 Importante | Médio |
| 4 | **Criar 3 vídeos de demo** para futuros anúncios (celular na mão, mostrando app real) | 🟡 Importante | Médio |
| 5 | **Iniciar 1 canal orgânico** (TikTok ou Instagram Reels): 3 posts/semana sobre "o que comer com GLP-1" | 🟡 Importante | Baixo |
| 6 | **Testar preço** com os 50 beta users: oferecer R$ 19,90/mês vs. R$ 149,90/ano, medir conversão | 🟡 Importante | Baixo |
| 7 | **Implementar sistema de indicação** ("Indique uma amiga e ganhe 1 mês grátis") | 🟡 Importante | Médio |
| 8 | **A/B test na landing page** (headline, CTA, cor do botão) usando Google Optimize ou similar | 🟢 Preparatório | Baixo |

> **Investimento estimado (mês 2):** R$ 0–300 em tráfego (teste de R$ 10/dia no Meta para validar criativo, se quiser). Tempo: 30–40h.

### **Dias 61–90: Validação & Pré-Escala (Transição para GO)**

| # | Ação | Prioridade | Esforço |
|---|------|------------|---------|
| 1 | **Analisar métricas de retenção:** day-1, day-7, day-30. Meta: day-7 > 15%, day-30 > 8% | 🔴 Crítico | Baixo |
| 2 | **Medir LTV real:** ticket médio, churn mensal, receita dos 50 primeiros pagantes | 🔴 Crítico | Baixo |
| 3 | **Rodar teste de tráfego pago piloto:** R$ 30–50/dia no Meta (R$ 900–1.500/mês), otimizando para install/trial | 🔴 Crítico | Médio |
| 4 | **Medir CAC real:** custo por install, custo por trial, custo por assinatura | 🔴 Crítico | Baixo |
| 5 | **Se LTV/CAC > 1,5x:** aumentar budget para R$ 2.000–3.000/mês e testar Google Ads | 🟡 Importante | Médio |
| 6 | **Se LTV/CAC < 1,0x:** pausar tráfego, voltar para otimização de produto (gameficação, preço, onboarding) | 🟡 Importante | Baixo |
| 7 | **Criar comunidade** (grupo de WhatsApp ou Discord) para os 100 primeiros usuários pagantes | 🟡 Importante | Baixo |
| 8 | **Preparar campanha de Remarketing:** segmentos de quem instalou mas não assinou, quem iniciou trial mas não pagou | 🟢 Preparatório | Baixo |
| 9 | **Documentar aprendizados** e decidir: escalar (GO) ou pivotar (NO-GO) | 🟢 Preparatório | Baixo |

> **Investimento estimado (mês 3):** R$ 1.500–3.000 em tráfego pago (teste). Tempo: 20–30h.

---

## Resumo Executivo para a Dona

> **Avaliação honesta, sem hype:**
>
> O **PersonalDiet tem uma janela de oportunidade real** — o mercado brasileiro de apps de nutrição B2C para nichos clínicos (GLP-1, celíaca, alergias) está praticamente vazio. Os concorrentes são ou B2B (Dietbox, Nutrium) ou genéricos globais (MyFitnessPal) que não entendem o contexto brasileiro.
>
> **Mas o app NÃO está pronto para tráfego pago hoje.** O bloqueador crítico é a **ausência de monetização**. Sem sistema de pagamento, sem trial, sem paywall, cada real investido em anúncios é real queimado. A matemática não fecha: mesmo com monetização, o LTV/CAC no cenário realista é de 0,7x — ou seja, prejuízo.
>
> **O caminho é:** 30 dias para implementar pagamento + onboarding otimizado; 60 dias para gameficação + retenção; 90 dias para teste de tráfego pago piloto com R$ 1.500–3.000. Se nesses 90 dias o LTV/CAC não chegar a pelo menos 1,5x, o produto ainda não tem product-market fit e precisa de mais iteração — **antes de escalar**.
>
> **O investimento inicial para "virar GO" não é alto em dinheiro (R$ 3.000–5.000), mas é alto em tempo e atenção.** A dona precisa decidir: quer transformar isso em um produto digital real, ou é um projeto paralelo? Se for projeto paralelo, o caminho é orgânico lento + testes de mercado. Se for produto real, os próximos 90 dias precisam de foco intenso em monetização e retenção.
>
> **Recomendação final:** **Não gaste em tráfego pago agora.** Gaste tempo em tornar o app vendável primeiro. Depois, o tráfego pago é um acelerador — não um salvador.

---

*Relatório elaborado por Estrategista_Trafego | Dados de mercado: julho/2026 | Fontes: Itaú BBA, XP, IQVIA, Meta Ads benchmarks, Google Ads benchmarks, Statista, AppsFlyer, ANVISA, CONAR, LGPD.*
