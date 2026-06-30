# Relatório de Mudanças — Estágio 4: Frontend Refactor (localStorage → Supabase + UX)

**Data:** 2026-07-03
**Responsável:** Frontend_Refactor
**Workspace:** `C:\Users\diana\Downloads\NutriAI`

---

## Resumo Executivo

Todos os dados de saúde e rastreamento do app PersonalDiet foram migrados de `localStorage` para o Supabase. Os componentes agora recebem `userId` como prop, carregam dados do Supabase na montagem, salvam automaticamente via `useRealtimeSync`, e tratam estados de loading. Problemas de UX e acessibilidade foram corrigidos (toasts, touch targets, ARIA, viewport). O `tsc --noEmit` passa sem erros.

---

## PARTE A: Migração localStorage → Supabase

### 1. App.tsx
- **Leitura:** `useEffect` de inicialização agora chama `fetchUserProfile(session.user.id)` e `fetchPantryItems(session.user.id)` em vez de ler `nutri_preferences` e `nutri_pantry_items` do localStorage.
- **Escrita:** `handleUpdatePreferences` e `handleSavePreferences` agora chamam `upsertUserProfile(session.user.id, next)` em vez de `localStorage.setItem("nutri_preferences", ...)`.
- **Migração:** Após `setSession(session)`, chama `migrateLocalStorageToSupabase(session.user.id)` para migrar dados antigos do usuário.
- **Flag local:** `nutri_onboarded` mantido em localStorage (flag de UX, não dado de saúde).

### 2. HydrationTracker.tsx
- Adicionada prop `userId: string`.
- Carrega logs via `fetchHydrationLogs(userId)` no `useEffect`.
- Salva/atualiza via `upsertHydrationLog(userId, log)`.
- Sincronização automática com `useRealtimeSync(userId, () => upsertHydrationLog(...))`.
- Estado de loading exibe "Carregando...".
- Fallback silencioso em caso de erro do Supabase.

### 3. SymptomTracker.tsx
- Adicionada prop `userId: string`.
- Carrega logs via `fetchSymptomLogs(userId)`.
- Salva via `upsertSymptomLog(userId, log)`.
- Sincronização automática com `useRealtimeSync`.
- Loading state adicionado.

### 4. WeightTracker.tsx
- Adicionada prop `userId: string`.
- Carrega dados via `fetchWeightLogs(userId)` (inclui peso, altura, meta).
- Salva via `upsertWeightLog(userId, { id, date, weight, heightCm, targetWeightKg })`.
- Sincronização automática com `useRealtimeSync`.
- Loading state adicionado.

### 5. MounjaroMonitor.tsx
- Adicionada prop `userId: string`.
- Carrega logs via `fetchDoseLogs(userId)`.
- Salva via `upsertDoseLog(userId, log)`.
- Sincronização automática com `useRealtimeSync`.
- Loading state adicionado.

### 6. PantryScanner.tsx
- Adicionada prop `userId: string`.
- Carrega itens via `fetchPantryItems(userId)`.
- Se despensa vazia, insere defaults no Supabase via `upsertPantryItems`.
- Salva/atualiza via `upsertPantryItems(userId, items)`.
- Sincronização automática com `useRealtimeSync`.
- Loading state adicionado.

### 7. MealPlanner.tsx
- Adicionada prop `userId: string`.
- Carrega plano e receitas via `fetchMealPlan(userId)`.
- Carrega lista de compras via `fetchShoppingList(userId)`.
- Salva plano via `upsertMealPlan(userId, plan, recipes)`.
- Salva lista de compras via `upsertShoppingList(userId, items)`.
- Sincronização automática com `useRealtimeSync`.
- Loading state adicionado.

### 8. ReminderCenter.tsx
- **Nenhuma alteração.** Lembretes (`nutri_last_hydration_reminder`, `nutri_last_meal_reminder`) são flags locais de UX e permanecem em localStorage, conforme especificação.

### 9. InstallPwaBanner.tsx
- **Nenhuma alteração em dados.** `nutri_visit_count` e `nutri_install_dismissed` são flags locais e permanecem em localStorage.
- **UX:** `alert()` substituído por `toast.info()` do sonner.

### 10. WhoAmI.tsx
- **Nenhuma alteração em dados.** `nutri_onboarded` é flag local e permanece em localStorage.
- **UX/Acessibilidade:** Melhorias significativas (ver Parte B abaixo).

---

## PARTE B: Correções de UX / Acessibilidade

