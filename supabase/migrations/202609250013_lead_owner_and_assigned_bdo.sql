-- FINLONEXA Lead ownership v2 (additive and non-destructive).
-- `sales_id` remains for legacy compatibility. New application code must use
-- `owner_sales_id` for the Lead creator and `assigned_bdo_id` for the BDO work queue.

alter table public.leads
  add column if not exists owner_sales_id bigint references public.sales(id) on delete restrict,
  add column if not exists assigned_bdo_id bigint references public.sales(id) on delete restrict;

create index if not exists leads_owner_sales_created_idx on public.leads (owner_sales_id, created_at desc);
create index if not exists leads_assigned_bdo_created_idx on public.leads (assigned_bdo_id, created_at desc);
create index if not exists leads_region_assigned_bdo_idx on public.leads (region_id, assigned_bdo_id);

-- Backfill only from evidence already stored on each row. A BDO in legacy
-- sales_id was the previous assignment representation; its creator metadata,
-- when available, is the owner. Otherwise preserve the legacy owner value.
-- The old trigger enforces the legacy sales_id scope and must not reinterpret
-- this metadata-only backfill as an end-user assignment.
do $$
begin
  if exists (select 1 from pg_trigger where tgrelid = 'public.leads'::regclass and tgname = 'leads_scope_before_write' and not tgisinternal) then
    execute 'alter table public.leads disable trigger leads_scope_before_write';
  end if;
  if exists (select 1 from pg_trigger where tgrelid = 'public.leads'::regclass and tgname = 'set_lead_scope' and not tgisinternal) then
    execute 'alter table public.leads disable trigger set_lead_scope';
  end if;
end $$;
update public.leads l
set owner_sales_id = coalesce(
      (select creator.id from public.sales creator where creator.user_id = l.created_by_user_id),
      l.sales_id
    ),
    assigned_bdo_id = case
      when (select legacy.role from public.sales legacy where legacy.id = l.sales_id) = 'bdo'
      then l.sales_id
      else null
    end
where l.owner_sales_id is null or l.assigned_bdo_id is null;
do $$
begin
  if exists (select 1 from pg_trigger where tgrelid = 'public.leads'::regclass and tgname = 'leads_scope_before_write' and not tgisinternal) then
    execute 'alter table public.leads enable trigger leads_scope_before_write';
  end if;
  if exists (select 1 from pg_trigger where tgrelid = 'public.leads'::regclass and tgname = 'set_lead_scope' and not tgisinternal) then
    execute 'alter table public.leads enable trigger set_lead_scope';
  end if;
end $$;

-- A Lead has always had a non-null legacy sales_id, so this only protects
-- against damaged data without guessing a manager.
do $$
declare total_count bigint; resolved_owner_count bigint; assigned_count bigint; unresolved_owner_count bigint;
begin
  select count(*), count(*) filter (where owner_sales_id is not null),
         count(*) filter (where assigned_bdo_id is not null),
         count(*) filter (where owner_sales_id is null)
    into total_count, resolved_owner_count, assigned_count, unresolved_owner_count
  from public.leads;
  raise notice 'Lead ownership backfill: total %, owner resolved %, assigned BDO resolved %, unresolved owner %', total_count, resolved_owner_count, assigned_count, unresolved_owner_count;
  if unresolved_owner_count > 0 then
    raise exception 'Lead ownership backfill stopped: % Leads have no provable owner', unresolved_owner_count;
  end if;
end $$;

alter table public.leads alter column owner_sales_id set not null;

-- New and changed assignments are validated in one server-side trigger.
-- Ownership is immutable after creation and legacy sales_id is kept equal to it.
create or replace function public.set_lead_scope() returns trigger language plpgsql security definer set search_path=public as $$
declare
  actor_role text;
  actor_sales_id bigint;
  owner_region bigint;
  assigned_region bigint;
  assigned_role text;
  assigned_manager uuid;
