# FINLONEXA Vercel Deployment Guide

## Detected project settings

- Framework: Vite + React + TypeScript
- Package manager: npm, using `package-lock.json`
- Node.js: `24.x` (the local runtime is Node `v24.19.0`; Vite supports Node 24)
- Temporary URL target: `https://crm-elve.vercel.app`
- Root directory: repository root (`.`)
- Install command: `npm ci`
- Build command: `npm run build` (TypeScript check followed by `vite build`)
- Output directory: `dist`
- SPA routing: React Admin uses hash routing; Vercel also rewrites direct paths to `/index.html`

## Vercel setup

1. Import this repository and select the repository root.
2. Set Framework Preset to `Vite`.
3. Set Install Command to `npm ci`.
4. Set Build Command to `npm run build`.
5. Set Output Directory to `dist`.
6. Set the Node.js version to `24.x`.
7. Add the required environment variables below to the Production, Preview, and Development scopes as appropriate.

`vercel.json` contains the Vite SPA rewrite, cache rules, and security headers. The CSP permits same-origin resources and Supabase project connections over HTTPS/WSS; review it if the app adds another API, external font, or embedded content provider.

## Environment variables

Required for the production browser app:

- `VITE_SUPABASE_URL`
- `VITE_SB_PUBLISHABLE_KEY`

Optional frontend settings:

- `VITE_ATTACHMENTS_BUCKET` (defaults to `attachments`)
- `VITE_INBOUND_EMAIL` (displays inbound-email setup details)
- `VITE_DISABLE_EMAIL_PASSWORD_AUTHENTICATION` (when unset, email/password login remains enabled)
- `VITE_GOOGLE_WORKPLACE_DOMAIN` (only when Google Workspace SSO is configured)

These Vite variables are included in browser code and must contain only public configuration. Never set a service-role key, database password, Postmark webhook password, or other privileged secret as a `VITE_` variable. Configure Edge Function secrets in Supabase, not in Vercel frontend variables.

Set both required variables in Vercel's Production scope. Set them in Preview only when preview builds should connect to Supabase. Preview deployments can perform real writes: use a separate Supabase project for Preview when isolation is required. Set Development values only if using Vercel's Development environment; local Vite development reads the ignored `.env.local` file.

## Supabase Auth URLs

In Supabase Dashboard, open **Authentication > URL Configuration** and configure:

- Site URL: `https://crm-elve.vercel.app`
- Redirect URL: `https://crm-elve.vercel.app/**`
- Local development redirect URL, if needed: `http://localhost:5173/**`

Password recovery and invitation emails use the configured Supabase Site URL unless a redirect is explicitly supplied, so test those links after configuring the temporary Vercel URL.

Public signup is not exposed: `/sign-up` redirects to `/login`. Super Admin user creation calls the authenticated `admin-create-user` Supabase Edge Function; the service-role key remains server-side.

## Post-deployment checklist

- Confirm `/` (dashboard), `/#/leads`, `/#/contacts`, `/#/companies`, `/#/deals` (opportunities/pipeline), `/#/tasks`, and `/#/profile` load after direct navigation and refresh. The dashboard is the root route; the pipeline is the `deals` resource.
- Test login, session persistence after refresh/new tab, logout, forgot password, set password, and Super Admin account creation with a test account.
- Confirm Supabase requests succeed and inspect browser network/console output for CORS, authorization, or runtime errors.
- Check desktop, tablet, and mobile layouts for login, dashboard, lead detail, tasks, and pipeline.
- Confirm user role scopes, lead ownership, assigned-BDO visibility, and RLS in the hosted project remain as intended.
- Review Vercel response headers and confirm the deployed build points to the intended Supabase project.

## Database status

This repository contains migrations through `202609250013_lead_owner_and_assigned_bdo.sql`. The hosted project's applied/pending migration state must be checked with an authenticated Supabase CLI connection; do not reset the database or apply migrations as part of a Vercel deployment.
