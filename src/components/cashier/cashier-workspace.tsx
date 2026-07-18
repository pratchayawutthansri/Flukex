"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Banknote, BellRing, CheckCircle2, ClipboardList, Eye, LogOut, Minus, Monitor, Pencil, Plus, QrCode, ReceiptText, Table2, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { calculateLineTotal, calculateOrderTotals, deriveOrderCalculationOptions } from "@/domain/calculations";
import type { Order, OrderItem } from "@/domain/types";
import { createId, formatCurrency, formatDateTime, formatTime } from "@/lib/utils";
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
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [productToAdd, setProductToAdd] = useState("");
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const orders = useDemoStore((state) => state.orders);
  const products = useDemoStore((state) => state.products);
  const updateOrderItems = useDemoStore((state) => state.updateOrderItems);
  const updateOrderStatus = useDemoStore((state) => state.updateOrderStatus);
  const updateTableStatus = useDemoStore((state) => state.updateTableStatus);
  const tables = useDemoStore((state) => state.tables);
  const restaurant = useDemoStore((state) => state.restaurants[0]);
  const branch = useDemoStore((state) => state.branches[0]);
  const selectedOrder = selectedOrderId ? orders.find((order) => order.id === selectedOrderId) ?? null : null;
  const editingOrder = editingOrderId ? orders.find((order) => order.id === editingOrderId) ?? null : null;
  const cancelOrder = cancelOrderId ? orders.find((order) => order.id === cancelOrderId) ?? null : null;
  const availableProducts = products.filter((product) => product.isAvailable && !product.isSoldOut);
  const editTotals = useMemo(() => calculateOrderTotals(
    editItems,
    editingOrder ? deriveOrderCalculationOptions(editingOrder) : {},
  ), [editItems, editingOrder]);
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

  const startEditingOrder = (order: Order) => {
    if (!["WAITING", "PREPARING"].includes(order.status)) {
      toast.error("แก้ไขออเดอร์นี้ไม่ได้", { description: "แก้ไขได้เฉพาะออเดอร์ที่รอรับรายการหรือกำลังเตรียม" });
      return;
    }

    setEditItems(order.items.map((item) => ({ ...item, modifiers: [...item.modifiers] })));
    setProductToAdd("");
    setSelectedOrderId(null);
    setEditingOrderId(order.id);
  };

  const changeItemQuantity = (itemId: string, change: number) => {
    setEditItems((items) => items.map((item) => item.id === itemId
      ? { ...item, quantity: Math.max(1, item.quantity + change) }
      : item));
  };

  const changeItemNote = (itemId: string, note: string) => {
    setEditItems((items) => items.map((item) => item.id === itemId ? { ...item, note } : item));
  };

  const removeItem = (itemId: string) => {
    setEditItems((items) => items.filter((item) => item.id !== itemId));
  };

  const addSelectedProduct = () => {
    const product = availableProducts.find((item) => item.id === productToAdd);
    if (!product || !editingOrder) return;

    const itemStatus = editingOrder.status === "PREPARING" ? "PREPARING" : "WAITING";
    setEditItems((items) => [...items, {
      id: createId("item"),
      productId: product.id,
      productName: product.name,
      station: product.station,
      quantity: 1,
      unitPrice: product.price,
      modifiers: [],
      status: itemStatus,
    }]);
    setProductToAdd("");
  };

  const saveEditedOrder = () => {
    if (!editingOrder || editItems.length === 0) return;

    updateOrderItems(editingOrder.id, editItems);
    toast.success(`บันทึกออเดอร์ ${editingOrder.orderNumber} แล้ว`, {
      description: `อัปเดตรายการและยอดสุทธิเป็น ${formatCurrency(editTotals.grandTotal)}`,
    });
    setEditingOrderId(null);
  };

  const openCancelConfirmation = (order: Order) => {
    setSelectedOrderId(null);
    setCancelOrderId(order.id);
  };

  const confirmCancelOrder = () => {
    if (!cancelOrder || ["SERVED", "CANCELLED"].includes(cancelOrder.status)) return;

    updateOrderStatus(cancelOrder.id, null, "CANCELLED");
    const hasAnotherActiveOrder = orders.some((order) => (
      order.id !== cancelOrder.id
      && order.tableId === cancelOrder.tableId
      && !["SERVED", "CANCELLED"].includes(order.status)
    ));
    if (!hasAnotherActiveOrder) updateTableStatus(cancelOrder.tableId, "AVAILABLE");

    toast.success(`ยกเลิกออเดอร์ ${cancelOrder.orderNumber} แล้ว`, {
      description: hasAnotherActiveOrder
        ? `${cancelOrder.tableName} ยังมีออเดอร์อื่นที่กำลังดำเนินการ`
        : `${cancelOrder.tableName} ถูกเปลี่ยนเป็นโต๊ะว่าง`,
    });
    setCancelOrderId(null);
    setSelectedOrderId(null);
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

              {!["SERVED", "CANCELLED"].includes(selectedOrder.status) && (
                <DialogFooter className="grid gap-2 sm:grid-cols-2">
                  {["WAITING", "PREPARING"].includes(selectedOrder.status) && (
                    <Button
                      variant="outline"
                      className="min-h-12"
                      onClick={() => startEditingOrder(selectedOrder)}
                    >
                      <Pencil />
                      แก้ไขออเดอร์
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="min-h-12"
                    onClick={() => openCancelConfirmation(selectedOrder)}
                  >
                    <XCircle />
                    ยกเลิกออเดอร์
                  </Button>
                  {selectedOrder.status === "WAITING" && (
                  <Button
                    size="lg"
                    className="min-h-12 sm:col-span-2"
                    onClick={() => acceptOrder(selectedOrder)}
                  >
                    <CheckCircle2 />
                    ยืนยันรับออเดอร์
                  </Button>
                  )}
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingOrder)} onOpenChange={(open) => !open && setEditingOrderId(null)}>
        <DialogContent className="max-w-2xl">
          {editingOrder && (
            <>
              <DialogHeader>
                <DialogTitle>แก้ไขออเดอร์ {editingOrder.orderNumber}</DialogTitle>
                <DialogDescription>
                  {editingOrder.tableName} · ปรับรายการ จำนวน และหมายเหตุ จากนั้นตรวจยอดก่อนบันทึก
                </DialogDescription>
              </DialogHeader>

              {editingOrder.paidAt && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
                  ออเดอร์นี้ชำระเงินแล้ว ยอดชำระจะถูกปรับตามรายการใหม่ โปรดตรวจสอบเงินทอนหรือยอดคืนกับลูกค้า
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cashier-add-product">เพิ่มสินค้าในออเดอร์</Label>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <select
                    id="cashier-add-product"
                    className="min-h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-base shadow-sm focus-visible:border-ring md:text-sm"
                    value={productToAdd}
                    onChange={(event) => setProductToAdd(event.target.value)}
                  >
                    <option value="">เลือกสินค้าที่พร้อมขาย</option>
                    {availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} · {formatCurrency(product.price)}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={!productToAdd}
                    onClick={addSelectedProduct}
                  >
                    <Plus />
                    เพิ่มสินค้า
                  </Button>
                </div>
              </div>

              <div className="space-y-3" aria-label="รายการสินค้าในออเดอร์">
                {editItems.map((item) => (
                  <div key={item.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.productName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCurrency(item.unitPrice)} ต่อรายการ
                          {item.modifiers.length > 0 && ` · ${item.modifiers.map((modifier) => modifier.name).join(", ")}`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                        aria-label={`ลบ ${item.productName} ออกจากออเดอร์`}
                      >
                        <Trash2 />
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-end">
                      <div>
                        <Label className="mb-2 block">จำนวน</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={item.quantity <= 1}
                            onClick={() => changeItemQuantity(item.id, -1)}
                            aria-label={`ลดจำนวน ${item.productName}`}
                          >
                            <Minus />
                          </Button>
                          <output className="min-w-8 text-center font-bold" aria-label={`จำนวน ${item.productName}`}>
                            {item.quantity}
                          </output>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => changeItemQuantity(item.id, 1)}
                            aria-label={`เพิ่มจำนวน ${item.productName}`}
                          >
                            <Plus />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`note-${item.id}`} className="mb-2 block">หมายเหตุถึงครัวหรือบาร์</Label>
                        <Textarea
                          id={`note-${item.id}`}
                          className="min-h-11"
                          value={item.note ?? ""}
                          onChange={(event) => changeItemNote(item.id, event.target.value)}
                          placeholder="เช่น ไม่เผ็ด ไม่ใส่ผัก"
                        />
                      </div>
                      <p className="pb-3 text-right font-bold">{formatCurrency(calculateLineTotal(item))}</p>
                    </div>
                  </div>
                ))}

                {editItems.length === 0 && (
                  <div className="rounded-xl border border-dashed p-6 text-center">
                    <p className="font-semibold">ออเดอร์ต้องมีสินค้าอย่างน้อย 1 รายการ</p>
                    <p className="mt-1 text-sm text-muted-foreground">เลือกสินค้าด้านบนเพื่อเพิ่มกลับเข้าออเดอร์</p>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-muted p-4 text-sm" aria-live="polite">
                <div className="flex justify-between text-muted-foreground"><span>ยอดรวมสินค้า</span><span>{formatCurrency(editTotals.subtotal)}</span></div>
                {editTotals.discount > 0 && <div className="mt-1 flex justify-between text-muted-foreground"><span>ส่วนลดเดิม</span><span>-{formatCurrency(editTotals.discount)}</span></div>}
                <div className="mt-1 flex justify-between text-muted-foreground"><span>ค่าบริการ</span><span>{formatCurrency(editTotals.serviceCharge)}</span></div>
                <div className="mt-1 flex justify-between text-muted-foreground"><span>VAT</span><span>{formatCurrency(editTotals.vat)}</span></div>
                <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold"><span>ยอดสุทธิใหม่</span><span>{formatCurrency(editTotals.grandTotal)}</span></div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" className="min-h-12" onClick={() => setEditingOrderId(null)}>
                  ไม่บันทึก
                </Button>
                <Button type="button" className="min-h-12" disabled={editItems.length === 0} onClick={saveEditedOrder}>
                  <CheckCircle2 />
                  บันทึกการแก้ไข
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelOrder)} onOpenChange={(open) => !open && setCancelOrderId(null)}>
        <DialogContent>
          {cancelOrder && (
            <>
              <DialogHeader>
                <DialogTitle>ยืนยันยกเลิกออเดอร์ {cancelOrder.orderNumber}</DialogTitle>
                <DialogDescription>
                  {cancelOrder.tableName} · ยอดสุทธิ {formatCurrency(cancelOrder.totals.grandTotal)}
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm">
                <p className="font-semibold text-destructive">การดำเนินการนี้ย้อนกลับไม่ได้จากหน้าแคชเชียร์</p>
                <p className="mt-1 leading-6 text-muted-foreground">
                  รายการทั้งหมดจะถูกยกเลิกและสถานะจะอัปเดตไปยังครัว บาร์ และหน้าติดตามออเดอร์ทันที
                  {cancelOrder.paidAt && " ออเดอร์นี้ชำระเงินแล้ว กรุณาดำเนินการคืนเงินให้ลูกค้าตามขั้นตอนของร้าน"}
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" className="min-h-12" onClick={() => setCancelOrderId(null)}>
                  กลับไปตรวจสอบ
                </Button>
                <Button type="button" variant="destructive" className="min-h-12" onClick={confirmCancelOrder}>
                  <XCircle />
                  ยืนยันยกเลิกออเดอร์
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
