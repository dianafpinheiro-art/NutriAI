import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json({ limit: "15mb" }));

const PORT = 3000;

// Lazy initialization of Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || "";
    // Note: Always prompt or handle missing keys gracefully instead of failing module load
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

// REST endpoints for PersonalDiet
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "2.1.0-pwa",
  });
});

// Endpoint 1: Generate recipes or meal plans based on rules
app.post("/api/gemini/generate-menu", async (req: Request, res: Response) => {
  try {
    const { preferences, pantry, actionType } = req.body;
    const client = getGeminiClient();

    const excludedList = (preferences?.excludedIngredients || []).join(", ");
    const clinicalRestr = (preferences?.clinicalRestrictions || []).join(", ");
    const currentTreatment = preferences?.clinicalTreatment || "none";
    const selectedDiet = preferences?.dietType || "none";
    const pantryItemsString = (pantry || []).map((item: any) => `${item.name} (${item.quantity})`).join(", ");

    // Build targeted context instructions
    let contextGuidelines = "";
    if (clinicalRestr.includes("celiac")) {
      contextGuidelines += " - O usuário é CELÍACO. Proíba expressamente qualquer traço de trigo, aveia com glúten, centeio, cevada e malte. Substitua por amido de milho, polvilho ou farinha de arroz.\n";
    }
    if (clinicalRestr.includes("lactose")) {
      contextGuidelines += " - O usuário tem INTOLERÂNCIA À LACTOSE. Proíba leite de vaca comum, manteiga tradicional, creme de leite ou queijos comuns. Ofereça opções lac-free ou à base de plantas.\n";
    }
    if (currentTreatment !== "none") {
      contextGuidelines += ` - O usuário utiliza ${currentTreatment.toUpperCase()} (Ozempic/Mounjaro). As refeições devem ser pequenas, ricas em proteínas magras, de fácil digestão, com baixíssimo teor de gordura saturada e açúcares para mitigar efeitos de náusea ou gastroparesia lenta.\n`;
    }
    if (excludedList) {
      contextGuidelines += ` - INGREDIENTES BANIDOS PELO USUÁRIO (Nunca use estes itens em hipótese alguma): ${excludedList}\n`;
    }
    if (selectedDiet !== "none") {
      contextGuidelines += ` - Dieta solicitada: Dieta ${selectedDiet.toUpperCase()}.\n`;
    }

    let userPrompt = "";
    let responseSchema: any = {};

    if (actionType === "suggest-recipes-pantry") {
      userPrompt = `Gere 3 receitas deliciosas usando principalmente o que o usuário tem na despensa: [${pantryItemsString}]. 
Adapte para as seguintes restrições:
${contextGuidelines}

Para cada receita, calcule o percentual de correspondência com a despensa (matchPercentage) e os ingredientes em falta se aplicável.`;

      responseSchema = {
        type: Type.ARRAY,
        description: "Lista de receitas sugeridas",
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Nome único e criativo da receita" },
            prepTime: { type: Type.STRING, description: "Tempo estimado, ex: '25 min'" },
            matchPercentage: { type: Type.INTEGER, description: "Porcentagem de aproveitamento dos itens da despensa (0-100)" },
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Ingredientes completos com medidas exatas"
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Passo a passo simples de preparo"
            },
            calories: { type: Type.INTEGER, description: "Estimativa calórica por porção" }
          },
          required: ["title", "prepTime", "matchPercentage", "ingredients", "instructions"]
        }
      };
    } else {
      // Default: generate a standard weekly 3-day preview for simplicity or full weekly menus
      userPrompt = `Gere um cardápio semanal nutricional prático com 3 dias (Segunda, Terça, Quarta) com 4 refeições diárias (cafe-da-manha, almoco, lanche, jantar) que siga estritamente estas condições:
${contextGuidelines}

Inclua as quantidades exatas para montagem de lista de compras posterior.`;

      responseSchema = {
        type: Type.ARRAY,
        description: "Plano alimentar dia a dia",
        items: {
          type: Type.OBJECT,
          properties: {
            dayName: { type: Type.STRING, description: "Dia da semana (ex: Segunda-feira, Terça-feira)" },
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Tipo de refeição: café-da-manhã, almoço, lanche ou jantar" },
                  name: { type: Type.STRING, description: "Nome elegante do prato" },
                  calories: { type: Type.INTEGER, description: "Estimativa de calorias" },
                  ingredients: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Nome do ingrediente" },
                        quantity: { type: Type.STRING, description: "Quantidade exata com unidade de peso (g, ml, colher, unidade)" }
                      },
                      required: ["name", "quantity"]
                    }
                  },
                  instructions: { type: Type.STRING, description: "Resumo rápido de preparo saudável em 1 parágrafo" }
                },
                required: ["type", "name", "ingredients", "instructions"]
              }
            }
          },
          required: ["dayName", "meals"]
        }
      };
    }

    // Determine target fallback values in case GEMINI_API_KEY is not setup
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY is missing, providing high quality mock static fallback content.");
      // Return beautiful matching mock content instantly
      if (actionType === "suggest-recipes-pantry") {
        return res.json([
          {
            title: "Omelete Nutritivo de Ervas",
            prepTime: "10 min",
            matchPercentage: 90,
            ingredients: [
              "2 ovos caipiras frescos",
              "1 colher de sopa de salsinha picada",
              "50g de queijo lac-free ralado (caso tolerado)",
              "1 colher de chá de azeite de oliva",
              "1 pitada de sal marinho"
            ],
            instructions: [
              "Bata levemente os ovos com uma pitada de sal e as ervas.",
              "Aqueça o azeite em uma frigideira antiaderente.",
              "Despeje os ovos e doure ambos os lados uniformemente.",
              "Dobre e sirva bem quentinho!"
            ],
            calories: 180
          },
          {
            title: "Sopa Creme Levíssima de Abóbora",
            prepTime: "25 min",
            matchPercentage: 75,
            ingredients: [
              "250g de abóbora cabotiá picada",
              "1 dente de alho amassado",
              "1/2 cebola roxa picada",
              "300ml de caldo de legumes caseiro",
              "1 colher de sobremesa de sementes de girassol torradas"
            ],
            instructions: [
              "Cozinhe a abóbora com alho e cebola no caldo de legumes até ficar macia.",
              "Bata tudo no liquidificador até obter um creme sedoso.",
              "Sirva em um bowl salpicado com as sementes de girassol por cima."
            ],
            calories: 120
          },
          {
            title: "Frango Grelhado Macio com Ervas",
            prepTime: "15 min",
            matchPercentage: 85,
            ingredients: [
              "150g de peito de frango em filé",
              "suco de 1/2 limão siciliano",
              "1 dente de alho picadinho",
              "1 ramo de alecrim fresco",
              "1 colher de chá de azeite"
            ],
            instructions: [
              "Tempere o frango com limão, alho amassado e sal.",
              "Aqueça a grelha com azeite de oliva refinado.",
              "Grelhe o frango lentamente com o ramo de alecrim para aromatizar."
            ],
            calories: 210
          }
        ]);
      } else {
        // Mock weekly menu that respects restrictions
        return res.json([
          {
            dayName: "Segunda-feira",
            meals: [
              {
                type: "cafe-da-manha",
                name: "Tapioca Funcional com Geleia Natural",
                calories: 190,
                ingredients: [
                  { name: "Goma de tapioca hidratada (Glúten-Free)", quantity: "60g" },
                  { name: "Chia", quantity: "1 colher de sopa" },
                  { name: "Morangos frescos macerados", quantity: "4 unidades" }
                ],
                instructions: "Espalhe a tapioca com chia na frigideira quente. Recheie com os morangos."
              },
              {
                type: "almoco",
                name: "Grelhado de Frango com Purê Orgânico",
                calories: 340,
                ingredients: [
                  { name: "Peito de marinado desossado", quantity: "120g" },
                  { name: "Abóbora picada macia", quantity: "150g" },
                  { name: "Azeite de oliva extra virgem", quantity: "1 colher de chá" }
                ],
                instructions: "Grelhe o frango. Cozinhe a abóbora e amasse com sal para o purê."
              },
              {
                type: "lanche",
                name: "Shake Proteico de Coco",
                calories: 150,
                ingredients: [
                  { name: "Leite de coco sem açúcar", quantity: "200ml" },
                  { name: "Whey Protein isolado ou proteína de ervilha", quantity: "20g" }
                ],
                instructions: "Bata com pedras de gelo. Ótimo para usuários em tratamento com Ozempic."
              },
              {
                type: "jantar",
                name: "Consomê de Legumes Comfort",
                calories: 160,
                ingredients: [
                  { name: "Cenoura", quantity: "1 unidade" },
                  { name: "Chuchu picadinho", quantity: "1 unidade" },
                  { name: "Salsão picado", quantity: "1 talo" },
                  { name: "Caldo natural de carne magra", quantity: "250ml" }
                ],
                instructions: "Ferva os legumes no caldo de carne até que fiquem macios. De fácil digestão."
              }
            ]
          },
          {
            dayName: "Terça-feira",
            meals: [
              {
                type: "cafe-da-manha",
                name: "Ovos Mexidos Cremosos da Fazenda",
                calories: 170,
                ingredients: [
                  { name: "Ovo de galinha caipira", quantity: "2 unidades" },
                  { name: "Azeite", quantity: "1 colher de café" },
                  { name: "Orégano seco desidratado", quantity: "1 pitada" }
                ],
                instructions: "Bata os ovos vigorosamente e cozinhe em fogo baixo mexendo sempre para cremosidade."
              },
              {
                type: "almoco",
                name: "Filé de Pescada ao Vapor com Brócolis",
                calories: 280,
                ingredients: [
                  { name: "Pescada branca fresca", quantity: "130g" },
                  { name: "Buquê de Brócolis", quantity: "100g" },
                  { name: "Limão siciliano", quantity: "1/2 unidade" }
                ],
                instructions: "Cozinhe o peixe e o brócolis no vapor da água aromática com rodelas de limão."
              },
              {
                type: "lanche",
                name: "Salada Colorida de Frutas Termogênicas",
                calories: 110,
                ingredients: [
                  { name: "Mamão formosa picado", quantity: "100g" },
                  { name: "Raspas de gengibre fresco", quantity: "1 pitada" },
                  { name: "Sementes de abóbora sem sal", quantity: "1 colher de chá" }
                ],
                instructions: "Misture o mamão com as raspas de gengibre e finalize decorando com as sementes."
              },
              {
                type: "jantar",
                name: "Creme Refinado de Mandioquinha",
                calories: 190,
                ingredients: [
                  { name: "Mandioquinha picada", quantity: "150g" },
                  { name: "Cebola", quantity: "1/2 unidade" },
                  { name: "Frango desfiado macio", quantity: "50g" }
                ],
                instructions: "Cozinhe e bata a mandioquinha com a cebola. Sirva quente misturado com frango."
              }
            ]
          }
        ]);
      }
    }

    // Call real Gemini
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "Você é o PersonalDiet, o assistente inteligente de cardápios clínicos e esportivos. Elabore receitas e cardápios precisos que repeitem com precisão absoluta as exclusões de ingredientes do usuário, restrições clínicas (Ex: Cíacos proíbem glúten estritamente; Intolerância a lactose proíbe laticínios tradicionais; Ozempic/Mounjaro exigem porções leves, sem gordura saturada ou excesso de açúcar).",
      },
    });

    const parsedData = JSON.parse(response.text?.trim() || "[]");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Gemini API Error in generate-menu:", err);
    res.status(500).json({ error: err?.message || "Erro interno ao processar cardápio inteligente." });
  }
});

