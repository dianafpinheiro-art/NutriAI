# Plano de Tráfego Pago: PersonalDiet — Máximo com Mínimo

**Orçamento inicial:** R$ 30–50/dia  
**Plataforma:** Meta Ads (Instagram + Facebook)  
**Nicho:** Usuários de GLP-1 (Ozempic, Mounjaro), celíacos, intolerantes à lactose, low-carb  
**Público:** Brasil (São Paulo, Rio, Curitiba, Belo Horizonte, Porto Alegre, Brasília)  
**Objetivo:** Conversão direta para checkout (garantia de reembolso em 7 dias)

---

## 1. Setup Técnico (obrigatório antes de ligar o ads)

### Pixel Meta (Facebook Pixel)
1. Acesse: **https://business.facebook.com** → Events Manager
2. Crie um novo Pixel → nome: `personaldiet_pixel`
3. Copie o Pixel ID (ex: `123456789012345`)
4. Cole no final do arquivo `public/landing.html` (substitua `SEU_PIXEL_ID`)
5. Instale também no app (página pós-login) para rastrear `InitiateCheckout` e `Purchase`

### Eventos de Conversão a rastrear:
| Evento | Quando dispara | Prioridade |
|--------|---------------|------------|
| `PageView` | Landing page | 🔴 Obrigatório |
| `Lead` | Clicou em "Assinar agora" | 🔴 Obrigatório |
| `CompleteRegistration` | Criou conta no app | 🟡 Importante |
| `InitiateCheckout` | Entrou na tela de planos | 🟡 Importante |
| `Purchase` | Assinou Premium | 🔴 Obrigatório (evento principal) |

### URL da Landing Page (destino dos anúncios)
```
https://nutri-ai-5qaa.vercel.app/landing.html
```

**UTM para rastrear cada campanha:**
```
?utm_source=meta&utm_medium=cpc&utm_campaign=nome_da_campanha
```

---

## 2. Criativos: 4 variações para testar A/B

### Criativo A — "Problema/Dor" (Vídeo 15-30s, Reels)
**Texto no vídeo:**
```
"Você começou o Ozempic e...
❌ Não sabe o que comer
❌ Tem medo de náusea
❌ Frango com salada de novo?

✅ PersonalDiet gera seu cardápio semanal
✅ Importa receitas de TikTok/Reels
✅ Respeita suas restrições
✅ R$ 19,90/mês · Garantia de 7 dias → link na bio"
```
**Tom:** Empatia, humor sofrido, "eu também passei por isso"
**Formato:** Reels vertical (1080x1920), com legendas automáticas

---

### Criativo B — "Transformação/Resultado" (Carrossel, 3-5 slides)
**Slide 1:** "3 refeições que você pode comer usando Ozempic" + foto apetitosa
**Slide 2:** "Cardápio da semana gerado em 3 minutos" + screenshot do app
**Slide 3:** "Celíaca? Intolerante à lactose? Sem problema." + checkmarks
**Slide 4:** "R$ 19,90/mês · Garantia de 7 dias" + CTA botão rosa

**Copy do post:**
```
🥗 Cardápio da semana para quem usa Ozempic — em 3 minutos

PersonalDiet gera receitas personalizadas com IA, respeitando:
✅ Seu tratamento (Ozempic/Mounjaro)
✅ Suas restrições alimentares (glúten, lactose)
✅ Os ingredientes que você já tem na geladeira
✅ As receitas que você salvou no TikTok, Reels ou YouTube

💎 R$ 19,90/mês · Não gostou? Devolução em 7 dias.

#ozempic #mounjaro #cardápio #saúde #emagrecimento
```

---

### Criativo C — "Prova Social / Depoimento" (Vídeo 30-45s)
**Formato:** Vídeo selfie ou texto animado
**Script:**
```
"Oi! Sou a Mariana, tenho 42 anos e comecei o Ozempic há 3 meses.
As primeiras semanas foram um caos — eu não sabia O QUE comer.
Toda comida me deixava com náusea.

Aí eu descobri o PersonalDiet.
Em 3 minutos ele montou meu cardápio da semana,
com receitas que eu REALMENTE consigo comer.

Agora tenho segurança na alimentação.

R$ 19,90 por mês. Se não curtir, devolve seu dinheiro em 7 dias."
```
**Tom:** Testimonial real, íntimo, sem filtro

---

### Criativo D — "Receita Salva que Nunca Sai do Print" (UGC/Reels 7-12s)
**Hook:**
```
"Você salva receita no TikTok e nunca faz?"
```

