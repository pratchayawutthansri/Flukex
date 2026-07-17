# Supabase Backend — Manual Testing Checklist

ทดสอบกับ `NEXT_PUBLIC_DATA_PROVIDER=supabase` ชี้ไปที่ project ที่ migrate + seed แล้ว (`pnpm dev`, เปิด URL ที่ terminal โชว์)

บัญชี demo (จาก `pnpm db:seed`):

| Role | Email | Password |
|---|---|---|
| Owner | owner@demo.com | demo1234 |
| Manager | manager@demo.com | demo1234 |
| Cashier | cashier@demo.com | demo1234 |
| Kitchen | kitchen@demo.com | demo1234 |
| Bar | bar@demo.com | demo1234 |
| Platform Admin | admin@flukex.demo | demo1234 |

---

## A. Auth & Session

- [ ] Login ด้วยอีเมล/รหัสผ่านผิด → ขึ้น error ที่อ่านออก ไม่ crash
- [ ] Login ด้วย `owner@demo.com` → เข้า `/dashboard` สำเร็จ
- [ ] Refresh หน้าเว็บหลัง login → ยังคง login อยู่ (ไม่เด้งกลับ `/login`)
- [ ] Logout → กลับไป `/login`, กด back ไม่สามารถเข้าหน้า dashboard ได้อีก
- [ ] Login แต่ละ role (manager/cashier/kitchen/bar) → ถูกพาไปหน้า home ของ role นั้นถูกต้อง (ดู `src/config/access-control.ts` → `ROLE_DEFINITIONS[role].home`):
  - OWNER/MANAGER → `/dashboard`
  - CASHIER → `/cashier`
  - KITCHEN → `/kitchen`
  - BAR → `/bar`
  - PLATFORM_ADMIN → `/platform-admin`
- [ ] "ลืมรหัสผ่าน" (`resetPassword`) ที่หน้า login → ไม่ error (อีเมลจริงจะถูกส่งถ้า SMTP ของ Supabase ตั้งไว้ ถ้ายังไม่ตั้งจะไม่มีอีเมลจริงแต่ API ไม่ควร error)

## B. สมัครสมาชิกใหม่ (Register → bootstrap_tenant)

- [ ] สมัครร้านใหม่ที่ `/register` ด้วยอีเมลที่ไม่เคยใช้ → login เข้า `/dashboard` ได้ทันที (ไม่ต้องยืนยันอีเมลก่อน ถ้า "Confirm email" ปิดอยู่ใน Supabase Auth settings)
- [ ] เช็คใน Supabase dashboard → Table Editor ว่ามีแถวใหม่ครบ 5 ตาราง: `tenants`, `restaurants`, `memberships` (role=OWNER), `subscriptions` (plan_id=free), `usage_counters` (ค่าเริ่มต้น 0)
- [ ] Login ด้วยบัญชีใหม่นี้ → เห็น **dashboard ว่างเปล่า** (ไม่มีสินค้า/โต๊ะ/ออเดอร์ของร้านสวัสดีบิสโทรปนมา)
- [ ] สมัครซ้ำด้วยอีเมลเดิม → ต้อง error ชัดเจน ไม่สร้างซ้ำ

## C. RLS / แยก tenant (สำคัญที่สุด)

- [ ] Login ร้าน A (เช่น demo owner) กับร้าน B (ร้านที่เพิ่งสมัครใหม่ใน B) คนละ browser/incognito พร้อมกัน
- [ ] ร้าน A มองไม่เห็นสินค้า/โต๊ะ/ออเดอร์/สาขา/พนักงานของร้าน B เลย (และกลับกัน)
- [ ] ลองพิมพ์ URL ตรงๆ เพื่อเดา id ของอีกร้าน (ถ้ามีหน้า edit-by-id) → ต้องเข้าไม่ได้/ไม่เจอข้อมูล ไม่ใช่ error 500
- [ ] (Automated ครอบคลุมแล้วใน `supabase/tests/rls-tenant-isolation.test.ts` — รันผ่านแล้ว)

