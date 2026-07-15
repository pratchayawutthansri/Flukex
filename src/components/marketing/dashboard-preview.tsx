import { BarChart3, ChefHat, CircleDollarSign, QrCode, ShoppingBag, TrendingUp } from "lucide-react";

const bars = [45, 68, 55, 83, 72, 94, 78];

export function DashboardPreview() {
  return (
    <div className="glass-panel relative overflow-hidden rounded-[1.75rem] p-3 sm:p-5">
      <div className="flex items-center gap-2 border-b pb-3"><span className="size-2.5 rounded-full bg-red-400"/><span className="size-2.5 rounded-full bg-amber-400"/><span className="size-2.5 rounded-full bg-green-400"/><span className="ml-2 text-xs font-semibold text-muted-foreground">สวัสดี บิสโทร • Dashboard</span></div>
      <div className="grid gap-3 py-4 sm:grid-cols-3">
        {[{ icon: CircleDollarSign, label: "ยอดขายวันนี้", value: "฿24,860", note: "+12.5%" }, { icon: ShoppingBag, label: "ออเดอร์", value: "86", note: "14 กำลังทำ" }, { icon: QrCode, label: "โต๊ะที่ใช้งาน", value: "12 / 18", note: "67%" }].map((item) => <div key={item.label} className="rounded-xl border bg-card p-4"><item.icon className="mb-3 size-5 text-primary"/><p className="text-xs text-muted-foreground">{item.label}</p><div className="mt-1 flex items-end justify-between gap-2"><strong className="text-xl">{item.value}</strong><span className="text-xs font-semibold text-success">{item.note}</span></div></div>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border bg-card p-4"><div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-bold">ยอดขาย 7 วัน</p><p className="text-xs text-muted-foreground">ภาพรวมทุกช่องทาง</p></div><TrendingUp className="size-5 text-success"/></div><div className="flex h-28 items-end gap-2">{bars.map((bar, index) => <div key={index} className="flex-1 rounded-t-md bg-primary/85" style={{ height: `${bar}%` }} />)}</div></div>
        <div className="rounded-xl border bg-[#231414] p-4 text-white"><div className="flex items-center gap-2"><ChefHat className="size-5 text-red-300"/><p className="text-sm font-bold">จอครัว</p></div><div className="mt-4 space-y-2">{["#1042 • โต๊ะ 02", "#1041 • โต๊ะ 04", "#1039 • โต๊ะ 07"].map((order, index) => <div key={order} className="rounded-lg bg-white/10 p-2.5"><div className="flex justify-between text-xs"><span>{order}</span><span className={index === 0 ? "text-amber-300" : "text-green-300"}>{index === 0 ? "กำลังทำ" : "พร้อมเสิร์ฟ"}</span></div></div>)}</div></div>
      </div>
      <div className="pointer-events-none absolute -right-20 -top-20 size-48 rounded-full bg-primary/10 blur-3xl" />
      <BarChart3 className="absolute bottom-7 right-8 hidden size-5 text-primary/20 sm:block" />
    </div>
  );
}
