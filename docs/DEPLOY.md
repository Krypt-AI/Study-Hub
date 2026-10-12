# Deploying Study Hub to Netlify

The hosted site works like this:

| Who | Can open | Progress |
|---|---|---|
| Anyone (guest) | University courses | kept only until the page is closed |
| Signed in with Google | every course: each person picks what to study | saved to their account |

Anyone who signs in gets full access: there is no list of approved accounts to keep. Share the link only with the people you study with.

Netlify serves the app. Supabase handles sign-in and stores everyone's progress. Courses outside the University area (HSK, JLPT, 新にほんご500問, Python, SQL), their page images and audio are checked on every request by an edge function (`netlify/edge-functions/content-gate`). Without a sign-in the file is refused, so it cannot be downloaded by guessing its URL. The rules are in `src/domain/content/accessRules.ts`.

You need about an hour for the first setup. Do the steps in order.

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com) (the free plan is enough for a group of friends; check current limits at supabase.com/pricing).
2. Apply the three migrations in `supabase/migrations/`, oldest first. Either:
   - `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push`, or
   - open **SQL Editor**, paste each file and run it, in name order.
3. Note two values from **Project Settings → API Keys / Data API**: the project URL `https://<ref>.supabase.co` and the **publishable** key (`sb_publishable_…`, or the legacy `anon` key). Never use the secret / `service_role` key in the app.
4. Check **Project Settings → JWT Keys**. If the current signing key is the **legacy JWT secret**, also copy that secret for step 3.4. If the project uses the newer signing keys, you need nothing else.

## 2. Google sign-in

Google redirects back to Supabase at:

```
https://<ref>.supabase.co/auth/v1/callback
```

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create a project (or pick one).
2. **OAuth consent screen**: user type **External**, fill in the app name and your email. While the app is in *Testing*, only the test users you list can sign in; choose **Publish app** to let any Google account in (basic sign-in needs no Google review).
3. **Credentials → Create credentials → OAuth client ID → Web application**:
   - Authorized JavaScript origins: `https://<your-site-name>.netlify.app`
   - Authorized redirect URIs: the callback above
4. Copy the **Client ID** and **Client secret** into **Supabase → Authentication → Sign In / Providers → Google**, and enable it.

Only Google is shown by default. To add Discord, GitHub or email later, enable the provider in Supabase and list it in `VITE_AUTH_PROVIDERS` (for example `google,github`).

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
   netlify env:set VITE_AUTH_PROVIDERS google
   # only for a project still on the legacy JWT secret (step 1.4):
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

## 5. Who has signed in

**Supabase → Table Editor → profiles** lists everyone who has signed in: email, name, picture and sign-in providers, refreshed at each sign-in. To remove someone, delete their user in **Authentication → Users** (their progress is deleted with it); they could sign in again with the link, so change the site name if the link has spread.

## 6. Check the live site

1. In a private window: the catalog shows **Sign in** tags on the non-University courses, a University course opens, and an HSK course says *Sign in to open this course*.
2. Opening a locked file directly, such as `https://<site>/content/courses/hsk-1.json`, answers **401**.
3. Sign in with Google: every course opens, search finds HSK and JLPT words, and **Settings → Your account** shows your name, picture and provider.

## Running the hosted setup locally

`npm run dev:netlify` runs the app behind the edge function at http://localhost:8888, using the same rules as the live site. Locally the edge function reads its settings from `.env.local`, not from variables set in your shell, so put `SUPABASE_JWT_SECRET` there too if your project uses the legacy secret. Without the settings it locks every course outside the University area, as intended. Plain `npm run dev` does not run the edge function: with Supabase configured you see the sign-in flow, but files are not locked. Without Supabase settings the app runs fully locally, as before, with nothing locked.

## What is protected, and what is not

- The locked courses' files, their page images and audio, and their search index are refused without a valid sign-in. The token is signed by Supabase and checked with your project's signing keys, so it cannot be forged; Supabase's anonymous sign-ins (off by default) do not count.
- The catalog (course titles, lesson titles and counts), the University courses and their pages are public.
- Each user's progress is private to them: row level security in the database (see [SUPABASE.md](SUPABASE.md)).
- Anyone who has the link can sign in with a Google account and open every course. The HSK and JLPT material comes from copyrighted books, so share the link only with the people you study with, and keep it out of public posts.
