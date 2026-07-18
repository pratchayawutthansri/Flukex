"use client";

import { useMemo, useState } from "react";
import { Coins, LoaderCircle, Plus, ReceiptText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreditLedgerEntry, PlatformMember } from "@/domain/credits";
import { dataProvider } from "@/services/container";
import { usePlatformStore } from "@/store/platform-store";

const QUICK_AMOUNTS = [500, 1_000, 3_000, 5_000];
const MAX_CREDIT = 1_000_000;

function newIdempotencyKey() {
  return globalThis.crypto.randomUUID();
}

interface DirectCreditDialogProps {
  member: PlatformMember | null;
  operatorEmail?: string;
  onClose: () => void;
}

export function DirectCreditDialog({ member, operatorEmail, onClose }: DirectCreditDialogProps) {
  const addCreditDirectly = usePlatformStore((state) => state.addCreditDirectly);
  const applyServerCredit = usePlatformStore((state) => state.applyServerCredit);
  const [amount, setAmount] = useState("1000");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey] = useState(newIdempotencyKey);

  const numericAmount = Number(amount);
  const isAmountValid = Number.isSafeInteger(numericAmount) && numericAmount >= 1 && numericAmount <= MAX_CREDIT;
  const balanceAfter = useMemo(
    () => member && isAmountValid ? member.creditBalance + numericAmount : null,
    [isAmountValid, member, numericAmount],
  );

  const submit = async () => {
    if (!member || !operatorEmail || !idempotencyKey) return;
    if (member.status !== "ACTIVE") {
      setError("เติมเครดิตได้เฉพาะร้านที่เปิดใช้งานอยู่");
      return;
    }
    if (!isAmountValid) {
      setError("จำนวนเครดิตต้องเป็นเลขจำนวนเต็มตั้งแต่ 1 ถึง 1,000,000");
      return;
    }
    if (note.length > 300) {
      setError("หมายเหตุต้องไม่เกิน 300 ตัวอักษร");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      let entry: CreditLedgerEntry;
      if (dataProvider === "supabase") {
        const response = await fetch("/api/platform-admin/credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: member.id, amount: numericAmount, note: note.trim() || undefined, idempotencyKey }),
        });
        const result = (await response.json()) as { entry?: CreditLedgerEntry; message?: string };
        if (!response.ok || !result.entry) throw new Error(result.message || "ไม่สามารถเติมเครดิตได้");
        entry = result.entry;
        applyServerCredit(entry);
      } else {
        entry = addCreditDirectly({
          memberId: member.id,
          amount: numericAmount,
          operatorEmail,
          note,
          idempotencyKey,
        });
      }

      toast.success(`เพิ่ม ${numericAmount.toLocaleString("th-TH")} เครดิตให้ ${member.businessName} แล้ว`, {
        description: `เลขอ้างอิง ${entry.reference}`,
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ไม่สามารถเติมเครดิตได้ กรุณาลองอีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={Boolean(member)} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
            <Coins className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>เติมเครดิตให้เจ้าของกิจการ</DialogTitle>
          <DialogDescription>
            เพิ่มเครดิตให้ร้านโดยตรง รายการจะถูกบันทึกใน Credit Ledger พร้อมผู้ดำเนินการและเลขอ้างอิง
          </DialogDescription>
        </DialogHeader>

        {member && (
          <div className="space-y-5">
            <div className="rounded-xl border bg-muted/40 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-bold">{member.businessName}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{member.ownerName} · {member.ownerEmail}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground">เครดิตปัจจุบัน</p>
                  <p className="text-lg font-bold">{member.creditBalance.toLocaleString("th-TH")}</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="direct-credit-amount">จำนวนเครดิต</Label>
              <div className="relative mt-2">
                <Input
                  id="direct-credit-amount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_CREDIT}
                  step={1}
                  value={amount}
                  onChange={(event) => { setAmount(event.target.value); setError(""); }}
                  className="h-12 pr-20 text-lg font-bold"
                  aria-describedby="direct-credit-help"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">เครดิต</span>
              </div>
              <p id="direct-credit-help" className="mt-1.5 text-xs text-muted-foreground">จำนวนเต็ม 1–1,000,000 เครดิตต่อรายการ</p>
              <div className="mt-3 grid grid-cols-4 gap-2" aria-label="เลือกจำนวนเครดิตด่วน">
                {QUICK_AMOUNTS.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    size="sm"
                    variant={numericAmount === quickAmount ? "default" : "outline"}
                    onClick={() => { setAmount(String(quickAmount)); setError(""); }}
                  >
                    +{quickAmount.toLocaleString("th-TH")}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="direct-credit-note">หมายเหตุ / หลักฐาน</Label>
                <span className="text-xs text-muted-foreground">{note.length}/300</span>
              </div>
              <Textarea
                id="direct-credit-note"
                value={note}
                maxLength={300}
                onChange={(event) => { setNote(event.target.value); setError(""); }}
                placeholder="เช่น รับยอดผ่าน LINE วันที่ 18 ก.ค. 2569"
                className="mt-2 min-h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
              <div><p className="text-xs text-muted-foreground">ก่อนเติม</p><p className="mt-1 font-bold">{member.creditBalance.toLocaleString("th-TH")}</p></div>
              <div><p className="text-xs text-muted-foreground">หลังเติม</p><p className="mt-1 font-bold text-emerald-700 dark:text-emerald-300">{balanceAfter?.toLocaleString("th-TH") ?? "—"}</p></div>
            </div>

            <div className="flex gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>ตรวจสอบร้านและยอดให้ถูกต้อง เมื่อยืนยันแล้วระบบจะบันทึกรายการถาวรใน Ledger</p>
            </div>

            {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter className="sticky bottom-0 z-10 -mx-6 -mb-6 border-t bg-background px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>ยกเลิก</Button>
          <Button onClick={submit} disabled={!member || !operatorEmail || !isAmountValid || isSubmitting}>
            {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Plus />}
            {isSubmitting ? "กำลังบันทึก..." : "ยืนยันเพิ่มเครดิต"}
          </Button>
        </DialogFooter>
        <p className="sr-only"><ReceiptText />ผู้ดำเนินการ {operatorEmail}</p>
      </DialogContent>
    </Dialog>
  );
}
