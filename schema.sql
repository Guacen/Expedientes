-- ============================================================
--  EXPEDIENTES — Rastreador manual de trofeos
--  Esquema Fase 1 · PostgreSQL / Supabase
--  Ejecutar completo en Supabase Studio → SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. TIPOS
-- ------------------------------------------------------------

create type game_status as enum ('backlog', 'jugando', 'completado', 'abandonado');
create type trophy_kind as enum ('binario', 'contador');

-- ------------------------------------------------------------
-- 2. TABLA DE REFERENCIA: NIVELES DE DIFICULTAD
--    Tabla y no enum, para poder renombrar sin migrar datos.
-- ------------------------------------------------------------

create table difficulty_levels (
  nivel   smallint primary key check (nivel between 1 and 4),
  nombre  text     not null,
  puntos  integer  not null check (puntos > 0),
  color   text     not null
);

insert into difficulty_levels (nivel, nombre, puntos, color) values
  (1, 'Rastro',            10,  '#7E8C99'),
  (2, 'Pista',             25,  '#4E7F8C'),
  (3, 'Caso',              50,  '#C08A2E'),
  (4, 'Expediente Cerrado', 100, '#8E3B3B');

-- ------------------------------------------------------------
-- 3. PERFILES
-- ------------------------------------------------------------

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text not null default 'Detective',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', 'Detective'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ------------------------------------------------------------
-- 4. JUEGOS
-- ------------------------------------------------------------

create table games (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  titulo       text not null,
  plataforma   text not null,
  portada_url  text,
  igdb_id      integer,
  estado       game_status not null default 'backlog',
  fecha_inicio date,
  fecha_fin    date,
  horas        numeric(6,1) not null default 0 check (horas >= 0),
  notas        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint fechas_coherentes check (fecha_fin is null or fecha_inicio is null or fecha_fin >= fecha_inicio)
);

create index games_user_idx    on games (user_id);
create index games_estado_idx  on games (user_id, estado);

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger games_touch
  before update on games
  for each row execute function touch_updated_at();

-- ------------------------------------------------------------
-- 5. TROFEOS
-- ------------------------------------------------------------

create table trophies (
  id              uuid primary key default gen_random_uuid(),
  game_id         uuid not null references games(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  titulo          text not null,
  descripcion     text,
  dificultad      smallint not null references difficulty_levels(nivel),
  tipo            trophy_kind not null default 'binario',
  meta            integer not null default 1 check (meta >= 1),
  valor_actual    integer not null default 0 check (valor_actual >= 0),
  oculto          boolean not null default false,
  orden           integer not null default 0,
  desbloqueado_at timestamptz,
  created_at      timestamptz not null default now(),
  constraint valor_no_excede_meta check (valor_actual <= meta),
  constraint binario_meta_uno     check (tipo = 'contador' or meta = 1)
);

create index trophies_game_idx on trophies (game_id, orden);
create index trophies_user_idx on trophies (user_id);

-- Solo puede existir un Expediente Cerrado por juego
create unique index un_expediente_por_juego
  on trophies (game_id)
  where dificultad = 4;

-- ------------------------------------------------------------
-- 6. LÓGICA DE DESBLOQUEO
-- ------------------------------------------------------------

-- 6.1 · El estado de desbloqueo se deriva del progreso, nunca se escribe a mano.
create or replace function sync_desbloqueo()
returns trigger language plpgsql as $$
begin
  if new.valor_actual >= new.meta then
    if new.desbloqueado_at is null then
      new.desbloqueado_at := now();
    end if;
  else
    new.desbloqueado_at := null;
  end if;
  return new;
end;
$$;

create trigger trophies_sync_desbloqueo
  before insert or update on trophies
  for each row execute function sync_desbloqueo();

-- 6.2 · El Expediente Cerrado se abre solo cuando todos los demás están completos.
create or replace function recalcular_expediente()
returns trigger language plpgsql as $$
declare
  v_game_id     uuid;
  v_total       integer;
  v_completados integer;
begin
  v_game_id := coalesce(new.game_id, old.game_id);

  -- El propio Expediente no dispara el recálculo (evita recursión)
  if coalesce(new.dificultad, old.dificultad) = 4 then
    return null;
  end if;

  select count(*), count(*) filter (where desbloqueado_at is not null)
    into v_total, v_completados
    from trophies
   where game_id = v_game_id and dificultad < 4;

  if v_total > 0 and v_completados = v_total then
    update trophies
       set valor_actual = meta
     where game_id = v_game_id
       and dificultad = 4
       and desbloqueado_at is null;
  else
    update trophies
       set valor_actual = 0
     where game_id = v_game_id
       and dificultad = 4
       and desbloqueado_at is not null;
  end if;

  return null;
end;
$$;

create trigger trophies_recalcular_expediente
  after insert or update or delete on trophies
  for each row execute function recalcular_expediente();

-- ------------------------------------------------------------
-- 7. XP Y NIVELES
--    Umbral del nivel n = 100 · (n-1)^1.5
-- ------------------------------------------------------------

create or replace function nivel_desde_xp(xp integer)
returns integer language sql immutable as $$
  select greatest(1, floor(power(greatest(xp, 0)::numeric / 100, 2.0/3.0))::integer + 1);
$$;

create or replace function xp_para_nivel(n integer)
returns integer language sql immutable as $$
  select ceil(100 * power(greatest(n - 1, 0)::numeric, 1.5))::integer;
$$;

-- ------------------------------------------------------------
-- 8. VISTAS DE PROGRESO
--    security_invoker: la vista respeta el RLS de quien consulta.
-- ------------------------------------------------------------

create view game_progress with (security_invoker = true) as
select
  g.id      as game_id,
  g.user_id,
  count(t.id)::integer                                              as total,
  count(t.id) filter (where t.desbloqueado_at is not null)::integer  as desbloqueados,
  coalesce(round(avg(t.valor_actual::numeric / t.meta) * 100, 1), 0) as progreso_pct,
  coalesce(sum(d.puntos) filter (where t.desbloqueado_at is not null), 0)::integer as xp,
  bool_or(t.dificultad = 4 and t.desbloqueado_at is not null)        as expediente_cerrado
from games g
left join trophies t          on t.game_id = g.id
left join difficulty_levels d on d.nivel   = t.dificultad
group by g.id, g.user_id;

create view profile_stats with (security_invoker = true) as
with xp as (
  select
    p.id as user_id,
    coalesce(sum(d.puntos), 0)::integer as xp_total
  from profiles p
  left join trophies t          on t.user_id = p.id and t.desbloqueado_at is not null
  left join difficulty_levels d on d.nivel   = t.dificultad
  group by p.id
)
select
  user_id,
  xp_total,
  nivel_desde_xp(xp_total)                        as nivel,
  xp_para_nivel(nivel_desde_xp(xp_total))         as xp_nivel_actual,
  xp_para_nivel(nivel_desde_xp(xp_total) + 1)     as xp_siguiente_nivel
from xp;

-- ------------------------------------------------------------
-- 9. ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table profiles          enable row level security;
alter table games             enable row level security;
alter table trophies          enable row level security;
alter table difficulty_levels enable row level security;

create policy "perfil propio" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "juegos propios" on games
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trofeos propios" on trophies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "dificultades legibles" on difficulty_levels
  for select to authenticated using (true);

-- ------------------------------------------------------------
-- 10. REALTIME (opcional, útil si abres la app en dos pestañas)
-- ------------------------------------------------------------

alter publication supabase_realtime add table games;
alter publication supabase_realtime add table trophies;
