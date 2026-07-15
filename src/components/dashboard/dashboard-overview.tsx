"use client";

import Link from "next/link";
import { Banknote, ChefHat, CircleDollarSign, ClipboardList, PackageOpen, QrCode, ShoppingBag, Sparkles, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getEntitlements, SUBSCRIPTION_PLANS } from "@/config/plans";
import { formatCurrency, formatTime } from "@/lib/utils";
import { getCurrentUsage, useDemoStore } from "@/store/demo-store";
import { PageHeader } from "./page-header";

function dateKey(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}

export function DashboardOverview() {
  const state = useDemoStore();
  const usage = getCurrentUsage(state);
  const limits = getEntitlements(state.planId);
  const today = new Date();
  const todayKey = dateKey(today);
  const todayOrders = state.orders.filter((order) => dateKey(order.createdAt) === todayKey);
  const paidToday = todayOrders.filter((order) => order.paidAt);
  const todaySales = paidToday.reduce((sum, order) => sum + order.totals.grandTotal, 0);
  const averageBill = paidToday.length ? todaySales / paidToday.length : 0;
  const activeTables = state.tables.filter((table) => table.status !== "AVAILABLE" && table.status !== "DISABLED").length;
  const pendingOrders = todayOrders.filter((order) => !["SERVED", "CANCELLED"].includes(order.status)).length;
  const restaurant = state.restaurants[0];
  const firstTable = state.tables[0];
  const qrHref = restaurant && firstTable ? `/order/${restaurant.slug}/table/${firstTable.token}` : "/dashboard/tables";

  const sales = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = dateKey(date);
    return {
      day: new Intl.DateTimeFormat("th-TH", { weekday: "short" }).format(date).replace(".", ""),
      value: state.orders
        .filter((order) => order.paidAt && dateKey(order.paidAt) === key)
        .reduce((sum, order) => sum + order.totals.grandTotal, 0),
    };
  });
  const hasSales = sales.some((item) => item.value > 0);

  const productQuantities = new Map<string, number>();
  state.orders.forEach((order) => order.items.forEach((item) => {
    productQuantities.set(item.productName, (productQuantities.get(item.productName) ?? 0) + item.quantity);
  }));
  const bestSellers = Array.from(productQuantities, ([name, quantity]) => ({ name, quantity }))
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 4);
  const maxProductQuantity = bestSellers[0]?.quantity ?? 1;

  const usageRows = [
    { label: "สาขา", value: usage.branches, max: limits.maxBranches },
    { label: "ผู้ใช้", value: usage.users, max: limits.maxUsers },
    { label: "โต๊ะ", value: usage.tables, max: limits.maxTables },
    { label: "สินค้า", value: usage.products, max: limits.maxProducts },
    { label: "ออเดอร์เดือนนี้", value: usage.monthlyOrders, max: limits.monthlyOrderLimit },
  ];

  const metrics = [
    { label: "ยอดขายวันนี้", value: formatCurrency(todaySales), note: paidToday.length ? `${paidToday.length} บิลชำระแล้ว` : "ยังไม่มีรายการชำระเงิน", icon: CircleDollarSign, color: "text-success" },
    { label: "ออเดอร์วันนี้", value: String(todayOrders.length), note: `${pendingOrders} กำลังดำเนินการ`, icon: ClipboardList, color: "text-primary" },
    { label: "โต๊ะที่ใช้งาน", value: `${activeTables} / ${state.tables.length}`, note: state.tables.length ? "อัปเดตจาก POS และ QR" : "เพิ่มโต๊ะเพื่อเริ่มรับออเดอร์", icon: Users, color: "text-accent" },
    { label: "ยอดเฉลี่ย/บิล", value: formatCurrency(averageBill), note: paidToday.length ? `คำนวณจาก ${paidToday.length} บิล` : "ยังไม่มีข้อมูล", icon: Banknote, color: "text-blue-600" },
  ];

  return (
    <>
      <PageHeader
        title="ภาพรวมร้านวันนี้"
        description="ยอดขาย ออเดอร์ และการใช้งานจากข้อมูลของร้านนี้เท่านั้น"
        actions={<><Button variant="outline" asChild><Link href={qrHref}><QrCode />{firstTable ? "เปิด QR Ordering" : "เพิ่มโต๊ะและ QR"}</Link></Button><Button asChild><Link href="/pos"><ShoppingBag />เปิด POS</Link></Button></>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div><p className="text-sm text-muted-foreground">{metric.label}</p><p className="mt-2 text-2xl font-bold">{metric.value}</p><p className={`mt-2 text-xs font-semibold ${metric.color}`}>{metric.note}</p></div>
                <span className="grid size-11 place-items-center rounded-xl bg-muted"><metric.icon className={`size-5 ${metric.color}`} /></span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between"><div><CardTitle>ยอดขาย 7 วัน</CardTitle><p className="mt-1 text-xs text-muted-foreground">หน่วย: บาท • เฉพาะบิลที่ชำระแล้ว</p></div><Badge variant="secondary">7 วันล่าสุด</Badge></CardHeader>
          <CardContent>
            {hasSales ? (
              <div className="h-72 w-full" role="img" aria-label="กราฟยอดขาย 7 วัน">
                <ResponsiveContainer width="100%" height="100%"><AreaChart data={sales} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}><defs><linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#dc2626" stopOpacity={0.35} /><stop offset="100%" stopColor="#dc2626" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => `${value / 1000}k`} /><Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} /><Area type="monotone" dataKey="value" stroke="#dc2626" strokeWidth={3} fill="url(#sales-fill)" /></AreaChart></ResponsiveContainer>
              </div>
            ) : (
              <div className="grid h-72 place-items-center text-center"><div><CircleDollarSign className="mx-auto size-10 text-muted-foreground/50" /><p className="mt-3 font-semibold">ยังไม่มียอดขาย</p><p className="mt-1 text-sm text-muted-foreground">ยอดจะปรากฏหลังปิดบิลแรกของร้าน</p></div></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center justify-between"><div><CardTitle>การใช้งานแพ็กเกจ</CardTitle><p className="mt-1 text-xs text-muted-foreground">แผน {SUBSCRIPTION_PLANS[state.planId].name}</p></div><Sparkles className="size-5 text-accent" /></div></CardHeader>
          <CardContent className="space-y-4">
            {usageRows.map((row) => { const percentage = Math.min(100, row.value / row.max * 100); return <div key={row.label}><div className="mb-1.5 flex justify-between text-xs"><span>{row.label}</span><span className="font-semibold">{row.value.toLocaleString("th-TH")} / {row.max.toLocaleString("th-TH")}</span></div><Progress value={percentage} /></div>; })}
            <Button variant="outline" className="w-full" asChild><Link href="/dashboard/subscription">จัดการแพ็กเกจ</Link></Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle>ออเดอร์ล่าสุด</CardTitle><Button variant="ghost" size="sm" asChild><Link href="/dashboard/orders">ดูทั้งหมด</Link></Button></CardHeader>
          <CardContent>
            <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="pb-3">ออเดอร์</th><th className="pb-3">โต๊ะ</th><th className="pb-3">เวลา</th><th className="pb-3">สถานะ</th><th className="pb-3 text-right">ยอดรวม</th></tr></thead><tbody>{state.orders.length ? state.orders.slice(0, 5).map((order) => <tr key={order.id} className="border-b last:border-0"><td className="py-3 font-bold">{order.orderNumber}</td><td>{order.tableName}</td><td>{formatTime(order.createdAt)}</td><td><Badge variant={order.status === "READY" ? "success" : order.status === "PREPARING" ? "warning" : "secondary"}>{order.status}</Badge></td><td className="text-right font-semibold">{formatCurrency(order.totals.grandTotal)}</td></tr>) : <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีออเดอร์ในร้านนี้</td></tr>}</tbody></table></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>สินค้าขายดี</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {bestSellers.length ? bestSellers.map((product, index) => <div key={product.name} className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-secondary text-xs font-bold text-primary">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-sm"><span className="truncate font-medium">{product.name}</span><span className="text-muted-foreground">{product.quantity} จาน</span></div><Progress value={product.quantity / maxProductQuantity * 100} className="mt-1.5 h-1.5" /></div></div>) : <div className="py-8 text-center"><PackageOpen className="mx-auto size-9 text-muted-foreground/50" /><p className="mt-3 text-sm font-semibold">ยังไม่มีข้อมูลสินค้าขายดี</p></div>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 rounded-xl border bg-[#4a0d0d] p-5 text-white">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-white/10"><ChefHat /></span><div><p className="font-bold">จอครัวมี {state.orders.filter((order) => order.items.some((item) => item.station === "KITCHEN" && !["SERVED", "CANCELLED"].includes(item.status))).length} ออเดอร์ที่กำลังทำ</p><p className="text-xs text-red-100/70">เปิดจอ KDS เพื่ออัปเดตสถานะรายการ</p></div></div><Button variant="accent" asChild><Link href="/kitchen">เปิดจอครัว</Link></Button></div>
      </div>
    </>
  );
}
