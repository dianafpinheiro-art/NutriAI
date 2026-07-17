import { createHash } from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
import { logger } from "./logger.js";
import { sanitizeString, parseCleanJson, cleanEnv } from "../utils/helpers.js";

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

interface PreferencesInput {
  excludedIngredients: string[];
  clinicalRestrictions: string[];
  clinicalTreatment: string;
  dietType: string;
}

interface PantryItemInput {
  name: string;
  quantity: string;
  category?: string;
  id?: string;
}

const geminiCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = cleanEnv(process.env.GEMINI_API_KEY);
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

function getCacheKey(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex");
}

function getFromCache(prompt: string): unknown | null {
  const key = getCacheKey(prompt);
  const entry = geminiCache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    geminiCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(prompt: string, data: unknown): void {
  if (geminiCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = geminiCache.keys().next().value as string | undefined;
    if (firstKey) {
      geminiCache.delete(firstKey);
    }
  }
  const key = getCacheKey(prompt);
  geminiCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function cachedGeminiCall(prompt: string, generateFn: () => Promise<unknown>, contentHash?: string): Promise<unknown> {
  // Include content hash in cache key so different images/PDFs with the same prompt text
  // don't return each other's results (critical for analyzePantryImage and parsePrescription).
  const cacheKey = contentHash ? `${prompt}::${contentHash}` : prompt;
  const cached = getFromCache(cacheKey);
  if (cached) {
    logger("info", "Cache hit for Gemini prompt");
    return cached;
  }
  const result = await generateFn();
  setCache(cacheKey, result);
  return result;
}

interface BuildPromptResult {
  prompt: string;
  responseSchema: Record<string, unknown>;
}

function buildPrompt(
  preferences: PreferencesInput,
  pantry: PantryItemInput[],
  actionType: string,
  localeInstruction?: string
): BuildPromptResult {
  const excludedList = sanitizeString((preferences.excludedIngredients || []).join(", "), 500);
  const clinicalRestr = sanitizeString((preferences.clinicalRestrictions || []).join(", "), 500);
  const currentTreatment = sanitizeString(preferences.clinicalTreatment || "none", 500);
  const selectedDiet = sanitizeString(preferences.dietType || "none", 500);
  const pantryItems = (pantry || []).map((item) => ({
    name: sanitizeString(item.name, 500),
    quantity: sanitizeString(item.quantity, 500),
  }));
  const localeInstr = sanitizeString(localeInstruction || "Responda todo o conteudo em portugues brasileiro.", 500);

  let contextGuidelines = "";
  if (clinicalRestr.includes("celiac")) {
    contextGuidelines += " - O usuario e CELIACO. Proiba expressamente qualquer traco de trigo, aveia com gluten, centeio, cevada e malte. Substitua por amido de milho, polvilho ou farinha de arroz.\n";
  }
  if (clinicalRestr.includes("lactose")) {
    contextGuidelines += " - O usuario tem INTOLERANCIA A LACTOSE. Proiba leite de vaca comum, manteiga tradicional, creme de leite ou queijos comuns. Ofereca opcoes lac-free ou a base de plantas.\n";
  }
  if (currentTreatment !== "none") {
    contextGuidelines += ` - O usuario utiliza ${currentTreatment.toUpperCase()} (Ozempic/Mounjaro). As refeicoes devem ser pequenas, ricas em proteinas magras, de facil digestao, com baixissimo teor de gordura saturada e acucares para mitigar efeitos de nausea ou gastroparesia lenta.\n`;
  }
  if (excludedList) {
    contextGuidelines += ` - INGREDIENTES BANIDOS PELO USUARIO (Nunca use estes itens em hipotese alguma): ${excludedList}\n`;
  }
  if (selectedDiet !== "none") {
    contextGuidelines += ` - Dieta solicitada: Dieta ${selectedDiet.toUpperCase()}.\n`;
  }

  const userData = {
    actionType,
    clinicalRestr,
    currentTreatment,
    selectedDiet,
    excludedList,
    pantryItems,
    localeInstruction: localeInstr,
    contextGuidelines,
  };

  let userPrompt = "";
  let responseSchema: Record<string, unknown>;

  if (actionType === "suggest-recipes-pantry") {
    userPrompt = `Voce e um assistente focado em fazer o usuario ECONOMIZAR DINHEIRO. 
Gere 3 receitas deliciosas usando EXCLUSIVAMENTE (ou o maximo possivel) o que o usuario ja tem na despensa/geladeira. 
O objetivo e evitar que o usuario va ao supermercado. Se faltar algum ingrediente, sugira substituicoes criativas com o que ele ja tem.
Adapte para as seguintes restricoes fornecidas no campo contextGuidelines.
Use os dados fornecidos em JSON para elaborar a resposta.

Dados do usuario em JSON:
\`\`\`json
${JSON.stringify(userData)}
\`\`\`

Para cada receita, calcule o percentual de correspondencia com a despensa (matchPercentage). De preferencia a receitas com matchPercentage acima de 90%.`;

    responseSchema = {
      type: Type.ARRAY,
      description: "Lista de receitas sugeridas",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Nome unico e criativo da receita" },
          prepTime: { type: Type.STRING, description: "Tempo estimado, ex: '25 min'" },
          matchPercentage: { type: Type.INTEGER, description: "Porcentagem de aproveitamento dos itens da despensa (0-100)" },
          ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Ingredientes completos com medidas exatas",
          },
          instructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Passo a passo simples de preparo",
          },
          calories: { type: Type.INTEGER, description: "Estimativa calorica por porcao" },
        },
        required: ["title", "prepTime", "matchPercentage", "ingredients", "instructions"],
      },
    };
  } else {
    userPrompt = `Gere um cardapio semanal nutricional pratico com 3 dias (Segunda, Terca, Quarta) com 4 refeicoes diarias (cafe-da-manha, almoco, lanche, jantar) que siga estritamente as condicoes fornecidas em contextGuidelines.
Use os dados fornecidos em JSON.

Dados do usuario em JSON:
\`\`\`json
${JSON.stringify(userData)}
\`\`\`

Inclua as quantidades exatas para montagem de lista de compras posterior.`;

    responseSchema = {
      type: Type.ARRAY,
      description: "Plano alimentar dia a dia",
      items: {
        type: Type.OBJECT,
        properties: {
          dayName: { type: Type.STRING, description: "Dia da semana (ex: Segunda-feira, Terca-feira)" },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "Tipo de refeicao: cafe-da-manha, almoco, lanche ou jantar" },
                name: { type: Type.STRING, description: "Nome elegante do prato" },
                calories: { type: Type.INTEGER, description: "Estimativa de calorias" },
                ingredients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: "Nome do ingrediente" },
                      quantity: { type: Type.STRING, description: "Quantidade exata com unidade de peso (g, ml, colher, unidade)" },
                    },
                    required: ["name", "quantity"],
                  },
                },
                instructions: { type: Type.STRING, description: "Resumo rapido de preparo saudavel em 1 paragrafo" },
              },
              required: ["type", "name", "ingredients", "instructions"],
            },
          },
        },
        required: ["dayName", "meals"],
      },
    };
  }

  return { prompt: userPrompt, responseSchema };
}

