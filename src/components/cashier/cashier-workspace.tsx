"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Banknote, BellRing, ClipboardList, LogOut, Monitor, QrCode, ReceiptText, Table2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatTime } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";

const statusLabel = {
  WAITING: "รอรับรายการ",
  PREPARING: "กำลังเตรียม",
  READY: "พร้อมเสิร์ฟ",
  SERVED: "เสิร์ฟแล้ว",
  CANCELLED: "ยกเลิก",
} as const;

export function CashierWorkspace() {
  const router = useRouter();
  const { session, signOut } = useAuthSession();
  const orders = useDemoStore((state) => state.orders);
  const tables = useDemoStore((state) => state.tables);
  const paidOrders = orders.filter((order) => Boolean(order.paidAt));
  const activeOrders = orders.filter((order) => !["SERVED", "CANCELLED"].includes(order.status));
  const pendingBills = tables.filter((table) => table.status === "BILL_REQUESTED");
  const shiftSales = paidOrders.reduce((sum, order) => sum + order.totals.grandTotal, 0);

  const logout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <main id="main-content" className="min-h-dvh bg-muted/40 pb-10">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur-lg">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo compact />
            <div className="hidden min-w-0 border-l pl-3 sm:block">
              <p className="truncate text-sm font-bold">Cashier Workspace</p>
              <p className="truncate text-xs text-muted-foreground">{session?.name ?? "บัญชีแคชเชียร์"} · สาขาสุขุมวิท</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:flex"><Monitor className="size-3.5" />แคชเชียร์</Badge>
            <Button variant="outline" size="sm" onClick={logout}><LogOut />ออกจากระบบ</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-2xl bg-[#3f0b0b] p-6 text-white shadow-soft sm:p-8" aria-labelledby="cashier-title">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <Badge className="bg-white/10 text-red-50">กะทำงานปัจจุบัน</Badge>
              <h1 id="cashier-title" className="mt-3 text-2xl font-bold sm:text-3xl">พร้อมรับออเดอร์และชำระเงิน</h1>
              <p className="mt-2 max-w-2xl text-sm text-red-100/75">พื้นที่นี้แสดงเฉพาะงานหน้าร้าน ไม่มีรายงานผู้บริหาร พนักงาน แพ็กเกจ หรือการตั้งค่าระดับเจ้าของ</p>
            </div>
            <Button size="lg" asChild className="min-h-12 bg-white text-primary hover:bg-red-50">
              <Link href="/pos"><Monitor />เปิดหน้าขาย POS<ArrowRight /></Link>
            </Button>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="สรุปกะทำงาน">
          {[
            { label: "ยอดขายในกะ", value: formatCurrency(shiftSales), description: `${paidOrders.length} บิลที่ชำระแล้ว`, icon: Banknote, tone: "text-emerald-700 bg-emerald-100" },
            { label: "ออเดอร์กำลังทำ", value: activeOrders.length.toLocaleString("th-TH"), description: "ติดตามจาก POS และ QR", icon: ClipboardList, tone: "text-blue-700 bg-blue-100" },
            { label: "โต๊ะรอชำระ", value: pendingBills.length.toLocaleString("th-TH"), description: pendingBills.length ? pendingBills.map((table) => table.name).join(", ") : "ยังไม่มีคำขอ", icon: BellRing, tone: "text-amber-700 bg-amber-100" },
            { label: "โต๊ะที่ใช้งาน", value: tables.filter((table) => table.status !== "AVAILABLE").length.toLocaleString("th-TH"), description: `จากทั้งหมด ${tables.length} โต๊ะ`, icon: Table2, tone: "text-violet-700 bg-violet-100" },
          ].map((item) => (
            <Card key={item.label} className="p-5">
              <span className={`grid size-10 place-items-center rounded-xl ${item.tone}`}><item.icon className="size-5" aria-hidden="true" /></span>
              <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{item.description}</p>
            </Card>
          ))}
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b p-5">
              <div><h2 className="font-bold">ออเดอร์ล่าสุด</h2><p className="text-xs text-muted-foreground">ข้อมูลที่ต้องใช้บริการลูกค้าหน้าร้าน</p></div>
              <Badge variant="outline">{orders.length} ออเดอร์</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-muted/60 text-xs text-muted-foreground"><tr><th className="px-5 py-3">ออเดอร์</th><th className="px-5 py-3">โต๊ะ</th><th className="px-5 py-3">เวลา</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3 text-right">ยอดรวม</th></tr></thead>
                <tbody>
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="border-t">
                      <td className="px-5 py-4 font-bold">{order.orderNumber}</td>
                      <td className="px-5 py-4">{order.tableName}</td>
                      <td className="px-5 py-4 text-muted-foreground">{formatTime(order.createdAt)}</td>
                      <td className="px-5 py-4"><Badge variant={order.status === "READY" ? "success" : order.status === "CANCELLED" ? "danger" : "outline"}>{statusLabel[order.status]}</Badge></td>
                      <td className="px-5 py-4 text-right font-semibold">{formatCurrency(order.totals.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-bold">งานด่วนหน้าร้าน</h2>
            <p className="mt-1 text-xs text-muted-foreground">เข้าถึงเฉพาะเครื่องมือของแคชเชียร์</p>
            <div className="mt-5 space-y-3">
              <Button className="min-h-12 w-full justify-between" asChild><Link href="/pos"><span className="flex items-center gap-2"><Monitor />เปิด POS</span><ArrowRight /></Link></Button>
              <Button variant="outline" className="min-h-12 w-full justify-between" asChild><Link href="/order/demo-restaurant/table/table-01"><span className="flex items-center gap-2"><QrCode />ดู QR เมนู</span><ArrowRight /></Link></Button>
              <div className="rounded-xl border bg-muted/50 p-4">
                <ReceiptText className="size-5 text-primary" />
                <p className="mt-3 text-sm font-bold">ข้อมูลผู้บริหารถูกจำกัด</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">รายงานเชิงลึก พนักงาน เครดิต แพ็กเกจ และตั้งค่า เปิดได้เฉพาะ Owner/Manager ตามสิทธิ์</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
