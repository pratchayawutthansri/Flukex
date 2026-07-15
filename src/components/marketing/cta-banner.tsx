import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return <section className="px-4 py-16 sm:px-6"><div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#4a0d0d] px-6 py-12 text-white shadow-2xl sm:px-12 sm:py-16"><div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]"><div><p className="text-sm font-bold text-red-200">พร้อมให้ร้านทำงานลื่นขึ้นหรือยัง?</p><h2 className="mt-3 text-balance text-3xl font-bold sm:text-4xl">เริ่มจากเดโมวันนี้ ใช้เวลาไม่ถึง 3 นาที</h2><p className="mt-4 max-w-2xl text-red-100/80">ไม่ต้องใส่บัตรเครดิต ไม่มีค่าใช้จ่าย และรีเซ็ตข้อมูลตัวอย่างได้ทุกเมื่อ</p></div><div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><Button variant="accent" size="lg" asChild><Link href="/register">เริ่มใช้ฟรี <ArrowRight /></Link></Button><Button size="lg" className="border border-white/25 bg-white/10 hover:bg-white/20" asChild><Link href="/login"><PlayCircle /> ลองเดโม</Link></Button></div></div></div></section>;
}