## D. สิทธิ์ตาม Role (route + read/write)

- [ ] Login เป็น CASHIER แล้วพยายามเข้า `/dashboard/settings`, `/dashboard/branches`, `/dashboard/employees` → ต้องถูกกันไม่ให้เข้า (ดู `ROUTE_RULES` ใน `access-control.ts`)
- [ ] Login เป็น KITCHEN/BAR แล้วพยายามเข้า `/dashboard` หรือ `/cashier` → ต้องถูกกัน
- [ ] Login เป็น MANAGER แล้วลองแก้ไข "ข้อมูลร้าน" (`/dashboard/restaurant`) หรือ "การตั้งค่า" (`/dashboard/settings`) → ต้องถูกกัน (route rule: OWNER only)
- [ ] (Automated) MANAGER ไม่สามารถเพิ่มพนักงานใหม่เป็น role OWNER ได้ — ครอบคลุมใน `supabase/tests/role-permissions.test.ts`

## E. Dashboard CRUD (แยกตามเมนู)

### ร้าน/สาขา
- [ ] แก้ไขข้อมูลร้าน (ชื่อ, เบอร์, ที่อยู่) → เซฟแล้ว refresh หน้า ค่ายังอยู่ (ไปเช็คตาราง `restaurants` ใน Supabase ตรงด้วย)
- [ ] เพิ่มสาขาใหม่ (OWNER) → ขึ้นในตาราง `branches` พร้อม `tenant_id` ถูกต้อง
- [ ] ปิดการใช้งานสาขา (`isActive=false`) → สถานะเปลี่ยนถูกต้อง

### หมวดหมู่ / สินค้า
- [ ] เพิ่มหมวดหมู่ใหม่ → ขึ้นในตาราง `categories`
- [ ] เพิ่มสินค้าใหม่พร้อม modifier 2-3 ตัว → เช็คตาราง `products` และ `product_modifiers` (ต้องมี `product_id` ผูกถูกต้อง)
- [ ] แก้ไขสินค้า (เปลี่ยนราคา, เพิ่ม/ลบ modifier) → เซฟแล้วข้อมูลใน `product_modifiers` อัปเดตตาม (ของเก่าที่ไม่ใช้แล้วต้องหายไป ไม่ใช่ค้าง)
- [ ] Toggle "หมดสต็อก" (isSoldOut) / "งดขาย" (isAvailable) → อัปเดตถูกต้อง
- [ ] ลบสินค้า → หายทั้งจาก `products` และ `product_modifiers` (cascade delete)

### โต๊ะ
- [ ] เพิ่มโต๊ะใหม่ → มี `token` ไม่ซ้ำกับโต๊ะอื่น (unique constraint), QR code ใช้ token นี้เจนได้
- [ ] เปลี่ยนสถานะโต๊ะ (AVAILABLE → OCCUPIED → CLEANING) → อัปเดตถูกต้อง

### พนักงาน
- [ ] ดูรายชื่อพนักงาน → ครบตามที่ seed (5 คน)
- [ ] แก้ไข role/สาขาที่ดูแลของพนักงานที่มีอยู่แล้ว → เซฟสำเร็จ
- [ ] ลองเพิ่ม "พนักงานใหม่" (คนที่ยังไม่เคยมี auth account) → **คาดหวังว่าจะ error/ยังไม่รองรับ** (เป็น known gap: `SupabaseUserRepository.save()` รองรับแค่แก้ไข membership เดิม ต้องทำ invite-flow แยกต่างหากในอนาคต)

### Subscription
- [ ] ดูแผนปัจจุบัน (starter สำหรับร้าน seed, free สำหรับร้านที่เพิ่งสมัคร)
- [ ] เปลี่ยนแผน (OWNER) → อัปเดตในตาราง `subscriptions` จริง

## F. POS (หน้าร้าน)

