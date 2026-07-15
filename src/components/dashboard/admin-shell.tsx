"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Boxes, Building2, ChefHat, ClipboardList, CreditCard, Grid2X2, LayoutDashboard, Menu, Package, Plug, QrCode, ReceiptText, RotateCcw, Settings, Store, Table2, Users, X } from "lucide-react";
import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn, formatTime } from "@/lib/utils";
import { services } from "@/services/container";
import { useDemoStore } from "@/store/demo-store";

const nav = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/restaurant", label: "ข้อมูลร้าน", icon: Store },
  { href: "/dashboard/branches", label: "สาขา", icon: Building2 },
  { href: "/dashboard/employees", label: "พนักงาน", icon: Users },
  { href: "/dashboard/categories", label: "หมวดหมู่", icon: Grid2X2 },
  { href: "/dashboard/products", label: "สินค้า", icon: Package },
  { href: "/dashboard/tables", label: "โต๊ะและ QR", icon: Table2 },
  { href: "/dashboard/orders", label: "ออเดอร์", icon: ClipboardList },
  { href: "/dashboard/reports", label: "รายงาน", icon: ReceiptText },
  { href: "/dashboard/subscription", label: "แพ็กเกจ", icon: CreditCard },
  { href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings },
  { href: "/dashboard/integrations", label: "Integration", icon: Plug },
];
const quick = [{ href: "/pos", label: "เปิด POS", icon: Boxes }, { href: "/kitchen", label: "จอครัว", icon: ChefHat }, { href: "/order/demo-restaurant/table/table-01", label: "QR เมนู", icon: QrCode }];

function NavLink({ item, onClick }: { item: (typeof nav)[number]; onClick?: () => void }) {
  const pathname = usePathname();
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  return <Link href={item.href} onClick={onClick} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", active && "bg-secondary text-primary")}><item.icon className="size-4.5"/><span>{item.label}</span></Link>;
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [resetOpen, setResetOpen] = useState(false);
  const resetDemo = useDemoStore((state) => state.resetDemo);
  return <div className="flex h-full flex-col bg-card"><div className="flex h-16 items-center border-b px-5"><BrandLogo/></div><div className="no-scrollbar flex-1 overflow-y-auto px-3 py-4"><p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">จัดการร้าน</p><nav className="space-y-1" aria-label="เมนูผู้ดูแล">{nav.map((item) => <NavLink key={item.href} item={item} onClick={onNavigate}/>)}</nav><p className="mb-2 mt-6 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">หน้าจอปฏิบัติงาน</p><div className="space-y-1">{quick.map((item) => <Link key={item.href} href={item.href} onClick={onNavigate} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"><item.icon className="size-4.5"/>{item.label}</Link>)}</div></div><div className="border-t p-3"><button type="button" onClick={() => setResetOpen(true)} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-destructive dark:hover:bg-red-950"><RotateCcw className="size-4"/>รีเซ็ตข้อมูลเดโม</button></div><Dialog open={resetOpen} onOpenChange={setResetOpen}><DialogContent><DialogHeader><DialogTitle>รีเซ็ตข้อมูลทั้งหมด?</DialogTitle><DialogDescription>เมนู โต๊ะ ออเดอร์ การแจ้งเตือน และแพ็กเกจจะกลับเป็นค่าเริ่มต้น การดำเนินการนี้ย้อนกลับไม่ได้</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setResetOpen(false)}>ยกเลิก</Button><Button variant="destructive" onClick={() => { resetDemo(); setResetOpen(false); location.reload(); }}><RotateCcw/>รีเซ็ตเดโม</Button></DialogFooter></DialogContent></Dialog></div>;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const notifications = useDemoStore((state) => state.notifications);
  const markRead = useDemoStore((state) => state.markNotificationsRead);
  const unread = notifications.filter((item) => !item.read).length;
  const logout = async () => { await services.auth.logout(); router.push("/login"); };
  return <div className="min-h-dvh bg-background"><aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r lg:block"><Sidebar/></aside>{mobileOpen && <><button className="fixed inset-0 z-40 bg-black/50 lg:hidden" aria-label="ปิดเมนู" onClick={() => setMobileOpen(false)}/><aside className="fixed inset-y-0 left-0 z-50 w-[min(86vw,320px)] border-r lg:hidden"><div className="absolute right-2 top-2"><Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="ปิดเมนู"><X/></Button></div><Sidebar onNavigate={() => setMobileOpen(false)}/></aside></>}<header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur-lg lg:left-64 lg:px-6"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="เปิดเมนู"><Menu/></Button><div><p className="text-sm font-bold">สวัสดี บิสโทร</p><p className="text-[11px] text-muted-foreground">สาขาสุขุมวิท • Demo mode</p></div></div><div className="flex items-center gap-2"><Badge variant="outline" className="hidden sm:flex"><span className="size-2 rounded-full bg-success"/>ระบบปกติ</Badge><DropdownMenu.Root onOpenChange={(open) => open && markRead()}><DropdownMenu.Trigger asChild><Button variant="ghost" size="icon" aria-label={`การแจ้งเตือน ${unread} รายการที่ยังไม่อ่าน`} className="relative"><Bell/>{unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">{unread}</span>}</Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} className="z-50 w-[min(92vw,360px)] rounded-xl border bg-card p-2 shadow-2xl"><div className="px-3 py-2"><p className="font-bold">การแจ้งเตือน</p><p className="text-xs text-muted-foreground">บันทึกใน Local Storage</p></div><div className="max-h-80 overflow-y-auto">{notifications.length ? notifications.slice(0,8).map((item) => <DropdownMenu.Item key={item.id} className="rounded-lg p-3 outline-none hover:bg-muted"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.message}</p></div><span className="shrink-0 text-[10px] text-muted-foreground">{formatTime(item.createdAt)}</span></div></DropdownMenu.Item>) : <p className="p-5 text-center text-sm text-muted-foreground">ยังไม่มีการแจ้งเตือน</p>}</div></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root><DropdownMenu.Root><DropdownMenu.Trigger asChild><Button variant="outline" className="px-2 sm:px-3"><span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-white">ม</span><span className="hidden text-sm sm:inline">คุณมินตรา</span></Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} className="z-50 w-48 rounded-lg border bg-card p-1.5 shadow-xl"><DropdownMenu.Item asChild><Link href="/dashboard/settings" className="block min-h-10 rounded-md px-3 py-2 text-sm outline-none hover:bg-muted">ตั้งค่าบัญชี</Link></DropdownMenu.Item><DropdownMenu.Separator className="my-1 h-px bg-border"/><DropdownMenu.Item onSelect={logout} className="min-h-10 rounded-md px-3 py-2 text-sm text-destructive outline-none hover:bg-red-50">ออกจากระบบ</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root></div></header><main id="main-content" className="min-h-dvh px-4 pb-24 pt-20 sm:px-6 lg:ml-64 lg:pb-8 lg:pt-20 xl:px-8">{children}</main><nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card/98 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgb(0_0_0/0.08)] lg:hidden" aria-label="เมนูมือถือ">{[{href:"/dashboard",label:"ภาพรวม",icon:LayoutDashboard},{href:"/pos",label:"POS",icon:Boxes},{href:"/dashboard/orders",label:"ออเดอร์",icon:ClipboardList},{href:"/dashboard/products",label:"เมนู",icon:Package},{href:"/dashboard/settings",label:"ตั้งค่า",icon:Settings}].map((item) => <Link key={item.href} href={item.href} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-primary"><item.icon className="size-5"/><span>{item.label}</span></Link>)}</nav></div>;
}
