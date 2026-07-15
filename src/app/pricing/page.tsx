import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PricingSection } from "@/components/marketing/pricing-section";
import { SectionHeading } from "@/components/marketing/section-heading";
export const metadata: Metadata = { title: "ราคาและแพ็กเกจ", description: "แพ็กเกจระบบ POS ร้านอาหาร Free, Starter 990 บาท และ Professional 1,990 บาทต่อเดือน" };
export default function PricingPage() { return <MarketingShell><section className="mesh-bg px-4 py-20 sm:px-6"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="แพ็กเกจ" title="เลือกแผนที่พอดีกับร้าน" description="ราคาตรงไปตรงมา เดโมนี้ไม่มีการชำระเงินจริง และคุณเปลี่ยนแผนทดลองได้ทุกเมื่อ"/><div className="mt-12"><PricingSection/></div><p className="mt-8 text-center text-sm text-muted-foreground">ราคายังไม่รวมภาษีมูลค่าเพิ่ม • ยกเลิกหรือเปลี่ยนแผนได้ • ไม่มีการตัดเงินจริงในเดโม</p></div></section></MarketingShell>; }
