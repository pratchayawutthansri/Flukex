# Future Supabase Integration Checklist

เดโมนี้ยังไม่มี Supabase dependency และต้องไม่สร้าง project ในระยะนี้

## Project and environment

- [ ] Create separate development/staging/production projects
- [ ] Add server-only URL/service credentials; expose only anon key where appropriate
- [ ] Change `NEXT_PUBLIC_DATA_PROVIDER=supabase`
- [ ] Validate environment variables with a server-side Zod schema
- [ ] Never commit `.env.local`

## Database model

- [ ] Create `tenants`, `restaurants`, `branches`, `profiles`, `memberships`
- [ ] Create `categories`, `products`, `product_modifiers`, `tables`
- [ ] Create `orders`, `order_items`, `payments`, `order_status_events`
- [ ] Create `subscriptions`, `usage_counters`, `notification_logs`
- [ ] Add `tenant_id` and timestamps to every tenant-scoped table
- [ ] Map TypeScript unions to PostgreSQL enums or validated text constraints
- [ ] Add indexes for tenant + branch + status + created_at queries

## Security and multi-tenancy

- [ ] Enable RLS on every tenant-scoped table
- [ ] Derive tenant membership from authenticated user; never accept trusted tenant id from browser input
- [ ] Add role/branch policies for OWNER, MANAGER, CASHIER, KITCHEN, BAR
- [ ] Test cross-tenant reads/writes with automated negative tests
- [ ] Keep payment/webhook secrets server-side only

## Adapter implementation

- [ ] Implement `SupabaseAuthService`
- [ ] Implement `SupabaseProductRepository`
- [ ] Implement `SupabaseOrderRepository`
- [ ] Implement `SupabaseRestaurantRepository`
- [ ] Implement `SupabaseSubscriptionRepository`
- [ ] Implement `SupabaseRealtimeService`
- [ ] Select adapters inside `ServiceContainer`; do not import Supabase in UI
- [ ] Preserve Zod validation at repository/service boundaries

## Realtime and idempotency

- [ ] Subscribe by authorized tenant/branch channels
- [ ] Handle reconnect and stale subscriptions
- [ ] Make order creation idempotent using client request id
- [ ] Keep order status transition validation on server/database
- [ ] Replace BroadcastChannel only at service adapter level

## Files and images

- [ ] Create private/public Storage buckets based on asset type
- [ ] Validate MIME, size and ownership before upload
- [ ] Generate responsive variants and reserve image dimensions
- [ ] Migrate demo URLs without changing `Product.imageUrl` consumers

## Subscription and entitlements

- [ ] Persist plan and usage server-side
- [ ] Enforce limits in server actions/database in addition to UI feedback
- [ ] Add billing provider behind a separate BillingService
- [ ] Verify webhook signatures and idempotency
- [ ] Do not infer paid plan from client state

## Notifications

- [ ] Implement provider adapters behind `NotificationService`
- [ ] Store connection secrets encrypted and server-only
- [ ] Queue delivery with retries/dead-letter handling
- [ ] Add consent, opt-out and audit logs for LINE/Telegram
- [ ] Verify Discord/Telegram/LINE requests server-side

## Migration and validation

- [ ] Write one-time Local Storage export/import only for development demos
- [ ] Seed sample tenant and demo roles
- [ ] Run contract tests against mock and Supabase adapters
- [ ] Run RLS integration tests
- [ ] Validate SEO pages remain server-rendered and independent of Supabase availability
- [ ] Add observability, error tracking, audit trail, backups and disaster-recovery runbook
