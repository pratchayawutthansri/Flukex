"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock3,
  Coins,
  History,
  KeyRound,
  LogOut,
  Search,
  ShieldCheck,
  Store,
  UserCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { MemberPasswordResetDialog } from "@/components/platform-admin/member-password-reset-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreditTopUpRequest, MemberStatus, PlatformMember } from "@/domain/credits";
import { formatDateTime } from "@/lib/utils";
import { usePlatformStore } from "@/store/platform-store";

const memberStatus: Record<MemberStatus, { label: string; variant: "outline" | "success" | "danger" }> = {
  PENDING: { label: "รอเปิดใช้งาน", variant: "outline" },
  ACTIVE: { label: "ใช้งานอยู่", variant: "success" },
  SUSPENDED: { label: "ระงับ", variant: "danger" },
};

interface ReviewState {
  request: CreditTopUpRequest;
  decision: "APPROVED" | "REJECTED";
}

function MemberCard({
  member,
  onStatusChange,
  onPasswordReset,
}: {
  member: PlatformMember;
  onStatusChange: (memberId: string, status: MemberStatus) => void;
  onPasswordReset: (member: PlatformMember) => void;
}) {
  const status = memberStatus[member.status];
  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary"><Store className="size-5" aria-hidden="true" /></span>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <h3 className="mt-4 font-bold">{member.businessName}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{member.ownerName} · {member.ownerEmail}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-sm">
        <div><p className="text-xs text-muted-foreground">เครดิต</p><p className="font-bold">{member.creditBalance.toLocaleString("th-TH")}</p></div>
        <div><p className="text-xs text-muted-foreground">แพ็กเกจ</p><p className="font-bold capitalize">{member.planId}</p></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {member.status !== "ACTIVE" && <Button size="sm" variant="outline" className="flex-1" onClick={() => onStatusChange(member.id, "ACTIVE")}><UserCheck />เปิดใช้งาน</Button>}
        {member.status === "ACTIVE" && <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={() => onStatusChange(member.id, "SUSPENDED")}><X />ระงับสมาชิก</Button>}
        <Button size="sm" variant="outline" onClick={() => onPasswordReset(member)} aria-label={`รีเซ็ตรหัสผ่าน ${member.businessName}`}><KeyRound />รีเซ็ตรหัส</Button>
      </div>
    </article>
  );
}

