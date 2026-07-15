"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChefHat, Eye, EyeOff, KeyRound, LoaderCircle, Monitor, UserRound } from "lucide-react";
import { DEMO_ACCOUNTS } from "@/data/mock-data";
import { loginSchema } from "@/domain/schemas";
import { services } from "@/services/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const accountIcons = { OWNER: UserRound, CASHIER: Monitor, KITCHEN: ChefHat };

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@demo.com");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง"); return; }
    setLoading(true);
    try { const session = await services.auth.login(parsed.data); router.push(session.role === "KITCHEN" ? "/kitchen" : "/dashboard"); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "เข้าสู่ระบบไม่สำเร็จ"); setLoading(false); }
  };
  const reset = async () => { try { await services.auth.resetPassword(resetEmail); setResetSent(true); } catch (caught) { setError(caught instanceof Error ? caught.message : "ไม่สำเร็จ"); } };
  return <><form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="login-email">อีเมล</Label><Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required/></div><div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="login-password">รหัสผ่าน</Label><Dialog><DialogTrigger asChild><button type="button" className="rounded text-xs font-semibold text-primary hover:underline">ลืมรหัสผ่าน?</button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>รีเซ็ตรหัสผ่านแบบเดโม</DialogTitle><DialogDescription>ระบบจะแสดงสถานะสำเร็จเท่านั้น ไม่มีอีเมลถูกส่งจริง</DialogDescription></DialogHeader>{resetSent ? <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">บันทึกคำขอจำลองแล้ว กรุณาใช้รหัส demo1234 ต่อได้เลย</div> : <div className="space-y-2"><Label htmlFor="reset-email">อีเมล</Label><Input id="reset-email" type="email" value={resetEmail} onChange={(e)=>setResetEmail(e.target.value)} /></div>}<DialogFooter>{!resetSent && <Button onClick={reset}><KeyRound/>จำลองการส่งลิงก์</Button>}</DialogFooter></DialogContent></Dialog></div><div className="relative"><Input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="pr-12"/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} className="absolute right-1 top-1 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted">{showPassword ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}</button></div></div>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}<Button className="w-full" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="animate-spin"/>กำลังเข้าสู่ระบบ...</> : "เข้าสู่ระบบ"}</Button></form><div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border"/>บัญชีเดโมพร้อมใช้<span className="h-px flex-1 bg-border"/></div><div className="grid gap-2 sm:grid-cols-3">{DEMO_ACCOUNTS.map((account) => { const Icon = accountIcons[account.role]; return <button key={account.email} type="button" onClick={() => { setEmail(account.email); setPassword(account.password); }} className="min-h-20 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary/40"><Icon className="size-4 text-primary"/><span className="mt-2 block text-xs font-bold">{account.role}</span><span className="block truncate text-[11px] text-muted-foreground">{account.email}</span></button>; })}</div><p className="mt-6 text-center text-sm text-muted-foreground">ยังไม่มีบัญชี? <Link href="/register" className="font-bold text-primary hover:underline">สมัครใช้งานฟรี</Link></p></>;
}
