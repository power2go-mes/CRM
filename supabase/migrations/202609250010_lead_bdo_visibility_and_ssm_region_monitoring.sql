-- BDOs work only their assigned leads. SSMs monitor all leads in their own region.
drop policy if exists leads_select on public.leads;
create policy leads_select on public.leads for select to authenticated using (
  public.current_sales_role() in ('super_admin','head_of_sales')
  or (public.current_sales_role() in ('rsm','ssm','asm') and region_id = public.current_sales_region_id())
  or (public.current_sales_role() = 'bdo' and sales_id = public.current_sales_id())
);
