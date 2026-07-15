"use client";

import { useState } from "react";
import { Check, Clipboard, KeyRound, LoaderCircle, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlatformMember } from "@/domain/credits";
import type { TemporaryCredential } from "@/services/contracts";
import { services } from "@/services/container";
import { usePlatformStore } from "@/store/platform-store";

interface MemberPasswordResetDialogProps {
  member: PlatformMember | null;
  operatorEmail?: string;
  onClose: () => void;
}

export function MemberPasswordResetDialog({ member, operatorEmail, onClose }: MemberPasswordResetDialogProps) {
  const recordPasswordReset = usePlatformStore((state) => state.recordPasswordReset);
  const [credential, setCredential] = useState<TemporaryCredential | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const clearAndClose = () => {
    setCredential(null);
    setCopied(false);
    setError("");
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) clearAndClose();
  };

  const resetPassword = async () => {
    if (!member || !operatorEmail) return;
    setLoading(true);
    setError("");
    try {
      const result = await services.auth.resetMemberPassword({
        email: member.ownerEmail,
        name: member.ownerName,
        tenantId: member.tenantId,
        restaurantName: member.businessName,
      });
      recordPasswordReset({ memberId: member.id, performedBy: operatorEmail });
      setCredential(result);
      toast.success("สร้างรหัสผ่านชั่วคราวแล้ว", { description: member.ownerEmail });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ไม่สามารถรีเซ็ตรหัสผ่านได้");
    } finally {
      setLoading(false);
    }
  };

  const copyCredential = async () => {
    if (!credential) return;
    try {
      await navigator.clipboard.writeText(`อีเมล: ${credential.email}\nรหัสผ่านชั่วคราว: ${credential.temporaryPassword}`);
      setCopied(true);
      toast.success("คัดลอกข้อมูลเข้าสู่ระบบแล้ว");
    } catch {
      setError("คัดลอกอัตโนมัติไม่สำเร็จ กรุณาเลือกรหัสผ่านและคัดลอกด้วยตนเอง");
    }
  };

  return (
    <Dialog open={Boolean(member)} onOpenChange={handleOpenChange}>
      <DialogContent>
        {credential ? (
          <>
            <DialogHeader>
              <span className="mb-2 grid size-11 place-items-center rounded-xl bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <DialogTitle>รหัสผ่านชั่วคราวพร้อมส่ง</DialogTitle>
              <DialogDescription>
                ส่งข้อมูลชุดนี้ให้ {member?.ownerName} ผ่านช่องทางส่วนตัว รหัสเดิมจะไม่สามารถใช้งานได้แล้ว
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4" aria-live="polite">
              <div className="space-y-2">
                <Label htmlFor="temporary-email">อีเมลสมาชิก</Label>
                <Input id="temporary-email" value={credential.email} readOnly className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temporary-password">รหัสผ่านชั่วคราว</Label>
                <Input id="temporary-password" value={credential.temporaryPassword} readOnly className="font-mono text-base font-bold tracking-wide" />
              </div>
              <p className="rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
                รหัสนี้จะแสดงเฉพาะในหน้าต่างนี้ เมื่อปิดแล้วต้องสร้างรหัสใหม่หากต้องการดูอีกครั้ง และ Audit log จะไม่บันทึกตัวรหัสผ่าน
              </p>
            </div>

            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={clearAndClose}>ปิดหน้าต่าง</Button>
              <Button onClick={copyCredential}>
                {copied ? <><Check />คัดลอกแล้ว</> : <><Clipboard />คัดลอกเพื่อส่งลูกค้า</>}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <span className="mb-2 grid size-11 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <KeyRound className="size-5" aria-hidden="true" />
              </span>
              <DialogTitle>สร้างรหัสผ่านชั่วคราว?</DialogTitle>
              <DialogDescription>
                {member ? `${member.businessName} · ${member.ownerEmail}` : "เลือกบัญชีสมาชิกที่ต้องการรีเซ็ต"}
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold">รหัสผ่านเดิมจะใช้ไม่ได้ทันที</p>
                <p className="mt-1 leading-6">เพื่อความปลอดภัย ผู้ดูแลไม่สามารถดูรหัสเดิมได้ ระบบจะสร้างรหัสใหม่และแสดงให้คัดลอกเพียงครั้งเดียว</p>
              </div>
            </div>

            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={clearAndClose} disabled={loading}>ยกเลิก</Button>
              <Button onClick={resetPassword} disabled={loading || !operatorEmail}>
                {loading ? <><LoaderCircle className="animate-spin" />กำลังสร้าง...</> : <><KeyRound />ยืนยันสร้างรหัสใหม่</>}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
