import { Type } from "@google/genai";
import { parseCleanJson, sanitizeString } from "../utils/helpers.js";
import { getGeminiClient } from "./geminiService.js";
import { logger } from "./logger.js";

export type RecipePlatform = "tiktok" | "instagram" | "youtube" | "outro" | "manual";

export interface ImportedIngredient {
  qtd: number | null;
  unidade: string | null;
  item: string;
  observacao: string | null;
}

export interface ImportedRecipe {
  titulo: string;
  descricao: string | null;
  porcoes: number;
  tempo_preparo_min: number | null;
  ingredientes: ImportedIngredient[];
  passos: string[];
  nutricao: {
    calorias: number | null;
    proteina_g: number | null;
    carbo_g: number | null;
    gordura_g: number | null;
    fibra_g: number | null;
    fonte: "estimativa_ia";
  };
  tags: string[];
  confianca: "alta" | "media" | "baixa";
  faltando: string[];
}

interface ExtractResult {
  ok: boolean;
  platform: RecipePlatform;
  caption: string | null;
  title: string | null;
  thumbnail: string | null;
  reason?: string;
}

interface ImportPreferences {
  excludedIngredients?: string[];
  clinicalRestrictions?: string[];
  clinicalTreatment?: string;
  dietType?: string;
}

const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

export function detectRecipePlatform(url: string): RecipePlatform {
  const normalized = url.toLowerCase();
  if (normalized.includes("tiktok.com")) return "tiktok";
  if (normalized.includes("instagram.com")) return "instagram";
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) return "youtube";
  return "outro";
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&#10;/g, "\n");
}

function metaContent(html: string, property: string): string | null {
  const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]*>`, "i"))?.[0];
  if (!tag) return null;
  const content = tag.match(/content=["']([\s\S]*?)["']/i)?.[1];
  return content ? decodeEntities(content) : null;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
      },
      redirect: "follow",
    });
    if (!response.ok) return null;
    return response.text();
  } catch (err) {
    logger("warn", "Falha ao buscar pagina de receita", { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

async function extractGenericOg(url: string, platform: RecipePlatform): Promise<ExtractResult> {
  const html = await fetchHtml(url);
  if (!html) {
    return {
      ok: false,
      platform,
      caption: null,
      title: null,
      thumbnail: null,
      reason: "Nao consegui acessar a pagina do video.",
    };
  }

  const caption = metaContent(html, "og:description") ?? metaContent(html, "description");
  const title = metaContent(html, "og:title");
  const thumbnail = metaContent(html, "og:image");

  if (caption && caption.trim().length >= 80) {
    return { ok: true, platform, caption, title, thumbnail };
  }

  return {
    ok: false,
    platform,
    caption,
    title,
    thumbnail,
    reason: "A legenda encontrada e curta demais para conter a receita completa.",
  };
}

async function extractTikTok(url: string): Promise<ExtractResult> {
  try {
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (response.ok) {
      const data = (await response.json()) as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
      };
      if (data.title?.trim()) {
        return {
          ok: true,
          platform: "tiktok",
          caption: data.title,
          title: data.author_name ? `Receita de @${data.author_name}` : null,
          thumbnail: data.thumbnail_url ?? null,
        };
      }
    }
  } catch (err) {
    logger("warn", "Falha no oEmbed do TikTok", { error: err instanceof Error ? err.message : String(err) });
  }

  return extractGenericOg(url, "tiktok");
}

async function extractFromUrl(url: string): Promise<ExtractResult> {
  const platform = detectRecipePlatform(url);
  if (platform === "tiktok") return extractTikTok(url);
  return extractGenericOg(url, platform);
}

function buildRecipePrompt(rawText: string, preferences?: ImportPreferences): string {
  const excluded = sanitizeString((preferences?.excludedIngredients ?? []).join(", "), 500);
  const restrictions = sanitizeString((preferences?.clinicalRestrictions ?? []).join(", "), 500);
  const treatment = sanitizeString(preferences?.clinicalTreatment ?? "none", 100);
  const dietType = sanitizeString(preferences?.dietType ?? "none", 100);

  return `Extraia uma receita estruturada do texto abaixo para um app brasileiro de nutricao.
Traduza para portugues brasileiro. Ignore hashtags, links, chamadas promocionais e texto que nao faca parte da receita.

Contexto de seguranca alimentar do usuario:
- Ingredientes banidos: ${excluded || "nenhum"}
- Restricoes clinicas: ${restrictions || "nenhuma"}
- Tratamento: ${treatment}
- Dieta: ${dietType}

Regras:
1. Se o texto nao for uma receita, responda {"erro":"nao_e_receita"}.
2. Ingredientes banidos nao devem aparecer na receita final; quando necessario, substitua por alternativa segura e registre em "faltando".
3. Para celiacos, nao use trigo, centeio, cevada, malte ou aveia com gluten.
4. Para intolerancia a lactose, nao use leite comum, manteiga comum, creme de leite ou queijos comuns.
5. Para Ozempic/Mounjaro, prefira porcoes leves, proteina magra, pouca gordura saturada e pouco acucar.
6. "nutricao" e por porcao. Se o texto nao trouxer macros, estime com cuidado e use "fonte":"estimativa_ia".
7. Se faltar rendimento, tempo ou preparo, deduza de forma plausivel e registre em "faltando".

