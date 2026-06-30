# Estágio 2 — Relatório: Persistência Supabase & Row Level Security

## 1. Resumo Executivo

Este estágio migra o armazenamento local (`localStorage`) para o **Supabase** (PostgreSQL na nuvem), garantindo que os dados do usuário persistam entre dispositivos e sejam protegidos por **Row Level Security (RLS)**. Foram entregues:

- Schema SQL pronto para execução no Supabase Dashboard.
- 8 tabelas mapeadas 1:1 com os tipos do app (`UserPreferences`, `HydrationLog`, `SymptomLog`, `WeightLog`, `DoseLog`, `PantryIngredient`, `MealPlan`, `ShoppingList`).
- 16 funções de data hooks (`src/dataHooks.ts`) para CRUD tipado.
- Hook de sync automático (`src/hooks/useRealtimeSync.ts`) para periodicamente sincronizar estado local com Supabase.
- Script de migração (`src/migrateLocalStorage.ts`) para importar dados legados do `localStorage`.
- Nenhum componente existente foi alterado (conforme requisito do Estágio 4).

---

## 2. Schema SQL (`supabase/migrations/001_initial_schema.sql`)

### Tabelas criadas

| Tabela | Propósito | Chave primária | `user_id` FK |
|--------|-----------|----------------|--------------|
| `user_profiles` | Preferências clínicas e do usuário | `id uuid` | `auth.users(id)` |
| `hydration_logs` | Registro diário de ingestão de água | `id uuid` | `auth.users(id)` |
| `symptom_logs` | Náuseas, sintomas e gatilhos | `id uuid` | `auth.users(id)` |
| `weight_logs` | Peso, altura e meta | `id uuid` | `auth.users(id)` |
| `dose_logs` | Aplicações de Mounjaro/Ozempic | `id uuid` | `auth.users(id)` |
| `pantry_items` | Ingredientes da geladeira/dispensa | `id uuid` | `auth.users(id)` |
| `meal_plans` | Cardápio semanal + receitas (JSONB) | `id uuid` | `auth.users(id)` |
| `shopping_lists` | Lista de compras (JSONB) | `id uuid` | `auth.users(id)` |

### Detalhes de tipagem

- IDs: `uuid default gen_random_uuid()`.
- Datas: `timestamptz` para created/updated; `text` para datas no formato `YYYY-MM-DD`.
- Arrays: `text[]` para `excluded_ingredients`, `clinical_restrictions`, `symptoms`, `triggers`.
- JSONB: `reminders`, `plan`, `recipes`, `items`.
- Decimais: `decimal(5,2)` para peso; `decimal(4,1)` para dose em mg.
- Constraints: `check` em `injection_site` e `treatment_type` para garantir valores válidos.
- Unique: `user_profiles`, `meal_plans` e `shopping_lists` possuem `unique(user_id)` para garantir 1 registro por usuário.

### Row Level Security (RLS)

Para **cada uma das 8 tabelas**, foram criadas 4 policies:

- `SELECT`: `auth.uid() = user_id`
- `INSERT`: `auth.uid() = user_id`
- `UPDATE`: `auth.uid() = user_id`
- `DELETE`: `auth.uid() = user_id`

Isso garante que um usuário nunca possa acessar dados de outro usuário, mesmo que tenha a `anon_key`.

### Como executar

1. Acesse o Supabase Dashboard → SQL Editor → New query.
2. Cole o conteúdo de `supabase/migrations/001_initial_schema.sql`.
3. Clique em **Run**.
4. Verifique no Table Editor que as 8 tabelas aparecem sob o schema `public`.

---

## 3. Data Hooks (`src/dataHooks.ts`)

### Funções implementadas

| Função | Tabela | Retorno |
|--------|--------|---------|
| `fetchUserProfile(userId)` | `user_profiles` | `UserPreferences \| null` |
| `upsertUserProfile(userId, profile)` | `user_profiles` | `void` |
| `fetchHydrationLogs(userId)` | `hydration_logs` | `HydrationLog[]` |
| `upsertHydrationLog(userId, log)` | `hydration_logs` | `void` |
| `fetchSymptomLogs(userId)` | `symptom_logs` | `SymptomLog[]` |
| `upsertSymptomLog(userId, log)` | `symptom_logs` | `void` |
| `fetchWeightLogs(userId)` | `weight_logs` | `WeightDataBundle` |
| `upsertWeightLog(userId, log)` | `weight_logs` | `void` |
| `fetchDoseLogs(userId)` | `dose_logs` | `DoseLog[]` |
| `upsertDoseLog(userId, log)` | `dose_logs` | `void` |
| `fetchPantryItems(userId)` | `pantry_items` | `PantryIngredient[]` |
| `upsertPantryItems(userId, items)` | `pantry_items` | `void` |
| `fetchMealPlan(userId)` | `meal_plans` | `MealPlanBundle` |
| `upsertMealPlan(userId, plan, recipes)` | `meal_plans` | `void` |
| `fetchShoppingList(userId)` | `shopping_lists` | `ShoppingItem[]` |
| `upsertShoppingList(userId, items)` | `shopping_lists` | `void` |

