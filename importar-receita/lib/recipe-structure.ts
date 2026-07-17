// lib/recipe-structure.ts
// Recebe o texto bruto (legenda/descrição/texto colado) e devolve a receita
// estruturada via Claude. 100% server-side — exige ANTHROPIC_API_KEY no env.

import Anthropic from "@anthropic-ai/sdk";

export interface Ingrediente {
  qtd: number | null;
  unidade: string | null; // g, ml, xíc, cs, cc, un...
  item: string;
  observacao: string | null;
}

export interface Nutricao {
  calorias: number | null;
  proteina_g: number | null;
  carbo_g: number | null;
  gordura_g: number | null;
  fibra_g: number | null;
  fonte: "estimativa_ia";
}

export interface ReceitaEstruturada {
  titulo: string;
  descricao: string | null;
  porcoes: number;
  tempo_preparo_min: number | null;
  ingredientes: Ingrediente[];
  passos: string[];
  nutricao: Nutricao;
  tags: string[];
  confianca: "alta" | "media" | "baixa";
  faltando: string[]; // o que não foi possível extrair do texto
}

const SYSTEM = `Você é um extrator de receitas para um app de nutrição brasileiro.
Recebe a legenda/descrição de um vídeo de receita (pode estar em português ou inglês,
com emojis, hashtags e texto promocional) e devolve APENAS um objeto JSON válido,
sem markdown, sem crases, sem comentários, com exatamente esta estrutura:

{
  "titulo": string,
  "descricao": string | null,
  "porcoes": number,
  "tempo_preparo_min": number | null,
  "ingredientes": [{ "qtd": number | null, "unidade": string | null, "item": string, "observacao": string | null }],
  "passos": [string],
  "nutricao": { "calorias": number | null, "proteina_g": number | null, "carbo_g": number | null, "gordura_g": number | null, "fibra_g": number | null, "fonte": "estimativa_ia" },
  "tags": [string],
  "confianca": "alta" | "media" | "baixa",
  "faltando": [string]
}

Regras:
1. Traduza tudo para português brasileiro. Converta medidas americanas quando natural
   (cup -> xícara, tbsp -> colher de sopa "cs", tsp -> colher de chá "cc", oz/lb -> g).
2. "nutricao" é POR PORÇÃO. Se o texto informa os macros, use-os. Se não informa,
   ESTIME com base em tabelas nutricionais médias dos ingredientes e das quantidades.
   Sempre "fonte": "estimativa_ia".
3. Se o texto não diz o rendimento, estime "porcoes" pelo volume dos ingredientes.
4. "passos": frases imperativas curtas, uma ação por passo. Se o texto não descreve o
   preparo, deduza um preparo plausível a partir dos ingredientes e adicione
   "modo de preparo deduzido (não estava na legenda)" em "faltando".
5. "confianca": "alta" = ingredientes com quantidades E preparo presentes no texto;
   "media" = falta parte (quantidades ou preparo); "baixa" = texto vago, muita dedução.
6. "faltando": liste em português tudo que você teve que deduzir ou não encontrou
   (ex.: "quantidade do azeite", "tempo de forno").
7. Ignore hashtags, CTAs ("segue pra mais"), links e autopromoção.
8. Se o texto NÃO for uma receita (não há comida/ingredientes), devolva:
   { "erro": "nao_e_receita" }
9. Saída: SOMENTE o JSON. Nada antes, nada depois.`;

export async function structureRecipe(
  rawText: string
): Promise<ReceitaEstruturada | { erro: string }> {
  const client = new Anthropic(); // usa process.env.ANTHROPIC_API_KEY

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: "user", content: `Texto do vídeo:\n\n${rawText}` }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .replace(/```json|```/g, "")
    .trim();

  try {
    return JSON.parse(text) as ReceitaEstruturada | { erro: string };
  } catch {
    return { erro: "falha_ao_estruturar" };
  }
}
