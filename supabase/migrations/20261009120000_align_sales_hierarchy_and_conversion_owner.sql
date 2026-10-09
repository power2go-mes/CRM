create or replace function public.validate_sales_hierarchy()
returns trigger
language plpgsql
security definer
set search_path = public
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
  if new.role = 'super_admin' then
    if new.reports_to_user_id is not null then
      raise exception 'Super Admin cannot report to another user';
    end if;
    return new;
  end if;
  if new.reports_to_user_id is null then
    raise exception 'A manager is required for role %', new.role;
  end if;
  if new.reports_to_user_id = new.user_id then
    raise exception 'A user cannot report to themselves';
  end if;

  select * into manager
  from public.sales
  where user_id = new.reports_to_user_id;
  if not found or manager.disabled then
    raise exception 'Reports To user does not exist or is inactive';
  end if;

  expected_role := case new.role
    when 'head_of_sales' then 'super_admin'
    when 'rsm' then 'head_of_sales'
    when 'ssm' then 'rsm'
    when 'asm' then 'ssm'
    when 'bdo' then 'asm'
  end;
  if manager.role <> expected_role then
    raise exception 'Invalid reporting hierarchy for role %', new.role;
  end if;
  if new.role in ('ssm', 'asm', 'bdo')
    and manager.region_id is distinct from new.region_id then
    raise exception 'Manager and subordinate must belong to the same region';
  end if;
  if tg_op = 'UPDATE' and old.region_id is distinct from new.region_id and exists (
    select 1
    from public.sales child
    where child.reports_to_user_id = new.user_id
      and child.region_id is distinct from new.region_id
  ) then
    raise exception 'Reassign direct reports before changing this manager region';
  end if;
  if exists (
    with recursive ancestors(user_id) as (
      select new.reports_to_user_id
      union all
      select sales.reports_to_user_id
      from public.sales
      join ancestors on sales.user_id = ancestors.user_id
      where sales.reports_to_user_id is not null
    )
    select 1 from ancestors where user_id = new.user_id
  ) then
    raise exception 'Reporting hierarchy cannot contain cycles';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_sales_hierarchy_trigger on public.sales;
create constraint trigger validate_sales_hierarchy_trigger
after insert or update of role, reports_to_user_id, region_id, disabled on public.sales
deferrable initially immediate
for each row execute function public.validate_sales_hierarchy();