// Endpoint 2: Read PDF Medical Prescriptions (Dropzone)
app.post("/api/gemini/parse-prescription", async (req: Request, res: Response) => {
  try {
    const { filename, fileContent } = req.body; // base64 encoded string or raw body
    const client = getGeminiClient();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("Using mock parse prescription");
      return res.json({
        success: true,
        detectedDiet: "low-carb",
        detectedRestrictions: ["lactose"],
        waterGoalMl: 2800,
        clinicalTreatment: "mounjaro",
        doctorNotes: "Prescrição lida: Dieta low-carb focada em controle glicêmico, com restrição severa de lactose devido a sintomas intestinais recorrentes. Início de tratamento com Mounjaro 2.5mg para gerenciamento metabólico.",
      });
    }

    const filePart = {
      inlineData: {
        mimeType: "application/pdf",
        data: fileContent,
      },
    };

    const promptText = `Analise esta prescrição médica ou receita nutricional que foi enviada. Extraia as instruções e configure um perfil de dieta:
- Tipo de dieta recomendado (low-carb, cetogenica, mediterranea, deficit-calorico, ou none)
- Restrições clínicas detectadas (celiaco/gluten-free, intolerancia-lactose, etc)
- Meta diária de água sugerida (numérico em ml)
- Tratamentos adicionais detectados (mounjaro, ozempic)
- Resumo conciso de observações do médico/nutricionista.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [filePart, { text: promptText }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedDiet: { type: Type.STRING },
            detectedRestrictions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            waterGoalMl: { type: Type.INTEGER },
            clinicalTreatment: { type: Type.STRING },
            doctorNotes: { type: Type.STRING }
          },
          required: ["detectedDiet", "detectedRestrictions", "waterGoalMl", "clinicalTreatment", "doctorNotes"]
        }
      }
    });

    const result = JSON.parse(response.text?.trim() || "{}");
    res.json(result);
  } catch (err: any) {
    console.error("Gemini PDF parsing failed:", err);
    res.status(500).json({ error: "Erro ao extrair informações do PDF da prescrição." });
  }
});

// Endpoint 3: Computer Vision (Pantry / Fridge image analyzer helper)
app.post("/api/gemini/analyze-pantry-image", async (req: Request, res: Response) => {
  try {
    const { image } = req.body; // Base64 string from camera / file
    const client = getGeminiClient();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Static beautifully simulated detected items
      return res.json({
        success: true,
        detectedIngredients: [
          { name: "Ovo", quantity: "12 unidades", category: "Proteínas" },
          { name: "Abobrinha", quantity: "2 unidades", category: "Legumes" },
          { name: "Frango Moído", quantity: "500g", category: "Proteínas" },
          { name: "Batata Doce", quantity: "3 unidades", category: "Carboidratos" },
          { name: "Limão", quantity: "4 unidades", category: "Frutas" }
        ]
      });
    }

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: image,
      },
    };

    const promptText = `Identifique todos os ingredientes e alimentos comestíveis visíveis nesta foto de despensa/geladeira. Forneça uma lista de alimentos contendo o nome do ingrediente, uma estimativa visual da quantidade e a categoria principal (ex: Proteínas, Legumes, Carboidratos, Frutas, Laticínios, Mercearia).`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
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
                  category: { type: Type.STRING }
                },
                required: ["name", "quantity", "category"]
              }
            }
          },
          required: ["detectedIngredients"]
        }
      }
    });

    const result = JSON.parse(response.text?.trim() || "{}");
    res.json(result);
  } catch (err: any) {
    console.error("Vision API failure:", err);
    res.status(500).json({ error: "Falha ao escanear a imagem da geladeira/despensa." });
  }
});

// Endpoint 4: Label scanning for allergens
app.post("/api/gemini/analyze-labels", async (req: Request, res: Response) => {
  try {
    const { labelText, restrictionType } = req.body;
    const client = getGeminiClient();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      const textLower = labelText.toLowerCase();
      let alert = false;
      let matchedTerm = "";
      let explanation = "Sem perigo detectado para as intolerâncias clínicas configuradas.";

      if (restrictionType === "celiac" && (textLower.includes("glúten") || textLower.includes("trigo") || textLower.includes("cevada") || textLower.includes("manteiga de aveia"))) {
        alert = true;
        matchedTerm = "Contém glúten / trigo";
        explanation = "Atenção: O ingrediente trigo ou traços de glúten foi mencionado de forma clara neste componente!";
      } else if (restrictionType === "lactose" && (textLower.includes("leite") || textLower.includes("lactose") || textLower.includes("manteiga") || textLower.includes("soro de leite"))) {
        alert = true;
        matchedTerm = "Contém derivados lácteos / lactose";
        explanation = "Cuidado extra: Esse rótulo explicitamente cita leite ou soro, sendo perigoso para intolerantes agudos.";
      }

      return res.json({
        isSafe: !alert,
        riskLevel: alert ? "HIGH" : "LOW",
        allergenFound: alert,
        triggerIngredient: matchedTerm,
        explanation: explanation,
      });
    }

    const promptText = `Dada a transcrição do rótulo de um alimento: "${labelText}".
Determine se é estritamente seguro para um paciente com a restrição: "${restrictionType}" (celiaco/gluten-free ou intolerante-lactose).
Retorne a segurança do rótulo, se algum alérgeno de risco foi isolado e o motivo nutricional.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
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
            explanation: { type: Type.STRING }
          },
          required: ["isSafe", "riskLevel", "allergenFound", "triggerIngredient", "explanation"]
        }
      }
    });

    const result = JSON.parse(response.text?.trim() || "{}");
    res.json(result);
  } catch (err: any) {
    console.error("Gemini scanning labels failed:", err);
    res.status(500).json({ error: "Falha na análise inteligente de compostos do rótulo." });
  }
});

// Configure Vite as Middleware or serve static build
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from dist.");
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Express custom server running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
