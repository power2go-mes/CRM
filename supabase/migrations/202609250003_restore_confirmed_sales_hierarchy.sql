-- Confirmed FINLONEXA hierarchy: Super Admin > Head of Sales > RSM > SSM > ASM > BDO.
-- This supersedes the temporary direct BDO-to-SSM assignment rule.
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

-- Users assigned during the temporary workflow must be explicitly reassigned to an ASM.
-- Do not guess an ASM or mutate production reporting relationships automatically.
create index if not exists sales_region_role_active_idx on public.sales (region_id, role) where disabled = false;
create index if not exists sales_reports_to_user_id_idx on public.sales (reports_to_user_id);
create index if not exists deals_sales_stage_created_idx on public.deals (sales_id, stage, created_at);
create index if not exists tasks_sales_due_date_idx on public.tasks (sales_id, due_date) where done_date is null;
