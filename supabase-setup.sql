-- ABAS member authentication + administration schema for Supabase
-- Run this once in Supabase > SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  city text not null default '',
  role text not null default 'member' check (role in ('member','admin')),
  status text not null default 'pending' check (status in ('pending','approved','suspended','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id,email,first_name,last_name,phone,city)
  values (
    new.id,
    coalesce(new.email,''),
    coalesce(new.raw_user_meta_data->>'first_name',''),
    coalesce(new.raw_user_meta_data->>'last_name',''),
    coalesce(new.raw_user_meta_data->>'phone',''),
    coalesce(new.raw_user_meta_data->>'city','')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email,''), updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
after update of email on auth.users
for each row execute procedure public.sync_profile_email();

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute procedure public.touch_profile_updated_at();

-- Backfill profiles if auth users already existed before this setup was installed.
insert into public.profiles (id,email,first_name,last_name,phone,city)
select
  u.id,
  coalesce(u.email,''),
  coalesce(u.raw_user_meta_data->>'first_name',''),
  coalesce(u.raw_user_meta_data->>'last_name',''),
  coalesce(u.raw_user_meta_data->>'phone',''),
  coalesce(u.raw_user_meta_data->>'city','')
from auth.users u
on conflict (id) do nothing;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin
on public.profiles for select
to authenticated
using (public.is_admin());

-- Direct browser writes are disabled. Changes go through the safe RPC functions below.
revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;

create or replace function public.update_my_profile(
  p_first_name text,
  p_last_name text,
  p_phone text default '',
  p_city text default ''
)
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  return query
    update public.profiles
    set first_name = trim(coalesce(p_first_name,'')),
        last_name = trim(coalesce(p_last_name,'')),
        phone = trim(coalesce(p_phone,'')),
        city = trim(coalesce(p_city,''))
    where id = auth.uid()
    returning *;
end;
$$;

create or replace function public.admin_update_member(
  target_id uuid,
  new_first_name text,
  new_last_name text,
  new_phone text,
  new_city text,
  new_status text,
  new_role text
)
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  if new_status not in ('pending','approved','suspended','rejected') then
    raise exception 'Invalid member status';
  end if;
  if new_role not in ('member','admin') then
    raise exception 'Invalid member role';
  end if;
  if target_id = auth.uid() and (new_status <> 'approved' or new_role <> 'admin') then
    raise exception 'You cannot remove your own approved admin access';
  end if;

  return query
    update public.profiles
    set first_name = trim(coalesce(new_first_name,'')),
        last_name = trim(coalesce(new_last_name,'')),
        phone = trim(coalesce(new_phone,'')),
        city = trim(coalesce(new_city,'')),
        status = new_status,
        role = new_role
    where id = target_id
    returning *;
end;
$$;

revoke all on function public.update_my_profile(text,text,text,text) from public;
revoke all on function public.admin_update_member(uuid,text,text,text,text,text,text) from public;
grant execute on function public.update_my_profile(text,text,text,text) to authenticated;
grant execute on function public.admin_update_member(uuid,text,text,text,text,text,text) to authenticated;

-- IMPORTANT: Bootstrap your first administrator AFTER that person has registered.
-- Run a statement like this in the SQL Editor, replacing the email:
-- update public.profiles
-- set role='admin', status='approved'
-- where lower(email)=lower('YOUR-ADMIN-EMAIL@example.com');