begin
  actor_role := public.current_sales_role();
  actor_sales_id := public.current_sales_id();

  if tg_op = 'INSERT' then
    if actor_role not in ('rsm','ssm','asm') then
      raise exception 'You do not have permission to create leads';
    end if;
    -- Creator is authoritative; client input cannot impersonate another owner.
    new.owner_sales_id := actor_sales_id;
    new.created_by_user_id := auth.uid();
    new.sales_id := new.owner_sales_id; -- deprecated legacy compatibility
    select region_id into owner_region from public.sales where id = new.owner_sales_id and disabled = false;
    if owner_region is null then raise exception 'Lead owner must be an active regional sales user'; end if;
    new.region_id := owner_region;
  else
    if actor_role in ('super_admin','head_of_sales') then
      raise exception 'You do not have permission to update leads';
    end if;
    if new.owner_sales_id is distinct from old.owner_sales_id
       or new.sales_id is distinct from old.sales_id
       or new.region_id is distinct from old.region_id
       or new.created_by_user_id is distinct from old.created_by_user_id then
      raise exception 'Lead owner, region, creator, and legacy owner are immutable';
    end if;
    if actor_role = 'bdo' and new.assigned_bdo_id is distinct from old.assigned_bdo_id then
      raise exception 'BDO users cannot reassign leads';
    end if;
    if actor_role in ('rsm','ssm') and new.assigned_bdo_id is distinct from old.assigned_bdo_id then
      raise exception 'Only the associated ASM can assign a Lead to a BDO';
    end if;
    if actor_role = 'bdo' then
      if old.status = 'new' and new.status not in ('new','contacted') then raise exception 'Lead must be contacted before qualification'; end if;
      if old.status = 'contacted' and new.status not in ('contacted','qualified','unqualified') then raise exception 'Invalid lead status transition'; end if;
      if old.status = 'qualified' and new.status not in ('qualified','contacted','converted') then raise exception 'Invalid lead status transition'; end if;
      if old.status in ('unqualified','converted') and new.status is distinct from old.status then raise exception 'This lead is historical and cannot be reopened'; end if;
      if new.status = 'unqualified' and nullif(btrim(coalesce(new.unqualified_reason,'')), '') is null then raise exception 'An unqualified reason is required'; end if;
    end if;
  end if;

  if new.assigned_bdo_id is not null then
    select region_id, role, reports_to_user_id into assigned_region, assigned_role, assigned_manager
    from public.sales where id = new.assigned_bdo_id and disabled = false;
    if assigned_role is distinct from 'bdo' then raise exception 'Assigned user must be an active BDO'; end if;
    if assigned_region is distinct from new.region_id then raise exception 'Assigned BDO must belong to the Lead region'; end if;
    if actor_role = 'asm' and assigned_manager is distinct from auth.uid() then
      raise exception 'ASM users can assign Leads only to their direct active BDOs';
    end if;
  end if;
  -- An ASM creates for its own team. RSM/SSM creation remains unassigned until
  -- the associated ASM performs the assignment.
  if tg_op = 'INSERT' and actor_role <> 'asm' and new.assigned_bdo_id is not null then
    raise exception 'Only an associated ASM can assign a Lead to a BDO';
  end if;
  new.updated_at := now();
  if tg_op = 'UPDATE' and new.status = 'unqualified' and old.status is distinct from 'unqualified' then new.unqualified_at := now(); end if;
  return new;
end $$;

drop trigger if exists leads_scope_before_write on public.leads;
drop trigger if exists set_lead_scope on public.leads;
create trigger set_lead_scope before insert or update on public.leads for each row execute function public.set_lead_scope();

-- Final hierarchy for future writes: Super Admin -> Head of Sales -> RSM -> SSM -> ASM -> BDO.
create or replace function public.validate_sales_hierarchy()
returns trigger language plpgsql security definer set search_path = public as $$
declare manager public.sales%rowtype; expected_role text;
begin
  if new.role in ('rsm','ssm','asm','bdo') and new.region_id is null then raise exception 'Region is required for role %', new.role; end if;
  if new.role in ('super_admin','head_of_sales') and new.region_id is not null then raise exception 'Region must be empty for role %', new.role; end if;
  if new.role = 'super_admin' then
    if new.reports_to_user_id is not null then raise exception 'Super Admin cannot report to another user'; end if;
    return new;
  end if;
  if new.reports_to_user_id is null then raise exception 'A manager is required for role %', new.role; end if;
  if new.reports_to_user_id = new.user_id then raise exception 'A user cannot report to themselves'; end if;
  select * into manager from public.sales where user_id = new.reports_to_user_id;
  if not found or manager.disabled then raise exception 'Reports To user does not exist or is inactive'; end if;
  expected_role := case new.role when 'head_of_sales' then 'super_admin' when 'rsm' then 'head_of_sales' when 'ssm' then 'rsm' when 'asm' then 'ssm' when 'bdo' then 'asm' end;
  if manager.role <> expected_role then raise exception 'Invalid reporting hierarchy for role %', new.role; end if;
  if new.role in ('ssm','asm','bdo') and manager.region_id is distinct from new.region_id then raise exception 'Manager and subordinate must belong to the same region'; end if;
  if exists (with recursive ancestors(user_id) as (
    select new.reports_to_user_id union all select s.reports_to_user_id from public.sales s join ancestors a on s.user_id = a.user_id where s.reports_to_user_id is not null
  ) select 1 from ancestors where user_id = new.user_id) then raise exception 'Reporting hierarchy cannot contain cycles'; end if;
  return new;
end $$;

-- Repair only unambiguous legacy development relationships. Each update runs
-- only when exactly one eligible manager exists; valid links are left intact.
update public.sales child
set reports_to_user_id = manager.user_id
from public.sales manager
where child.role = 'head_of_sales' and child.reports_to_user_id is null
  and manager.role = 'super_admin' and not manager.disabled
  and (select count(*) from public.sales where role = 'super_admin' and not disabled) = 1;

