# FINLONEXA Vercel Deployment Guide

## Vercel project setup

1. Import the repository into Vercel.
2. Set the framework preset to `Vite`.
3. Use the repository root as the root directory.
4. Set the build command to `npm run build`.
5. Set the output directory to `dist`.
6. Set the install command to `npm install`.
7. Set Node to `22.x` unless the project has a stricter runtime requirement in the selected environment.

## Required environment variables

Set these variables in the Vercel project environment for the production scope:

- `VITE_SUPABASE_URL`
- `VITE_SB_PUBLISHABLE_KEY`
- `VITE_INBOUND_EMAIL`
- `VITE_ATTACHMENTS_BUCKET`
- `VITE_IS_DEMO`
- `VITE_DISABLE_EMAIL_PASSWORD_AUTHENTICATION`
- `VITE_GOOGLE_WORKPLACE_DOMAIN` (optional, only if Google Workplace SSO is configured)

Do not add service-role keys, admin secrets, or other privileged credentials to browser-visible Vercel variables.

## Supabase Auth configuration

In the hosted Supabase dashboard:

1. Set the Site URL to the production Vercel domain, for example `https://<production-domain>`.
2. Add redirect URLs such as `https://<production-domain>/**` and preserve local development exceptions like `http://localhost:5173/**`.
3. Verify the forgot password and invitation flows point back to the production application and not to localhost.

## Domain and DNS

1. Add the Vercel project to the desired custom domain.
2. Configure the DNS records in the domain provider for the Vercel domain.
3. Verify the live domain matches the Supabase Site URL.
4. Keep `crm.elvaveo.com` as the target production hostname.

## Post-deployment checks

1. Confirm the app loads without `404` errors on direct navigation to `/`, `/dashboard`, `/leads`, `/contacts`, `/companies`, `/opportunities`, `/pipeline`, `/tasks`, and `/profile`.
2. Confirm login, logout, forgot password, set password, and invite flows work against the hosted Supabase project.
3. Confirm the app responds correctly when required environment variables are present.
4. Confirm no local `localhost` endpoints are required at runtime in production.
5. Confirm the app still respects the verified role hierarchy and lead ownership rules.

## Preview safety

Preview deployments can write to the same hosted Supabase project as production. Treat preview data as real data unless it is intentionally isolated in a separate environment.
