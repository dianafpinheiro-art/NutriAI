export type DietType = 'low-carb' | 'cetogenica' | 'mediterranea' | 'deficit-calorico' | 'none';
export type ClinicalRestriction = 'lactose' | 'celiac' | 'none';
export type ClinicalTreatment = 'mounjaro' | 'ozempic' | 'none';
export type Locale = 'pt' | 'en' | 'es';

export interface ReminderSettings {
  hydrationEnabled: boolean;
  hydrationIntervalMinutes: number;
  mealEnabled: boolean;
  mealIntervalHours: number;
  activeStart: string; // HH:mm
  activeEnd: string; // HH:mm
}

export interface UserPreferences {
  userName?: string;
  excludedIngredients: string[];
  clinicalRestrictions: ClinicalRestriction[];
  clinicalTreatment: ClinicalTreatment;
  dietType: DietType;
  dailyWaterGoal: number; // in ml
  locale?: Locale;
  prescriptionMealIntervalHours?: number;
  reminders?: ReminderSettings;
}

export interface HydrationLog {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // in ml
}

export interface PantryIngredient {
  id: string;
  name: string;
  quantity: string; // e.g., "300g", "2 unidades"
  category?: string;
}

export interface SymptomLog {
  id: string;
  date: string; // ISO String
  intensity: number; // 1 to 10
  symptoms: string[]; // e.g. ["Náusea", "Dor de cabeça", "Fadiga", "Refluxo"]
  triggers: string[]; // e.g. ["Refeição pesada", "Pouca água", "Dose recente", "Nenhum"]
}

export interface DoseLog {
  id: string;
  date: string; // YYYY-MM-DD
  doseMg: number; // e.g., 2.5, 5.0, 7.5, 10
  injectionSite: 'esquerda-abdomen' | 'direita-abdomen' | 'coxa-esquerda' | 'coxa-direita' | 'braco-esquerdo' | 'braco-direito';
  treatmentType: ClinicalTreatment;
}

export interface Meal {
  type: 'cafe-da-manha' | 'almoco' | 'lanche' | 'jantar';
  name: string;
  ingredients: { name: string; quantity: string }[];
  instructions: string;
  calories?: number;
}

export interface DayMealPlan {
  dayName: string; // Segunda, Terça, etc.
  meals: Meal[];
}

export interface RecipeResult {
  title: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  matchPercentage: number;
  nutritionSummary?: string;
  sourcePlatform?: string;
  sourceUrl?: string | null;
  confidence?: "alta" | "media" | "baixa";
  missingInfo?: string[];
  servings?: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
  category: string;
}