export async function generateMenu(
  preferences: PreferencesInput,
  pantry: PantryItemInput[],
  actionType: string,
  localeInstruction?: string
): Promise<unknown> {
  const apiKey = cleanEnv(process.env.GEMINI_API_KEY);
  const useMock = process.env.USE_MOCK_AI === "true";

  logger("info", "generate-menu requested", { apiKeyPresent: !!apiKey, useMock });

  if (!apiKey) {
    if (!useMock) {
      logger("error", "GEMINI_API_KEY ausente e USE_MOCK_AI nao ativado");
      throw new Error("Servico de IA nao configurado.");
    }
    logger("warn", "Usando mock fallback porque GEMINI_API_KEY ausente e USE_MOCK_AI=true");
    return getHealthCompliantFallback(preferences, actionType);
  }

  if (useMock) {
    logger("warn", "Usando mock fallback por USE_MOCK_AI=true");
    return getHealthCompliantFallback(preferences, actionType);
  }

  const { prompt, responseSchema } = buildPrompt(preferences, pantry, actionType, localeInstruction);

  return cachedGeminiCall(prompt, async () => {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as unknown,
        systemInstruction: "Voce e o PersonalDiet, o assistente inteligente de cardapios clinicos e esportivos. Elabore receitas e cardapios precisos que respeitem com precisao absoluta as exclusoes de ingredientes do usuario, restricoes clinicas (Ex: Celiacos proibem gluten estritamente; Intolerancia a lactose proibe laticinios tradicionais; Ozempic/Mounjaro exigem porcoes leves, sem gordura saturada ou excesso de acucar).",
      },
    });

    const responseText = response.text || "";
    return parseCleanJson(responseText);
  });
}

