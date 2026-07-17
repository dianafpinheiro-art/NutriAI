// app/api/importar-receita/route.ts
// POST { url?: string, texto?: string }
// - Se vier "texto", estrutura direto (fallback manual).
// - Se vier "url", tenta extrair a legenda; se insuficiente, responde
//   { precisa_texto_manual: true } pra UI abrir o campo de colar.

import { NextRequest, NextResponse } from "next/server";
import { extractFromUrl, detectPlatform } from "@/lib/recipe-extract";
import { structureRecipe } from "@/lib/recipe-structure";

export const runtime = "nodejs";
export const maxDuration = 60; // estruturar pode levar alguns segundos

export async function POST(req: NextRequest) {
  let body: { url?: string; texto?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const url = body.url?.trim();
  const texto = body.texto?.trim();

  if (!url && !texto) {
    return NextResponse.json(
      { erro: "Envie 'url' ou 'texto'." },
      { status: 400 }
    );
  }

  // ---- caminho 1: texto colado manualmente ----
  if (texto) {
    const receita = await structureRecipe(texto);
    if ("erro" in receita) {
      const msg =
        receita.erro === "nao_e_receita"
          ? "Esse texto não parece conter uma receita."
          : "Não consegui estruturar a receita. Tente ajustar o texto.";
      return NextResponse.json({ erro: msg }, { status: 422 });
    }
    return NextResponse.json({
      receita,
      origem: {
        platform: url ? detectPlatform(url) : "manual",
        source_url: url ?? null,
        source_caption: texto,
        thumbnail: null,
      },
    });
  }

  // ---- caminho 2: só a URL ----
  const extracted = await extractFromUrl(url!);

  if (!extracted.ok || !extracted.caption) {
    return NextResponse.json(
      {
        precisa_texto_manual: true,
        motivo:
          extracted.reason ??
          "Não encontrei a receita na legenda desse vídeo.",
        platform: extracted.platform,
        thumbnail: extracted.thumbnail,
      },
      { status: 200 }
    );
  }

  const receita = await structureRecipe(extracted.caption);

  if ("erro" in receita) {
    // legenda existia mas não era receita → pede texto manual
    return NextResponse.json(
      {
        precisa_texto_manual: true,
        motivo:
          "A legenda do vídeo não contém a receita completa. Cole o texto da receita.",
        platform: extracted.platform,
        thumbnail: extracted.thumbnail,
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    receita,
    origem: {
      platform: extracted.platform,
      source_url: url,
      source_caption: extracted.caption,
      thumbnail: extracted.thumbnail,
    },
  });
}
