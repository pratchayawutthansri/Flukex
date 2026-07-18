"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Edit3, ExternalLink, LockKeyhole, Plus, QrCode, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RestaurantTable, TableStatus } from "@/domain/types";
import { cn, createId } from "@/lib/utils";
import { services } from "@/services/container";
import { useDemoStore } from "@/store/demo-store";
import { PageHeader } from "./page-header";

const statusMeta: Record<TableStatus, { label: string; variant: "success" | "warning" | "danger" | "secondary" | "outline" }> = {
  AVAILABLE: { label: "ว่าง", variant: "success" },
  OCCUPIED: { label: "มีลูกค้า", variant: "warning" },
  BILL_REQUESTED: { label: "ขอเช็กบิล", variant: "danger" },
  CLEANING: { label: "กำลังทำความสะอาด", variant: "secondary" },
  DISABLED: { label: "ปิดใช้งาน", variant: "outline" },
};

function newTable(tenantId: string, branchId: string): RestaurantTable {
  const now = new Date().toISOString();
  const id = createId("table");
  return { id, tenantId, branchId, name: "", token: id.replace("table_", "table-"), seats: 2, status: "AVAILABLE", createdAt: now, updatedAt: now };
}

export function TableManager() {
  const tables = useDemoStore((state) => state.tables);
  const activeTenantId = useDemoStore((state) => state.activeTenantId);
  const branchId = useDemoStore((state) => state.branches[0]?.id ?? "");
  const restaurantSlug = useDemoStore((state) => state.restaurants[0]?.slug ?? "");
  const saveTable = useDemoStore((state) => state.saveTable);
  const updateStatus = useDemoStore((state) => state.updateTableStatus);
  const [editing, setEditing] = useState<RestaurantTable | null>(null);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const orderUrl = qrTable && restaurantSlug ? `/order/${restaurantSlug}/table/${qrTable.token}` : "";
  const absolute = typeof window !== "undefined" && orderUrl ? `${window.location.origin}${orderUrl}` : orderUrl;

  const save = () => {
    if (!editing?.name || !editing.branchId) return;
    const saved = saveTable({ ...editing, updatedAt: new Date().toISOString() });
    if (!saved) return;
    setEditing(null);
    void services.notifications.notify({ title: "บันทึกโต๊ะแล้ว", message: "QR Code ถูกล็อกกับโต๊ะนี้เรียบร้อย" });
  };

  return (
    <>
      <PageHeader
        title="โต๊ะและ QR Code"
        description={`${tables.length} โต๊ะ • แต่ละโต๊ะมี token และ URL สั่งอาหารแยกกัน`}
        actions={<Button disabled={!branchId} onClick={() => setEditing(newTable(activeTenantId, branchId))}><Plus />เพิ่มโต๊ะ</Button>}
      />
      {!branchId && <Card className="mb-5 p-5"><p className="font-bold">ยังไม่มีสาขาสำหรับผูกโต๊ะ</p><p className="mt-1 text-sm text-muted-foreground">เพิ่มสาขาก่อนสร้าง QR ของโต๊ะ</p><Button className="mt-4" asChild><Link href="/dashboard/branches">ไปที่สาขา</Link></Button></Card>}
      <div className="mb-5 flex flex-wrap gap-2">{Object.entries(statusMeta).map(([key, meta]) => <Badge key={key} variant={meta.variant}>{meta.label} {tables.filter((table) => table.status === key).length}</Badge>)}</div>
      {tables.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {tables.map((table) => {
            const meta = statusMeta[table.status];
            return <Card key={table.id} className={cn("p-5", table.status === "BILL_REQUESTED" && "border-destructive ring-2 ring-destructive/15")}>
              <div className="flex items-start justify-between"><div><p className="text-xl font-bold">{table.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3.5" />{table.seats} ที่นั่ง</p></div><Badge variant={meta.variant}>{meta.label}</Badge></div>
              <div className="mt-5 grid grid-cols-2 gap-2"><Button variant="outline" size="sm" onClick={() => setQrTable(table)}><QrCode />QR Code</Button><Button variant="outline" size="sm" onClick={() => setEditing({ ...table })}><Edit3 />แก้ไข</Button></div>
              <select aria-label={`เปลี่ยนสถานะ ${table.name}`} className="mt-2 min-h-10 w-full rounded-lg border bg-card px-2 text-xs" value={table.status} onChange={(event) => updateStatus(table.id, event.target.value as TableStatus)}>{Object.entries(statusMeta).map(([status, item]) => <option key={status} value={status}>{item.label}</option>)}</select>
            </Card>;
          })}
        </div>
      ) : branchId ? <Card className="p-8 text-center"><h2 className="text-lg font-bold">ยังไม่มีโต๊ะ</h2><p className="mt-1 text-sm text-muted-foreground">เพิ่มโต๊ะแรกเพื่อสร้าง QR Ordering ของร้านนี้</p><Button className="mt-5" onClick={() => setEditing(newTable(activeTenantId, branchId))}><Plus />เพิ่มโต๊ะแรก</Button></Card> : null}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.name ? "แก้ไขโต๊ะ" : "เพิ่มโต๊ะ"}</DialogTitle><DialogDescription>QR token จะผูกกับร้านและสาขาปัจจุบันเท่านั้น</DialogDescription></DialogHeader>
          {editing && <div className="space-y-4"><div className="space-y-2"><Label htmlFor="table-name">ชื่อโต๊ะ</Label><Input id="table-name" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="table-seats">จำนวนที่นั่ง</Label><Input id="table-seats" type="number" min="1" max="30" value={editing.seats} onChange={(event) => setEditing({ ...editing, seats: Number(event.target.value) })} /></div><div className="space-y-2"><Label htmlFor="table-token">QR Token ประจำโต๊ะ</Label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="table-token" className="bg-muted pl-10" value={editing.token} readOnly aria-describedby="table-token-help" /></div><p id="table-token-help" className="text-xs leading-5 text-muted-foreground">ระบบสร้างให้อัตโนมัติและล็อก 1 QR Code ต่อ 1 โต๊ะ เพื่อป้องกันออเดอร์เข้าผิดโต๊ะ</p></div></div>}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>ยกเลิก</Button><Button onClick={save}>บันทึกโต๊ะ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(qrTable)} onOpenChange={(open) => !open && setQrTable(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>QR Ordering • {qrTable?.name}</DialogTitle><DialogDescription>QR Code นี้ใช้ได้เฉพาะ {qrTable?.name} และไม่สามารถสลับไปโต๊ะอื่นได้ หน้านี้ตั้งค่า noindex</DialogDescription></DialogHeader>
          <div className="mx-auto rounded-2xl border bg-white p-5"><QRCodeSVG value={absolute} size={220} level="M" includeMargin aria-label={`QR Code ${qrTable?.name}`} /></div>
          <div className="flex items-center gap-2 rounded-lg bg-muted p-2"><code className="min-w-0 flex-1 truncate text-xs">{absolute}</code><Button size="icon" variant="ghost" aria-label="คัดลอก URL" onClick={() => { void navigator.clipboard.writeText(absolute); void services.notifications.notify({ title: "คัดลอกแล้ว", message: "QR ordering URL อยู่ในคลิปบอร์ด" }); }}><Copy /></Button></div>
          <DialogFooter><Button variant="outline" asChild><Link href={orderUrl} target="_blank">เปิดหน้าเมนู<ExternalLink /></Link></Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
