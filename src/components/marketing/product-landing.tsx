import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MarketingShell } from "./marketing-shell";
import { CtaBanner } from "./cta-banner";

export interface ProductLandingProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  bullets: string[];
  workflow: { title: string; description: string }[];
  demoHref: string;
  demoLabel: string;
  darkPreview?: boolean;
}

export function ProductLanding({ eyebrow, title, description, icon: Icon, bullets, workflow, demoHref, demoLabel, darkPreview }: ProductLandingProps) {
  return <MarketingShell><section className="mesh-bg px-4 py-20 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2"><div><Badge>{eyebrow}</Badge><h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1><p className="mt-5 max-w-xl text-lg text-muted-foreground">{description}</p><ul className="mt-7 grid gap-3 sm:grid-cols-2">{bullets.map((item) => <li key={item} className="flex gap-2 text-sm font-medium"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success"/>{item}</li>)}</ul><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button size="lg" asChild><Link href={demoHref}>{demoLabel}<ArrowRight/></Link></Button><Button size="lg" variant="outline" asChild><Link href="/register">เริ่มใช้ฟรี</Link></Button></div></div><div className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl ${darkPreview ? "dark bg-[#160c0c] text-white" : "bg-card"}`}><div className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/20 blur-3xl"/><div className="relative flex min-h-[380px] flex-col"><div className="flex items-center justify-between border-b pb-4"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Icon/></span><div><p className="font-bold">สวัสดี บิสโทร</p><p className="text-xs text-muted-foreground">สาขาสุขุมวิท</p></div></div><Badge variant="success">ออนไลน์</Badge></div><div className="grid flex-1 place-items-center py-8"><Icon className="size-28 text-primary/25"/><div className="text-center"><p className="text-xl font-bold">{eyebrow}</p><p className="mt-2 max-w-sm text-sm text-muted-foreground">หน้าจอสาธิตพร้อมข้อมูลตัวอย่างและ interaction จริง</p></div></div><Button asChild><Link href={demoHref}>เปิดหน้าจอเดโม</Link></Button></div></div></div></section><section className="px-4 py-20 sm:px-6"><div className="mx-auto max-w-6xl"><div className="text-center"><p className="text-sm font-bold text-primary">ขั้นตอนการทำงาน</p><h2 className="mt-3 text-3xl font-bold">เข้าใจง่ายตั้งแต่ครั้งแรก</h2></div><div className="mt-12 grid gap-5 md:grid-cols-3">{workflow.map((step, index) => <Card key={step.title} className="p-6"><span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">{index + 1}</span><h3 className="mt-5 text-lg font-bold">{step.title}</h3><p className="mt-2 text-sm text-muted-foreground">{step.description}</p></Card>)}</div></div></section><CtaBanner/></MarketingShell>;
}
