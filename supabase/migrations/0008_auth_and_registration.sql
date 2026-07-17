-- Auth wiring: profile bootstrap on signup, and a security-definer RPC that lets a
-- freshly authenticated user create their own tenant/restaurant/OWNER membership
-- (tenants/restaurants have no authenticated INSERT policy, by design — see 0007_rls.sql).

create or replace function generate_unique_slug(base_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
  suffix int := 0;
begin
  candidate := trim(both '-' from lower(regexp_replace(base_name, '[^a-zA-Z0-9]+', '-', 'g')));
  if candidate = '' then
    candidate := 'restaurant';
  end if;
  while exists (
    select 1 from restaurants
    where slug = candidate || case when suffix = 0 then '' else '-' || suffix end
  ) loop
    suffix := suffix + 1;
  end loop;
  return candidate || case when suffix = 0 then '' else '-' || suffix end;
end;
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.email), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Called once by the client right after supabase.auth.signUp() succeeds.
create or replace function bootstrap_tenant(p_restaurant_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  new_slug text;
begin
  if auth.uid() is null then
    raise exception 'must be authenticated';
  end if;

  if exists (select 1 from memberships where user_id = auth.uid()) then
    raise exception 'user already belongs to a tenant';
  end if;

  insert into tenants (name) values (p_restaurant_name) returning id into new_tenant_id;

  new_slug := generate_unique_slug(p_restaurant_name);

  insert into restaurants (tenant_id, name, slug, phone, address)
  values (new_tenant_id, p_restaurant_name, new_slug, '', '');

  insert into memberships (tenant_id, user_id, role) values (new_tenant_id, auth.uid(), 'OWNER');

  insert into subscriptions (tenant_id, plan_id) values (new_tenant_id, 'free');
  insert into usage_counters (tenant_id) values (new_tenant_id);

  return new_tenant_id;
end;
$$;

grant execute on function bootstrap_tenant(text) to authenticated;
