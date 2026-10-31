# Rogue Rose cloud setup

The redesign is on the `redesign/property-accounting` branch. The original `main` branch is untouched.

## What this foundation provides

- A Supabase/Postgres schema for properties, tenants, transactions, maintenance, and workspace settings.
- Each row is tied to the authenticated owner's Supabase user ID.
- Row Level Security (RLS) policies restrict reads and writes to that signed-in owner.
- Foreign keys prevent records from linking to another owner's property or tenant.

## Create the private backend

1. Create a Supabase project at https://supabase.com/dashboard.
2. Choose a strong database password and store it in a password manager. Do not put it in GitHub or in website code.
3. In the project, open **SQL Editor → New query**.
4. Copy and run the complete contents of `supabase/schema.sql`.
5. Open **Project Settings → API** and copy the Project URL and the publishable/anon client key. A publishable/anon key is designed for browser use when RLS is correctly enabled. Never use a `service_role` or secret key in the website.
6. In **Authentication → Providers**, enable Email. For a private owner-only workspace, leave public sign-ups disabled after creating the owner's account through the Supabase dashboard/invite flow. Configure the allowed site URL and redirect URLs when the site is deployed.
7. Keep the project URL and publishable key available for the next integration step. Do not send database passwords, service-role keys, or recovery codes in chat.

## Important before real records

The current dashboard still uses browser localStorage. This schema does **not** automatically migrate or sync those browser records. The login form and Supabase client still need to be connected to the actual project, then the dashboard's save/load actions need to be switched from localStorage to authenticated database calls.

Do not enter real tenant, banking, identity, or lease data into the prototype until that integration is completed and tested. Enable MFA on the owner account, use a unique password, and verify backup/recovery access.

## Files

- `supabase/schema.sql` — database tables, indexes, constraints, and owner-only RLS policies.
