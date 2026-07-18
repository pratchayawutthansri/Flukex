-- Platform administrators can credit an active business directly.
-- The database function owns authorization, validation, locking and idempotency so
-- the balance and immutable ledger cannot diverge under concurrent requests.

alter table credit_ledger_entries
  add column if not exists idempotency_key uuid;

create unique index if not exists credit_ledger_entries_idempotency_key_idx
  on credit_ledger_entries(idempotency_key)
  where idempotency_key is not null;

create or replace function platform_admin_add_credit(
  p_member_id uuid,
  p_amount numeric,
  p_note text,
  p_idempotency_key uuid
)
returns table (
  id uuid,
  member_id uuid,
  tenant_id uuid,
  type credit_ledger_type,
  amount numeric,
  balance_after numeric,
  reference text,
  description text,
  created_at timestamptz,
  created_by text,
  idempotency_key uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_member platform_members%rowtype;
  operator_email text;
  next_balance numeric(12, 2);
  entry_reference text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if not is_platform_admin() then
    raise exception 'Platform administrator permission required' using errcode = '42501';
  end if;
  if p_idempotency_key is null then
    raise exception 'Idempotency key is required' using errcode = '22023';
  end if;
  if p_amount is null or p_amount <> trunc(p_amount) or p_amount < 1 or p_amount > 1000000 then
    raise exception 'Credit amount must be an integer between 1 and 1000000' using errcode = '22023';
  end if;
  if length(coalesce(p_note, '')) > 300 then
    raise exception 'Credit note must not exceed 300 characters' using errcode = '22023';
  end if;

  -- A retry returns the first result without changing the balance again.
  return query
  select e.id, e.member_id, e.tenant_id, e.type, e.amount, e.balance_after,
         e.reference, e.description, e.created_at, e.created_by, e.idempotency_key
  from credit_ledger_entries e
  where e.idempotency_key = p_idempotency_key;
  if found then
    return;
  end if;

  select * into target_member
  from platform_members
  where platform_members.id = p_member_id
  for update;

  if not found then
    raise exception 'Platform member not found' using errcode = 'P0002';
  end if;
  if target_member.status <> 'ACTIVE' then
    raise exception 'Credit can only be added to an active member' using errcode = '22023';
  end if;

  -- Re-check after acquiring the member lock so concurrent retries are idempotent.
  return query
  select e.id, e.member_id, e.tenant_id, e.type, e.amount, e.balance_after,
         e.reference, e.description, e.created_at, e.created_by, e.idempotency_key
  from credit_ledger_entries e
  where e.idempotency_key = p_idempotency_key;
  if found then
    return;
  end if;

  next_balance := target_member.credit_balance + p_amount;
  entry_reference := 'ADMIN-TOPUP-' || to_char(current_date, 'YYYYMMDD') || '-' ||
    upper(substr(replace(p_idempotency_key::text, '-', ''), 1, 8));
  select coalesce(p.email, auth.uid()::text) into operator_email
  from profiles p
  where p.id = auth.uid();

  update platform_members
  set credit_balance = next_balance
  where platform_members.id = p_member_id;

  return query
  insert into credit_ledger_entries (
    member_id, tenant_id, type, amount, balance_after, reference,
    description, created_by, idempotency_key
  ) values (
    target_member.id,
    target_member.tenant_id,
    'TOP_UP',
    p_amount,
    next_balance,
    entry_reference,
    coalesce(nullif(trim(p_note), ''), 'เติมเครดิตโดยผู้ดูแลแพลตฟอร์ม'),
    operator_email,
    p_idempotency_key
  )
  returning credit_ledger_entries.id, credit_ledger_entries.member_id,
    credit_ledger_entries.tenant_id, credit_ledger_entries.type,
    credit_ledger_entries.amount, credit_ledger_entries.balance_after,
    credit_ledger_entries.reference, credit_ledger_entries.description,
    credit_ledger_entries.created_at, credit_ledger_entries.created_by,
    credit_ledger_entries.idempotency_key;
end;
$$;

revoke all on function platform_admin_add_credit(uuid, numeric, text, uuid) from public;
grant execute on function platform_admin_add_credit(uuid, numeric, text, uuid) to authenticated;
