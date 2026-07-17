import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, FileText, Link2, Save, ShoppingCart, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "../authFetch";
import { RecipeResult, ShoppingItem, UserPreferences } from "../types";

interface ImportedIngredient {
  qtd: number | null;
  unidade: string | null;
  item: string;
  observacao: string | null;
}

interface ImportedRecipeResponse {
  receita?: {
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
    confianca: "alta" | "media" | "baixa";
    faltando: string[];
  };
  origem?: {
    platform: string;
    source_url: string | null;
    source_caption: string;
    thumbnail: string | null;
  };
  precisa_texto_manual?: boolean;
  motivo?: string;
  erro?: string;
  error?: string;
}

interface RecipeDraft {
  title: string;
  description: string;
  servings: number;
  prepTimeMin: number | null;
  ingredientsText: string;
  stepsText: string;
  nutritionSummary: string;
  confidence?: "alta" | "media" | "baixa";
  missingInfo: string[];
  sourcePlatform?: string;
  sourceUrl?: string | null;
}

interface RecipeImporterProps {
  preferences: UserPreferences;
  isPremium: boolean;
  onShowPaywall: () => void;
  onImported: (recipe: RecipeResult, shoppingItems: ShoppingItem[]) => void;
}

function formatIngredient(ingredient: ImportedIngredient): string {
  const quantity = [ingredient.qtd, ingredient.unidade].filter(Boolean).join(" ").trim() || "a gosto";
  const note = ingredient.observacao ? ` (${ingredient.observacao})` : "";
  return `${ingredient.item} - ${quantity}${note}`;
}

function nutritionToText(recipe: NonNullable<ImportedRecipeResponse["receita"]>): string {
  const nutrition = recipe.nutricao;
  const parts = [
    nutrition.calorias ? `${nutrition.calorias} kcal` : null,
    nutrition.proteina_g ? `${nutrition.proteina_g}g proteina` : null,
    nutrition.carbo_g ? `${nutrition.carbo_g}g carbo` : null,
    nutrition.gordura_g ? `${nutrition.gordura_g}g gordura` : null,
    nutrition.fibra_g ? `${nutrition.fibra_g}g fibra` : null,
  ].filter(Boolean);
  return parts.length > 0 ? `${parts.join(" | ")} por porcao (estimativa IA)` : "Macros nao informados; estimativa IA pendente.";
}

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseShoppingItem(line: string): ShoppingItem {
  const [namePart, ...quantityParts] = line.split(" - ");
  const quantity = quantityParts.join(" - ").replace(/\s*\([^)]*\)\s*$/, "").trim() || "a gosto";
  return {
    id: Math.random().toString(36).slice(2, 9),
    name: namePart.trim(),
    quantity,
    checked: false,
    category: "receita-importada",
  };
}