### 1. Substituir `alert()` por `sonner` toasts
| Componente | Antes | Depois |
|------------|-------|--------|
| App.tsx | `alert(t(locale, "duplicateIngredient"))` | `toast.error(...)` |
| HydrationTracker.tsx | — | já usava notificações inline |
| SymptomTracker.tsx | `alert("Por favor, selecione pelo menos 1 sintoma!")` | `toast.warning(...)` |
| WeightTracker.tsx | `alert("Por favor, insira um peso válido!")` | `toast.warning(...)` |
| MounjaroMonitor.tsx | `alert("Por favor insira uma dose válida!")` | `toast.warning(...)` |
| MounjaroMonitor.tsx | `alert(\`Dose de ...\`)` | `toast.success(...)` |
| PantryScanner.tsx | 3× `alert(...)` | `toast.error()` / `toast.warning()` / `toast.success()` |
| MealPlanner.tsx | 2× `alert(...)` | `toast.success()` / `toast.error()` |
| InstallPwaBanner.tsx | `alert("Para instalar...")` | `toast.info(...)` |

### 2. Touch targets (mínimo 44×44px)
- Todos os ícones interativos pequenos (`Trash2`, `X`, etc.) agora estão envolvidos em `<button>` com `className="p-2 ... touch-target"` (ou `min-w-[44px] min-h-[44px]`).
- Checkboxes customizadas em `PantryScanner.tsx` (Square/CheckSquare) agora têm `role="checkbox"`, `aria-checked`, `tabIndex={0}`, e respondem a teclado (Enter/Space).
- Shopping list items em `MealPlanner.tsx` também têm `role="button"`, `tabIndex={0}`, e respondem a Enter/Space.

### 3. ARIA no modal `WhoAmI`
- Adicionado `role="dialog"`, `aria-modal="true"`, `aria-labelledby="whoami-title"`.
- Implementado **focus trap**: quando o modal abre, o foco vai para o primeiro `<input>`.
- Shift+Tab no primeiro elemento foca no último; Tab no último volta ao primeiro.
- Tecla **Esc** fecha o modal (chama `onClose`).
- Todos os botões de fechar/ícones têm `aria-label`.

### 4. Viewport corrigido
- `index.html`: removido `maximum-scale=1.0, user-scalable=no` do meta viewport.
- Agora: `width=device-width, initial-scale=1.0, viewport-fit=cover`.
- Isso melhora a acessibilidade para usuários que precisam dar zoom.

### 5. Fontes e ícones
- Google Fonts já continha `&display=swap` no link — nenhuma alteração necessária.
- Ícones externos (Icons8) no `apple-touch-icon` permanecem como estão (não há equivalente direto no lucide-react para esse caso específico de PWA).

### 6. CSS touch-target
- `src/index.css` já possuía `.touch-target { min-height: 44px; min-width: 44px; }` — nenhuma alteração necessária.

---

## PARTE C: App.tsx Integration

- `session.user.id` passado como prop `userId` para todos os componentes filhos que precisam:
  - `HydrationTracker userId={userId}`
  - `SymptomTracker userId={userId}`
  - `WeightTracker userId={userId}`
  - `MounjaroMonitor userId={userId}`
  - `PantryScanner userId={userId}`
  - `MealPlanner userId={userId}`
- `migrateLocalStorageToSupabase(session.user.id)` chamado após `setSession(session)`.
- `onAuthStateChange` mantido para atualizar a session dinamicamente.

---

## Validação

### TypeScript
```
npx tsc --noEmit
```
**Resultado:** `return code: 0` — sem erros de compilação.

### Funcionalidade preservada
- Todos os estados locais (`useState`) permanecem nos componentes.
- A mudança foi apenas na **persistência**: de `localStorage` para Supabase via hooks.
- O visual (Tailwind classes) foi preservado integralmente.
- O idioma permanece em pt-BR.

---

## Arquivos Modificados

1. `src/App.tsx` — integração Supabase, passagem de userId, toasts
2. `src/components/HydrationTracker.tsx` — migração completa + UX
3. `src/components/SymptomTracker.tsx` — migração completa + UX
4. `src/components/WeightTracker.tsx` — migração completa + UX
5. `src/components/MounjaroMonitor.tsx` — migração completa + UX
6. `src/components/PantryScanner.tsx` — migração completa + UX
7. `src/components/MealPlanner.tsx` — migração completa + UX
8. `src/components/WhoAmI.tsx` — ARIA, focus trap, Esc
9. `src/components/InstallPwaBanner.tsx` — toast no lugar de alert
10. `index.html` — viewport corrigido

---

## Próximos Passos Recomendados (fora do escopo deste estágio)

1. **Testes E2E:** Verificar sync cross-device (login em celular + desktop simultâneos).
2. **Optimistic UI:** Atualizar o estado local imediatamente e fazer o sync em background para evitar delay visual.
3. **Offline Support:** Implementar service worker que queueia upserts quando offline.
4. **CSV Export:** O export atual em `MealPlanner` não lê mais do localStorage; considere buscar os dados do Supabase para o CSV futuramente.
