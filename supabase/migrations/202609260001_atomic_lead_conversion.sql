-- FINLONEXA Lead conversion: a single guarded transaction.
-- Existing Lead ownership and BDO assignment are intentionally never changed.

alter table public.contacts
  add column if not exists source_lead_id bigint references public.leads(id) on delete set null;
alter table public.companies
  add column if not exists source_lead_id bigint references public.leads(id) on delete set null;
alter table public.deals
  add column if not exists source_lead_id bigint references public.leads(id) on delete set null;

create index if not exists contacts_source_lead_id_idx on public.contacts(source_lead_id) where source_lead_id is not null;
create index if not exists companies_source_lead_id_idx on public.companies(source_lead_id) where source_lead_id is not null;
create index if not exists deals_source_lead_id_idx on public.deals(source_lead_id) where source_lead_id is not null;

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

  -- The row lock is the retry/race guard: a second request waits, then sees
  -- the first request's converted state and makes no additional CRM records.
  select * into lead_row from public.leads where id = p_lead_id for update;
  if not found then
    raise exception 'You do not have permission to convert this Lead.';
  end if;
  if lead_row.status <> 'qualified' or lead_row.converted_at is not null then
    raise exception 'Lead has already been converted or is not qualified.';
  end if;

  if not (
    (actor_role = 'bdo' and lead_row.assigned_bdo_id = actor_sales_id)
    or (actor_role = 'asm' and (lead_row.owner_sales_id = actor_sales_id or lead_row.assigned_bdo_id in (select public.get_subordinate_sales_ids())))
    or (actor_role = 'ssm' and (lead_row.owner_sales_id in (select public.get_subordinate_sales_ids()) or lead_row.assigned_bdo_id in (select public.get_subordinate_sales_ids())))
    or (actor_role = 'rsm' and lead_row.region_id = public.current_sales_region_id())
  ) then
    raise exception 'You do not have permission to convert this Lead.';
  end if;

  if nullif(btrim(p_first_name), '') is null or nullif(btrim(p_last_name), '') is null then
    raise exception 'Contact first name and last name are required.';
  end if;
  if p_create_deal and (nullif(btrim(p_deal_name), '') is null or p_expected_closing_date is null or nullif(btrim(p_deal_stage), '') is null) then
    raise exception 'Opportunity name, expected closing date, and stage are required.';
  end if;
  if p_create_deal and p_deal_stage <> 'opportunity' then
    raise exception 'Invalid Opportunity stage.';
  end if;
  if coalesce(p_deal_amount, 0) < 0 then
    raise exception 'Opportunity amount cannot be negative.';
  end if;

  if p_existing_company_id is not null then
    select c.id, c.sales_id into company_id, company_owner_id from public.companies c where c.id = p_existing_company_id;
    if company_id is null or not public.can_access_sales_owner(company_owner_id) then
      raise exception 'Selected Company is invalid.';
    end if;
  else
    if nullif(btrim(p_new_company_name), '') is null then
      raise exception 'Select an existing Company or enter a new Company name.';
    end if;
    if exists (
      select 1 from public.companies c
      where lower(btrim(c.name)) = lower(btrim(p_new_company_name))
        and public.can_access_sales_owner(c.sales_id)
    ) then
      raise exception 'A matching Company already exists. Select that Company before converting this Lead.';
    end if;
    insert into public.companies (name, sales_id, source_lead_id)
      values (btrim(p_new_company_name), actor_sales_id, lead_row.id)
      returning id into company_id;
  end if;

  if p_existing_contact_id is not null then
    select c.id, c.sales_id into contact_id, contact_owner_id from public.contacts c where c.id = p_existing_contact_id;
    if contact_id is null or not public.can_access_sales_owner(contact_owner_id) then
      raise exception 'Selected Contact is invalid.';
    end if;
  else
    select c.id into duplicate_contact_id
    from public.contacts c
    where public.can_access_sales_owner(c.sales_id)
      and (
        (nullif(lower(btrim(p_email)), '') is not null and exists (
          select 1 from jsonb_array_elements(coalesce(c.email_jsonb, '[]'::jsonb)) item
          where lower(btrim(item ->> 'email')) = lower(btrim(p_email))
        ))
        or (nullif(regexp_replace(coalesce(p_phone, ''), '\\D', '', 'g'), '') is not null and exists (
          select 1 from jsonb_array_elements(coalesce(c.phone_jsonb, '[]'::jsonb)) item
          where regexp_replace(coalesce(item ->> 'number', ''), '\\D', '', 'g') = regexp_replace(p_phone, '\\D', '', 'g')
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
      btrim(p_first_name), btrim(p_last_name), company_id, actor_sales_id,
      case when nullif(btrim(p_email), '') is null then null else jsonb_build_array(jsonb_build_object('email', btrim(p_email), 'type', 'Work')) end,
      case when nullif(btrim(p_phone), '') is null then null else jsonb_build_array(jsonb_build_object('number', btrim(p_phone), 'type', 'Work')) end,
      now(), now(), '{}'::integer[], lead_row.id
    ) returning id into contact_id;
  end if;

  if p_create_deal then
    insert into public.deals (
      name, company_id, contact_ids, amount, expected_closing_date, stage,
      sales_id, "index", source_lead_id
    ) values (
      btrim(p_deal_name), company_id, array[contact_id], coalesce(p_deal_amount, 0),
      p_expected_closing_date, p_deal_stage, actor_sales_id, 0, lead_row.id
    ) returning id into deal_id;
  end if;

  -- Only conversion fields change. Creator/Owner, assigned BDO, region, and
  -- legacy sales_id stay untouched by this update and by the Lead trigger.
  update public.leads
  set status = 'converted', converted_at = now(), converted_contact_id = contact_id,
      converted_company_id = company_id, converted_deal_id = deal_id
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
