"use client";

import Link from "next/link";
import { ArrowRight, ChefHat, ClipboardList, PackageCheck, ShoppingCart, TableProperties, Users, UtensilsCrossed } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";

const actionLinks = [
  { href: "/pos", label: "เปิดหน้าขาย", description: "รับออเดอร์และชำระเงิน", icon: ShoppingCart },
  { href: "/kitchen", label: "ติดตามงานครัว", description: "ดูคิวและเวลาเตรียมอาหาร", icon: ChefHat },
  { href: "/dashboard/orders", label: "จัดการออเดอร์", description: "ตรวจสอบรายการและสถานะล่าสุด", icon: ClipboardList },
  { href: "/dashboard/products", label: "ตรวจสอบสินค้า", description: "เช็กเมนู ราคา และความพร้อมขาย", icon: PackageCheck },
] as const;

const statusLabel = {
  WAITING: "รอเริ่ม", PREPARING: "กำลังทำ", READY: "พร้อมเสิร์ฟ", SERVED: "เสิร์ฟแล้ว", CANCELLED: "ยกเลิก",
} as const;

export function ManagerOverview() {
  const orders = useDemoStore((state) => state.orders);
  const tables = useDemoStore((state) => state.tables);
  const products = useDemoStore((state) => state.products);
  const users = useDemoStore((state) => state.users);
  const activeOrders = orders.filter((order) => ["WAITING", "PREPARING", "READY"].includes(order.status));
  const attentionOrders = activeOrders.filter((order) => order.status === "READY" || order.status === "WAITING");
  const occupiedTables = tables.filter((table) => table.status !== "AVAILABLE");
  const availableProducts = products.filter((product) => product.isAvailable);
  const recentOrders = [...orders].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 6);
  const metrics = [
    { label: "ออเดอร์ที่กำลังดูแล", value: activeOrders.length, detail: `${attentionOrders.length} รายการควรติดตาม`, icon: ClipboardList },
    { label: "โต๊ะที่กำลังใช้งาน", value: occupiedTables.length, detail: `จากทั้งหมด ${tables.length} โต๊ะ`, icon: TableProperties },
    { label: "เมนูพร้อมขาย", value: availableProducts.length, detail: `จากทั้งหมด ${products.length} เมนู`, icon: UtensilsCrossed },
    { label: "ทีมงานในร้าน", value: users.length, detail: "บัญชีที่อยู่ในร้านนี้", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="ภาพรวมการปฏิบัติงาน"
        description="ติดตามสถานะหน้าร้าน ครัว และทีมงานที่ต้องจัดการในกะนี้"
        actions={<Button asChild><Link href="/pos"><ShoppingCart aria-hidden="true" />เปิด POS</Link></Button>}
      />

      <section aria-labelledby="manager-metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <h2 id="manager-metrics" className="sr-only">สรุปสถานะร้าน</h2>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}><CardContent className="flex items-start justify-between p-5">
              <div><p className="text-sm text-muted-foreground">{metric.label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{metric.value}</p><p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p></div>
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
            </CardContent></Card>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4"><div><CardTitle>ออเดอร์ล่าสุด</CardTitle><p className="mt-1 text-sm text-muted-foreground">สถานะงานที่หัวหน้ากะควรเห็นทันที</p></div><Button variant="ghost" size="sm" asChild><Link href="/dashboard/orders">ดูทั้งหมด<ArrowRight aria-hidden="true" /></Link></Button></CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center"><ClipboardList className="mx-auto size-8 text-muted-foreground" aria-hidden="true" /><p className="mt-3 font-medium">ยังไม่มีออเดอร์</p><p className="mt-1 text-sm text-muted-foreground">ออเดอร์ใหม่จาก POS และ QR จะปรากฏที่นี่</p></div>
            ) : (
              <div className="divide-y">{recentOrders.map((order) => (
                <div key={order.id} className="flex min-h-16 items-center justify-between gap-4 py-3">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">#{order.orderNumber}</p><Badge variant={order.status === "READY" ? "default" : "secondary"}>{statusLabel[order.status]}</Badge></div><p className="mt-1 truncate text-sm text-muted-foreground">{order.tableName || "สั่งกลับบ้าน"} · {formatDateTime(order.updatedAt)}</p></div>
                  <p className="shrink-0 font-semibold tabular-nums">{formatCurrency(order.totals.grandTotal)}</p>
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>ทางลัดสำหรับหัวหน้ากะ</CardTitle><p className="text-sm text-muted-foreground">เข้าถึงงานประจำโดยไม่แสดงข้อมูลเจ้าของธุรกิจ</p></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">{actionLinks.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="group flex min-h-20 items-center gap-4 rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary"><Icon className="size-5" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block font-semibold">{action.label}</span><span className="mt-0.5 block text-sm text-muted-foreground">{action.description}</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            );
          })}</CardContent>
        </Card>
      </div>
    </div>
  );
}
