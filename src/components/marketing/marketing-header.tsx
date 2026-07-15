"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/features", label: "ฟีเจอร์" },
  { href: "/restaurant-pos", label: "POS ร้านอาหาร" },
  { href: "/qr-ordering", label: "QR Ordering" },
  { href: "/pricing", label: "ราคา" },
  { href: "/faq", label: "คำถามที่พบบ่อย" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b bg-card/92 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLogo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="เมนูหลัก">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={cn("rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", pathname === link.href && "bg-secondary text-primary")}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" asChild><Link href="/login">เข้าสู่ระบบ</Link></Button>
          <Button asChild><Link href="/register">เริ่มใช้ฟรี</Link></Button>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <nav id="mobile-menu" className="border-t bg-card p-4 lg:hidden" aria-label="เมนูมือถือ">
          <div className="mx-auto grid max-w-7xl gap-1">
            {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="min-h-11 rounded-lg px-3 py-2.5 font-medium hover:bg-muted">{link.label}</Link>)}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-4"><Button variant="outline" asChild><Link href="/login">เข้าสู่ระบบ</Link></Button><Button asChild><Link href="/register">เริ่มใช้ฟรี</Link></Button></div>
          </div>
        </nav>
      )}
    </header>
  );
}
