"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import { getRoleHome } from "@/config/access-control";
import { loginSchema } from "@/domain/schemas";
import { services } from "@/services/container";
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

export function LoginForm() {
  const router = useRouter();
  const { establishSession } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

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
                  <DialogTitle>รีเซ็ตรหัสผ่าน</DialogTitle>
                  <DialogDescription>กรอกอีเมลที่ใช้สมัครเพื่อส่งคำขอรีเซ็ตรหัสผ่าน</DialogDescription>
                </DialogHeader>
                {resetSent ? (
                  <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                    รับคำขอแล้ว กรุณาติดต่อผู้ดูแลระบบเพื่อรับรหัสผ่านใหม่
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">อีเมล</Label>
                    <Input id="reset-email" type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} />
                  </div>
                )}
                <DialogFooter>
                  {!resetSent && <Button onClick={reset}><KeyRound />ส่งคำขอรีเซ็ตรหัสผ่าน</Button>}
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

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ยังไม่มีบัญชี? <Link href="/register" className="font-bold text-primary hover:underline">สมัครใช้งานฟรี</Link>
      </p>
    </>
  );
}