export async function parsePrescription(fileContent: string): Promise<unknown> {
  const apiKey = cleanEnv(process.env.GEMINI_API_KEY);
  const useMock = process.env.USE_MOCK_AI === "true";

  logger("info", "parse-prescription requested", { apiKeyPresent: !!apiKey, useMock });

  if (!apiKey) {
    if (!useMock) {
      logger("error", "GEMINI_API_KEY ausente e USE_MOCK_AI nao ativado");
      throw new Error("Servico de IA nao configurado.");
    }
    logger("warn", "Usando mock parse prescription");
    return getMockPrescriptionResult();
  }

  if (useMock) {
    logger("warn", "Usando mock parse prescription por USE_MOCK_AI=true");
    return getMockPrescriptionResult();
  }

  const filePart = {
    inlineData: {
      mimeType: "application/pdf" as const,
      data: fileContent,
    },
  };

  const promptText = `Analise esta prescricao medica ou receita nutricional que foi enviada. Extraia as instrucoes e configure um perfil de dieta:
- Tipo de dieta recomendado (low-carb, cetogenica, mediterranea, deficit-calorico, ou none)
- Restricoes clinicas detectadas (celiaco/gluten-free, intolerancia-lactose, etc)
- Meta diaria de agua sugerida (numerico em ml)
- Tratamentos adicionais detectados (mounjaro, ozempic)
- Intervalo alimentar recomendado em horas, se a prescricao mencionar comer de X em X horas; se nao mencionar, use 3
- Resumo conciso de observacoes do medico/nutricionista.`;

  return cachedGeminiCall(promptText, async () => {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [filePart, { text: promptText }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedDiet: { type: Type.STRING },
            detectedRestrictions: { type: Type.ARRAY, items: { type: Type.STRING } },
            waterGoalMl: { type: Type.INTEGER },
            clinicalTreatment: { type: Type.STRING },
            doctorNotes: { type: Type.STRING },
            mealIntervalHours: { type: Type.INTEGER },
          },
          required: ["detectedDiet", "detectedRestrictions", "waterGoalMl", "clinicalTreatment", "doctorNotes", "mealIntervalHours"],
        } as unknown,
      },
    });

    return parseCleanJson(response.text?.trim() || "{}");
  }, createHash("sha256").update(fileContent).digest("hex").slice(0, 32));
}

