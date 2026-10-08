-- FINLONEXA CRM incremental authentication and roles upgrade
-- Run this file against the existing CRM database.
-- It does not create or delete business tables or business data.
-- Disable public signup separately in Supabase Authentication settings.

alter table public.sales
  add column if not exists role text,
  add column if not exists designation text,
  add column if not exists reports_to_user_id uuid,
  add column if not exists region text,
  add column if not exists area text;

update public.sales
set role = case when administrator then 'super_admin' else 'bdo' end
where role is null;

alter table public.sales
  alter column role set default 'bdo',
  alter column role set not null;

alter table public.sales
  drop constraint if exists sales_role_check;

alter table public.sales
  add constraint sales_role_check check (
    role in ('super_admin', 'head_of_sales', 'rsm', 'ssm', 'asm', 'bdo')
  );

alter table public.sales
  drop constraint if exists sales_reports_to_user_id_fkey;

alter table public.sales
  add constraint sales_reports_to_user_id_fkey
  foreign key (reports_to_user_id) references auth.users(id) on delete restrict;

create or replace function public.validate_sales_hierarchy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  manager_role text;
  manager_disabled boolean;
  expected_manager_role text;
  has_cycle boolean;
begin
  if new.reports_to_user_id is null then
    if new.role not in ('super_admin', 'head_of_sales', 'rsm') then
      raise exception 'A manager is required for role %', new.role;
    end if;
    return new;
  end if;

  if new.reports_to_user_id = new.user_id then
    raise exception 'A user cannot report to themselves';
  end if;

  select role, disabled
  into manager_role, manager_disabled
  from public.sales
  where user_id = new.reports_to_user_id;

  if manager_role is null then
    raise exception 'Reports to user does not exist';
  end if;
  if manager_disabled then
    raise exception 'A user cannot report to an inactive user';
  end if;

  expected_manager_role := case new.role
    when 'ssm' then 'rsm'
    when 'asm' then 'ssm'
    when 'bdo' then 'ssm'
    else null
  end;

  if expected_manager_role is null then
    raise exception 'Role % cannot report to another user', new.role;
  end if;
  if manager_role <> expected_manager_role then
    raise exception 'Invalid reporting hierarchy for role %', new.role;
  end if;

  with recursive ancestors(user_id) as (
    select new.reports_to_user_id
    union all
    select sales.reports_to_user_id
    from public.sales
    join ancestors on sales.user_id = ancestors.user_id
    where sales.reports_to_user_id is not null
  )
  select exists (select 1 from ancestors where user_id = new.user_id)
  into has_cycle;

  if has_cycle then
    raise exception 'Reporting hierarchy cannot contain cycles';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_sales_hierarchy_trigger on public.sales;
create constraint trigger validate_sales_hierarchy_trigger
after insert or update of role, reports_to_user_id, disabled on public.sales
deferrable initially deferred
for each row execute function public.validate_sales_hierarchy();

create or replace function public.prevent_last_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'super_admin' and (new.role <> 'super_admin' or new.disabled) then
    if not exists (
      select 1
      from public.sales
      where role = 'super_admin'
        and disabled = false
        and user_id <> old.user_id
    ) then
      raise exception 'At least one active super_admin is required';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_last_super_admin_trigger on public.sales;
create trigger prevent_last_super_admin_trigger
before update of role, disabled on public.sales
for each row execute function public.prevent_last_super_admin();

create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.sales
    where user_id = auth.uid()
      and role = 'super_admin'
      and disabled = false
  );
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.sales (
    first_name,
    last_name,
    email,
    user_id,
    administrator,
    role,
    designation,
    reports_to_user_id,
    region,
    area
  )
  values (
    coalesce(new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data -> 'custom_claims' ->> 'first_name', 'Pending'),
    coalesce(new.raw_user_meta_data ->> 'last_name', new.raw_user_meta_data -> 'custom_claims' ->> 'last_name', 'Pending'),
    new.email,
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'bdo') = 'super_admin',
    case
      when new.raw_user_meta_data ->> 'role' in ('super_admin', 'head_of_sales', 'rsm', 'ssm', 'asm', 'bdo')
        then new.raw_user_meta_data ->> 'role'
      else 'bdo'
    end,
    new.raw_user_meta_data ->> 'designation',
    nullif(new.raw_user_meta_data ->> 'reports_to_user_id', '')::uuid,
    new.raw_user_meta_data ->> 'region',
    new.raw_user_meta_data ->> 'area'
  );
  return new;
end;
$$;

comment on column public.sales.administrator is 'Legacy compatibility field; use role instead.';
comment on column public.sales.role is 'Canonical CRM role: super_admin, head_of_sales, rsm, ssm, asm, or bdo.';
comment on column public.sales.designation is 'Employee designation, separate from the CRM role.';
