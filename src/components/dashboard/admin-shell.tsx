"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Bell,
  Boxes,
  Building2,
  ChefHat,
  ClipboardList,
  CreditCard,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plug,
  QrCode,
  ReceiptText,
  RotateCcw,
  Settings,
  Store,
  Table2,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { RoleGuard } from "@/components/auth/role-guard";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { canAccessRoute, getRoleInitials, ROLE_DEFINITIONS } from "@/config/access-control";
import type { SessionRole } from "@/domain/types";
import { cn, formatTime } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";

const nav = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/restaurant", label: "ข้อมูลร้าน", icon: Store, exact: false },
  { href: "/dashboard/branches", label: "สาขา", icon: Building2, exact: false },
  { href: "/dashboard/employees", label: "พนักงาน", icon: Users, exact: false },
  { href: "/dashboard/categories", label: "หมวดหมู่", icon: Grid2X2, exact: false },
  { href: "/dashboard/products", label: "สินค้า", icon: Package, exact: false },
  { href: "/dashboard/tables", label: "โต๊ะและ QR", icon: Table2, exact: false },
  { href: "/dashboard/orders", label: "ออเดอร์", icon: ClipboardList, exact: false },
  { href: "/dashboard/reports", label: "รายงาน", icon: ReceiptText, exact: false },
  { href: "/dashboard/credits", label: "เครดิต Flukex", icon: WalletCards, exact: false },
  { href: "/dashboard/subscription", label: "แพ็กเกจ", icon: CreditCard, exact: false },
  { href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings, exact: false },
  { href: "/dashboard/integrations", label: "Integration", icon: Plug, exact: false },
] as const;

const quick = [
  { href: "/pos", label: "เปิด POS", icon: Boxes, public: false },
  { href: "/kitchen", label: "จอครัว", icon: ChefHat, public: false },
  { href: "/order/demo-restaurant/table/table-01", label: "QR เมนู", icon: QrCode, public: true },
] as const;

type NavigationItem = (typeof nav)[number];

function NavLink({ item, onClick }: { item: NavigationItem; onClick?: () => void }) {
  const pathname = usePathname();
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active && "bg-secondary text-primary",
      )}
    >
      <item.icon className="size-4.5" aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

