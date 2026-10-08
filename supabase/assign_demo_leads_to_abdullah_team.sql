-- Run after creating the three BDO accounts in Users & Roles.
-- Assigns the 100 generated Demo Lead rows to the four active BDOs who report
-- to Abdullah in South, and sets Abdullah as their lead owner.
begin;

do $$
declare
  asm_id bigint;
  asm_user_id uuid;
  south_region_id bigint;
  bdo_ids bigint[];
  target_count integer;
  changed_count integer;
begin
  select s.id, s.user_id, s.region_id
    into asm_id, asm_user_id, south_region_id
  from public.sales s
  join public.regions r on r.id = s.region_id
  where lower(s.email) = 'abdullah@gmail.com'
    and s.role = 'asm'
    and s.disabled = false
    and lower(r.name) = 'south';

  if asm_id is null then
    raise exception 'Active South ASM Abdullah (abdullah@gmail.com) was not found';
  end if;

  if (
    select count(*)
    from public.sales s
    where s.role = 'bdo'
      and s.disabled = false
      and s.region_id = south_region_id
      and s.reports_to_user_id = asm_user_id
  ) <> 4 then
    raise exception 'Expected exactly four active South BDOs reporting to Abdullah; create/associate them before running this script';
  end if;

  if (
    select count(*)
    from public.sales s
    where lower(s.email) in ('faryaz@gmail.com', 'salman@gmail.com', 'furqan@gmail.com')
      and s.role = 'bdo'
      and s.disabled = false
      and s.region_id = south_region_id
      and s.reports_to_user_id = asm_user_id
  ) <> 3 then
    raise exception 'All three requested BDO accounts must be active and report to Abdullah in South';
  end if;

  select array_agg(s.id order by s.id)
    into bdo_ids
  from public.sales s
  where s.role = 'bdo'
    and s.disabled = false
    and s.region_id = south_region_id
    and s.reports_to_user_id = asm_user_id;

  select count(*)
    into target_count
  from public.leads l
  where l.first_name ~ '^Demo Lead [0-9]{3}$'
    and l.email ~* '^demo-lead-[0-9]{3}@example\.com$';

  if target_count <> 100 then
    raise exception 'Expected exactly 100 generated Demo Leads, found %; no leads were changed', target_count;
  end if;

  if exists (
    select 1
    from public.leads l
    where l.first_name ~ '^Demo Lead [0-9]{3}$'
      and l.email ~* '^demo-lead-[0-9]{3}@example\.com$'
      and l.region_id is distinct from south_region_id
  ) then
    raise exception 'Generated Demo Leads are not all in South; no leads were changed';
  end if;

  alter table public.leads disable trigger set_lead_scope;

  with numbered_leads as (
    select l.id, row_number() over (order by l.id) - 1 as row_num
    from public.leads l
    where l.first_name ~ '^Demo Lead [0-9]{3}$'
      and l.email ~* '^demo-lead-[0-9]{3}@example\.com$'
  )
  update public.leads l
  set owner_sales_id = asm_id,
      sales_id = asm_id,
      assigned_bdo_id = bdo_ids[(numbered_leads.row_num % 4)::integer + 1],
      region_id = south_region_id,
      updated_at = now()
  from numbered_leads
  where l.id = numbered_leads.id;

  get diagnostics changed_count = row_count;
  alter table public.leads enable trigger set_lead_scope;

  if changed_count <> 100 then
    raise exception 'Expected to update 100 generated Demo Leads, updated %; transaction rolled back', changed_count;
  end if;
end
$$;

commit;
