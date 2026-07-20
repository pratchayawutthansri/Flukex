"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Check,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
  Store,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUBSCRIPTION_PLANS } from "@/config/plans";
import { registrationSchema, staffRegistrationSchema } from "@/domain/schemas";
import type { PlanId, RegistrationAccountType } from "@/domain/types";
import type { StaffAccessRequestReceipt } from "@/services/contracts";
import { cn, formatCurrency } from "@/lib/utils";
import { services } from "@/services/container";
import { useDemoStore } from "@/store/demo-store";
import { usePlatformStore } from "@/store/platform-store";

const LINE_ADMIN_ID = "flukexd_";

export function RegisterForm() {
  const router = useRouter();
  const { establishSession } = useAuthSession();
  const registerMember = usePlatformStore((state) => state.registerMember);
  const selectPlan = useDemoStore((state) => state.selectPlan);
  const [accountType, setAccountType] = useState<RegistrationAccountType>("OWNER");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [plan, setPlan] = useState<PlanId>("free");
  const [contactPlan, setContactPlan] = useState<PlanId | null>(null);
  const [lineCopied, setLineCopied] = useState(false);
  const [staffReceipt, setStaffReceipt] = useState<StaffAccessRequestReceipt | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    restaurantName: "",
    approverEmail: "",
  });

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const chooseAccountType = (nextType: RegistrationAccountType) => {
    setAccountType(nextType);
    setError("");
    setStaffReceipt(null);
  };

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!acceptedTerms) {
      setError("กรุณายอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัวก่อนดำเนินการต่อ");
      return;
    }

    if (accountType === "STAFF") {
      const parsed = staffRegistrationSchema.safeParse(form);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "กรุณาตรวจสอบข้อมูล");
        return;
      }
      setLoading(true);
      try {
        const receipt = await services.staffAccess.request({
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password,
          restaurantName: parsed.data.restaurantName,
          approverEmail: parsed.data.approverEmail,
        });
        setStaffReceipt(receipt);
        setStep(2);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "ส่งคำขอเข้าร่วมร้านไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
      return;
    }

    const parsed = registrationSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "กรุณาตรวจสอบข้อมูล");
      return;
    }

    setLoading(true);
    try {
      const session = await services.auth.register({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        restaurantName: parsed.data.restaurantName,
      });
      establishSession(session);
      registerMember({
        tenantId: session.tenantId,
        businessName: parsed.data.restaurantName,
        ownerName: parsed.data.name,
        ownerEmail: parsed.data.email,
      });
      setStep(2);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "สมัครไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const finish = () => {
    selectPlan(plan);
    router.push("/dashboard?welcome=1");
  };

  const choosePlan = (planId: PlanId) => {
    const selectedPlan = SUBSCRIPTION_PLANS[planId];
    if (selectedPlan.priceMonthly > 0) {
      setContactPlan(planId);
      setLineCopied(false);
      return;
    }
    setPlan(planId);
  };

  const copyLineId = async () => {
    try {
      await navigator.clipboard.writeText(LINE_ADMIN_ID);
      setLineCopied(true);
    } catch {
      setLineCopied(false);
    }
  };

  const isStaff = accountType === "STAFF";
  const secondStepLabel = isStaff ? "รออนุมัติ" : "เลือกแผน";

  return (
    <div>
      <div className="mb-7 flex items-center gap-3" aria-label="ขั้นตอนการสมัคร">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-white">{step > 1 ? <Check className="size-4" /> : 1}</span>
          <span className="text-sm font-semibold">ข้อมูลบัญชี</span>
        </div>
        <span className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2">
          <span className={cn("grid size-8 place-items-center rounded-full text-xs font-bold", step === 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>2</span>
          <span className="text-sm font-semibold">{secondStepLabel}</span>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={createAccount} className="space-y-5">
          <fieldset>
            <legend className="mb-3 text-sm font-semibold">คุณสมัครในฐานะใด?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => chooseAccountType("OWNER")}
                aria-pressed={accountType === "OWNER"}
                className={cn(
                  "min-h-24 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  accountType === "OWNER" ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "hover:bg-muted/50",
                )}
              >
                <Store className="size-5 text-primary" aria-hidden="true" />
                <strong className="mt-3 block text-sm">เจ้าของร้าน</strong>
                <span className="mt-1 block text-xs text-muted-foreground">สร้างร้านและ Workspace ใหม่</span>
              </button>
              <button
                type="button"
                onClick={() => chooseAccountType("STAFF")}
                aria-pressed={accountType === "STAFF"}
                className={cn(
                  "min-h-24 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  accountType === "STAFF" ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600/15 dark:bg-blue-950" : "hover:bg-muted/50",
                )}
              >
                <BriefcaseBusiness className="size-5 text-blue-700 dark:text-blue-300" aria-hidden="true" />
                <strong className="mt-3 block text-sm">พนักงาน</strong>
                <span className="mt-1 block text-xs text-muted-foreground">ขอเข้าร่วมร้านที่มีอยู่แล้ว</span>
              </button>
            </div>
          </fieldset>

          <div className={cn("rounded-xl border p-4", isStaff ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950" : "border-primary/15 bg-primary/5")}>
            <div className="flex items-start gap-3">
              {isStaff
                ? <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-700 dark:text-blue-300" aria-hidden="true" />
                : <Store className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />}
              <div>
                <p className="text-sm font-semibold">
                  {isStaff ? "บัญชีพนักงาน — คุณไม่ใช่เจ้าของร้าน" : "บัญชีเจ้าของร้าน — สำหรับสร้างร้านใหม่"}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {isStaff
                    ? "กรอกชื่อร้านอาหารที่ทำงานอยู่ ระบบจะส่งคำขอให้เจ้าของหรือผู้จัดการกำหนดบทบาทและสาขาก่อนเข้าใช้งาน"
                    : "ระบบจะสร้างพื้นที่ร้านใหม่และกำหนดบัญชีนี้เป็นเจ้าของร้าน ห้ามใช้ตัวเลือกนี้สำหรับบัญชีพนักงาน"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="register-name">{isStaff ? "ชื่อ-นามสกุลพนักงาน" : "ชื่อเจ้าของร้าน"}</Label>
              <Input id="register-name" value={form.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-restaurant">{isStaff ? "ชื่อร้านอาหารที่ทำงานอยู่" : "ชื่อร้านอาหารใหม่"} <span className="text-destructive">*</span></Label>
              <Input
                id="register-restaurant"
                value={form.restaurantName}
                onChange={(event) => update("restaurantName", event.target.value)}
                placeholder={isStaff ? "กรอกชื่อร้านให้ตรงกับข้อมูลของร้าน" : "เช่น ครัวบ้านสวน"}
                required
              />
              {isStaff && <p className="text-xs text-muted-foreground">ช่องนี้ใช้ค้นหาร้านเดิม ไม่ได้สร้างร้านใหม่</p>}
            </div>
          </div>

          {isStaff && (
            <div className="space-y-2">
              <Label htmlFor="register-approver-email">อีเมลเจ้าของร้านหรือผู้จัดการ <span className="text-destructive">*</span></Label>
              <Input
                id="register-approver-email"
                type="email"
                value={form.approverEmail}
                onChange={(event) => update("approverEmail", event.target.value)}
                autoComplete="email"
                placeholder="ใช้ยืนยันว่าคำขอถูกส่งไปยังร้านที่ถูกต้อง"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="register-email">อีเมลสำหรับเข้าสู่ระบบของคุณ</Label>
            <Input id="register-email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" required />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="register-password">รหัสผ่าน</Label>
              <Input id="register-password" type={showPasswords ? "text" : "password"} value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" required />
              <p className="text-xs text-muted-foreground">อย่างน้อย 6 ตัวอักษร</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">ยืนยันรหัสผ่าน</Label>
              <Input id="register-confirm-password" type={showPasswords ? "text" : "password"} value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} autoComplete="new-password" required />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords((current) => !current)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-pressed={showPasswords}
          >
            {showPasswords ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            {showPasswords ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่านทั้งสองช่อง"}
          </button>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
              required
            />
            <span>
              ฉันได้อ่านและยอมรับ{" "}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">ข้อกำหนดการใช้งาน</Link>
              {" "}และ{" "}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">นโยบายความเป็นส่วนตัว</Link>
            </span>
          </label>

          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? (
              <><LoaderCircle className="animate-spin" />{isStaff ? "กำลังส่งคำขอ..." : "กำลังสร้างร้าน..."}</>
            ) : isStaff ? (
              <><UsersRound />ส่งคำขอเข้าร่วมร้าน</>
            ) : (
              <><Store />สร้างร้านและดำเนินการต่อ</>
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">มีบัญชีแล้ว? <Link href="/login" className="font-bold text-primary">เข้าสู่ระบบ</Link></p>
        </form>
      ) : isStaff && staffReceipt ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
            <span className="grid size-11 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200">
              <Clock3 className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold">ส่งคำขอเข้าร่วมร้านแล้ว</h2>
            <p className="mt-2 text-sm leading-6">
              บัญชี <strong>{staffReceipt.applicantEmail}</strong> เป็นบัญชีพนักงาน ไม่ใช่เจ้าของร้าน และยังเข้าใช้งานไม่ได้จนกว่าจะได้รับอนุมัติ
            </p>
          </div>
          <div className="rounded-xl border p-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">ร้านอาหาร</span>
              <strong className="text-right">{staffReceipt.restaurantName}</strong>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 border-t pt-3">
              <span className="text-muted-foreground">สถานะ</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">รอเจ้าของ/ผู้จัดการอนุมัติ</span>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            แจ้งเจ้าของร้านหรือผู้จัดการให้เปิดเมนู <strong className="text-foreground">พนักงาน → คำขอเข้าร่วมร้าน</strong> แล้วกำหนดบทบาทและสาขาให้คุณ
          </p>
          <Button asChild className="w-full"><Link href="/login">ไปหน้าเข้าสู่ระบบ</Link></Button>
        </div>
      ) : (
        <div>
          <div className="mb-5 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
            <strong>สร้างร้านเรียบร้อยแล้ว</strong>
            <p className="mt-1">บัญชีใหม่เริ่มด้วยข้อมูลร้านของคุณและไม่มีออเดอร์หรือสินค้าเดิมปะปน</p>
          </div>
          <div className="grid gap-3">
            {Object.values(SUBSCRIPTION_PLANS).map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => choosePlan(item.id)}
                className={cn("flex min-h-20 cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors", plan === item.id && "border-primary bg-secondary/40 ring-2 ring-primary/15")}
              >
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{item.name}</span>{item.highlighted && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">แนะนำ</span>}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                </div>
                <span className="shrink-0 text-sm font-bold">{item.priceMonthly === 0 ? "ฟรี" : `${formatCurrency(item.priceMonthly).replace(".00", "")}/ด.`}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={() => setStep(1)}>ย้อนกลับ</Button>
            <Button onClick={finish}><UsersRound />เริ่มตั้งค่าร้าน</Button>
          </div>

          <Dialog open={Boolean(contactPlan)} onOpenChange={(open) => !open && setContactPlan(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>กรุณาติดต่อแอดมินได้ที่ LINE ID : {LINE_ADMIN_ID}</DialogTitle>
                <DialogDescription>
                  แจ้งชื่อร้านและแผน {contactPlan ? SUBSCRIPTION_PLANS[contactPlan].name : ""} ให้แอดมินตรวจสอบและเปิดใช้งานแพ็กเกจ
                </DialogDescription>
              </DialogHeader>
              {contactPlan && (
                <div className="rounded-xl border border-[#06C755]/30 bg-[#06C755]/10 p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#06C755] text-white">
                      <MessageCircle className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold">แผน {SUBSCRIPTION_PLANS[contactPlan].name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatCurrency(SUBSCRIPTION_PLANS[contactPlan].priceMonthly).replace(".00", "")} / เดือน
                      </p>
                      <p className="mt-3 font-mono text-lg font-bold text-[#07883f]">{LINE_ADMIN_ID}</p>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setContactPlan(null)}>ปิด</Button>
                <Button className="bg-[#06C755] text-white hover:bg-[#05a648]" onClick={copyLineId}>
                  <Copy />{lineCopied ? "คัดลอกแล้ว" : "คัดลอก LINE ID"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
