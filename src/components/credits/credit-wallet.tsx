"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Clock3, Copy, ExternalLink, History, MessageCircle, ShieldCheck, WalletCards, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/dashboard/page-header";
import { getSafeLineAddFriendUrl } from "@/config/line";
import type { CreditRequestStatus } from "@/domain/credits";
import { formatDateTime } from "@/lib/utils";
import { usePlatformStore } from "@/store/platform-store";

const LINE_ADD_FRIEND_URL = getSafeLineAddFriendUrl(process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL);
const LINE_ADMIN_ID = "flukexd_";
const LINE_CONTACT_MESSAGE = `กรุณาติดต่อแอดมินที่ ID ไลน์ ${LINE_ADMIN_ID}`;

const requestStatus: Record<CreditRequestStatus, { label: string; icon: typeof Clock3; variant: "outline" | "success" | "danger" }> = {
  PENDING: { label: "รอตรวจสอบ", icon: Clock3, variant: "outline" },
  APPROVED: { label: "อนุมัติแล้ว", icon: CheckCircle2, variant: "success" },
  REJECTED: { label: "ปฏิเสธ", icon: XCircle, variant: "danger" },
};

export function CreditWallet() {
  const { session } = useAuthSession();
  const members = usePlatformStore((state) => state.members);
  const requests = usePlatformStore((state) => state.topUpRequests);
  const ledger = usePlatformStore((state) => state.ledger);
  const requestTopUp = usePlatformStore((state) => state.requestTopUp);
  const [amount, setAmount] = useState(500);
  const [note, setNote] = useState("");
  const [createdReference, setCreatedReference] = useState<string | null>(null);
  const [error, setError] = useState("");

  const member = members.find((item) => item.tenantId === session?.tenantId);
  const memberRequests = useMemo(() => requests.filter((item) => item.tenantId === session?.tenantId), [requests, session?.tenantId]);
  const memberLedger = useMemo(() => ledger.filter((item) => item.tenantId === session?.tenantId), [ledger, session?.tenantId]);
  const pendingCredits = memberRequests.filter((item) => item.status === "PENDING").reduce((sum, item) => sum + item.amount, 0);

  if (!session || !member) {
    return <div role="alert" className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">ไม่พบบัญชีเครดิตของร้าน กรุณาติดต่อผู้ดูแล Flukex</div>;
  }

  const submitRequest = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const request = requestTopUp({ memberId: member.id, amount, requestedByEmail: session.email, note });
      setCreatedReference(request.reference);
      setNote("");
      toast.success("สร้างคำขอเติมเครดิตแล้ว", { description: LINE_CONTACT_MESSAGE });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "สร้างคำขอไม่สำเร็จ");
    }
  };

  const copyReference = async () => {
    if (!createdReference) return;
    try {
      await navigator.clipboard.writeText(createdReference);
      toast.success("คัดลอกเลขอ้างอิงแล้ว");
    } catch {
      toast.error("คัดลอกไม่สำเร็จ กรุณาเลือกข้อความด้วยตนเอง");
    }
  };

  const copyLineId = async () => {
    try {
      await navigator.clipboard.writeText(LINE_ADMIN_ID);
      toast.success("คัดลอก LINE ID แล้ว", { description: LINE_ADMIN_ID });
    } catch {
      toast.error(`คัดลอกไม่สำเร็จ กรุณาคัดลอก LINE ID: ${LINE_ADMIN_ID} ด้วยตนเอง`);
    }
  };

  return (
    <>
      <PageHeader title="เครดิต Flukex" description="เติมเครดิตโดยติดต่อผู้ดูแลผ่าน LINE และรออนุมัติจากหลังบ้าน" />

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]" aria-label="ยอดเครดิตและแบบฟอร์มเติมเครดิต">
        <Card className="overflow-hidden">
          <div className="bg-[#3f0b0b] p-6 text-white">
            <span className="grid size-12 place-items-center rounded-xl bg-white/10"><WalletCards className="size-6" aria-hidden="true" /></span>
            <p className="mt-5 text-sm text-red-100/70">เครดิตคงเหลือ</p>
            <p className="mt-1 text-4xl font-bold">{member.creditBalance.toLocaleString("th-TH")}</p>
            <p className="mt-1 text-sm text-red-100/70">เครดิตพร้อมใช้งาน</p>
          </div>
          <div className="grid grid-cols-2 divide-x border-t">
            <div className="p-5"><p className="text-xs text-muted-foreground">กำลังรออนุมัติ</p><p className="mt-1 text-xl font-bold text-warning">{pendingCredits.toLocaleString("th-TH")}</p></div>
            <div className="p-5"><p className="text-xs text-muted-foreground">แพ็กเกจ</p><p className="mt-1 text-xl font-bold capitalize">{member.planId}</p></div>
          </div>
          <div className="border-t bg-muted/40 p-5 text-sm">
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" /><div><p className="font-bold">ยอดจะเพิ่มหลังอนุมัติเท่านั้น</p><p className="mt-1 text-xs leading-5 text-muted-foreground">LINE ใช้สำหรับติดต่อและส่งหลักฐาน การเพิ่มยอดจริงเกิดจาก Platform Admin พร้อม Audit log</p></div></div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#06C755]/10 text-[#07883f]"><MessageCircle className="size-5" aria-hidden="true" /></span>
            <div><h2 className="text-lg font-bold">ส่งคำขอเติมเครดิต</h2><p className="text-sm text-muted-foreground">สร้างเลขอ้างอิงแล้วส่งเลขนี้พร้อมหลักฐานให้ผู้ดูแลทาง LINE</p></div>
          </div>
          <form onSubmit={submitRequest} className="mt-6 space-y-5">
            <div>
              <Label htmlFor="credit-amount">จำนวนเครดิต</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[500, 1_000, 2_000].map((preset) => (
                  <button key={preset} type="button" aria-pressed={amount === preset} onClick={() => setAmount(preset)} className={`min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${amount === preset ? "border-primary bg-secondary text-primary" : "hover:bg-muted"}`}>
                    {preset.toLocaleString("th-TH")}
                  </button>
                ))}
              </div>
              <Input id="credit-amount" type="number" min={100} step={100} value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="mt-2" required />
              <p className="mt-1 text-xs text-muted-foreground">ขั้นต่ำ 100 เครดิต · ผู้ดูแลจะแจ้งยอดชำระจริงผ่าน LINE</p>
            </div>
            <div>
              <Label htmlFor="credit-note">หมายเหตุถึงผู้ดูแล</Label>
              <Textarea id="credit-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="เช่น ต้องการใช้ต่ออายุแพ็กเกจเดือนถัดไป" className="mt-2" />
            </div>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
            <Button type="submit" size="lg" className="w-full"><MessageCircle />สร้างคำขอและรับเลขอ้างอิง</Button>
          </form>
          {!LINE_ADD_FRIEND_URL && (
            <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
              ยังไม่ได้ตั้งค่า LINE Add Friend URL — เพิ่มค่า <code>NEXT_PUBLIC_LINE_ADD_FRIEND_URL</code> ก่อนเปิดให้สมาชิกใช้งานจริง
            </p>
          )}
        </Card>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b p-5"><h2 className="flex items-center gap-2 font-bold"><Clock3 className="size-5 text-primary" />คำขอเติมเครดิต</h2><p className="mt-1 text-xs text-muted-foreground">ติดตามสถานะที่ Platform Admin ดำเนินการ</p></div>
          <div className="divide-y">
            {memberRequests.length ? memberRequests.slice(0, 8).map((request) => {
              const status = requestStatus[request.status];
              return (
                <article key={request.id} className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0"><p className="truncate font-mono text-xs font-bold text-primary">{request.reference}</p><p className="mt-1 text-sm font-semibold">{request.amount.toLocaleString("th-TH")} เครดิต</p><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(request.createdAt)}</p>{request.reviewNote && <p className="mt-2 text-xs text-muted-foreground">หมายเหตุ: {request.reviewNote}</p>}</div>
                  <Badge variant={status.variant}><status.icon className="size-3.5" />{status.label}</Badge>
                </article>
              );
            }) : <p className="p-8 text-center text-sm text-muted-foreground">ยังไม่มีคำขอเติมเครดิต</p>}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b p-5"><h2 className="flex items-center gap-2 font-bold"><History className="size-5 text-primary" />Credit Ledger</h2><p className="mt-1 text-xs text-muted-foreground">ประวัติยอดเข้าออกที่แก้ย้อนหลังไม่ได้ใน workflow</p></div>
          <div className="divide-y">
            {memberLedger.length ? memberLedger.slice(0, 8).map((entry) => (
              <article key={entry.id} className="flex items-start justify-between gap-4 p-5">
                <div><p className="text-sm font-bold">{entry.description}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{entry.reference}</p><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p></div>
                <div className="text-right"><p className={`font-bold ${entry.amount >= 0 ? "text-success" : "text-destructive"}`}>{entry.amount >= 0 ? "+" : ""}{entry.amount.toLocaleString("th-TH")}</p><p className="mt-1 text-xs text-muted-foreground">คงเหลือ {entry.balanceAfter.toLocaleString("th-TH")}</p></div>
              </article>
            )) : <p className="p-8 text-center text-sm text-muted-foreground">ยังไม่มีรายการเครดิต</p>}
          </div>
        </Card>
      </section>

      <Dialog open={Boolean(createdReference)} onOpenChange={(open) => !open && setCreatedReference(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{LINE_CONTACT_MESSAGE}</DialogTitle>
            <DialogDescription>ส่งเลขอ้างอิงพร้อมหลักฐานให้แอดมิน คำขอจะอยู่ในสถานะรอตรวจสอบจนกว่าผู้ดูแล Flukex จะยืนยันและกดอนุมัติ</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 sm:grid-cols-[160px_1fr] sm:items-center">
            <div className="mx-auto grid size-40 place-items-center rounded-xl border bg-white p-3">
              {LINE_ADD_FRIEND_URL ? <QRCodeSVG value={LINE_ADD_FRIEND_URL} size={132} title="QR Code เพิ่มเพื่อน LINE" /> : <MessageCircle className="size-14 text-muted-foreground/35" aria-hidden="true" />}
            </div>
            <div className="min-w-0">
              <div className="rounded-lg border border-[#06C755]/30 bg-[#06C755]/10 p-3">
                <p className="text-xs font-bold text-[#07883f]">LINE ID สำหรับเติมเครดิต</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <strong className="font-mono text-lg">{LINE_ADMIN_ID}</strong>
                  <Button type="button" variant="outline" size="sm" onClick={copyLineId}><Copy />คัดลอก ID</Button>
                </div>
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">เลขอ้างอิง</p>
              <p className="mt-2 break-all rounded-lg bg-muted p-3 font-mono text-sm font-bold text-primary">{createdReference}</p>
              <Button variant="outline" className="mt-3 w-full" onClick={copyReference}><Copy />คัดลอกเลขอ้างอิง</Button>
            </div>
          </div>
          <DialogFooter>
            {LINE_ADD_FRIEND_URL ? <Button asChild className="bg-[#06C755] text-white hover:bg-[#05a648]"><Link href={LINE_ADD_FRIEND_URL} target="_blank" rel="noreferrer"><MessageCircle />เพิ่มเพื่อนทาง LINE<ExternalLink /></Link></Button> : <Button type="button" className="bg-[#06C755] text-white hover:bg-[#05a648]" onClick={copyLineId}><Copy />คัดลอก LINE ID</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
