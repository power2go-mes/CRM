-- Revised FINLONEXA assignment workflow:
-- RSMs are scoped directly by region; SSMs report to an RSM; ASMs and BDOs
-- select an SSM in the same region. Area is retained only as legacy data.

create or replace function public.validate_sales_hierarchy()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  manager public.sales%rowtype;
  expected_role text;
begin
  if new.role in ('rsm', 'ssm', 'asm', 'bdo') and new.region_id is null then
    raise exception 'Region is required for role %', new.role;
  end if;
  if new.role in ('super_admin', 'head_of_sales') and new.region_id is not null then
    raise exception 'Region must be empty for role %', new.role;
  end if;

  if new.role in ('super_admin', 'head_of_sales', 'rsm') then
    if new.reports_to_user_id is not null then
      raise exception 'Role % is assigned by organization or region and cannot have Reports To', new.role;
    end if;
    if tg_op = 'UPDATE' and old.region_id is distinct from new.region_id and exists (
      select 1 from public.sales child
      where child.reports_to_user_id = new.user_id
        and child.region_id is distinct from new.region_id
    ) then
      raise exception 'Reassign direct reports before changing this manager region';
    end if;
    return new;
  end if;

  if new.reports_to_user_id is null then
    raise exception 'A manager is required for role %', new.role;
  end if;
  if new.reports_to_user_id = new.user_id then
    raise exception 'A user cannot report to themselves';
  end if;

  select * into manager from public.sales where user_id = new.reports_to_user_id;
  if not found then raise exception 'Reports To user does not exist'; end if;
  if manager.disabled then raise exception 'A user cannot report to an inactive user'; end if;

  expected_role := case new.role
    when 'ssm' then 'rsm'
    when 'asm' then 'ssm'
    when 'bdo' then 'ssm'
  end;
  if manager.role <> expected_role then
    raise exception 'Invalid reporting hierarchy for role %', new.role;
  end if;
  if manager.region_id is distinct from new.region_id then
    raise exception 'Manager and subordinate must belong to the same region';
  end if;

  if tg_op = 'UPDATE' and old.region_id is distinct from new.region_id and exists (
    select 1 from public.sales child
    where child.reports_to_user_id = new.user_id
      and child.region_id is distinct from new.region_id
  ) then
    raise exception 'Reassign direct reports before changing this manager region';
  end if;

  if exists (
    with recursive ancestors(user_id) as (
      select new.reports_to_user_id
      union all
      select s.reports_to_user_id
      from public.sales s join ancestors a on s.user_id = a.user_id
      where s.reports_to_user_id is not null
    ) select 1 from ancestors where user_id = new.user_id
  ) then
    raise exception 'Reporting hierarchy cannot contain cycles';
  end if;
  return new;
end $$;

-- Convert the previous BDO -> ASM link to BDO -> that ASM's SSM.
update public.sales bdo
set reports_to_user_id = asm.reports_to_user_id
from public.sales asm
where bdo.role = 'bdo'
  and bdo.reports_to_user_id = asm.user_id
  and asm.role = 'asm'
  and asm.reports_to_user_id is not null;

update public.sales
set reports_to_user_id = null
where role in ('super_admin', 'head_of_sales', 'rsm')
  and reports_to_user_id is not null;