Texto:
${sanitizeString(rawText, 12000)}`;
}

export async function structureImportedRecipe(
  rawText: string,
  preferences?: ImportPreferences
): Promise<ImportedRecipe | { erro: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  const useMock = process.env.USE_MOCK_AI === "true";

  if (!apiKey) {
    if (!useMock) {
      throw new Error("Servico de IA nao configurado.");
    }
    return {
      titulo: "Receita importada",
      descricao: "Fallback local para ambiente sem chave de IA.",
      porcoes: 2,
      tempo_preparo_min: 25,
      ingredientes: [{ qtd: null, unidade: null, item: rawText.slice(0, 80) || "ingredientes", observacao: null }],
      passos: ["Revise o texto importado e ajuste ingredientes e preparo antes de salvar."],
      nutricao: { calorias: null, proteina_g: null, carbo_g: null, gordura_g: null, fibra_g: null, fonte: "estimativa_ia" },
      tags: ["importada"],
      confianca: "baixa",
      faltando: ["IA nao configurada neste ambiente"],
    };
  }

  if (useMock) {
    return {
      titulo: "Batata rustica de airfryer",
      descricao: "Receita leve importada em modo mock.",
      porcoes: 2,
      tempo_preparo_min: 25,
      ingredientes: [
        { qtd: 500, unidade: "g", item: "batata", observacao: "em cubos" },
        { qtd: 1, unidade: "colher de sopa", item: "azeite", observacao: null },
        { qtd: null, unidade: null, item: "paprica, alho em po e sal", observacao: "a gosto" },
      ],
      passos: ["Corte a batata em cubos.", "Tempere com azeite, paprica, alho e sal.", "Asse na airfryer a 200C por 25 minutos."],
      nutricao: { calorias: 230, proteina_g: 4, carbo_g: 42, gordura_g: 7, fibra_g: 5, fonte: "estimativa_ia" },
      tags: ["airfryer", "pratica"],
      confianca: "media",
      faltando: [],
    };
  }

  const prompt = buildRecipePrompt(rawText, preferences);
  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          erro: { type: Type.STRING },
          titulo: { type: Type.STRING },
          descricao: { type: Type.STRING, nullable: true },
          porcoes: { type: Type.INTEGER },
          tempo_preparo_min: { type: Type.INTEGER, nullable: true },
          ingredientes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                qtd: { type: Type.NUMBER, nullable: true },
                unidade: { type: Type.STRING, nullable: true },
                item: { type: Type.STRING },
                observacao: { type: Type.STRING, nullable: true },
              },
              required: ["qtd", "unidade", "item", "observacao"],
            },
          },
          passos: { type: Type.ARRAY, items: { type: Type.STRING } },
          nutricao: {
            type: Type.OBJECT,
            properties: {
              calorias: { type: Type.INTEGER, nullable: true },
              proteina_g: { type: Type.NUMBER, nullable: true },
              carbo_g: { type: Type.NUMBER, nullable: true },
              gordura_g: { type: Type.NUMBER, nullable: true },
              fibra_g: { type: Type.NUMBER, nullable: true },
              fonte: { type: Type.STRING },
            },
            required: ["calorias", "proteina_g", "carbo_g", "gordura_g", "fibra_g", "fonte"],
          },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          confianca: { type: Type.STRING },
          faltando: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      } as unknown,
      systemInstruction: "Voce e um extrator de receitas do PersonalDiet. Responda somente JSON valido.",
    },
  });

  return parseCleanJson(response.text || "{}") as ImportedRecipe | { erro: string };
}

export async function importRecipeFromSource(params: {
  url?: string;
  texto?: string;
  preferences?: ImportPreferences;
}): Promise<unknown> {
  const url = params.url?.trim();
  const texto = params.texto?.trim();

  if (texto) {
    const receita = await structureImportedRecipe(texto, params.preferences);
    if ("erro" in receita) {
      return { erro: receita.erro === "nao_e_receita" ? "Esse texto nao parece conter uma receita." : "Nao consegui estruturar a receita." };
    }
    return {
      receita,
      origem: {
        platform: url ? detectRecipePlatform(url) : "manual",
        source_url: url ?? null,
        source_caption: texto,
        thumbnail: null,
      },
    };
  }

  if (!url) {
    return { erro: "Envie um link ou cole o texto da receita." };
  }

  const extracted = await extractFromUrl(url);
  if (!extracted.ok || !extracted.caption) {
    return {
      precisa_texto_manual: true,
      motivo: extracted.reason ?? "Nao encontrei a receita na legenda desse video.",
      platform: extracted.platform,
      thumbnail: extracted.thumbnail,
    };
  }

  const receita = await structureImportedRecipe(extracted.caption, params.preferences);
  if ("erro" in receita) {
    return {
      precisa_texto_manual: true,
      motivo: "A legenda do video nao contem a receita completa. Cole o texto da receita.",
      platform: extracted.platform,
      thumbnail: extracted.thumbnail,
    };
  }

  return {
    receita,
    origem: {
      platform: extracted.platform,
      source_url: url,
      source_caption: extracted.caption,
      thumbnail: extracted.thumbnail,
    },
  };
}
