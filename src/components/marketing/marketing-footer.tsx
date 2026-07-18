import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

const footerLinks = [
  { title: "ผลิตภัณฑ์", links: [["ฟีเจอร์", "/features"], ["POS ร้านอาหาร", "/restaurant-pos"], ["QR Ordering", "/qr-ordering"], ["จอครัว", "/kitchen-display"]] },
  { title: "ข้อมูล", links: [["ราคา", "/pricing"], ["เปรียบเทียบแผน", "/plan-comparison"], ["คำถามที่พบบ่อย", "/faq"], ["ติดต่อเรา", "/contact"]] },
  { title: "กฎหมาย", links: [["นโยบายความเป็นส่วนตัว", "/privacy"], ["ข้อกำหนดการใช้งาน", "/terms"], ["เข้าสู่ระบบ", "/login"], ["สมัครใช้งาน", "/register"]] },
];

export function MarketingFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_2fr] lg:px-8">
        <div><BrandLogo /><p className="mt-4 max-w-sm text-sm text-muted-foreground">ระบบบริหารร้านอาหารที่ทำให้หน้าร้าน ครัว และข้อมูลยอดขายทำงานเป็นทีมเดียวกัน</p></div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {footerLinks.map((group) => <div key={group.title}><h2 className="mb-3 text-sm font-bold">{group.title}</h2><ul>{group.links.map(([label, href]) => <li key={href}><Link href={href} className="inline-flex min-h-11 min-w-11 items-center text-sm text-muted-foreground hover:text-primary">{label}</Link></li>)}</ul></div>)}
        </div>
      </div>
      <div className="border-t px-4 py-5 text-center text-xs text-muted-foreground">© 2026 Flukex POS — สงวนลิขสิทธิ์</div>
    </footer>
  );
}
