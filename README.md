# Flukex POS Demo

เดโม Multi-tenant SaaS Restaurant POS สำหรับนำเสนอ Marketing website และ Product demo แก่ลูกค้า โดยใช้ Mock Data + Local Storage เท่านั้น ไม่มี API key, secret, payment gateway หรือการเชื่อมบริการภายนอก

## ความสามารถในเดโม

- SEO Marketing: Homepage, Features, Pricing, Comparison, POS, QR Ordering, KDS, FAQ, Contact และ Legal pages
- Demo Auth: Register, Login, Logout, Reset password, Onboarding และ Plan selection
- Admin: Dashboard, ร้าน, สาขา, พนักงาน, หมวดหมู่, สินค้า, โต๊ะ/QR, ออเดอร์, รายงาน, Subscription, Settings และ Integrations
- POS: โต๊ะ, ค้นหา, หมวด, Modifier, Note, Quantity, Discount, VAT, Service charge, Payment และ Receipt simulation
- QR Ordering: Mobile-first menu, Cart, Submit, Status, Call staff และ Request bill
- KDS: Kitchen/Bar station filtering, Waiting time, Item status, Toast, Sound และ New-order highlight
- Centralized entitlements และ financial calculation engine
- Realtime demo ด้วย BroadcastChannel หลัง `RealtimeService`
- Reset-to-default จาก Admin sidebar

## บัญชีเดโม

| บทบาท | อีเมล | รหัสผ่าน |
|---|---|---|
| Owner | `owner@demo.com` | `demo1234` |
| Cashier | `cashier@demo.com` | `demo1234` |
| Kitchen | `kitchen@demo.com` | `demo1234` |

## เริ่มพัฒนา

ต้องใช้ Node.js 20.9 ขึ้นไป และ pnpm

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

เปิด [http://localhost:3000](http://localhost:3000)

คำสั่งตรวจคุณภาพ:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## Environment

`.env.example` ไม่มี secret:

```env
NEXT_PUBLIC_DATA_PROVIDER=mock
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_REALTIME=broadcast-channel
```

โหมด `mock` ใช้สำหรับสาธิตบนอุปกรณ์เดียว ส่วนการใช้งานจริงและ Discord Webhook
ต้องตั้ง `NEXT_PUBLIC_DATA_PROVIDER=supabase` พร้อม Supabase credentials

## Deploy บน Vercel

1. Push โฟลเดอร์นี้ขึ้น Git repository
2. Import repository ใน Vercel และตั้ง Root Directory เป็น `FlukexPOS` หาก repository root อยู่เหนือโฟลเดอร์นี้
3. Framework Preset: Next.js
4. Install Command: `pnpm install`
5. Build Command: `pnpm build`
6. เพิ่ม environment variables ตาม `.env.example` โดยเปลี่ยน `NEXT_PUBLIC_APP_URL` เป็น production URL
7. รัน Supabase migrations ทุกไฟล์ตามลำดับจนถึง `0013_staff_join_requests.sql`
8. สร้าง `INTEGRATION_ENCRYPTION_KEY` แบบสุ่มอย่างน้อย 32 ตัวอักษรและตั้งเฉพาะฝั่ง Server
9. หากต้องการ Webhook กลางเพียงตัวเดียว สามารถตั้ง `DISCORD_WEBHOOK_URL` บน Hosting แทนการกรอกใน Dashboard
10. Deploy และตรวจ `/robots.txt`, `/sitemap.xml`, Marketing pages และ noindex ของ `/order/...`

ห้ามใส่ `SUPABASE_SERVICE_ROLE_KEY`, `INTEGRATION_ENCRYPTION_KEY` หรือ
`DISCORD_WEBHOOK_URL` ไว้ในตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_` และห้าม commit ค่าเหล่านี้

## เอกสาร

- [Architecture](./docs/ARCHITECTURE.md)
- [Future Supabase integration checklist](./docs/SUPABASE_INTEGRATION.md)
- [UI Design System](./design-system/flukex-pos/MASTER.md)

## ข้อจำกัดของเดโม

- Local Storage เป็นข้อมูลระดับ Browser/Device ไม่ใช่ shared cloud database
- BroadcastChannel ทำงานระหว่างแท็บใน origin เดียวกัน ไม่ใช่ realtime ข้ามอุปกรณ์
- Payment, printer, LINE, Telegram และ subscription billing เป็น simulation
- Discord Webhook ใช้งานจริงเมื่อเปิด Supabase mode, รัน migration และตั้ง encryption key แล้ว
- ข้อมูลรายงานบางส่วนเป็น mock aggregates เพื่อให้ demo story สมบูรณ์
