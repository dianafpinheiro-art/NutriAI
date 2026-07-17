# Feature: Importar Receita de Vídeo (estilo ReciMe) — PersonalDiet

## O que é
Usuária cola um link de TikTok / Instagram / YouTube (ou o texto da legenda), e o app:
1. Extrai a legenda/descrição do post
2. Usa Claude pra estruturar em receita: ingredientes com quantidades, modo de preparo, porções e estimativa de calorias/macros por porção
3. Mostra preview editável → salva no Supabase → aparece no livro de receitas
4. Botão "adicionar ingredientes à lista de compras"

## Instruções pro Claude Code (leia antes de integrar)

Este pacote foi escrito SEM conhecer a estrutura exata do projeto PersonalDiet.
Antes de copiar os arquivos, faça:

1. **Descubra a estrutura**: o projeto usa App Router (`app/`) ou Pages Router (`pages/`)?
   Os arquivos aqui assumem App Router + TypeScript + Tailwind. Adapte se necessário.
2. **Supabase**: verifique se já existe um client em `lib/supabase` (ou similar) e uma
   tabela de receitas. Se JÁ EXISTE tabela de receitas, NÃO crie a nova — adicione apenas
   as colunas que faltam (ver `supabase/001_recipes_imported.sql`, seção "ALTER
   alternativo"). Se não existe, rode a migration completa.
3. **Auth**: o insert em `page.tsx` assume `user_id` do usuário logado via
   `supabase.auth.getUser()`. Ajuste pro padrão de auth que o projeto já usa.
4. **Design**: o componente usa Tailwind neutro de propósito. Ajuste cores, fontes e
   componentes pros tokens que o PersonalDiet já usa (identidade rosa atual) — reaproveite
   Button/Card/Input existentes se houver design system.
5. **Env**: precisa de `ANTHROPIC_API_KEY` no `.env.local` e nas env vars do Vercel.
   A chamada ao Claude é 100% server-side (route handler) — a chave nunca vai pro client.
6. **Navegação**: adicione link "Importar receita" no menu/nav existente apontando
   pra `/importar`.

## Arquivos do pacote

| Arquivo | Destino sugerido | O que faz |
|---|---|---|
| `supabase/001_recipes_imported.sql` | rodar no SQL editor do Supabase | tabela `recipes` + RLS |
| `lib/recipe-extract.ts` | `lib/` | busca legenda via oEmbed/og:description |
| `lib/recipe-structure.ts` | `lib/` | chamada Claude → JSON estruturado |
| `app/api/importar-receita/route.ts` | `app/api/importar-receita/` | endpoint POST |
| `app/importar/page.tsx` | `app/importar/` | tela: link → preview → salvar |

## Limitações conhecidas (por design, pro MVP)

- **Instagram** logado-out às vezes bloqueia o fetch da página → o endpoint retorna
  `precisa_texto_manual: true` e a UI abre o campo "cole a legenda aqui". Esse fallback
  cobre qualquer plataforma.
- **YouTube**: og:description vem truncada (~160 chars). Se a receita estiver só na
  descrição longa, cai no fallback manual também.
- **Áudio do vídeo NÃO é transcrito** nesta fase. Fase 2 = worker com yt-dlp + Whisper
  no VPS do n8n, chamado quando a legenda não contém a receita.
- Macros são **estimativa da IA** com base em tabelas nutricionais médias — o JSON marca
  `nutricao.fonte = "estimativa_ia"` e a UI mostra esse aviso. Não apresentar como
  cálculo clínico.

## Teste rápido pós-integração

```bash
curl -X POST http://localhost:3000/api/importar-receita \
  -H 'Content-Type: application/json' \
  -d '{"texto":"Batata rústica de airfryer: 500g batata, 1 cs azeite, páprica, alho em pó, sal. Corte em cubos, tempere, 25min a 200C. Rende 2 porções."}'
```

Deve voltar JSON com `receita.ingredientes[]`, `receita.passos[]` e `receita.nutricao`.

## Fase 3 (backlog)
- PWA share target (`manifest.json` → `share_target`) pra compartilhar direto do TikTok
- Botão "enviar pra lista de compras" integrado ao módulo de compras, se existir
- Dedupe por `source_url`
