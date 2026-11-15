-- DBW News — what the create-account form collects.
--
-- The form sends these as sign-up metadata; the new-user trigger copies them
-- onto the profile, where row-level security protects them. Metadata on the
-- auth user is editable by the user and is not the place to keep them.

alter table public.profiles
  add column mailing_address   text not null default '',   -- print levels only
  add column email_list        boolean not null default false,
  add column terms_accepted_at timestamptz;                 -- terms, privacy, community rules and the age line

-- She can keep her own name, address and email-list choice up to date.
grant update (display_name, mailing_address, email_list) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, display_name, mailing_address, email_list, terms_accepted_at)
  values (
    new.id,
    left(coalesce(meta ->> 'display_name', ''), 120),
    left(coalesce(meta ->> 'mailing_address', ''), 500),
    (meta ->> 'email_list') = 'true',
    case when (meta ->> 'terms_accepted') = 'true' then now() end
  );
  return new;
end $$;