**Texto no vídeo:**
```
Cole o link no PersonalDiet.
A IA extrai ingredientes, preparo e estimativa de macros.
Você revisa, salva no livro de receitas
e manda tudo para a lista de compras.

R$ 19,90/mês · 7 dias de garantia.
```

**Copy do post:**
```
Sabe aquela receita que você salvou no Reels e ficou perdida?

Agora você cola o link no PersonalDiet e a IA transforma em:
✅ receita organizada
✅ ingredientes com quantidades
✅ estimativa de macros por porção
✅ lista de compras automática

E ainda respeita suas restrições: glúten, lactose, preferências e rotina alimentar.

Teste 7 dias. R$ 19,90/mês depois.
```

**Tom:** UGC rápido, "life hack", demonstração de tela com link sendo colado.

---

## 3. Públicos-Alvo (Segmentação Meta Ads)

### Público 1 — "Interesse Direto" (CBO principal)
**Interesses:**
- Ozempic
- Mounjaro
- Wegovy
- Semaglutida
- Tirzepatida
- Dieta low-carb
- Dieta cetogênica
- Nutrição clínica

**Comportamento:**
- Acessou páginas sobre emagrecimento nos últimos 30 dias
- Comprou produtos de saúde online

**Demografia:**
- Idade: 30-55 anos
- Gênero: Mulheres (80%) + Homens (20%)
- Local: São Paulo, Rio, Curitiba, BH, Porto Alegre, Brasília, Florianópolis

---

### Público 2 — "Lookalike" (só depois de 100 leads)
**Criado a partir de:** Pessoas que clicaram em "Começar 7 dias grátis"
**Porcentagem:** 1% (mais parecido possível)

---

### Público 3 — "Retargeting" (Remarketing)
**Quem:** Pessoas que:
- Viram o anúncio mas não clicaram (últimos 7 dias)
- Clicaram na landing mas não criaram conta (últimos 14 dias)
- Criaram conta mas não ativaram trial (últimos 30 dias)

**Criativo:** "Ainda pensando? Seu cardápio da semana está esperando. 7 dias grátis."

---

## 4. Estrutura de Campanha — CBO (Campaign Budget Optimization)

### Fase 1: Teste (dias 1-7)
**Orçamento:** R$ 30/dia (R$ 210/semana)
**Objetivo:** Leads (cliques em "Começar trial")
**Estrutura:**
- 1 Campanha (CBO: R$ 30/dia)
- 3 Ad Sets (públicos diferentes)
- 4 Criativos por Ad Set (A/B test: dor, comida, UGC, importar receita)

**Ad Set 1:** Interesse Ozempic/Mounjaro (São Paulo + Rio)
**Ad Set 2:** Interesse low-carb/dieta (Curitiba + BH + Porto Alegre)
**Ad Set 3:** Amplo (deixa o algoritmo encontrar)

**Métricas de corte (pare se):**
- CPC > R$ 3,00 (custo por clique muito alto)
- CTR < 1% (ninguém clica — criativo ruim)
- Custo por lead > R$ 15,00 (não vale a pena)

---

### Fase 2: Escala (dias 8-14)
**Se Fase 1 deu resultado:**
- Aumente orçamento para R$ 50/dia (aumento de 20% por dia, não de uma vez)
- Pare o Ad Set que teve pior performance
- Duplique o Ad Set com melhor performance e mude o criativo

**Se Fase 1 NÃO deu resultado:**
- Pare tudo
- Mude os criativos (teste vídeo selfie, teste humor)
- Mude o público (teste faixa etária diferente)
- Não gaste mais dinheiro até achar um criativo que funcione

---

### Fase 3: Retargeting (dias 15-30)
**Orçamento:** R$ 20/dia para retargeting + R$ 30/dia para prospecção
**Objetivo:** Converter quem já viu mas não agiu

---

## 5. Orçamento e Projeção (realista)

### Cenário Otimista (15% de conversão de lead → trial)
| Métrica | Valor |
|---------|-------|
| Orçamento/dia | R$ 30 |
| CPC médio (nicho saúde) | R$ 1,50 |
| Cliques/dia | 20 |
| CTR | 2% |
| Leads/dia (cliques em trial) | 6 |
| Custo por lead | R$ 5,00 |
| Trial ativados (15% dos leads) | 0,9/dia |
| Custo por trial | R$ 33,33 |
| Assinantes (20% dos trials) | 0,18/dia |
| Custo por assinatura (CAC) | R$ 166,67 |
| Receita por assinante (LTV) | R$ 247 |
| **Lucro/prejuízo** | **R$ 80,33 de lucro** |