create or replace function public.convert_qualified_lead(
  p_lead_id bigint,
  p_first_name text,
  p_last_name text,
  p_email text default null,
  p_phone text default null,
  p_existing_contact_id bigint default null,
  p_existing_company_id bigint default null,
  p_new_company_name text default null,
  p_create_deal boolean default true,
  p_deal_name text default null,
  p_deal_amount numeric default 0,
  p_expected_closing_date date default null,
  p_deal_stage text default 'opportunity'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  lead_row public.leads%rowtype;
  actor_sales_id bigint := public.current_sales_id();
  actor_role text := public.current_sales_role();
  record_sales_id bigint;
  contact_id bigint;
  company_id bigint;
  deal_id bigint;
  duplicate_contact_id bigint;
  contact_owner_id bigint;
  company_owner_id bigint;
begin
  if auth.uid() is null or actor_sales_id is null then
    raise exception 'You do not have permission to convert this Lead.';
  end if;

  select * into lead_row
  from public.leads
  where id = p_lead_id
  for update;
  if not found then
    raise exception 'You do not have permission to convert this Lead.';
  end if;
  if lead_row.status <> 'qualified' or lead_row.converted_at is not null then
    raise exception 'Lead has already been converted or is not qualified.';
  end if;

  if not (
    (actor_role = 'bdo' and lead_row.assigned_bdo_id = actor_sales_id)
    or (actor_role = 'asm' and (
      lead_row.owner_sales_id = actor_sales_id
      or lead_row.assigned_bdo_id in (select public.get_subordinate_sales_ids())
    ))
    or (actor_role = 'ssm' and (
      lead_row.owner_sales_id in (select public.get_subordinate_sales_ids())
      or lead_row.assigned_bdo_id in (select public.get_subordinate_sales_ids())
    ))
    or (actor_role = 'rsm' and lead_row.region_id = public.current_sales_region_id())
  ) then
    raise exception 'You do not have permission to convert this Lead.';
  end if;

  record_sales_id := coalesce(lead_row.assigned_bdo_id, lead_row.owner_sales_id);
  if not exists (
    select 1 from public.sales
    where id = record_sales_id and not disabled
      and (
        lead_row.assigned_bdo_id is null
        or (role = 'bdo' and region_id = lead_row.region_id)
      )
  ) then
    raise exception 'The Lead owner or assigned BDO is inactive. Reassign the Lead before converting it.';
  end if;

  if nullif(btrim(p_first_name), '') is null
    or nullif(btrim(p_last_name), '') is null then
    raise exception 'Contact first name and last name are required.';
  end if;
  if p_create_deal and (
    nullif(btrim(p_deal_name), '') is null
    or p_expected_closing_date is null
    or nullif(btrim(p_deal_stage), '') is null
  ) then
    raise exception 'Opportunity name, expected closing date, and stage are required.';
  end if;
  if p_create_deal and p_deal_stage <> 'opportunity' then
    raise exception 'Invalid Opportunity stage.';
  end if;
  if coalesce(p_deal_amount, 0) < 0 then
    raise exception 'Opportunity amount cannot be negative.';
  end if;

  if p_existing_company_id is not null then
    select c.id, c.sales_id
    into company_id, company_owner_id
    from public.companies c
    where c.id = p_existing_company_id;
    if company_id is null or not public.can_access_sales_owner(company_owner_id) then
      raise exception 'Selected Company is invalid.';
    end if;
  else
    if nullif(btrim(p_new_company_name), '') is null then
      raise exception 'Select an existing Company or enter a new Company name.';
    end if;
    if exists (
      select 1
      from public.companies c
      where lower(btrim(c.name)) = lower(btrim(p_new_company_name))
        and public.can_access_sales_owner(c.sales_id)
    ) then
      raise exception 'A matching Company already exists. Select that Company before converting this Lead.';
    end if;
    insert into public.companies (name, sales_id, source_lead_id)
    values (btrim(p_new_company_name), record_sales_id, lead_row.id)
    returning id into company_id;
  end if;

  if p_existing_contact_id is not null then
    select c.id, c.sales_id
    into contact_id, contact_owner_id
    from public.contacts c
    where c.id = p_existing_contact_id;
    if contact_id is null or not public.can_access_sales_owner(contact_owner_id) then
      raise exception 'Selected Contact is invalid.';
    end if;
  else
    select c.id into duplicate_contact_id
    from public.contacts c
    where public.can_access_sales_owner(c.sales_id)
      and (
        (nullif(lower(btrim(p_email)), '') is not null and exists (
          select 1
          from jsonb_array_elements(coalesce(c.email_jsonb, '[]'::jsonb)) item
          where lower(btrim(item ->> 'email')) = lower(btrim(p_email))
        ))
        or (nullif(regexp_replace(coalesce(p_phone, ''), '\\D', '', 'g'), '') is not null and exists (
          select 1
          from jsonb_array_elements(coalesce(c.phone_jsonb, '[]'::jsonb)) item
          where regexp_replace(coalesce(item ->> 'number', ''), '\\D', '', 'g')
            = regexp_replace(p_phone, '\\D', '', 'g')
        ))
      )
    limit 1;
    if duplicate_contact_id is not null then
      raise exception 'A matching Contact already exists. Select that Contact before converting this Lead.';
    end if;
    insert into public.contacts (
      first_name, last_name, company_id, sales_id, email_jsonb, phone_jsonb,
      first_seen, last_seen, tags, source_lead_id
    ) values (
      btrim(p_first_name), btrim(p_last_name), company_id, record_sales_id,
      case when nullif(btrim(p_email), '') is null then null else
        jsonb_build_array(jsonb_build_object('email', btrim(p_email), 'type', 'Work'))
      end,
      case when nullif(btrim(p_phone), '') is null then null else
        jsonb_build_array(jsonb_build_object('number', btrim(p_phone), 'type', 'Work'))
      end,
      now(), now(), '{}'::integer[], lead_row.id
    ) returning id into contact_id;
  end if;

  if p_create_deal then
    insert into public.deals (
      name, company_id, contact_ids, amount, expected_closing_date, stage,
      sales_id, "index", source_lead_id
    ) values (
      btrim(p_deal_name), company_id, array[contact_id], coalesce(p_deal_amount, 0),
      p_expected_closing_date, p_deal_stage, record_sales_id, 0, lead_row.id
    ) returning id into deal_id;
  end if;

  update public.leads
  set status = 'converted',
      converted_at = now(),
      converted_contact_id = contact_id,
      converted_company_id = company_id,
      converted_deal_id = deal_id
  where id = lead_row.id;

  return jsonb_build_object(
    'lead_id', lead_row.id,
    'contact_id', contact_id,
    'company_id', company_id,
    'deal_id', deal_id
  );
end;
$$;

revoke all on function public.convert_qualified_lead(bigint, text, text, text, text, bigint, bigint, text, boolean, text, numeric, date, text) from public;
grant execute on function public.convert_qualified_lead(bigint, text, text, text, text, bigint, bigint, text, boolean, text, numeric, date, text) to authenticated;
