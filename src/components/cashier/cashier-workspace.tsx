"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Banknote, BellRing, CheckCircle2, ClipboardList, Eye, LogOut, Monitor, QrCode, ReceiptText, Table2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Order } from "@/domain/types";
import { formatCurrency, formatDateTime, formatTime } from "@/lib/utils";
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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const orders = useDemoStore((state) => state.orders);
  const updateOrderStatus = useDemoStore((state) => state.updateOrderStatus);
  const tables = useDemoStore((state) => state.tables);
  const restaurant = useDemoStore((state) => state.restaurants[0]);
  const branch = useDemoStore((state) => state.branches[0]);
  const selectedOrder = selectedOrderId ? orders.find((order) => order.id === selectedOrderId) ?? null : null;
  const firstTable = tables[0];
  const qrHref = restaurant && firstTable ? `/order/${restaurant.slug}/table/${firstTable.token}` : "/dashboard/tables";
  const paidOrders = orders.filter((order) => Boolean(order.paidAt));
  const activeOrders = orders.filter((order) => !["SERVED", "CANCELLED"].includes(order.status));
  const pendingBills = tables.filter((table) => table.status === "BILL_REQUESTED");
  const shiftSales = paidOrders.reduce((sum, order) => sum + order.totals.grandTotal, 0);

  const logout = async () => {
    await signOut();
    router.replace("/login");
  };

  const acceptOrder = (order: Order) => {
    if (order.status !== "WAITING") return;

    updateOrderStatus(order.id, null, "PREPARING");
    toast.success(`ยืนยันรับออเดอร์ ${order.orderNumber} แล้ว`, {
      description: `${order.tableName} • ส่งรายการให้ครัวและบาร์แล้ว`,
    });
  };

  return (
    <main id="main-content" className="min-h-dvh bg-muted/40 pb-10">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur-lg">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo compact />
            <div className="hidden min-w-0 border-l pl-3 sm:block">
              <p className="truncate text-sm font-bold">Cashier Workspace</p>
              <p className="truncate text-xs text-muted-foreground">{session?.name ?? "บัญชีแคชเชียร์"} · {branch?.name ?? "ยังไม่มีสาขา"}</p>
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
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-muted/60 text-xs text-muted-foreground"><tr><th className="px-5 py-3">ออเดอร์</th><th className="px-5 py-3">โต๊ะ</th><th className="px-5 py-3">เวลา</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3 text-right">ยอดรวม</th><th className="px-5 py-3 text-right">การทำงาน</th></tr></thead>
                <tbody>
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="border-t hover:bg-muted/40">
                      <td className="px-5 py-4 font-bold">
                        <button
                          type="button"
                          className="rounded-sm underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          onClick={() => setSelectedOrderId(order.id)}
                          aria-label={`ดูรายละเอียดออเดอร์ ${order.orderNumber}`}
                        >
                          {order.orderNumber}
                        </button>
                      </td>
                      <td className="px-5 py-4">{order.tableName}</td>
                      <td className="px-5 py-4 text-muted-foreground">{formatTime(order.createdAt)}</td>
                      <td className="px-5 py-4"><Badge variant={order.status === "READY" ? "success" : order.status === "CANCELLED" ? "danger" : "outline"}>{statusLabel[order.status]}</Badge></td>
                      <td className="px-5 py-4 text-right font-semibold">{formatCurrency(order.totals.grandTotal)}</td>
                      <td className="px-5 py-3 text-right">
                        {order.status === "WAITING" ? (
                          <Button
                            size="sm"
                            className="min-h-11 whitespace-nowrap"
                            onClick={() => acceptOrder(order)}
                            aria-label={`ยืนยันรับออเดอร์ ${order.orderNumber}`}
                          >
                            <CheckCircle2 />
                            ยืนยันรับออเดอร์
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-11 whitespace-nowrap"
                            onClick={() => setSelectedOrderId(order.id)}
                            aria-label={`ดูรายละเอียดออเดอร์ ${order.orderNumber}`}
                          >
                            <Eye />
                            ดูรายละเอียด
                          </Button>
                        )}
                      </td>
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
              <Button variant="outline" className="min-h-12 w-full justify-between" asChild><Link href={qrHref}><span className="flex items-center gap-2"><QrCode />{firstTable ? "ดู QR เมนู" : "เพิ่มโต๊ะและ QR"}</span><ArrowRight /></Link></Button>
              <div className="rounded-xl border bg-muted/50 p-4">
                <ReceiptText className="size-5 text-primary" />
                <p className="mt-3 text-sm font-bold">ข้อมูลผู้บริหารถูกจำกัด</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">รายงานเชิงลึก พนักงาน เครดิต แพ็กเกจ และตั้งค่า เปิดได้เฉพาะ Owner/Manager ตามสิทธิ์</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent>
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>ออเดอร์ {selectedOrder.orderNumber}</DialogTitle>
                <DialogDescription>
                  {selectedOrder.tableName} · {formatDateTime(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center justify-between">
                <Badge variant={selectedOrder.status === "READY" ? "success" : selectedOrder.status === "CANCELLED" ? "danger" : "outline"}>
                  {statusLabel[selectedOrder.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">ช่องทาง: {selectedOrder.source === "QR" ? "QR Ordering" : "POS"}</span>
              </div>

              <div className="mt-4 space-y-2">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="rounded-lg bg-muted p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span><strong>{item.quantity}×</strong> {item.productName}</span>
                      <Badge variant={item.status === "READY" ? "success" : item.status === "CANCELLED" ? "danger" : "outline"}>{statusLabel[item.status]}</Badge>
                    </div>
                    {item.modifiers.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.modifiers.map((modifier) => modifier.name).join(", ")}
                      </p>
                    )}
                    {item.note && <p className="mt-1 text-xs text-warning">หมายเหตุ: {item.note}</p>}
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1 border-t pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>ยอดรวมสินค้า</span><span>{formatCurrency(selectedOrder.totals.subtotal)}</span></div>
                {selectedOrder.totals.discount > 0 && (
                  <div className="flex justify-between text-muted-foreground"><span>ส่วนลด</span><span>-{formatCurrency(selectedOrder.totals.discount)}</span></div>
                )}
                <div className="flex justify-between text-muted-foreground"><span>ค่าบริการ</span><span>{formatCurrency(selectedOrder.totals.serviceCharge)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>VAT</span><span>{formatCurrency(selectedOrder.totals.vat)}</span></div>
                <div className="flex justify-between text-base font-bold"><span>ยอดสุทธิ</span><span>{formatCurrency(selectedOrder.totals.grandTotal)}</span></div>
              </div>

              {selectedOrder.status === "WAITING" && (
                <DialogFooter>
                  <Button
                    size="lg"
                    className="min-h-12 w-full"
                    onClick={() => acceptOrder(selectedOrder)}
                  >
                    <CheckCircle2 />
                    ยืนยันรับออเดอร์
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
