-- ASM may assign a lead only to one of their direct active BDOs.
create or replace function public.set_lead_scope() returns trigger language plpgsql security definer set search_path=public as $$
declare owner_region bigint; actor_role text; owner_role text; owner_manager uuid;
begin
  actor_role := public.current_sales_role();
  if tg_op = 'INSERT' and actor_role not in ('rsm','ssm','asm') then raise exception 'You do not have permission to create leads'; end if;
  if tg_op = 'UPDATE' and actor_role in ('super_admin','head_of_sales') then raise exception 'You do not have permission to update leads'; end if;
  if tg_op = 'UPDATE' and actor_role = 'bdo' and (new.sales_id is distinct from old.sales_id or new.region_id is distinct from old.region_id or new.created_by_user_id is distinct from old.created_by_user_id) then raise exception 'BDO users cannot reassign leads'; end if;
  select region_id, role, reports_to_user_id into owner_region, owner_role, owner_manager from public.sales where id=new.sales_id and disabled=false;
  if owner_region is null then raise exception 'Lead owner must be an active regional sales user'; end if;
  if actor_role = 'asm' and (owner_role <> 'bdo' or owner_manager is distinct from auth.uid()) then raise exception 'ASM users can assign leads only to their direct active BDOs'; end if;
  if not public.can_access_sales_owner(new.sales_id) then raise exception 'Cannot assign lead outside your CRM scope'; end if;
  new.region_id := owner_region; new.updated_at:=now(); if tg_op='INSERT' then new.created_by_user_id:=auth.uid(); end if; return new;
end $$;