function Sidebar({ role, onNavigate }: { role: SessionRole; onNavigate?: () => void }) {
  const [resetOpen, setResetOpen] = useState(false);
  const resetDemo = useDemoStore((state) => state.resetDemo);
  const visibleNav = nav.filter((item) => canAccessRoute(role, item.href));
  const visibleQuick = quick.filter((item) => item.public || canAccessRoute(role, item.href));

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-16 items-center border-b px-5"><BrandLogo /></div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">จัดการร้าน</p>
        <nav className="space-y-1" aria-label="เมนูจัดการร้าน">
          {visibleNav.map((item) => <NavLink key={item.href} item={item} onClick={onNavigate} />)}
        </nav>
        <p className="mb-2 mt-6 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">หน้าจอปฏิบัติงาน</p>
        <div className="space-y-1">
          {visibleQuick.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <item.icon className="size-4.5" aria-hidden="true" />{item.label}
            </Link>
          ))}
        </div>
      </div>

      {role === "OWNER" && (
        <div className="border-t p-3">
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-red-950"
          >
            <RotateCcw className="size-4" aria-hidden="true" />รีเซ็ตข้อมูลเดโม
          </button>
        </div>
      )}

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รีเซ็ตข้อมูลร้านทั้งหมด?</DialogTitle>
            <DialogDescription>เมนู โต๊ะ ออเดอร์ การแจ้งเตือน และแพ็กเกจจะกลับเป็นค่าเริ่มต้น การดำเนินการนี้ย้อนกลับไม่ได้</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={() => { resetDemo(); setResetOpen(false); location.reload(); }}><RotateCcw />รีเซ็ตเดโม</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminShellContent({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { session, signOut } = useAuthSession();
  const notifications = useDemoStore((state) => state.notifications);
  const markRead = useDemoStore((state) => state.markNotificationsRead);
  const unread = notifications.filter((item) => !item.read).length;

  if (!session) return null;
  const role = ROLE_DEFINITIONS[session.role];
  const canOpenSettings = canAccessRoute(session.role, "/dashboard/settings");
  const mobileItems = [
    { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
    { href: "/pos", label: "POS", icon: Boxes },
    { href: "/dashboard/orders", label: "ออเดอร์", icon: ClipboardList },
    { href: session.role === "OWNER" ? "/dashboard/credits" : "/dashboard/products", label: session.role === "OWNER" ? "เครดิต" : "เมนู", icon: session.role === "OWNER" ? WalletCards : Package },
    { href: session.role === "OWNER" ? "/dashboard/settings" : "/dashboard/reports", label: session.role === "OWNER" ? "ตั้งค่า" : "รายงาน", icon: session.role === "OWNER" ? Settings : ReceiptText },
  ].filter((item) => canAccessRoute(session.role, item.href));

  const logout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r lg:block"><Sidebar role={session.role} /></aside>
      {mobileOpen && (
        <>
          <button className="fixed inset-0 z-40 cursor-pointer bg-black/50 lg:hidden" aria-label="ปิดเมนู" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-[min(86vw,320px)] border-r lg:hidden">
            <div className="absolute right-2 top-2"><Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="ปิดเมนู"><X /></Button></div>
            <Sidebar role={session.role} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur-lg lg:left-64 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="เปิดเมนู"><Menu /></Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">สวัสดี {session.name.replace(/\s*\([^)]*\)\s*$/, "")}</p>
            <p className="truncate text-[11px] text-muted-foreground">สวัสดี บิสโทร · สาขาสุขุมวิท</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex">{role.label}</Badge>
          <DropdownMenu.Root onOpenChange={(open) => open && markRead()}>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon" aria-label={`การแจ้งเตือน ${unread} รายการที่ยังไม่อ่าน`} className="relative">
                <Bell />
                {unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">{unread}</span>}
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={8} className="z-50 w-[min(92vw,360px)] rounded-xl border bg-card p-2 shadow-2xl">
                <div className="px-3 py-2"><p className="font-bold">การแจ้งเตือน</p><p className="text-xs text-muted-foreground">รายการงานล่าสุดของร้าน</p></div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length ? notifications.slice(0, 8).map((item) => (
                    <DropdownMenu.Item key={item.id} className="rounded-lg p-3 outline-none hover:bg-muted focus:bg-muted">
                      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.message}</p></div><span className="shrink-0 text-[10px] text-muted-foreground">{formatTime(item.createdAt)}</span></div>
                    </DropdownMenu.Item>
                  )) : <p className="p-5 text-center text-sm text-muted-foreground">ยังไม่มีการแจ้งเตือน</p>}
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="outline" className="px-2 sm:px-3">
                <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-white">{getRoleInitials(session.name)}</span>
                <span className="hidden max-w-32 truncate text-sm sm:inline">{role.shortLabel}</span>
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={8} className="z-50 w-56 rounded-lg border bg-card p-1.5 shadow-xl">
                <div className="px-3 py-2"><p className="truncate text-sm font-bold">{session.name}</p><p className="truncate text-xs text-muted-foreground">{session.email}</p></div>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                {canOpenSettings && <DropdownMenu.Item asChild><Link href="/dashboard/settings" className="block min-h-10 rounded-md px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted">ตั้งค่าบัญชี</Link></DropdownMenu.Item>}
                <DropdownMenu.Item onSelect={logout} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive outline-none hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-950 dark:focus:bg-red-950"><LogOut className="size-4" />ออกจากระบบ</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>

      <main id="main-content" className="min-h-dvh px-4 pb-24 pt-20 sm:px-6 lg:ml-64 lg:pb-8 lg:pt-20 xl:px-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid border-t bg-card/98 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgb(0_0_0/0.08)] lg:hidden" style={{ gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))` }} aria-label="เมนูมือถือ">
        {mobileItems.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", active && "text-primary")}>
              <item.icon className="size-5" aria-hidden="true" /><span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <RoleGuard><AdminShellContent>{children}</AdminShellContent></RoleGuard>;
}
