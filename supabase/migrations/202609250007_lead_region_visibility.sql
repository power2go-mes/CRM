-- Regional lead visibility: every sales user in a lead's region can monitor it.
-- Write permissions remain governed by 202609250006_lead_role_permissions.sql.
drop policy if exists leads_select on public.leads;
create policy leads_select on public.leads for select to authenticated using (
  public.current_sales_role() in ('super_admin','head_of_sales')
  or region_id = public.current_sales_region_id()
);
create or replace view public.leads_summary with (security_invoker = true) as
select l.*, concat_ws(' ', s.first_name, s.last_name) as owner_name, r.name as region_name
from public.leads l join public.sales s on s.id = l.sales_id left join public.regions r on r.id = l.region_id;
grant select on public.leads_summary to authenticated;
