-- Accounts: a profile for every user (filled from their Google, Discord or GitHub sign-in) and
-- the members list that unlocks the courses outside the University area.
--
-- Anyone can sign in and save progress. Only members can open the other courses: the hosting
-- layer reads the `study_hub_member` claim that `custom_access_token_hook` adds to each access
-- token. Enable the hook once in the dashboard: Authentication -> Hooks -> Customize Access
-- Token (JWT) Claims -> Postgres function `public.custom_access_token_hook` (see docs/DEPLOY.md).

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  -- Every provider the user has signed in with, e.g. {google, github}.
  providers text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner reads" on public.profiles for select
  using ((select auth.uid()) = user_id);
-- Only the display name is the user's to change; the rest is copied from auth.users.
create policy "profiles: owner updates" on public.profiles for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.profiles from anon;
revoke insert, delete, update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- Copies the sign-in details into the profile on every sign-up and sign-in that changes them.
-- Provider metadata differs: Google sends full_name and picture, GitHub name and user_name,
-- Discord full_name and custom_claims.global_name; all send avatar_url or picture.
create function public.sync_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, email, display_name, avatar_url, providers)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data -> 'custom_claims' ->> 'global_name',
      new.raw_user_meta_data ->> 'user_name',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    coalesce(array(select jsonb_array_elements_text(new.raw_app_meta_data -> 'providers')), '{}')
  )
  on conflict (user_id) do update set
    email = excluded.email,
    avatar_url = excluded.avatar_url,
    providers = excluded.providers,
    -- Keep a name the user chose; fill it only if it is still empty.
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = now();
  return new;
end;
$$;

revoke execute on function public.sync_profile() from public, anon, authenticated;

create trigger sync_profile
  after insert or update of email, raw_user_meta_data, raw_app_meta_data on auth.users
  for each row execute function public.sync_profile();

-- ---------------------------------------------------------------------------
-- Members
-- ---------------------------------------------------------------------------

-- The `private` schema is not exposed through the API: only the owner (dashboard, SQL editor)
-- and the functions below can read it.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.member_emails (
  email text primary key check (email = lower(email)),
  note text,
  added_at timestamptz not null default now()
);

revoke all on private.member_emails from public, anon, authenticated;

-- A member is a user whose confirmed email is on the list. Google, Discord and GitHub confirm
-- the email before Supabase marks it confirmed, so a list entry cannot be claimed by someone
-- who merely types that address into another provider.
create function private.is_member(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from auth.users u
    join private.member_emails m on m.email = lower(u.email)
    where u.id = target and u.email_confirmed_at is not null
  );
$$;

revoke execute on function private.is_member(uuid) from public, anon, authenticated;

-- Supabase Auth calls this before issuing each access token. It adds `study_hub_member`, which
-- the app shows and the Netlify edge function enforces. A change to the list reaches a user at
-- their next token refresh (within an hour) or sign-in.
create function public.custom_access_token_hook(event jsonb) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  return jsonb_set(
    event,
    '{claims,study_hub_member}',
    to_jsonb(private.is_member((event ->> 'user_id')::uuid))
  );
end;
$$;

revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
