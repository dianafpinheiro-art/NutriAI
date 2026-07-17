// lib/recipe-extract.ts
// Extrai a legenda/descrição de um post de vídeo a partir da URL.
// Estratégia MVP: oEmbed (TikTok) + og:description (Instagram/YouTube/genérico).
// Se nada suficiente for encontrado, retorna ok=false e a UI pede o texto manual.

export type Platform = "tiktok" | "instagram" | "youtube" | "outro";

export interface ExtractResult {
  ok: boolean;
  platform: Platform;
  caption: string | null;
  title: string | null;
  thumbnail: string | null;
  reason?: string; // por que falhou, pra UI explicar
}

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

export function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  return "outro";
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&#10;/g, "\n");
}

function metaContent(html: string, property: string): string | null {
  // procura <meta property="og:description" content="..."> em qualquer ordem de atributos
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]*>`,
    "i"
  );
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  const content = tag.match(/content=["']([\s\S]*?)["']/i)?.[1];
  return content ? decodeEntities(content) : null;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9" },
      redirect: "follow",
      // Next.js: não cachear páginas de terceiros
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function extractTikTok(url: string): Promise<ExtractResult> {
  // oEmbed oficial do TikTok devolve o caption completo no campo "title"
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = (await res.json()) as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
      };
      if (data.title && data.title.trim().length > 0) {
        return {
          ok: true,
          platform: "tiktok",
          caption: data.title,
          title: data.author_name ? `Receita de @${data.author_name}` : null,
          thumbnail: data.thumbnail_url ?? null,
        };
      }
    }
  } catch {
    /* cai pro fallback abaixo */
  }
  return genericOg(url, "tiktok");
}

async function genericOg(url: string, platform: Platform): Promise<ExtractResult> {
  const html = await fetchHtml(url);
  if (!html) {
    return {
      ok: false,
      platform,
      caption: null,
      title: null,
      thumbnail: null,
      reason: "Não consegui acessar a página do vídeo.",
    };
  }
  const desc =
    metaContent(html, "og:description") ?? metaContent(html, "description");
  const title = metaContent(html, "og:title");
  const thumb = metaContent(html, "og:image");

  // Heurística: legenda muito curta provavelmente não contém a receita
  if (desc && desc.length >= 80) {
    return { ok: true, platform, caption: desc, title, thumbnail: thumb };
  }
  return {
    ok: false,
    platform,
    caption: desc,
    title,
    thumbnail: thumb,
    reason:
      "A legenda encontrada é curta demais pra conter a receita completa.",
  };
}

export async function extractFromUrl(url: string): Promise<ExtractResult> {
  const platform = detectPlatform(url);
  if (platform === "tiktok") return extractTikTok(url);
  return genericOg(url, platform);
}
