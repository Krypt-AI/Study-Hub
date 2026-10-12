# Deploying Study Hub to Netlify

The hosted site works like this:

| Who | Can open | Progress |
|---|---|---|
| Anyone (guest) | University courses | kept only until the page is closed |
| Signed in (Google, Discord or GitHub) | University courses | saved to their account |
| Signed in **and on the members list** | every course | saved to their account |

Netlify serves the app. Supabase handles sign-in and stores everyone's progress. Courses outside the University area (HSK, JLPT, 新にほんご500問, Python, SQL), their page images and audio are checked on every request by an edge function (`netlify/edge-functions/content-gate`). Without a member's sign-in the file is refused, so it cannot be downloaded by guessing its URL. The rules are in `src/domain/content/accessRules.ts`.

You need about an hour for the first setup. Do the steps in order.

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com) (the free plan is enough for a group of friends; check current limits at supabase.com/pricing).
2. Apply the three migrations in `supabase/migrations/`, oldest first. Either:
   - `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push`, or
   - open **SQL Editor**, paste each file and run it, in name order.
3. **Turn on the members hook**: **Authentication → Hooks → Customize Access Token (JWT) Claims → Postgres**, schema `public`, function `custom_access_token_hook`. Without it nobody is a member, so only University courses open.
4. Note two values from **Project Settings → API Keys / Data API**: the project URL `https://<ref>.supabase.co` and the **publishable** key (`sb_publishable_…`, or the legacy `anon` key). Never use the secret / `service_role` key in the app.
5. Check **Project Settings → JWT Keys**. If the current signing key is the **legacy JWT secret**, also copy that secret for step 3.4. If the project uses the newer signing keys, you need nothing else.

## 2. Sign-in providers

Every provider redirects back to Supabase at:

```
https://<ref>.supabase.co/auth/v1/callback
```

Create an OAuth app with each provider, then paste its client ID and secret into **Supabase → Authentication → Sign In / Providers → <provider>** and enable it.

| Provider | Where to create the app | What to enter |
|---|---|---|
| Google | [Google Cloud Console](https://console.cloud.google.com/apis/credentials): set up the OAuth consent screen, then **Create credentials → OAuth client ID → Web application** | Authorized redirect URI: the callback above |
| Discord | [Discord Developer Portal](https://discord.com/developers/applications) → **New Application → OAuth2** | Redirects: the callback above |
| GitHub | GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App** | Homepage URL: your site; Authorization callback URL: the callback above |

To show fewer buttons, set `VITE_AUTH_PROVIDERS` (for example `google,github`). Add `email` to it to also offer email and password, and keep the **Email** provider enabled in Supabase for that.

## 3. Netlify site

The University and imported courses are not in git (they are your materials), so the site is built and uploaded **from this computer** with the Netlify CLI rather than from the repository.

1. `npm install -g netlify-cli`, then `netlify login`.
2. In this folder: `netlify sites:create --name <your-site-name>` (it links the folder to the new site; if it does not, run `netlify link`). The site URL is `https://<your-site-name>.netlify.app`.
3. Back in **Supabase → Authentication → URL Configuration**:
   - Site URL: `https://<your-site-name>.netlify.app`
   - Redirect URLs: `https://<your-site-name>.netlify.app/**`, and for local testing `http://localhost:5173/**` and `http://localhost:8888/**`
4. Set the site's environment variables. They are needed both while building (the app) and at run time (the edge function):

   ```
   netlify env:set VITE_SUPABASE_URL https://<ref>.supabase.co
   netlify env:set VITE_SUPABASE_ANON_KEY <publishable key>
   netlify env:set VITE_AUTH_PROVIDERS google,discord,github
   # only for a project still on the legacy JWT secret (step 1.5):
   netlify env:set SUPABASE_JWT_SECRET <legacy secret> --secret
   ```

5. Put the same `VITE_` values in `.env.local` (copy `.env.example`), because the build runs on this computer.

## 4. Deploy

```
npm run deploy:preview   # a draft URL to try first
npm run deploy           # the live site
```

Both run `npm run check:deploy` first. It stops the deploy if Supabase is not configured, if the browser key is a secret key, or if the private courses are missing. Then they build everything (`npm run build`) and upload `dist/` with the edge function. The first upload is about 420 MB of page images and audio and takes a while; later deploys upload only changed files.

Redeploy whenever content changes (new lessons, a new semester, imported books).

## 5. Members

Sign in on the live site yourself first. Then add the emails that may open every course, yourself included, in **SQL Editor**:

```sql
insert into private.member_emails (email, note) values
  ('you@gmail.com', 'me'),
  ('friend@gmail.com', 'Mei');
```

Use lower case. A friend's membership takes effect at their next sign-in or within the hour, or at once if they press **Check again** on a locked course. To remove someone: `delete from private.member_emails where email = 'friend@gmail.com';`.

Membership needs the account's email to be **confirmed** by the provider, so typing someone else's address into another provider does not work. To see who has signed in (to copy an email), open **Table Editor → profiles**: it holds each user's email, name, picture and sign-in providers, refreshed at every sign-in.

## 6. Check the live site

1. In a private window: the catalog shows **Members** tags on the non-University courses, a University course opens, and an HSK course says *This course is for members*.
2. Opening a members-only file directly, such as `https://<site>/content/courses/hsk-1.json`, answers **401**.
3. Sign in with each provider. **Settings → Your account** shows your name, picture and provider. Before you are on the list it says *Not on the members list yet*.
4. Add yourself to the members list, press **Check again**: every course opens, and search finds HSK and JLPT words.

## Running the hosted setup locally

`npm run dev:netlify` runs the app behind the edge function at http://localhost:8888, using the same rules as the live site. Locally the edge function reads its settings from `.env.local`, not from variables set in your shell, so put `SUPABASE_JWT_SECRET` there too if your project uses the legacy secret. Without the settings it locks every members-only file, as intended. Plain `npm run dev` does not run the edge function: with Supabase configured you see the sign-in flow, but files are not locked. Without Supabase settings the app runs fully locally, as before, with nothing locked.

## What is protected, and what is not

- Members-only course files, their page images and audio, and the members' search index are refused without a valid member token. The token is signed by Supabase and checked with your project's signing keys, so it cannot be forged or edited in the browser.
- The catalog (course titles, lesson titles and counts), the University courses and their pages are public.
- Each user's progress is private to them: row level security in the database (see [SUPABASE.md](SUPABASE.md)).
- Anyone can create an account. Without being on the members list it only lets them save University progress.
- The HSK and JLPT material comes from copyrighted books. Keep the members list to the people you study with.
