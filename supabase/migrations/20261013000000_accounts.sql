-- Accounts: a profile for every user, filled from their Google, Discord or GitHub sign-in.
--
-- Anyone signed in can save progress and open every course; who may sign in at all is up to
-- whom you share the site with. The Netlify edge function only checks that a request carries a
-- valid sign-in (see docs/DEPLOY.md).

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