export async function analyzePantryImage(image: string): Promise<unknown> {
  const apiKey = cleanEnv(process.env.GEMINI_API_KEY);
  const useMock = process.env.USE_MOCK_AI === "true";

  logger("info", "analyze-pantry-image requested", { apiKeyPresent: !!apiKey, useMock });

  if (!apiKey) {
    if (!useMock) {
      logger("error", "GEMINI_API_KEY ausente e USE_MOCK_AI nao ativado");
      throw new Error("Servico de IA nao configurado.");
    }
    return getMockPantryResult();
  }

  if (useMock) {
    return getMockPantryResult();
  }

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg" as const,
      data: image,
    },
  };

  const promptText = `Identifique todos os ingredientes e alimentos comestiveis visiveis nesta foto de despensa/geladeira. Forneca uma lista de alimentos contendo o nome do ingrediente, uma estimativa visual da quantidade e a categoria principal (ex: Proteinas, Legumes, Carboidratos, Frutas, Laticinios, Mercearia).`;

  return cachedGeminiCall(promptText, async () => {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [imagePart, { text: promptText }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedIngredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ["name", "quantity", "category"],
              },
            },
          },
          required: ["detectedIngredients"],
        } as unknown,
      },
    });

    return parseCleanJson(response.text?.trim() || "{}");
  }, createHash("sha256").update(image).digest("hex").slice(0, 32));
}

function analyzeLabelsFallback(sanitizedLabel: string, restrictionType: "celiac" | "lactose"): unknown {
  const textLower = sanitizedLabel.toLowerCase();
  let alert = false;
  let matchedTerm = "";
  let explanation = "Sem perigo detectado para as intolerancias clinicas configuradas.";

  if (restrictionType === "celiac" && (textLower.includes("gluten") || textLower.includes("trigo") || textLower.includes("cevada") || textLower.includes("manteiga de aveia"))) {
    alert = true;
    matchedTerm = "Contem gluten / trigo";
    explanation = "Atencao: O ingrediente trigo ou tracos de gluten foi mencionado de forma clara neste componente!";
  } else if (restrictionType === "lactose" && (textLower.includes("leite") || textLower.includes("lactose") || textLower.includes("manteiga") || textLower.includes("soro de leite"))) {
    alert = true;
    matchedTerm = "Contem derivados lacteos / lactose";
    explanation = "Cuidado extra: Esse rotulo explicitamente cita leite ou soro, sendo perigoso para intolerantes agudos.";
  }

  return {
    isSafe: !alert,
    riskLevel: alert ? "HIGH" : "LOW",
    allergenFound: alert,
    triggerIngredient: matchedTerm,
    explanation: explanation,
  };
}

export async function analyzeLabels(labelText: string, restrictionType: "celiac" | "lactose"): Promise<unknown> {
  const apiKey = cleanEnv(process.env.GEMINI_API_KEY);
  const useMock = process.env.USE_MOCK_AI === "true";

  logger("info", "analyze-labels requested", { apiKeyPresent: !!apiKey, useMock });

  const sanitizedLabel = sanitizeString(labelText, 10000);

  if (!apiKey) {
    if (!useMock) {
      logger("error", "GEMINI_API_KEY ausente e USE_MOCK_AI nao ativado");
      throw new Error("Servico de IA nao configurado.");
    }
    return analyzeLabelsFallback(sanitizedLabel, restrictionType);
  }

  if (useMock) {
    return analyzeLabelsFallback(sanitizedLabel, restrictionType);
  }

  const promptText = `Dada a transcricao do rotulo de um alimento: "${sanitizedLabel}".
Determine se e estritamente seguro para um paciente com a restricao: "${restrictionType}" (celiaco/gluten-free ou intolerante-lactose).
Retorne a seguranca do rotulo, se algum alergeno de risco foi isolado e o motivo nutricional.`;

  return cachedGeminiCall(promptText, async () => {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: { type: Type.BOOLEAN },
            riskLevel: { type: Type.STRING, description: "LOW, MEDIUM, HIGH" },
            allergenFound: { type: Type.BOOLEAN },
            triggerIngredient: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["isSafe", "riskLevel", "allergenFound", "triggerIngredient", "explanation"],
        } as unknown,
      },
    });

    return parseCleanJson(response.text?.trim() || "{}");
  });
}

