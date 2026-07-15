"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChefHat,
  Coffee,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Monitor,
  ShieldCheck,
  Store,
  UserCog,
} from "lucide-react";
import { getRoleHome, ROLE_DEFINITIONS } from "@/config/access-control";
import { PLATFORM_ADMIN_ACCOUNT, TENANT_DEMO_ACCOUNTS } from "@/data/mock-data";
import type { SessionRole } from "@/domain/types";
import { loginSchema } from "@/domain/schemas";
import { services } from "@/services/container";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthSession } from "./auth-session-provider";

const accountIcons = {
  PLATFORM_ADMIN: ShieldCheck,
  OWNER: Store,
  MANAGER: UserCog,
  CASHIER: Monitor,
  KITCHEN: ChefHat,
  BAR: Coffee,
} satisfies Record<SessionRole, typeof Store>;

const accountStyles = {
  PLATFORM_ADMIN: "border-violet-300 bg-violet-50/70 text-violet-900 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-100",
  OWNER: "border-amber-300 bg-amber-50/70 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
  MANAGER: "border-indigo-300 bg-indigo-50/70 text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-100",
  CASHIER: "border-blue-300 bg-blue-50/70 text-blue-950 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100",
  KITCHEN: "border-orange-300 bg-orange-50/70 text-orange-950 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-100",
  BAR: "border-emerald-300 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
} satisfies Record<SessionRole, string>;

type DemoAccount = (typeof TENANT_DEMO_ACCOUNTS)[number] | typeof PLATFORM_ADMIN_ACCOUNT;

function AccountCard({ account, selected, onSelect }: { account: DemoAccount; selected: boolean; onSelect: () => void }) {
  const Icon = accountIcons[account.role];
  const role = ROLE_DEFINITIONS[account.role];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "min-h-32 cursor-pointer rounded-xl border p-4 text-left transition-[border-color,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        accountStyles[account.role],
        selected && "ring-2 ring-primary ring-offset-2",
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-white/80 shadow-sm dark:bg-black/20">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide dark:bg-black/20">
          {role.shortLabel}
        </span>
      </span>
      <strong className="mt-3 block text-sm">{role.label}</strong>
      <span className="mt-1 block text-xs leading-5 opacity-75">{role.description}</span>
      <span className="mt-2 block truncate text-[11px] font-medium opacity-70">{account.email}</span>
    </button>
  );
}

export function LoginForm() {
  const router = useRouter();
  const { establishSession } = useAuthSession();
  const [email, setEmail] = useState("owner@demo.com");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const selectAccount = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      return;
    }

    setLoading(true);
    try {
      const session = await services.auth.login(parsed.data);
      establishSession(session);
      router.replace(getRoleHome(session.role));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "เข้าสู่ระบบไม่สำเร็จ");
      setLoading(false);
    }
  };

  const reset = async () => {
    try {
      await services.auth.resetPassword(resetEmail);
      setResetSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ไม่สำเร็จ");
    }
  };

  return (
    <>
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-email">อีเมล</Label>
          <Input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">รหัสผ่าน</Label>
            <Dialog>
              <DialogTrigger asChild>
                <button type="button" className="cursor-pointer rounded text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  ลืมรหัสผ่าน?
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>รีเซ็ตรหัสผ่านแบบเดโม</DialogTitle>
                  <DialogDescription>ระบบจะแสดงสถานะสำเร็จเท่านั้น ไม่มีอีเมลถูกส่งจริง</DialogDescription>
                </DialogHeader>
                {resetSent ? (
                  <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                    บันทึกคำขอจำลองแล้ว กรุณาใช้รหัส demo1234 ต่อได้เลย
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">อีเมล</Label>
                    <Input id="reset-email" type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} />
                  </div>
                )}
                <DialogFooter>
                  {!resetSent && <Button onClick={reset}><KeyRound />จำลองการส่งลิงก์</Button>}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="pr-12" />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              className="absolute right-1 top-1 grid size-9 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? <><LoaderCircle className="animate-spin" />กำลังเข้าสู่ระบบ...</> : "เข้าสู่ระบบ"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />เลือกบทบาทสำหรับทดลอง<span className="h-px flex-1 bg-border" />
      </div>

      <section aria-labelledby="tenant-accounts-heading">
        <div className="mb-3">
          <h2 id="tenant-accounts-heading" className="text-sm font-bold">บัญชีทีมร้านอาหาร</h2>
          <p className="text-xs text-muted-foreground">แต่ละบทบาทจะเข้าสู่ Workspace และเห็นเมนูไม่เหมือนกัน</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {TENANT_DEMO_ACCOUNTS.map((account) => (
            <AccountCard key={account.email} account={account} selected={email === account.email} onSelect={() => selectAccount(account)} />
          ))}
        </div>
      </section>

      <section className="mt-5 border-t pt-5" aria-labelledby="platform-account-heading">
        <div className="mb-3">
          <h2 id="platform-account-heading" className="text-sm font-bold">หลังบ้าน Flukex</h2>
          <p className="text-xs text-muted-foreground">สำหรับคุณเท่านั้น: ดูสมาชิกและอนุมัติเครดิต</p>
        </div>
        <AccountCard account={PLATFORM_ADMIN_ACCOUNT} selected={email === PLATFORM_ADMIN_ACCOUNT.email} onSelect={() => selectAccount(PLATFORM_ADMIN_ACCOUNT)} />
      </section>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ยังไม่มีบัญชี? <Link href="/register" className="font-bold text-primary hover:underline">สมัครใช้งานฟรี</Link>
      </p>
    </>
  );
}
