-- Allow a task to belong directly to a Lead without breaking existing Contact tasks.
alter table public.tasks alter column contact_id drop not null;
alter table public.tasks drop constraint if exists tasks_related_record_required;
alter table public.tasks add constraint tasks_related_record_required
  check (contact_id is not null or lead_id is not null);
