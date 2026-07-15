import Link from "next/link";
import { ArrowRight, BarChart3, BellRing, ChefHat, CheckCircle2, Clock3, QrCode, ShieldCheck, Smartphone, Store, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { SectionHeading } from "@/components/marketing/section-heading";
import { PricingSection } from "@/components/marketing/pricing-section";
import { CtaBanner } from "@/components/marketing/cta-banner";

const features = [
  { icon: Store, title: "POS หน้าร้าน", description: "รับออเดอร์ คิดส่วนลด VAT และ Service charge จากหน้าจอเดียว" },
  { icon: QrCode, title: "QR Ordering", description: "ลูกค้าสแกน สั่งอาหาร และติดตามสถานะจากมือถือได้ทันที" },
  { icon: ChefHat, title: "จอครัวและบาร์", description: "แยกงานตาม Station ลดออเดอร์ตกหล่นและสื่อสารผิดพลาด" },
  { icon: BarChart3, title: "รายงานยอดขาย", description: "เห็นยอดขาย เมนูขายดี และช่วงเวลาพีคได้ง่าย ๆ" },
  { icon: BellRing, title: "แจ้งเตือนทันที", description: "ออเดอร์ใหม่ เรียกพนักงาน และขอเช็กบิล พร้อมเสียงแจ้งเตือน" },
  { icon: ShieldCheck, title: "สิทธิ์พนักงาน", description: "แยกบทบาทเจ้าของร้าน แคชเชียร์ ครัว และบาร์อย่างชัดเจน" },
];

export default function HomePage() {
  return (
    <MarketingShell>
      <section className="mesh-bg relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="grid-dots absolute inset-0 opacity-45 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Badge variant="outline" className="bg-white/75"><span className="size-2 rounded-full bg-success" /> เดโมพร้อมทดลอง • ไม่ต้องใช้บัตรเครดิต</Badge>
            <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.18] tracking-tight sm:text-5xl lg:text-6xl">ระบบ POS ร้านอาหาร พร้อมสั่งผ่าน <span className="text-primary">QR</span> จอครัวเรียลไทม์ และรายงานยอดขาย</h1>
            <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">ให้หน้าร้าน ครัว และเจ้าของร้านเห็นข้อมูลชุดเดียวกัน ลดความผิดพลาด บริการเร็วขึ้น และเริ่มใช้งานได้ฟรี</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button size="lg" asChild><Link href="/register">เริ่มใช้ฟรี <ArrowRight /></Link></Button><Button size="lg" variant="outline" asChild><Link href="/login">ลองเดโม</Link></Button><Button size="lg" variant="ghost" asChild><Link href="/pricing">ดูราคา</Link></Button></div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">{["ติดตั้งง่าย", "รองรับมือถือ", "รีเซ็ตเดโมได้"].map((label) => <span key={label} className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success"/>{label}</span>)}</div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section className="border-y bg-card px-4 py-6 sm:px-6"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-semibold text-muted-foreground"><span>ออกแบบเพื่อร้านอาหารไทย</span><span className="flex items-center gap-2"><Smartphone className="size-4"/>Mobile-first</span><span className="flex items-center gap-2"><Clock3 className="size-4"/>เริ่มใช้ในไม่กี่นาที</span><span className="flex items-center gap-2"><Utensils className="size-4"/>ครบ Front → Kitchen</span></div></section>

      <section className="px-4 py-20 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="ครบในระบบเดียว" title="ทุกจุดในร้านเชื่อมถึงกัน" description="ออกแบบ workflow ให้ทีมทำงานเร็วขึ้น โดยไม่เพิ่มความซับซ้อนให้พนักงาน"/><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{features.map((feature) => <Card key={feature.title} className="p-6 transition-transform duration-200 hover:-translate-y-1"><div className="mb-5 grid size-12 place-items-center rounded-xl bg-secondary text-primary"><feature.icon className="size-6"/></div><h3 className="text-lg font-bold">{feature.title}</h3><p className="mt-2 text-sm text-muted-foreground">{feature.description}</p></Card>)}</div></div></section>

      <section className="bg-[#4a0d0d] px-4 py-20 text-white sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2"><div><Badge className="bg-white/10 text-red-100">Workflow ที่ชัดเจน</Badge><h2 className="mt-5 text-balance text-3xl font-bold sm:text-4xl">ออเดอร์จากโต๊ะ ส่งตรงถึง Station ที่ถูกต้อง</h2><p className="mt-4 text-red-100/75">อาหารไปจอครัว เครื่องดื่มไปจอบาร์ พร้อมสถานะ WAITING → PREPARING → READY → SERVED ที่ทุกคนมองเห็นตรงกัน</p><Button variant="accent" size="lg" className="mt-7" asChild><Link href="/kitchen-display">ดูระบบจอครัว <ArrowRight /></Link></Button></div><div className="grid gap-4 sm:grid-cols-2">{[{ title: "1. ลูกค้าสั่ง", text: "สแกน QR หรือพนักงานรับผ่าน POS", icon: QrCode }, { title: "2. แยก Station", text: "อาหารเข้าครัว เครื่องดื่มเข้าบาร์", icon: ChefHat }, { title: "3. อัปเดตสถานะ", text: "ทุกหน้าจอเห็นความคืบหน้า", icon: BellRing }, { title: "4. ปิดบิล", text: "คำนวณยอดและบันทึกรายงาน", icon: BarChart3 }].map((item) => <div key={item.title} className="rounded-xl border border-white/10 bg-white/8 p-5"><item.icon className="size-6 text-red-300"/><h3 className="mt-4 font-bold">{item.title}</h3><p className="mt-1 text-sm text-red-100/65">{item.text}</p></div>)}</div></div></section>

      <section className="px-4 py-20 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="ราคาโปร่งใส" title="เริ่มฟรี แล้วโตไปพร้อมร้าน" description="เดโมไม่มีการชำระเงินจริง เลือกแผนเพื่อทดลอง entitlement และ limit ของระบบ"/><div className="mt-12"><PricingSection compact /></div></div></section>
      <CtaBanner />
    </MarketingShell>
  );
}
