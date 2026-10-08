-- Final Leads operational permissions. Monitoring roles are explicitly read-only.
create or replace function public.set_lead_scope() returns trigger language plpgsql security definer set search_path=public as $$
declare owner_region bigint; actor_role text;
begin
  actor_role := public.current_sales_role();
  if tg_op = 'INSERT' and actor_role not in ('rsm','ssm','asm') then raise exception 'You do not have permission to create leads'; end if;
  if tg_op = 'UPDATE' and actor_role in ('super_admin','head_of_sales') then raise exception 'You do not have permission to update leads'; end if;
  if tg_op = 'UPDATE' and actor_role = 'bdo' and (new.sales_id is distinct from old.sales_id or new.region_id is distinct from old.region_id or new.created_by_user_id is distinct from old.created_by_user_id) then raise exception 'BDO users cannot reassign leads'; end if;
  if not public.can_access_sales_owner(new.sales_id) then raise exception 'Cannot assign lead outside your CRM scope'; end if;
  select region_id into owner_region from public.sales where id=new.sales_id and disabled=false;
  if owner_region is null then raise exception 'Lead owner must be an active regional sales user'; end if;
  new.region_id := owner_region; new.updated_at:=now(); if tg_op='INSERT' then new.created_by_user_id:=auth.uid(); end if; return new;
end $$;
drop policy if exists leads_select on public.leads; drop policy if exists leads_insert on public.leads; drop policy if exists leads_update on public.leads; drop policy if exists leads_delete on public.leads;
create policy leads_select on public.leads for select to authenticated using (public.can_access_sales_owner(sales_id));
create policy leads_insert on public.leads for insert to authenticated with check (public.current_sales_role() in ('rsm','ssm','asm') and public.can_access_sales_owner(sales_id));
create policy leads_update on public.leads for update to authenticated using (public.current_sales_role() in ('rsm','ssm','asm','bdo') and public.can_access_sales_owner(sales_id)) with check (public.current_sales_role() in ('rsm','ssm','asm','bdo') and public.can_access_sales_owner(sales_id));
-- Deliberately no DELETE policy: Leads remain historical records.