### Cenário Realista (10% de conversão)
| Métrica | Valor |
|---------|-------|
| Leads/dia | 6 |
| Trial ativados | 0,6/dia |
| Assinantes (15% dos trials) | 0,09/dia |
| CAC | R$ 333,33 |
| LTV | R$ 247 |
| **Lucro/prejuízo** | **R$ 86,33 de prejuízo** |

> **Conclusão:** No início você vai queimar dinheiro. Isso é NORMAL. O objetivo da Fase 1 é **aprender** qual criativo e público funcionam, não lucrar. O lucro vem depois de otimizar.

---

## 6. Checklist antes de ligar os anúncios

- [ ] Pixel Meta instalado na landing page
- [ ] Landing page abrindo rápido (< 3s) no celular
- [ ] Teste de conversão: você consegue fazer login e ativar o trial?
- [ ] App não quebra quando gera cardápio (teste o fluxo completo)
- [ ] Importação de receita testada com texto manual e com fallback de link bloqueado
- [ ] Conta do Mercado Pago com saldo para receber pagamentos
- [ ] Termos de uso e política de privacidade no footer (já tem)
- [ ] Conta no Meta Business Manager verificada
- [ ] Domínio verificado no Meta Business (para rastreamento preciso)
- [ ] Conta bancária vinculada ao Mercado Pago para receber

---

## 7. O que fazer nos primeiros 7 dias (dia a dia)

### Dia 1: Liga a campanha
- Orçamento: R$ 30
- 3 Ad Sets, 3 criativos cada
- Acompanhe a cada 2 horas

### Dia 2-3: Observa
- Qual criativo tem melhor CTR?
- Qual público tem menor CPC?
- Não mexe nada ainda (Meta precisa de 50 eventos para otimizar)

### Dia 4: Primeiro corte
- Pare o Ad Set com pior desempenho (mais caro, menos cliques)
- Pare o criativo com pior CTR

### Dia 5-6: Ajusta
- Reallocate orçamento para o Ad Set que está funcionando
- Teste um novo criativo no lugar do que parou

### Dia 7: Decisão
- **Se custo por lead < R$ 10:** Aumente para R$ 50/dia e continue
- **Se custo por lead > R$ 20:** Pare, reescreva os criativos, recomece
- **Se custo por lead R$ 10-20:** Continue testando com ajustes

---

## 8. Regras de Ouro (não quebre)

1. **Nunca gaste mais de R$ 50/dia nos primeiros 14 dias** — primeiro você aprende, depois escala
2. **Nunca pare um anúncio antes de 48h** — o Meta precisa de tempo para otimizar
3. **Nunca escale mais que 20% do orçamento por dia** — senão o algoritmo quebra
4. **Sempre tenha 4 criativos rodando** — nunca dependa de um só; o novo ângulo de "receita salva no Reels" deve disputar com os criativos atuais
5. **Retargeting é metade do jogo** — quem já viu tem 3x mais chance de converter
6. **Não se apaixone pelo criativo** — se os números dizem que é ruim, pare

---

## 9. Métricas para acompanhar (planilha simples)

| Dia | Gasto | Impressões | Cliques | CTR | Leads | CPL | Trial | CAC | Decisão |
|-----|-------|-----------|---------|-----|-------|-----|-------|-----|---------|
| 1 | | | | | | | | | |
| 2 | | | | | | | | | |
| 3 | | | | | | | | | |

Use uma planilha do Google Sheets ou Excel. Atualize uma vez por dia, de manhã.

---

## 10. Quando parar (regra do corte)

**Pare imediatamente se:**
- Gastou R$ 300 e não teve NENHUMA conversão (trial ativado)
- CPC > R$ 5,00 por mais de 3 dias seguidos
- CTR < 0,5% em todos os criativos
- O app está quebrando (usuários reclamam que não conseguem usar)

**Continue se:**
- Custo por lead < R$ 15
- Pelo menos 1 trial ativado por dia
- Os números estão melhorando dia após dia

---

## Resumo em 3 frases:

> Comece com **R$ 30/dia**, teste **4 criativos** e **3 públicos**, e acompanhe **todo dia**. O objetivo não é lucrar na semana 1 — é **descobrir o que funciona**. Só escale depois de achar um criativo + público que entregue leads por menos de **R$ 10**.

---

*Plano criado por Kimi para Diana — PersonalDiet. Julho de 2026.*
