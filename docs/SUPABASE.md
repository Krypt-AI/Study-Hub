# Supabase (optional)

By default Study Hub keeps your data in the browser. Connect Supabase to sign in with Google (Discord, GitHub or email can be added) and use the same data on several devices. To host it for friends on Netlify, follow [DEPLOY.md](DEPLOY.md), which covers these steps too.

## Set up

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the migrations in `supabase/migrations/`, oldest first (the second adds the calendar tables, the third profiles, the fourth the table privileges signed-in users need):
   - with the Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`, or
   - paste each SQL file into the dashboard's SQL editor and run it once, in name order.
3. Turn on the sign-in providers: [DEPLOY.md, step 2](DEPLOY.md#2-sign-in-providers).
4. Copy `.env.example` to `.env.local` and fill in the project URL and the **publishable** (or legacy **anon**) key from **Project Settings → API Keys**:

   ```
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<publishable or anon key>
   ```

5. Restart `npm run dev`. Visitors start as guests; **Sign in** in the rail opens `/sign-in`.

**Never** put the `service_role` key in any `VITE_` variable or anywhere in the frontend: it bypasses row level security and would be readable by anyone who opens the site.

## Moving your local data

In local mode, **Settings → Backups → Export backup**. Then configure Supabase, sign in and use **Import backup** (Merge or Replace).

## How your data is protected

- Every table has row level security: a signed-in user can read and write only rows whose `user_id` is their own. `user_id` is filled in by the database from the session, never by the app.
- The `anon` role (signed out) has no privileges on these tables.
- Two functions (`record_activity`, `delete_note_folder`) run as the caller, so the same policies apply inside them.
- `profiles` holds each user's email, name, picture and sign-in providers, copied from `auth.users` by a trigger. A user can read their own profile and change only its display name.
- `npm test` runs `supabase/tests/rls.test.ts`, which applies the migrations to a real Postgres (PGlite) and checks that another user's rows cannot be read, changed, deleted or written, that signed-out requests are refused, and that profiles stay private.

## Schema

Each table stores the app's record as JSONB in `record`, with the key in `id`, the owner in `user_id`, and generated columns for the fields the app filters on. The record shapes are in `src/data/records.ts`. To change the schema, add a new migration file; do not edit an applied one.
