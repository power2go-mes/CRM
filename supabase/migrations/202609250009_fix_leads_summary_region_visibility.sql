-- `leads_summary` must not lose region-visible leads because the sales-directory
-- RLS hides a manager profile from a peer. The lead row remains the authorization source.
create or replace function public.lead_owner_name(lead_id bigint, owner_id bigint)
returns text language plpgsql stable security definer set search_path=public as $$
begin
  if not exists (select 1 from public.leads where id = lead_id and (
    public.current_sales_role() in ('super_admin','head_of_sales')
    or region_id = public.current_sales_region_id()
  )) then
    return null;
  end if;
  return (select concat_ws(' ', first_name, last_name) from public.sales where id = owner_id);
end $$;
revoke all on function public.lead_owner_name(bigint,bigint) from public;
grant execute on function public.lead_owner_name(bigint,bigint) to authenticated;

create or replace view public.leads_summary with (security_invoker = true) as
select l.*, public.lead_owner_name(l.id, l.sales_id) as owner_name, r.name as region_name
from public.leads l left join public.regions r on r.id = l.region_id;
grant select on public.leads_summary to authenticated;
