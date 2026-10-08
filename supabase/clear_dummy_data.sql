-- Remove generated demo CRM records while preserving sales/account records.
-- Run the entire script in the Supabase SQL editor.
BEGIN;

DELETE FROM public.tasks
WHERE contact_id IN (
  SELECT id
  FROM public.contacts
  WHERE
    first_name ILIKE 'Demo%' OR
    last_name ILIKE 'Demo%' OR
    COALESCE(email_jsonb::text, '') ILIKE '%@example.com%' OR
    COALESCE(email_jsonb::text, '') ILIKE '%demo-%@%' OR
    company_id IN (
      SELECT id
      FROM public.companies
      WHERE
        name ILIKE 'Demo Seed%' OR
        name ILIKE 'Demo %' OR
        name ILIKE 'Sample %' OR
        website ILIKE '%example.com%'
    )
)
OR lead_id IN (
  SELECT id
  FROM public.leads
  WHERE
    first_name ILIKE 'Demo%' OR
    last_name ILIKE 'Demo%' OR
    company_name ILIKE 'Demo Seed%' OR
    company_name ILIKE 'Demo %' OR
    email ILIKE '%@example.com%' OR
    email ILIKE 'demo-%@%' OR
    source ILIKE 'demo%' OR
    notes ILIKE '%fictional%'
);

DELETE FROM public.contact_notes
WHERE contact_id IN (
  SELECT id
  FROM public.contacts
  WHERE
    first_name ILIKE 'Demo%' OR
    last_name ILIKE 'Demo%' OR
    COALESCE(email_jsonb::text, '') ILIKE '%@example.com%' OR
    COALESCE(email_jsonb::text, '') ILIKE '%demo-%@%' OR
    company_id IN (
      SELECT id
      FROM public.companies
      WHERE
        name ILIKE 'Demo Seed%' OR
        name ILIKE 'Demo %' OR
        name ILIKE 'Sample %' OR
        website ILIKE '%example.com%'
    )
);

DELETE FROM public.deal_notes
WHERE deal_id IN (
  SELECT id
  FROM public.deals
  WHERE
    name ILIKE 'Demo%' OR
    name ILIKE 'Sample%' OR
    company_id IN (
      SELECT id
      FROM public.companies
      WHERE
        name ILIKE 'Demo Seed%' OR
        name ILIKE 'Demo %' OR
        name ILIKE 'Sample %' OR
        website ILIKE '%example.com%'
    )
);

DELETE FROM public.deals
WHERE
  name ILIKE 'Demo%' OR
  name ILIKE 'Sample%' OR
  company_id IN (
    SELECT id
    FROM public.companies
    WHERE
      name ILIKE 'Demo Seed%' OR
      name ILIKE 'Demo %' OR
      name ILIKE 'Sample %' OR
      website ILIKE '%example.com%'
  );

DELETE FROM public.contacts
WHERE
  first_name ILIKE 'Demo%' OR
  last_name ILIKE 'Demo%' OR
  COALESCE(email_jsonb::text, '') ILIKE '%@example.com%' OR
  COALESCE(email_jsonb::text, '') ILIKE '%demo-%@%' OR
  company_id IN (
    SELECT id
    FROM public.companies
    WHERE
      name ILIKE 'Demo Seed%' OR
      name ILIKE 'Demo %' OR
      name ILIKE 'Sample %' OR
      website ILIKE '%example.com%'
  );

DELETE FROM public.companies
WHERE
  name ILIKE 'Demo Seed%' OR
  name ILIKE 'Demo %' OR
  name ILIKE 'Sample %' OR
  website ILIKE '%example.com%';

DELETE FROM public.leads
WHERE
  first_name ILIKE 'Demo%' OR
  last_name ILIKE 'Demo%' OR
  company_name ILIKE 'Demo Seed%' OR
  company_name ILIKE 'Demo %' OR
  email ILIKE '%@example.com%' OR
  email ILIKE 'demo-%@%' OR
  source ILIKE 'demo%' OR
  notes ILIKE '%fictional%';

DELETE FROM public.tags
WHERE name ILIKE 'Demo%' OR name ILIKE 'Sample%';

COMMIT;
