-- Feature: Importar Receita de Vídeo — PersonalDiet
-- Rodar no SQL Editor do Supabase (ou salvar como migration)

-- ============================================================
-- OPÇÃO A: projeto ainda NÃO tem tabela de receitas
-- ============================================================
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  descricao text,
  porcoes numeric default 1,
  tempo_preparo_min int,
  -- [{ "qtd": 500, "unidade": "g", "item": "batata", "observacao": null }]
  ingredientes jsonb not null default '[]'::jsonb,
  -- ["Corte as batatas em cubos", "..."]
  passos jsonb not null default '[]'::jsonb,
  -- { "calorias": 340, "proteina_g": 40, "carbo_g": 33, "gordura_g": 15,
  --   "fibra_g": null, "fonte": "estimativa_ia" }  (valores POR PORÇÃO)
  nutricao jsonb,
  tags text[] default '{}',
  -- origem da importação
  source_url text,
  source_platform text check (source_platform in ('tiktok','instagram','youtube','manual','outro')),
  source_caption text,          -- legenda original, pra auditoria/reprocessamento
  import_confidence text check (import_confidence in ('alta','media','baixa')),
  import_missing jsonb default '[]'::jsonb,  -- o que a IA não conseguiu extrair
  imagem_url text,
  cozinhada boolean default false,
  avaliacao int check (avaliacao between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists recipes_user_idx on public.recipes(user_id);
create index if not exists recipes_source_idx on public.recipes(user_id, source_url);

alter table public.recipes enable row level security;

create policy "recipes_select_own" on public.recipes
  for select using (auth.uid() = user_id);
create policy "recipes_insert_own" on public.recipes
  for insert with check (auth.uid() = user_id);
create policy "recipes_update_own" on public.recipes
  for update using (auth.uid() = user_id);
create policy "recipes_delete_own" on public.recipes
  for delete using (auth.uid() = user_id);

-- trigger de updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists recipes_updated_at on public.recipes;
create trigger recipes_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

-- ============================================================
-- OPÇÃO B (ALTER alternativo): projeto JÁ tem tabela de receitas
-- Adicione só as colunas de importação na tabela existente:
-- ============================================================
-- alter table public.<sua_tabela_de_receitas>
--   add column if not exists source_url text,
--   add column if not exists source_platform text,
--   add column if not exists source_caption text,
--   add column if not exists import_confidence text,
--   add column if not exists import_missing jsonb default '[]'::jsonb;
