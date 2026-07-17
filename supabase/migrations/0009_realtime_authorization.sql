-- Realtime Authorization for the "tenant-{tenantId}" broadcast channels used by
-- SupabaseRealtimeService (src/services/realtime-service.ts).
--
-- NOTE: Supabase's Realtime Authorization for Broadcast (RLS on realtime.messages,
-- the realtime.topic() helper) is a newer feature — verify this against the current
-- Supabase docs/CLI-generated starter policy once the project exists, since the exact
-- function name/signature may have moved on. Test that KDS/POS/QR realtime actually
-- delivers events end-to-end before relying on this in production.

-- Since April 2025, Supabase enables RLS on realtime.messages by default and locks
-- its ownership to supabase_admin — `alter table ... enable row level security` here
-- fails with "must be owner of table messages". Only the policies below are ours to add.

create policy realtime_tenant_channel_select on realtime.messages for select
  using (
    realtime.topic() like 'tenant-%'
    and is_tenant_member((substring(realtime.topic() from 8))::uuid)
  );

create policy realtime_tenant_channel_insert on realtime.messages for insert
  with check (
    realtime.topic() like 'tenant-%'
    and is_tenant_member((substring(realtime.topic() from 8))::uuid)
  );