- [ ] เลือกโต๊ะ → เลือกสินค้า + modifier + จำนวน + note → ยอดรวมคำนวณถูกต้อง (subtotal → discount → service charge → VAT → grand total ตามลำดับใน `docs/ARCHITECTURE.md`)
- [ ] กดชำระเงิน (จำลอง) → ออเดอร์เปลี่ยนสถานะ, มีแถวใหม่ใน `orders`, `order_items`, `order_status_events`, และ `payments` (ถ้าจ่ายแล้ว)
- [ ] โต๊ะที่สร้างออเดอร์ → สถานะเปลี่ยนเป็น OCCUPIED ถูกต้อง

## G. QR Ordering (ลูกค้า, ไม่ login)

- [ ] เปิด `/order/[restaurantSlug]/table/[tableToken]` โดยไม่ login (ใช้ token ของโต๊ะที่มีจริง)
- [ ] เลือกเมนู → ใส่ตะกร้า → submit → ออเดอร์ถูกสร้าง, โต๊ะเปลี่ยนเป็น OCCUPIED
- [ ] "เรียกพนักงาน" / "ขอเช็คบิล" → มีแถวใหม่ใน `notification_logs`
- [ ] ทดสอบ token ปลอม/ไม่มีจริง → ต้องขึ้นหน้า error สุภาพ ไม่ leak ข้อมูล/ไม่ 500

## H. KDS (ครัว/บาร์)

- [ ] เปิด `/kitchen` คู่กับสร้างออเดอร์จากอีกแท็บ (POS หรือ QR) → ออเดอร์ใหม่ขึ้นแบบ realtime (ไม่ต้อง refresh) — ทดสอบ `SupabaseRealtimeService`
- [ ] `/kitchen` เห็นเฉพาะเมนูฝั่ง KITCHEN, `/bar` เห็นเฉพาะฝั่ง BAR
- [ ] กดเปลี่ยนสถานะ WAITING → PREPARING → READY → SERVED → sync ไปหน้าอื่นที่เปิดค้างไว้ (เช่น POS) แบบ realtime

## I. Platform Admin

- [ ] Login `admin@flukex.demo` → เห็นรายชื่อร้าน/สมาชิกทั้งหมด (ข้าม tenant ได้ เพราะเป็น `is_platform_admin=true`)
- [ ] Reset รหัสผ่านให้สมาชิก → มีแถวใหม่ใน `platform_security_events`, สมาชิกคนนั้น login ด้วยรหัสเก่าไม่ได้อีก ต้องใช้รหัสชั่วคราวที่ได้
- [ ] อนุมัติ/ปฏิเสธคำขอเติมเครดิต → `credit_top_up_requests.status` เปลี่ยน, ถ้าอนุมัติมีแถวใหม่ใน `credit_ledger_entries`

## J. เช็คตรงกับ Supabase dashboard (spot-check)

- [ ] ทุกตารางที่มี `tenant_id` → ค่าตรงกับ tenant ที่ล็อกอินอยู่จริง ไม่มีค่า null หลุด
- [ ] `created_at`/`updated_at` อัปเดตอัตโนมัติทุกครั้งที่แก้ไข (trigger `set_updated_at`)
- [ ] ไม่มี error ใน Supabase dashboard → Logs → API/Postgres ระหว่างทดสอบทั้งหมด

---

## Automated tests (ต้องมี live Supabase project ก่อนถึงจะรันได้)

```
SUPABASE_TEST_URL=... SUPABASE_TEST_ANON_KEY=... SUPABASE_TEST_SERVICE_ROLE_KEY=... pnpm vitest run supabase/tests
```

- `rls-tenant-isolation.test.ts` — ข้าม tenant อ่าน/เขียนไม่ได้
- `role-permissions.test.ts` — CASHIER/KITCHEN เขียนสินค้าไม่ได้, MANAGER เลื่อนตัวเองเป็น OWNER ไม่ได้
- `registration-bootstrap.test.ts` — `bootstrap_tenant` สร้างครบ 4 ตาราง และเรียกซ้ำไม่ได้

รันซ้ำได้เรื่อยๆ โดยไม่ทำให้ข้อมูล demo เสีย เพราะ test สร้าง/ลบ tenant ทดสอบของตัวเองทุกครั้ง (`beforeAll`/`afterAll`)