export default function RecipeImporter({ preferences, isPremium, onShowPaywall, onImported }: RecipeImporterProps) {
  const [url, setUrl] = useState("");
  const [manualText, setManualText] = useState("");
  const [showManualText, setShowManualText] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<RecipeDraft | null>(null);

  const canImport = useMemo(() => Boolean(url.trim() || manualText.trim()), [url, manualText]);

  const handleImport = async (event: FormEvent) => {
    event.preventDefault();
    if (!isPremium) {
      onShowPaywall();
      return;
    }
    if (!canImport) {
      toast.error("Cole um link ou o texto da receita para importar.");
      return;
    }

    setLoading(true);
    try {
      const response = await authFetch("/api/gemini/import-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || undefined,
          texto: manualText.trim() || undefined,
          preferences,
        }),
      });
      const data = (await response.json()) as ImportedRecipeResponse;
      if (!response.ok || data.erro || data.error) {
        throw new Error(data.erro || data.error || "Falha ao importar receita.");
      }
      if (data.precisa_texto_manual) {
        setShowManualText(true);
        toast.info(data.motivo || "Cole a legenda ou o texto da receita para continuar.");
        return;
      }
      if (!data.receita) {
        throw new Error("Resposta sem receita estruturada.");
      }

      setDraft({
        title: data.receita.titulo,
        description: data.receita.descricao ?? "",
        servings: data.receita.porcoes,
        prepTimeMin: data.receita.tempo_preparo_min,
        ingredientsText: data.receita.ingredientes.map(formatIngredient).join("\n"),
        stepsText: data.receita.passos.join("\n"),
        nutritionSummary: nutritionToText(data.receita),
        confidence: data.receita.confianca,
        missingInfo: data.receita.faltando,
        sourcePlatform: data.origem?.platform,
        sourceUrl: data.origem?.source_url,
      });
      toast.success("Receita importada. Revise o preview antes de salvar.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!draft) return;
    const recipe: RecipeResult = {
      title: draft.title.trim() || "Receita importada",
      ingredients: lines(draft.ingredientsText),
      instructions: lines(draft.stepsText),
      prepTime: draft.prepTimeMin ? `${draft.prepTimeMin} min` : "Tempo nao informado",
      matchPercentage: 100,
      nutritionSummary: draft.nutritionSummary,
      sourcePlatform: draft.sourcePlatform,
      sourceUrl: draft.sourceUrl,
      confidence: draft.confidence,
      missingInfo: draft.missingInfo,
      servings: draft.servings,
    };
    const shoppingItems = recipe.ingredients.map(parseShoppingItem);
    onImported(recipe, shoppingItems);
    toast.success("Receita salva no livro e ingredientes enviados para compras.");
    setDraft(null);
    setManualText("");
    setUrl("");
    setShowManualText(false);
  };

  return (
    <section className="bg-white border border-stone-100 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-heading font-extrabold text-stone-800 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-pink-500" />
            Importar receita de video
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Cole um link do TikTok, Instagram ou YouTube. Se a legenda bloquear, cole o texto manualmente.
          </p>
        </div>
        <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 bg-pink-50 text-pink-600 border border-pink-100 rounded-full">
          Novo
        </span>
      </div>

      <form onSubmit={handleImport} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase font-extrabold text-stone-400 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" /> Link do video
          </span>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.tiktok.com/... ou https://instagram.com/reel/..."
            className="w-full text-xs p-3 outline-none border border-stone-200 rounded-2xl bg-stone-50 font-semibold focus:border-pink-300 focus:bg-white transition-all"
          />
        </label>

        {(showManualText || manualText) && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-extrabold text-stone-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Texto da receita
            </span>
            <textarea
              value={manualText}
              onChange={(event) => setManualText(event.target.value)}
              rows={5}
              placeholder="Cole aqui legenda, ingredientes ou modo de preparo..."
              className="w-full text-xs p-3 outline-none border border-stone-200 rounded-2xl bg-stone-50 font-semibold focus:border-pink-300 focus:bg-white transition-all resize-none"
            />
          </label>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowManualText((current) => !current)}
            className="px-3 py-2 border border-stone-200 text-stone-600 bg-white hover:bg-stone-50 text-xs font-bold rounded-xl btn-interactive"
          >
            {showManualText ? "Ocultar texto" : "Colar texto"}
          </button>
          <button
            type="submit"
            disabled={loading || !canImport}
            className="flex-1 px-4 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl shadow-md shadow-pink-100 btn-interactive flex items-center justify-center gap-2"
          >
            <Wand2 className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Importando..." : "Importar com IA"}
          </button>
        </div>
      </form>

      {draft && (
        <div className="border-t border-stone-100 pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-heading font-extrabold text-sm text-stone-800">Preview editavel</h4>
              <p className="text-[11px] text-stone-500">Ajuste antes de salvar no livro de receitas.</p>
            </div>
            {draft.confidence && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                Confianca {draft.confidence}
              </span>
            )}
          </div>

          {draft.missingInfo.length > 0 && (
            <div className="text-[11px] bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Revise: {draft.missingInfo.join(", ")}</span>
            </div>
          )}

          <input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            className="w-full text-sm p-3 outline-none border border-stone-200 rounded-2xl bg-stone-50 font-extrabold focus:border-pink-300 focus:bg-white transition-all"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={1}
              value={draft.servings}
              onChange={(event) => setDraft({ ...draft, servings: Number(event.target.value) || 1 })}
              className="w-full text-xs p-3 outline-none border border-stone-200 rounded-2xl bg-stone-50 font-semibold focus:border-pink-300 focus:bg-white transition-all"
              aria-label="Porcoes"
            />
            <input
              type="number"
              min={0}
              value={draft.prepTimeMin ?? ""}
              onChange={(event) => setDraft({ ...draft, prepTimeMin: Number(event.target.value) || null })}
              className="w-full text-xs p-3 outline-none border border-stone-200 rounded-2xl bg-stone-50 font-semibold focus:border-pink-300 focus:bg-white transition-all"
              aria-label="Tempo de preparo em minutos"
              placeholder="Minutos"
            />
          </div>

          <textarea
            value={draft.ingredientsText}
            onChange={(event) => setDraft({ ...draft, ingredientsText: event.target.value })}
            rows={5}
            className="w-full text-xs p-3 outline-none border border-stone-200 rounded-2xl bg-stone-50 font-semibold focus:border-pink-300 focus:bg-white transition-all resize-none"
            aria-label="Ingredientes"
          />

          <textarea
            value={draft.stepsText}
            onChange={(event) => setDraft({ ...draft, stepsText: event.target.value })}
            rows={5}
            className="w-full text-xs p-3 outline-none border border-stone-200 rounded-2xl bg-stone-50 font-semibold focus:border-pink-300 focus:bg-white transition-all resize-none"
            aria-label="Modo de preparo"
          />

          <div className="text-[11px] bg-green-50 border border-green-100 text-green-800 rounded-2xl p-3">
            {draft.nutritionSummary}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-95 text-white text-xs font-extrabold rounded-2xl shadow-md shadow-pink-100 btn-interactive flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar no livro
            <ShoppingCart className="w-4 h-4" />
            enviar ingredientes
          </button>
        </div>
      )}
    </section>
  );
}
