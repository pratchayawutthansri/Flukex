"use client";

import Link from "next/link";
import { BarChart3, Download, LockKeyhole, PackageOpen, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canUseFeature } from "@/config/plans";
import { formatCurrency } from "@/lib/utils";
import { services } from "@/services/container";
import { useDemoStore } from "@/store/demo-store";
import { PageHeader } from "./page-header";

const thaiDay = new Intl.DateTimeFormat("th-TH", { weekday: "short" });
const thaiDateTime = new Intl.DateTimeFormat("th-TH", { dateStyle: "short", timeStyle: "short" });

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function ReportsDashboard() {
  const planId = useDemoStore((state) => state.planId);
  const orders = useDemoStore((state) => state.orders);
  const products = useDemoStore((state) => state.products);
  const categories = useDemoStore((state) => state.categories);
  const advanced = canUseFeature(planId, "advancedReportsEnabled");
  const now = new Date();
  const paidOrders = orders.filter((order) => Boolean(order.paidAt));
  const monthOrders = paidOrders.filter((order) => {
    const date = new Date(order.paidAt ?? order.createdAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const monthSales = monthOrders.reduce((sum, order) => sum + order.totals.grandTotal, 0);
  const averageBill = monthOrders.length ? monthSales / monthOrders.length : 0;

  const sevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const dailyOrders = paidOrders.filter((order) => {
      const paidAt = new Date(order.paidAt ?? order.createdAt);
      return paidAt >= date && paidAt < next;
    });
    return { key: date.toISOString(), label: thaiDay.format(date), sales: dailyOrders.reduce((sum, order) => sum + order.totals.grandTotal, 0), orders: dailyOrders.length };
  });
  const maxDailySales = Math.max(...sevenDays.map((day) => day.sales), 1);

  const categorySales = categories.map((category) => {
    const productIds = new Set(products.filter((product) => product.categoryId === category.id).map((product) => product.id));
    const sales = monthOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => productIds.has(item.productId) ? itemSum + item.unitPrice * item.quantity : itemSum, 0), 0);
    return { id: category.id, name: category.name, color: category.color, sales };
  }).filter((category) => category.sales > 0).sort((a, b) => b.sales - a.sales);

  const paymentSales = ["CASH", "QR", "CARD"].map((method) => ({
    method,
    sales: monthOrders.filter((order) => order.paymentMethod === method).reduce((sum, order) => sum + order.totals.grandTotal, 0),
  })).filter((item) => item.sales > 0);

  const exportCsv = () => {
    if (!monthOrders.length) return;
    const rows = [
      ["order_number", "paid_at", "table", "payment_method", "total"],
      ...monthOrders.map((order) => [order.orderNumber, order.paidAt ?? order.createdAt, order.tableName, order.paymentMethod ?? "", order.totals.grandTotal]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `flukex-sales-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    void services.notifications.notify({ title: "ส่งออกรายงานแล้ว", message: `ดาวน์โหลดข้อมูลจริง ${monthOrders.length} บิลเรียบร้อย` });
  };

  return (
    <>
      <PageHeader
        title="รายงานยอดขาย"
        description="คำนวณจากออเดอร์ที่ชำระแล้วของร้านปัจจุบันเท่านั้น"
        actions={<Button variant="outline" disabled={!monthOrders.length} onClick={exportCsv}><Download />ส่งออก CSV</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "ยอดขายเดือนนี้", value: formatCurrency(monthSales), note: monthOrders.length ? "ข้อมูลที่ชำระแล้ว" : "ยังไม่มีการชำระเงิน" },
          { label: "จำนวนบิล", value: monthOrders.length.toLocaleString("th-TH"), note: "เดือนปัจจุบัน" },
          { label: "ยอดเฉลี่ย/บิล", value: formatCurrency(averageBill), note: monthOrders.length ? "คำนวณจากบิลจริง" : "ยังไม่มีข้อมูล" },
          { label: "สินค้าที่เปิดขาย", value: products.filter((product) => product.isAvailable && !product.isSoldOut).length.toLocaleString("th-TH"), note: `จากทั้งหมด ${products.length} รายการ` },
        ].map((item) => <Card key={item.label} className="p-5"><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{item.value}</p><p className="mt-2 text-xs text-muted-foreground">{item.note}</p></Card>)}
      </div>

      {!paidOrders.length ? (
        <Card className="mt-5 p-8 text-center sm:p-12">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><PackageOpen aria-hidden="true" /></span>
          <h2 className="mt-4 text-xl font-bold">ยังไม่มีข้อมูลสำหรับออกรายงาน</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">รายงานจะเริ่มคำนวณหลังจากร้านปิดบิลแรก และแสดงเฉพาะข้อมูลของร้านนี้</p>
          <Button className="mt-5" asChild><Link href="/pos">เปิด POS เพื่อเริ่มขาย</Link></Button>
        </Card>
      ) : (
        <>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <Card>
              <CardHeader><CardTitle>ยอดขาย 7 วันล่าสุด</CardTitle></CardHeader>
              <CardContent>
                <div className="grid h-64 grid-cols-7 items-end gap-2" role="img" aria-label={`ยอดขายสูงสุดใน 7 วัน ${formatCurrency(Math.max(...sevenDays.map((day) => day.sales)))}`}>
                  {sevenDays.map((day) => <div key={day.key} className="flex h-full flex-col justify-end gap-2 text-center"><span className="text-[10px] font-medium tabular-nums text-muted-foreground">{day.sales ? formatCurrency(day.sales) : "-"}</span><div className="mx-auto min-h-1 w-full max-w-10 rounded-t-md bg-primary" style={{ height: `${Math.max(2, (day.sales / maxDailySales) * 100)}%` }} /><span className="text-xs text-muted-foreground">{day.label}</span></div>)}
                </div>
                <table className="sr-only"><caption>ยอดขายและจำนวนบิล 7 วันล่าสุด</caption><thead><tr><th>วัน</th><th>ยอดขาย</th><th>จำนวนบิล</th></tr></thead><tbody>{sevenDays.map((day) => <tr key={day.key}><th>{day.label}</th><td>{day.sales}</td><td>{day.orders}</td></tr>)}</tbody></table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>ยอดขายตามหมวด</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {categorySales.length ? categorySales.map((category) => <div key={category.id}><div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ backgroundColor: category.color }} aria-hidden="true" />{category.name}</span><strong className="tabular-nums">{formatCurrency(category.sales)}</strong></div></div>) : <p className="text-sm text-muted-foreground">ยังไม่พบยอดขายที่ผูกกับหมวดหมู่</p>}
              </CardContent>
            </Card>
          </div>

          <div className="relative mt-5 grid gap-5 xl:grid-cols-2">
            {!advanced && <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-background/80 p-6 text-center backdrop-blur-sm"><div><span className="mx-auto grid size-12 place-items-center rounded-xl bg-secondary text-primary"><LockKeyhole /></span><h2 className="mt-4 text-xl font-bold">รายงานขั้นสูงสำหรับ Professional</h2><p className="mt-2 text-sm text-muted-foreground">อัปเกรดเพื่อดูรายละเอียดช่วงเวลาและช่องทางชำระเงิน</p><Button className="mt-5" asChild><Link href="/dashboard/subscription">ดูแพ็กเกจ</Link></Button></div></div>}
            <Card><CardHeader><CardTitle>บิลล่าสุด</CardTitle></CardHeader><CardContent className="space-y-3">{monthOrders.slice(0, 5).map((order) => <div key={order.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0"><span className="flex items-center gap-2 text-sm"><ReceiptText className="size-4 text-primary" />{order.orderNumber}<small className="text-muted-foreground">{thaiDateTime.format(new Date(order.paidAt ?? order.createdAt))}</small></span><strong className="tabular-nums">{formatCurrency(order.totals.grandTotal)}</strong></div>)}</CardContent></Card>
            <Card><CardHeader><CardTitle>ช่องทางชำระเงิน</CardTitle></CardHeader><CardContent className="space-y-3">{paymentSales.length ? paymentSales.map((item) => <div key={item.method} className="flex items-center justify-between rounded-lg bg-muted/60 p-3"><span className="flex items-center gap-2 text-sm"><BarChart3 className="size-4 text-primary" />{item.method}</span><strong className="tabular-nums">{formatCurrency(item.sales)}</strong></div>) : <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลช่องทางชำระเงิน</p>}</CardContent></Card>
          </div>
        </>
      )}
    </>
  );
}
