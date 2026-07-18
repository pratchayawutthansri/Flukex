import type { Metadata } from "next";
import { BarChart3, Bell, Boxes, ChefHat, ClipboardList, QrCode, ReceiptText, ShieldCheck, Store } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "ฟีเจอร์ระบบ POS ร้านอาหาร", description: "สำรวจฟีเจอร์ POS, QR Ordering, จอครัว, รายงานยอดขาย และระบบจัดการร้านอาหารของ Flukex POS" };
const groups = [
  { icon: Store, title: "ขายหน้าร้าน", items: ["เลือกโต๊ะและค้นหาเมนู", "ส่วนลด VAT Service charge", "เงินสด QR และบัตร"] },
  { icon: QrCode, title: "QR Ordering", items: ["เมนูบนมือถือ", "Modifier และหมายเหตุ", "เรียกพนักงานและขอเช็กบิล"] },
  { icon: ChefHat, title: "Kitchen & Bar", items: ["แยกออเดอร์ตาม Station", "จับเวลารอ", "สถานะพร้อมเสิร์ฟ"] },
  { icon: Boxes, title: "จัดการเมนู", items: ["หมวดหมู่และสินค้า", "สถานะหมด/พร้อมขาย", "รูป ราคา และตัวเลือกเพิ่มเติม"] },
  { icon: ClipboardList, title: "จัดการออเดอร์", items: ["รายการล่าสุด", "ประวัติสถานะ", "ค้นหาและกรอง"] },
  { icon: BarChart3, title: "รายงาน", items: ["รายวัน/รายเดือน", "เมนูและหมวดขายดี", "ช่วงพีคและช่องทางชำระ"] },
  { icon: ShieldCheck, title: "พนักงานและสิทธิ์", items: ["Owner, Cashier, Kitchen", "ขอบเขตตามสาขา", "พร้อมต่อยอด RBAC"] },
  { icon: Bell, title: "การแจ้งเตือน", items: ["Toast และเสียง", "Notification log", "Discord Webhook แบบเข้ารหัส", "เตรียม LINE/Telegram adapter"] },
  { icon: ReceiptText, title: "สมาชิก", items: ["Entitlement กลาง", "Usage เทียบ Limit", "จัดการแพ็กเกจ"] },
];
export default function FeaturesPage() { return <MarketingShell><section className="mesh-bg px-4 py-20 sm:px-6"><SectionHeading eyebrow="ฟีเจอร์" title="เครื่องมือครบ แต่พนักงานเรียนรู้ได้เร็ว" description="แต่ละหน้าจอถูกออกแบบให้เหมาะกับบริบทการใช้งาน ตั้งแต่ลูกค้าในมือถือถึงเชฟที่มองจากระยะไกล"/></section><section className="px-4 py-16 sm:px-6"><div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-3">{groups.map((group) => <Card key={group.title} className="p-6"><div className="grid size-12 place-items-center rounded-xl bg-secondary text-primary"><group.icon/></div><h2 className="mt-5 text-xl font-bold">{group.title}</h2><ul className="mt-4 space-y-2 text-sm text-muted-foreground">{group.items.map((item) => <li key={item}>• {item}</li>)}</ul></Card>)}</div></section><CtaBanner/></MarketingShell>; }