update public.sales child
set reports_to_user_id = manager.user_id
from public.sales manager
where child.role = 'rsm' and child.reports_to_user_id is null
  and manager.role = 'head_of_sales' and not manager.disabled
  and (select count(*) from public.sales where role = 'head_of_sales' and not disabled) = 1;

update public.sales child
set reports_to_user_id = manager.user_id
from public.sales manager
where child.role = 'asm'
  and manager.role = 'ssm' and not manager.disabled
  and manager.region_id = child.region_id
  and not exists (select 1 from public.sales current_manager where current_manager.user_id = child.reports_to_user_id and current_manager.role = 'ssm')
  and (select count(*) from public.sales candidate where candidate.role = 'ssm' and not candidate.disabled and candidate.region_id = child.region_id) = 1;

-- RLS scopes both Owner and Assigned BDO without permitting normal roles global access.
drop policy if exists leads_select on public.leads;
drop policy if exists leads_insert on public.leads;
drop policy if exists leads_update on public.leads;
-- Lead history is retained; remove the legacy sales_id-based delete policy.
drop policy if exists leads_delete on public.leads;
create policy leads_select on public.leads for select to authenticated using (
  public.current_sales_role() in ('super_admin','head_of_sales')
  or (public.current_sales_role() = 'rsm' and region_id = public.current_sales_region_id())
  or (public.current_sales_role() = 'ssm' and (owner_sales_id in (select public.get_subordinate_sales_ids()) or assigned_bdo_id in (select public.get_subordinate_sales_ids())))
  or (public.current_sales_role() = 'asm' and (owner_sales_id = public.current_sales_id() or assigned_bdo_id in (select public.get_subordinate_sales_ids())))
  or (public.current_sales_role() = 'bdo' and assigned_bdo_id = public.current_sales_id())
);
create policy leads_insert on public.leads for insert to authenticated with check (public.current_sales_role() in ('rsm','ssm','asm') and owner_sales_id = public.current_sales_id());
create policy leads_update on public.leads for update to authenticated
  using (
    (public.current_sales_role() = 'rsm' and region_id = public.current_sales_region_id())
    or (public.current_sales_role() = 'ssm' and (owner_sales_id in (select public.get_subordinate_sales_ids()) or assigned_bdo_id in (select public.get_subordinate_sales_ids())))
    or (public.current_sales_role() = 'asm' and (owner_sales_id = public.current_sales_id() or assigned_bdo_id in (select public.get_subordinate_sales_ids())))
    or (public.current_sales_role() = 'bdo' and assigned_bdo_id = public.current_sales_id())
  ) with check (
    (public.current_sales_role() = 'rsm' and region_id = public.current_sales_region_id())
    or (public.current_sales_role() = 'ssm' and (owner_sales_id in (select public.get_subordinate_sales_ids()) or assigned_bdo_id in (select public.get_subordinate_sales_ids())))
    or (public.current_sales_role() = 'asm' and (owner_sales_id = public.current_sales_id() or assigned_bdo_id in (select public.get_subordinate_sales_ids())))
    or (public.current_sales_role() = 'bdo' and assigned_bdo_id = public.current_sales_id())
  );

create or replace function public.lead_sales_name(lead_id bigint, sale_id bigint)
returns text language plpgsql stable security definer set search_path=public as $$
begin
  if not exists (select 1 from public.leads where id = lead_id and (
    public.current_sales_role() in ('super_admin','head_of_sales')
    or (public.current_sales_role() = 'rsm' and region_id = public.current_sales_region_id())
    or (public.current_sales_role() = 'bdo' and assigned_bdo_id = public.current_sales_id())
    or (public.current_sales_role() in ('ssm','asm') and (owner_sales_id in (select public.get_subordinate_sales_ids()) or assigned_bdo_id in (select public.get_subordinate_sales_ids()) or owner_sales_id = public.current_sales_id()))
  )) then return null; end if;
  return (select concat_ws(' ', first_name, last_name) from public.sales where id = sale_id);
end $$;
revoke all on function public.lead_sales_name(bigint,bigint) from public;
grant execute on function public.lead_sales_name(bigint,bigint) to authenticated;

-- Preserve the already-published view column order. PostgreSQL does not allow
-- CREATE OR REPLACE VIEW to insert columns before existing owner_name/region_name.
create or replace view public.leads_summary with (security_invoker = true) as
select l.id, l.first_name, l.last_name, l.company_name, l.email, l.phone,
       l.source, l.status, l.notes, l.sales_id, l.region_id,
       l.created_by_user_id, l.created_at, l.updated_at, l.converted_at,
       l.converted_contact_id, l.converted_company_id, l.converted_deal_id,
       public.lead_sales_name(l.id, l.owner_sales_id) as owner_name,
       r.name as region_name,
       l.unqualified_reason, l.unqualified_at, l.owner_sales_id,
       l.assigned_bdo_id,
       public.lead_sales_name(l.id, l.assigned_bdo_id) as assigned_bdo_name
from public.leads l left join public.regions r on r.id = l.region_id;
grant select on public.leads_summary to authenticated;
