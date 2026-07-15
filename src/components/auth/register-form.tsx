"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Store, UsersRound } from "lucide-react";
import { useState } from "react";
import { registrationSchema } from "@/domain/schemas";
import type { PlanId } from "@/domain/types";
import { SUBSCRIPTION_PLANS } from "@/config/plans";
import { services } from "@/services/container";
import { useDemoStore } from "@/store/demo-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { usePlatformStore } from "@/store/platform-store";

export function RegisterForm() {
  const router = useRouter();
  const { establishSession } = useAuthSession();
  const registerMember = usePlatformStore((state) => state.registerMember);
  const selectPlan = useDemoStore((state) => state.selectPlan);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<PlanId>("free");
  const [form, setForm] = useState({ name: "", email: "", password: "", restaurantName: "" });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const createAccount = async (event: React.FormEvent) => { event.preventDefault(); setError(""); const parsed = registrationSchema.safeParse(form); if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "กรุณาตรวจสอบข้อมูล"); return; } setLoading(true); try { const session = await services.auth.register(parsed.data); establishSession(session); registerMember({ tenantId: session.tenantId, businessName: parsed.data.restaurantName, ownerName: parsed.data.name, ownerEmail: parsed.data.email }); setStep(2); } catch(caught) { setError(caught instanceof Error ? caught.message : "สมัครไม่สำเร็จ"); } finally { setLoading(false); } };
  const finish = () => { selectPlan(plan); router.push("/dashboard?welcome=1"); };
  return <div><div className="mb-7 flex items-center gap-3"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-white">{step > 1 ? <Check className="size-4"/> : 1}</span><span className="text-sm font-semibold">ข้อมูลร้าน</span></div><span className="h-px flex-1 bg-border"/><div className="flex items-center gap-2"><span className={cn("grid size-8 place-items-center rounded-full text-xs font-bold", step === 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>2</span><span className="text-sm font-semibold">เลือกแผน</span></div></div>{step === 1 ? <form onSubmit={createAccount} className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="register-name">ชื่อผู้ดูแล</Label><Input id="register-name" value={form.name} onChange={(e)=>update("name",e.target.value)} autoComplete="name" required/></div><div className="space-y-2"><Label htmlFor="register-restaurant">ชื่อร้านอาหาร</Label><Input id="register-restaurant" value={form.restaurantName} onChange={(e)=>update("restaurantName",e.target.value)} required/></div></div><div className="space-y-2"><Label htmlFor="register-email">อีเมล</Label><Input id="register-email" type="email" value={form.email} onChange={(e)=>update("email",e.target.value)} autoComplete="email" required/></div><div className="space-y-2"><Label htmlFor="register-password">รหัสผ่านเดโม</Label><Input id="register-password" type="password" value={form.password} onChange={(e)=>update("password",e.target.value)} autoComplete="new-password" required/><p className="text-xs text-muted-foreground">อย่างน้อย 6 ตัวอักษร • อย่าใช้รหัสผ่านจริง</p></div>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}<Button className="w-full" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="animate-spin"/>กำลังสร้างร้าน...</> : <><Store/>สร้างร้านและดำเนินการต่อ</>}</Button><p className="text-center text-sm text-muted-foreground">มีบัญชีแล้ว? <Link href="/login" className="font-bold text-primary">เข้าสู่ระบบ</Link></p></form> : <div><div className="mb-5 rounded-lg bg-green-50 p-4 text-sm text-green-800"><strong>สร้างร้านจำลองแล้ว</strong><p className="mt-1">เลือกแผนเริ่มต้นเพื่อกำหนด entitlement ของเดโม</p></div><div className="grid gap-3">{Object.values(SUBSCRIPTION_PLANS).map((item) => <button type="button" key={item.id} onClick={() => setPlan(item.id)} className={cn("flex min-h-20 items-center justify-between gap-4 rounded-xl border p-4 text-left", plan === item.id && "border-primary bg-secondary/40 ring-2 ring-primary/15")}><div><div className="flex items-center gap-2"><span className="font-bold">{item.name}</span>{item.highlighted && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">แนะนำ</span>}</div><p className="mt-1 text-xs text-muted-foreground">{item.description}</p></div><span className="shrink-0 text-sm font-bold">{item.priceMonthly === 0 ? "ฟรี" : `${formatCurrency(item.priceMonthly).replace(".00","")}/ด.`}</span></button>)}</div><div className="mt-6 grid gap-2 sm:grid-cols-2"><Button variant="outline" onClick={() => setStep(1)}>ย้อนกลับ</Button><Button onClick={finish}><UsersRound/>เริ่ม Onboarding</Button></div></div>}</div>;
}