function getMockPrescriptionResult(): unknown {
  return {
    success: true,
    detectedDiet: "low-carb",
    detectedRestrictions: ["lactose"],
    waterGoalMl: 2800,
    clinicalTreatment: "mounjaro",
    doctorNotes: "Prescricao lida: Dieta low-carb focada em controle glicemico, com restricao severa de lactose devido a sintomas intestinais recorrentes. Inicio de tratamento com Mounjaro 2.5mg para gerenciamento metabolico.",
    mealIntervalHours: 3,
  };
}

function getMockPantryResult(): unknown {
  return {
    success: true,
    detectedIngredients: [
      { name: "Ovo", quantity: "12 unidades", category: "Proteinas" },
      { name: "Abobrinha", quantity: "2 unidades", category: "Legumes" },
      { name: "Frango Moido", quantity: "500g", category: "Proteinas" },
      { name: "Batata Doce", quantity: "3 unidades", category: "Carboidratos" },
      { name: "Limao", quantity: "4 unidades", category: "Frutas" },
    ],
  };
}

function getHealthCompliantFallback(preferences: PreferencesInput, actionType: string): unknown {
  const excluded = (preferences.excludedIngredients || []).map((i: string) => i.toLowerCase().trim());
  const restrictions = preferences.clinicalRestrictions || [];
  const treatment = preferences.clinicalTreatment || "none";

  const isCeliac = restrictions.includes("celiac") || restrictions.includes("celiaco") || restrictions.includes("gluten");
  const isLactose = restrictions.includes("lactose");

  if (actionType === "suggest-recipes-pantry") {
    const pool = [
      {
        title: "Omelete Nutritivo de Ervas Finas",
        prepTime: "10 min",
        matchPercentage: 90,
        glutenFree: true,
        lactoseFree: true,
        mounjaroFriendly: true,
        ingredients: [
          "2 ovos caipiras frescos organicos",
          "1 colher de sopa de salsinha e cebolinha picadas frescas",
          "1 colher de cafe de azeite de oliva extra virgem",
          "1 pitada de sal marinho",
          "50g de espinafre baby fresco",
        ],
        instructions: [
          "Bata levemente os ovos com uma pitada de sal e as ervas.",
          "Aqueca o azeite em uma frigideira antiaderente rasa.",
          "Despeje os ovos e junte as folhas de espinafre murchas de forma equilibrada.",
          "Dobre ao meio com cuidado e sirva bem dourado.",
        ],
        calories: 145,
      },
      {
        title: "Creme de Abobora Cabotia Termogenico",
        prepTime: "25 min",
        matchPercentage: 80,
        glutenFree: true,
        lactoseFree: true,
        mounjaroFriendly: true,
        ingredients: [
          "250g de abobora cabotia cortada em cubos sem sementes",
          "1 dente de alho fresco picadinho",
          "1/2 cebola roxa picada finamente",
          "300ml de caldo de legumes natural preparado artesanalmente",
          "1 colher de sobremesa de sementes cruas de girassol torradas",
          "1 pitada de gengibre ralado",
        ],
        instructions: [
          "Cozinhe a abobora cabotia com o alho, cebola e ginger no caldo de legumes.",
          "Ferva ate a abobora ficar bem macia e murcha.",
          "Bata no liquidificador ate obter um creme leve e aveludado.",
          "Sirva em um bowl salpicado com as sementes de girassol.",
        ],
        calories: 110,
      },
      {
        title: "File de Frango Grelhado Leve com Alecrim",
        prepTime: "15 min",
        matchPercentage: 85,
        glutenFree: true,
        lactoseFree: true,
        mounjaroFriendly: true,
        ingredients: [
          "150g de file de peito de frango limpo sem gordura",
          "Suco fresco espremido do limao siciliano",
          "1 dente de alho macerado",
          "1 colher de cafe de azeite de oliva",
          "1 ramo de alecrim fresco colhido na hora",
          "Uma pitada leve de sal mineral",
        ],
        instructions: [
          "Tempere o peito de frango com limao, alho e a pitada de sal.",
          "Aqueca ligeiramente a grelha com o azeite.",
          "Grelhe lentamente ate dourar bem das duas superficies.",
          "Adicione o ramo de alecrim na frigideira ao final para exalar sabor.",
        ],
        calories: 195,
      },
      {
        title: "Atum Grelhado Selado com Gergelim",
        prepTime: "12 min",
        matchPercentage: 75,
        glutenFree: true,
        lactoseFree: true,
        mounjaroFriendly: true,
        ingredients: [
          "130g de posta de atum fresco solido",
          "1 colher de sopa de sementes mistas de gergelim preto e branco",
          "1 colher de sobremesa de azeite de oliva extra virgem",
          "Folhas de rucula fresca lavadas",
          "Sal marinho q.b.",
        ],
        instructions: [
          "Tempere a posta de atum com sal e role levemente nas sementes de gergelim.",
          "Sele a as duas partes rapidamente por 2 minutos em frigideira quente.",
          "Sirva acompanhado de folhagens de rucula temperadas.",
        ],
        calories: 220,
      },
      {
        title: "Wrap Ecologico de Alface com Proteina Leve",
        prepTime: "10 min",
        matchPercentage: 85,
        glutenFree: true,
        lactoseFree: true,
        mounjaroFriendly: true,
        ingredients: [
          "3 folhas largas e frescas de alface americana crocante",
          "110g de frango desfiado temperado levemente com ervas finas",
          "40g de tomate cereja picado ao meio",
          "1 colher de cha de azeite de oliva extra virgem",
        ],
        instructions: [
          "Lave bem e seque as folhas de alface americana.",
          "Adicione o frango desfiado temperado e misture com os tomates.",
          "Distribua a mistura no centro das folhas de alface e enrole em formato wrap.",
        ],
        calories: 125,
      },
      {
        title: "Papinha Funcional de Aveia Sem Gluten",
        prepTime: "15 min",
        matchPercentage: 80,
        glutenFree: true,
        lactoseFree: true,
        mounjaroFriendly: true,
        ingredients: [
          "30g de aveia flocada estritamente certificada livre de gluten",
          "120ml de leite vegetal de amendoa sem acucar",
          "1 colher de cha de mel puro organico",
          "Uma pitada de canela em po",
        ],
        instructions: [
          "Combine o leite de coco ou amendoa com a aveia sem gluten.",
          "Ferva por 6-8 minutos misturando sempre ate liquefazer e engrossar suavemente.",
          "Sirva polvilhada com a canela em po por cima.",
        ],
        calories: 140,
      },
    ];

    const filtered = pool.filter((recipe) => {
      if (isCeliac && !recipe.glutenFree) return false;
      if (isLactose && !recipe.lactoseFree) return false;
      if (treatment !== "none" && !recipe.mounjaroFriendly) return false;

      const textRepresent = [recipe.title, ...recipe.ingredients].join(" ").toLowerCase();
      for (const bad of excluded) {
        if (bad.length > 2 && textRepresent.includes(bad)) {
          return false;
        }
      }
      return true;
    });

    return filtered.length >= 2 ? filtered.slice(0, 3) : pool.slice(0, 3);
  } else {
    const baseMeals1 = [
      {
        type: "cafe-da-manha" as const,
        name: isLactose ? "Creme de Papaya Lac-Free" : "Creme de Papaya com Iogurte Natural",
        calories: 140,
        ingredients: [
          { name: "Mamao papaya descascado", quantity: "150g" },
          { name: isLactose ? "Iogurte vegetal/Lac-Free" : "Iogurte grego natural", quantity: "100g" },
          { name: "Chia em graos", quantity: "1 colher de cha" },
        ],
        instructions: "Bata ligeiramente as frutas vermelhas e o iogurte grego. Perfeito contra azia e de digestao ultrarrapida.",
      },
      {
        type: "almoco" as const,
        name: "Lombo de Pescada Branca ao Vapor com Alecrim",
        calories: 250,
        ingredients: [
          { name: "File fresco de pescada branca limpo", quantity: "125g" },
          { name: "Folhas verdes de couve cozida fatiada no bafo", quantity: "100g" },
          { name: "Azeite de oliva extra virgem de oliva", quantity: "1 colher de cha" },
        ],
        instructions: "Prepare o peixe lentamente no vapor da agua. Coza a couve e tempere com azeite de oliva e limao.",
      },
      {
        type: "lanche" as const,
        name: "Claras Mexidas Anti-Fadiga",
        calories: 90,
        ingredients: [
          { name: "Claras frescas de ovos ricos em albumina", quantity: "3 unidades" },
          { name: "Salsinha picadinha", quantity: "1 colher de cha" },
        ],
        instructions: "Adicione as claras na frigideira quente antiaderente sem oleo. Misture rapido por 3 minutos e consuma morno para alta recuperacao.",
      },
      {
        type: "jantar" as const,
        name: "Sopa Purificada Cremosa de Abobrinha",
        calories: 130,
        ingredients: [
          { name: "Abobrinha verde fatiada media", quantity: "200g" },
          { name: "Alho poro picado", quantity: "1/2 talo" },
          { name: "Frango desfiado em cubos cozidos", quantity: "50g" },
        ],
        instructions: "Cozinhe a abobrinha com o alho poro. Liquidifique bem ate formar sopa homogenea, acrescente frango e sirva.",
      },
    ];

    const baseMeals2 = [
      {
        type: "cafe-da-manha" as const,
        name: "Ovos Cozidos com Ervas",
        calories: 155,
        ingredients: [
          { name: "Ovos caipiras organicos frescos", quantity: "2 unidades" },
          { name: "Azeite de oliva", quantity: "1 colher de cafe" },
        ],
        instructions: "Cozinhe os ovos em fervura limpa por 8 minutos. Sirva com gotas de azeite e oregano.",
      },
      {
        type: "almoco" as const,
        name: "Frango Grelhado das Americas com Seleta",
        calories: 290,
        ingredients: [
          { name: "Peito de marinado em ervas", quantity: "120g" },
          { name: "Cenoura cozida no vapor fatiada", quantity: "80g" },
          { name: "Vagem fresca em pedacos cozida", quantity: "80g" },
        ],
        instructions: "Grelhe lentamente o file limpo de frango. Junte cenoura e vagem cozidos e quentes.",
      },
      {
        type: "lanche" as const,
        name: "Abacate Amassado com Gotas de Limao",
        calories: 120,
        ingredients: [
          { name: "Polpa fresca de abacate descascado", quantity: "80g" },
          { name: "Suco natural do limao", quantity: "1/2 colher de sopa" },
        ],
        instructions: "Amasse bem o abacate com um garfo limpo e incorpore as gotas de limao para manter verde e saboroso.",
      },
      {
        type: "jantar" as const,
        name: "Espaguete Saudavel de Cenoura",
        calories: 145,
        ingredients: [
          { name: "Cenoura cortada em fios finos espirais", quantity: "150g" },
          { name: "Molho rustico de tomate fresco", quantity: "80g" },
          { name: "Carne bovina moida magra refogada", quantity: "60g" },
        ],
        instructions: "Cozinhe os fios espirais de cenoura no vapor por 4 minutos. Cubra com molho rustico fervente e carne moida.",
      },
    ];

    return [
      {
        dayName: "Segunda-feira",
        meals: baseMeals1,
      },
      {
        dayName: "Terca-feira",
        meals: baseMeals2,
      },
      {
        dayName: "Quarta-feira",
        meals: baseMeals1.map((m) => ({ ...m, calories: (m.calories || 100) + 10 })),
      },
    ];
  }
}
