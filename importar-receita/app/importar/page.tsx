// app/importar/page.tsx
// Tela de importação: cola o link → preview editável → salvar no Supabase.
// Tailwind neutro de propósito — adapte às cores/componentes do PersonalDiet.
// AJUSTE OBRIGATÓRIO: troque o import do client Supabase pelo que o projeto já usa.

"use client";

import { useState } from "react";
// TODO(Claude Code): apontar pro client já existente no projeto, ex.:
// import { createClient } from "@/lib/supabase/client";

interface Ingrediente {
  qtd: number | null;
  unidade: string | null;
  item: string;
  observacao: string | null;
}

interface Receita {
  titulo: string;
  descricao: string | null;
  porcoes: number;
  tempo_preparo_min: number | null;
  ingredientes: Ingrediente[];
  passos: string[];
  nutricao: {
    calorias: number | null;
    proteina_g: number | null;
    carbo_g: number | null;
    gordura_g: number | null;
    fibra_g: number | null;
    fonte: string;
  };
  tags: string[];
  confianca: "alta" | "media" | "baixa";
  faltando: string[];
}

interface Origem {
  platform: string;
  source_url: string | null;
  source_caption: string | null;
  thumbnail: string | null;
}

type Fase = "link" | "texto_manual" | "carregando" | "preview" | "salvo";

export default function ImportarReceitaPage() {
  const [fase, setFase] = useState<Fase>("link");
  const [url, setUrl] = useState("");
  const [textoManual, setTextoManual] = useState("");
  const [motivoManual, setMotivoManual] = useState<string | null>(null);
  const [receita, setReceita] = useState<Receita | null>(null);
  const [origem, setOrigem] = useState<Origem | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function importar(payload: { url?: string; texto?: string }) {
    setErro(null);
    setFase("carregando");
    try {
      const res = await fetch("/api/importar-receita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.precisa_texto_manual) {
        setMotivoManual(data.motivo ?? null);
        setFase("texto_manual");
        return;
      }
      if (data.erro) {
        setErro(data.erro);
        setFase(payload.texto ? "texto_manual" : "link");
        return;
      }
      setReceita(data.receita);
      setOrigem(data.origem);
      setFase("preview");
    } catch {
      setErro("Falha na importação. Tente de novo.");
      setFase("link");
    }
  }

  async function salvar() {
    if (!receita) return;
    setSalvando(true);
    setErro(null);
    try {
      // TODO(Claude Code): trocar pelo client/padrão de auth do projeto.
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErro("Faça login para salvar a receita.");
        setSalvando(false);
        return;
      }
      const { error } = await supabase.from("recipes").insert({
        user_id: user.id,
        titulo: receita.titulo,
        descricao: receita.descricao,
        porcoes: receita.porcoes,
        tempo_preparo_min: receita.tempo_preparo_min,
        ingredientes: receita.ingredientes,
        passos: receita.passos,
        nutricao: receita.nutricao,
        tags: receita.tags,
        source_url: origem?.source_url ?? null,
        source_platform: origem?.platform ?? "manual",
        source_caption: origem?.source_caption ?? null,
        import_confidence: receita.confianca,
        import_missing: receita.faltando,
        imagem_url: origem?.thumbnail ?? null,
      });
      if (error) throw error;
      setFase("salvo");
    } catch {
      setErro("Não consegui salvar. Verifique a conexão e tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Importar receita de vídeo</h1>
      <p className="mt-1 text-sm text-gray-600">
        Cole o link de um vídeo de receita do TikTok, Instagram ou YouTube.
      </p>

      {erro && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {fase === "link" && (
        <div className="mt-6 space-y-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@perfil/video/..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <button
            onClick={() => url.trim() && importar({ url: url.trim() })}
            disabled={!url.trim()}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
          >
            Importar receita
          </button>
          <button
            onClick={() => setFase("texto_manual")}
            className="w-full text-center text-sm text-gray-500 underline"
          >
            Ou cole o texto da receita
          </button>
        </div>
      )}

      {fase === "texto_manual" && (
        <div className="mt-6 space-y-3">
          {motivoManual && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {motivoManual} Cole abaixo a legenda ou o texto da receita.
            </div>
          )}
          <textarea
            value={textoManual}
            onChange={(e) => setTextoManual(e.target.value)}
            rows={8}
            placeholder="Cole aqui a legenda do vídeo ou a receita completa..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <button
            onClick={() =>
              textoManual.trim() &&
              importar({ texto: textoManual.trim(), url: url.trim() || undefined })
            }
            disabled={!textoManual.trim()}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
          >
            Estruturar receita
          </button>
          <button
            onClick={() => setFase("link")}
            className="w-full text-center text-sm text-gray-500 underline"
          >
            Voltar pro link
          </button>
        </div>
      )}

      {fase === "carregando" && (
        <div className="mt-10 text-center text-sm text-gray-500">
          Lendo o vídeo e montando a receita…
        </div>
      )}

      {fase === "preview" && receita && (
        <div className="mt-6 space-y-5">
          {origem?.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={origem.thumbnail}
              alt=""
              className="h-44 w-full rounded-xl object-cover"
            />
          )}

          <input
            value={receita.titulo}
            onChange={(e) => setReceita({ ...receita, titulo: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-semibold"
          />

          <div className="flex gap-4 text-sm text-gray-600">
            <span>{receita.porcoes} porção(ões)</span>
            {receita.tempo_preparo_min && (
              <span>{receita.tempo_preparo_min} min</span>
            )}
          </div>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Ingredientes
            </h2>
            <ul className="mt-2 space-y-1 text-sm">
              {receita.ingredientes.map((ing, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-medium">
                    {ing.qtd ?? ""} {ing.unidade ?? ""}
                  </span>
                  <span>
                    {ing.item}
                    {ing.observacao ? ` (${ing.observacao})` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Modo de preparo
            </h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              {receita.passos.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Nutrição por porção
            </h2>
            <div className="mt-2 grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <div className="text-lg font-bold">
                  {receita.nutricao.calorias ?? "–"}
                </div>
                <div className="text-xs text-gray-500">kcal</div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {receita.nutricao.proteina_g ?? "–"}g
                </div>
                <div className="text-xs text-gray-500">proteína</div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {receita.nutricao.carbo_g ?? "–"}g
                </div>
                <div className="text-xs text-gray-500">carbo</div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {receita.nutricao.gordura_g ?? "–"}g
                </div>
                <div className="text-xs text-gray-500">gordura</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Valores estimados por IA a partir dos ingredientes.
            </p>
          </section>

          {receita.faltando.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              A IA precisou deduzir: {receita.faltando.join("; ")}. Revise antes
              de salvar.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={salvar}
              disabled={salvando}
              className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
            >
              {salvando ? "Salvando…" : "Salvar receita"}
            </button>
            <button
              onClick={() => {
                setReceita(null);
                setFase("link");
              }}
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {fase === "salvo" && (
        <div className="mt-10 space-y-4 text-center">
          <p className="text-lg font-semibold">Receita salva! 🎉</p>
          <button
            onClick={() => {
              setUrl("");
              setTextoManual("");
              setReceita(null);
              setFase("link");
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
          >
            Importar outra
          </button>
        </div>
      )}
    </main>
  );
}