export function PlatformAdminDashboard() {
  const router = useRouter();
  const { session, signOut } = useAuthSession();
  const members = usePlatformStore((state) => state.members);
  const requests = usePlatformStore((state) => state.topUpRequests);
  const ledger = usePlatformStore((state) => state.ledger);
  const securityEvents = usePlatformStore((state) => state.securityEvents);
  const reviewTopUp = usePlatformStore((state) => state.reviewTopUp);
  const setMemberStatus = usePlatformStore((state) => state.setMemberStatus);
  const [search, setSearch] = useState("");
  const [review, setReview] = useState<ReviewState | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [passwordResetMember, setPasswordResetMember] = useState<PlatformMember | null>(null);

  const pendingRequests = requests.filter((request) => request.status === "PENDING");
  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) => `${member.businessName} ${member.ownerName} ${member.ownerEmail}`.toLowerCase().includes(query));
  }, [members, search]);
  const totalCredits = members.reduce((sum, member) => sum + member.creditBalance, 0);
  const pendingCreditAmount = pendingRequests.reduce((sum, request) => sum + request.amount, 0);

  const logout = async () => {
    await signOut();
    router.replace("/login");
  };

  const updateMemberStatus = (memberId: string, status: MemberStatus) => {
    setMemberStatus(memberId, status);
    toast.success(status === "ACTIVE" ? "เปิดใช้งานสมาชิกแล้ว" : "ระงับสมาชิกแล้ว");
  };

  const submitReview = () => {
    if (!review || !session) return;
    const changed = reviewTopUp({
      requestId: review.request.id,
      decision: review.decision,
      reviewerEmail: session.email,
      reviewNote,
    });
    if (!changed) {
      toast.error("คำขอนี้ถูกดำเนินการไปแล้ว");
      setReview(null);
      return;
    }
    toast.success(review.decision === "APPROVED" ? "อนุมัติและเพิ่มเครดิตแล้ว" : "ปฏิเสธคำขอแล้ว", { description: review.request.reference });
    setReview(null);
    setReviewNote("");
  };

  return (
    <main id="main-content" className="min-h-dvh bg-[#f7f8fb] pb-12 text-slate-950 dark:bg-[#090d14] dark:text-slate-50">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-lg dark:bg-slate-950/95">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo compact />
            <div className="hidden border-l pl-3 sm:block"><p className="text-sm font-bold">Flukex Platform Admin</p><p className="text-xs text-muted-foreground">สมาชิก · เครดิต · Audit log</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="hidden bg-violet-100 text-violet-800 sm:flex dark:bg-violet-950 dark:text-violet-200"><ShieldCheck className="size-3.5" />ผู้ดูแลแพลตฟอร์ม</Badge>
            <Button variant="outline" size="sm" onClick={logout}><LogOut />ออกจากระบบ</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><p className="text-sm font-bold text-violet-700 dark:text-violet-300">CONTROL CENTER</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">จัดการสมาชิกและเครดิต</h1><p className="mt-2 text-sm text-muted-foreground">อนุมัติจากหลักฐานที่ได้รับทาง LINE และเก็บประวัติทุกการเปลี่ยนแปลง</p></div>
          <p className="text-xs text-muted-foreground">เข้าสู่ระบบโดย {session?.email}</p>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="สรุปแพลตฟอร์ม">
          {[
            { label: "สมาชิกทั้งหมด", value: members.length, description: `${members.filter((item) => item.status === "ACTIVE").length} ร้านใช้งานอยู่`, icon: Users, tone: "bg-blue-100 text-blue-700" },
            { label: "คำขอรอตรวจ", value: pendingRequests.length, description: `${pendingCreditAmount.toLocaleString("th-TH")} เครดิต`, icon: Clock3, tone: "bg-amber-100 text-amber-700" },
            { label: "เครดิตในระบบ", value: totalCredits.toLocaleString("th-TH"), description: "ยอดคงเหลือทุกร้าน", icon: Coins, tone: "bg-emerald-100 text-emerald-700" },
            { label: "Audit events", value: ledger.length + securityEvents.length, description: `${securityEvents.length} กิจกรรมความปลอดภัย`, icon: History, tone: "bg-violet-100 text-violet-700" },
          ].map((item) => (
            <Card key={item.label} className="p-5"><span className={`grid size-10 place-items-center rounded-xl ${item.tone}`}><item.icon className="size-5" aria-hidden="true" /></span><p className="mt-4 text-sm text-muted-foreground">{item.label}</p><p className="mt-1 text-2xl font-bold">{item.value}</p><p className="mt-1 text-xs text-muted-foreground">{item.description}</p></Card>
          ))}
        </section>

        <section className="mt-6" aria-labelledby="pending-topups-heading">
          <div className="mb-4 flex items-end justify-between gap-3"><div><h2 id="pending-topups-heading" className="text-xl font-bold">คำขอเติมเครดิตที่รอตรวจสอบ</h2><p className="mt-1 text-sm text-muted-foreground">ตรวจหลักฐานใน LINE ก่อนกดอนุมัติ</p></div><Badge variant={pendingRequests.length ? "warning" : "success"}>{pendingRequests.length} คำขอ</Badge></div>
          {pendingRequests.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {pendingRequests.map((request) => {
                const member = members.find((item) => item.id === request.memberId);
                return (
                  <Card key={request.id} className="p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0"><p className="font-mono text-xs font-bold text-primary">{request.reference}</p><h3 className="mt-2 text-lg font-bold">{member?.businessName ?? "ไม่พบร้านค้า"}</h3><p className="mt-1 text-sm text-muted-foreground">{request.requestedByEmail} · {formatDateTime(request.createdAt)}</p>{request.note && <p className="mt-3 rounded-lg bg-muted p-3 text-sm">{request.note}</p>}</div>
                      <div className="shrink-0 text-left sm:text-right"><p className="text-3xl font-bold text-primary">{request.amount.toLocaleString("th-TH")}</p><p className="text-xs text-muted-foreground">เครดิต</p></div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2 border-t pt-4">
                      <Button variant="outline" className="text-destructive" onClick={() => { setReview({ request, decision: "REJECTED" }); setReviewNote(""); }}><X />ปฏิเสธ</Button>
                      <Button onClick={() => { setReview({ request, decision: "APPROVED" }); setReviewNote(""); }}><Check />อนุมัติ</Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : <Card className="grid min-h-44 place-items-center p-6 text-center"><div><Check className="mx-auto size-10 text-success" /><p className="mt-3 font-bold">ตรวจครบแล้ว</p><p className="mt-1 text-sm text-muted-foreground">ไม่มีคำขอที่รอการดำเนินการ</p></div></Card>}
        </section>

        <section className="mt-8" aria-labelledby="members-heading">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div><h2 id="members-heading" className="text-xl font-bold">สมาชิกและร้านค้า</h2><p className="mt-1 text-sm text-muted-foreground">ค้นหา จัดการสถานะ หรือสร้างรหัสผ่านชั่วคราวให้สมาชิก</p></div>
            <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาร้าน ชื่อ หรืออีเมล" className="pl-10" aria-label="ค้นหาสมาชิก" /></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => <MemberCard key={member.id} member={member} onStatusChange={updateMemberStatus} onPasswordReset={setPasswordResetMember} />)}
          </div>
        </section>

        <section className="mt-8" aria-labelledby="security-audit-heading">
          <Card className="overflow-hidden">
            <div className="border-b p-5">
              <h2 id="security-audit-heading" className="flex items-center gap-2 text-lg font-bold"><KeyRound className="size-5 text-primary" />กิจกรรมความปลอดภัยล่าสุด</h2>
              <p className="mt-1 text-xs text-muted-foreground">บันทึกผู้ดำเนินการและเวลาที่รีเซ็ตรหัส โดยไม่บันทึกตัวรหัสผ่าน</p>
            </div>
            {securityEvents.length ? (
              <ul className="divide-y" aria-live="polite">
                {securityEvents.slice(0, 8).map((event) => {
                  const member = members.find((item) => item.id === event.memberId);
                  return (
                    <li key={event.id} className="flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"><KeyRound className="size-4" aria-hidden="true" /></span>
                        <div className="min-w-0"><p className="font-semibold">สร้างรหัสผ่านชั่วคราว</p><p className="truncate text-xs text-muted-foreground">{member?.businessName ?? event.tenantId} · โดย {event.createdBy}</p></div>
                      </div>
                      <time className="text-xs text-muted-foreground" dateTime={event.createdAt}>{formatDateTime(event.createdAt)}</time>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-8 text-center"><ShieldCheck className="mx-auto size-9 text-muted-foreground" /><p className="mt-3 font-semibold">ยังไม่มีกิจกรรมรีเซ็ตรหัส</p><p className="mt-1 text-xs text-muted-foreground">รายการจะปรากฏหลังผู้ดูแลสร้างรหัสผ่านชั่วคราว</p></div>
            )}
          </Card>
        </section>

        <section className="mt-8" aria-labelledby="ledger-heading">
          <Card className="overflow-hidden">
            <div className="border-b p-5"><h2 id="ledger-heading" className="flex items-center gap-2 text-lg font-bold"><WalletCards className="size-5 text-primary" />Credit Ledger ล่าสุด</h2><p className="mt-1 text-xs text-muted-foreground">ยอดทุกครั้งเชื่อมกับร้าน เลขอ้างอิง และผู้ดำเนินการ</p></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-muted/60 text-xs text-muted-foreground"><tr><th className="px-5 py-3">เวลา</th><th className="px-5 py-3">ร้านค้า</th><th className="px-5 py-3">อ้างอิง</th><th className="px-5 py-3">ผู้ดำเนินการ</th><th className="px-5 py-3 text-right">เปลี่ยนแปลง</th><th className="px-5 py-3 text-right">คงเหลือ</th></tr></thead>
                <tbody>
                  {ledger.slice(0, 12).map((entry) => {
                    const member = members.find((item) => item.id === entry.memberId);
                    return <tr key={entry.id} className="border-t"><td className="px-5 py-4 text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</td><td className="px-5 py-4 font-semibold">{member?.businessName ?? entry.tenantId}</td><td className="px-5 py-4 font-mono text-xs text-primary">{entry.reference}</td><td className="px-5 py-4 text-xs">{entry.createdBy}</td><td className={`px-5 py-4 text-right font-bold ${entry.amount >= 0 ? "text-success" : "text-destructive"}`}>{entry.amount >= 0 ? "+" : ""}{entry.amount.toLocaleString("th-TH")}</td><td className="px-5 py-4 text-right font-semibold">{entry.balanceAfter.toLocaleString("th-TH")}</td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </div>

      <MemberPasswordResetDialog member={passwordResetMember} operatorEmail={session?.email} onClose={() => setPasswordResetMember(null)} />

      <Dialog open={Boolean(review)} onOpenChange={(open) => !open && setReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{review?.decision === "APPROVED" ? "อนุมัติและเพิ่มเครดิต?" : "ปฏิเสธคำขอเติมเครดิต?"}</DialogTitle>
            <DialogDescription>
              {review ? `${review.request.reference} · ${review.request.amount.toLocaleString("th-TH")} เครดิต` : "ตรวจสอบข้อมูลคำขอ"}
              {review?.decision === "APPROVED" ? " ระบบจะเพิ่มยอดและเขียน Ledger เพียงครั้งเดียว" : " ระบบจะไม่เปลี่ยนยอดเครดิตของสมาชิก"}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="review-note">หมายเหตุการตรวจสอบ</Label>
            <Textarea id="review-note" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder={review?.decision === "APPROVED" ? "เช่น ตรวจหลักฐานใน LINE แล้ว" : "ระบุเหตุผลที่ปฏิเสธ"} className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReview(null)}>ยกเลิก</Button>
            <Button variant={review?.decision === "REJECTED" ? "destructive" : "default"} onClick={submitReview}>{review?.decision === "APPROVED" ? <><Check />ยืนยันอนุมัติ</> : <><X />ยืนยันปฏิเสธ</>}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
