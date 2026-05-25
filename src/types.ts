export type DietType = 'low-carb' | 'cetogenica' | 'mediterranea' | 'deficit-calorico' | 'none';
export type ClinicalRestriction = 'lactose' | 'celiac' | 'none';
export type ClinicalTreatment = 'mounjaro' | 'ozempic' | 'none';

export interface UserPreferences {
  excludedIngredients: string[];
  clinicalRestrictions: ClinicalRestriction[];
  clinicalTreatment: ClinicalTreatment;
  dietType: DietType;
  dailyWaterGoal: number; // in ml
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
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
  category: string;
}
