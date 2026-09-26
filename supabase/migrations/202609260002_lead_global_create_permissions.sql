-- Allow global sales administrators to create leads for any active region.
-- RSM creation remains restricted to the authenticated user's own region.

create or replace function public.set_lead_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  actor_sales_id bigint;
  actor_region bigint;
  target_region bigint;
  assigned_region bigint;
  assigned_role text;
  assigned_manager uuid;
begin
  actor_role := public.current_sales_role();
  actor_sales_id := public.current_sales_id();
  actor_region := public.current_sales_region_id();

  if tg_op = 'INSERT' then
    if actor_role not in ('super_admin', 'head_of_sales', 'rsm', 'ssm', 'asm') then
      raise exception 'You do not have permission to create leads';
    end if;

    new.owner_sales_id := actor_sales_id;
    new.created_by_user_id := auth.uid();
    new.sales_id := new.owner_sales_id;

    if actor_role in ('super_admin', 'head_of_sales') then
      target_region := new.region_id;
      if target_region is null or not exists (
        select 1 from public.regions where id = target_region and is_active
      ) then
        raise exception 'A valid active region is required when creating a lead';
      end if;
    else
      target_region := actor_region;
      if target_region is null then
        raise exception 'Lead creator must belong to an active region';
      end if;
    end if;

    new.region_id := target_region;
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
    if actor_role = 'asm' and assigned_manager is distinct from auth.uid() then raise exception 'ASM users can assign Leads only to their direct active BDOs'; end if;
  end if;

  if tg_op = 'INSERT' and actor_role <> 'asm' and new.assigned_bdo_id is not null then
    raise exception 'Only an associated ASM can assign a Lead to a BDO';
  end if;
  new.updated_at := now();
  if tg_op = 'UPDATE' and new.status = 'unqualified' and old.status is distinct from 'unqualified' then new.unqualified_at := now(); end if;
  return new;
end
$$;

drop policy if exists leads_insert on public.leads;
create policy leads_insert on public.leads for insert to authenticated
with check (
  public.current_sales_role() in ('super_admin','head_of_sales')
  or (public.current_sales_role() in ('rsm','ssm','asm') and owner_sales_id = public.current_sales_id())
);