### Estratégias de persistência

- **Upsert por `user_id`**: `user_profiles`, `meal_plans`, `shopping_lists` usam `onConflict: "user_id"` para garantir 1 registro por usuário.
- **Upsert por `id`**: Logs individuais (`hydration_logs`, `symptom_logs`, `weight_logs`, `dose_logs`) usam `onConflict: "id"` para atualizar entradas existentes sem duplicar.
- **Delete + Insert**: `pantry_items` usa deleção completa seguida de batch insert para simplificar a sincronização do estoque (evita ter que rastrear itens removidos um a um).
- **Tratamento de erros**: Todas as funções retornam `null` ou array vazio em caso de falha e logam no console via `[dataHooks] <op> failed: ...`.

### Tipos auxiliares exportados

```ts
export interface WeightDataBundle {
  logs: WeightLogDb[];
  heightCm: number;
  targetWeightKg: number;
}

export interface MealPlanBundle {
  plan: DayMealPlan[];
  recipes: RecipeResult[];
}
```

---

## 4. Migração de Dados (`src/migrateLocalStorage.ts`)

### O que faz

A função `migrateLocalStorageToSupabase(userId)`:

1. Lê **todas** as `localStorage` keys que começam com `nutri_`.
2. Converte os dados JSON para os formatos das tabelas Supabase.
3. Chama os hooks de `upsert` para inserir em batch.
4. Marca a migração como concluída com `localStorage.setItem("nutri_migrated_v1", "true")`.

### Mapeamento de keys

| `localStorage` key | Tabela destino | Notas |
|--------------------|----------------|-------|
| `nutri_preferences` | `user_profiles` | JSON completo de `UserPreferences` |
| `nutri_hydration_logs` | `hydration_logs` | Array de `HydrationLog` |
| `nutri_symptom_logs` | `symptom_logs` | Array de `SymptomLog` |
| `nutri_weight_logs` + `nutri_height` + `nutri_target_weight` | `weight_logs` | Cada log recebe altura/meta mais recentes |
| `nutri_dose_logs` | `dose_logs` | Array de `DoseLog` |
| `nutri_pantry_items` | `pantry_items` | Array de `PantryIngredient` |
| `nutri_current_mealplan` + `nutri_current_recipes` | `meal_plans` | `plan` + `recipes` JSONB |
| `nutri_current_shopping` | `shopping_lists` | Array de `ShoppingItem` |

### Como integrar no login (App.tsx)

No `useEffect` de auth, após `setSession(session)`:

```tsx
import { migrateLocalStorageToSupabase } from "./migrateLocalStorage";

// dentro do useEffect do auth:
supabase.auth.getSession().then(({ data: { session } }) => {
  setSession(session);
  if (session?.user?.id) {
    migrateLocalStorageToSupabase(session.user.id);
  }
});
```

> ⚠️ **Não foi alterado o `App.tsx` neste estágio** — a instrução acima é para o agente do Estágio 4.

---

## 5. Verificação de Compilação

- `src/dataHooks.ts`: ✅ Sem erros de TypeScript.
- `src/migrateLocalStorage.ts`: ✅ Sem erros de TypeScript (removida importação não utilizada do `supabase`).
- Erros existentes em `App.tsx` e `server.ts` são **pré-existentes** (falta `@types/react`, variáveis não utilizadas) e **não foram introduzidos** por este estágio.

---

## 6. Instruções para o Estágio 4

O agente do Estágio 4 deve:

1. **Importar `dataHooks`** em cada componente e substituir `localStorage.getItem` / `setItem` pelas funções async.
2. **Chamar `migrateLocalStorageToSupabase`** no `App.tsx` assim que o `session` for definido.
3. **Ajustar tipos** em `src/types.ts` se necessário (ex: adicionar `heightCm` e `targetWeightKg` em `UserPreferences` se quiser centralizar metas).
4. **Considerar sincronização automática**:
   - Opção A: Chamar `upsertXxx` a cada alteração de estado (mais simples, dados sempre atualizados).
   - Opção B: Implementar `useEffect` com `setInterval(30s)` para batch-sync.
   - Opção C: Usar `beforeunload` para sync de emergência.
5. **Manter o `localStorage` como cache de fallback** opcional, mas a fonte da verdade passa a ser o Supabase.

---

## 7. Arquivos entregues

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/001_initial_schema.sql` | Schema completo + RLS pronto para copiar/colar no Supabase |
| `src/dataHooks.ts` | 16 funções de CRUD tipado para todas as tabelas |
| `src/hooks/useRealtimeSync.ts` | Hook de sync automático (30s + beforeunload) |
| `src/migrateLocalStorage.ts` | Script de migração de dados legados |
| `estagio2-relatorio.md` | Este relatório |

---

*Database_Engineer — NutriAI Estágio 2*
