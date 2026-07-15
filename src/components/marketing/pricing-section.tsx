"use client";

import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { SUBSCRIPTION_PLANS } from "@/config/plans";
import type { PlanId } from "@/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";

export function PricingSection({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState<PlanId | null>(null);
  const selectPlan = useDemoStore((state) => state.selectPlan);
  const plans = Object.values(SUBSCRIPTION_PLANS);
  const confirm = () => { if (selected) selectPlan(selected); setSelected(null); };
  return (
    <>
      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.highlighted ? "relative border-primary ring-2 ring-primary/15" : "relative"}>
            {plan.highlighted && <Badge className="absolute -top-3 left-5 bg-primary text-white"><Sparkles className="size-3"/>ยอดนิยม</Badge>}
            <div className="p-6"><h3 className="text-xl font-bold">{plan.name}</h3><p className="mt-2 min-h-12 text-sm text-muted-foreground">{plan.description}</p><div className="my-6"><span className="text-4xl font-bold">{plan.priceMonthly === 0 ? "ฟรี" : formatCurrency(plan.priceMonthly).replace(".00", "")}</span>{plan.priceMonthly > 0 && <span className="text-sm text-muted-foreground"> / เดือน</span>}</div><Button className="w-full" variant={plan.highlighted ? "default" : "outline"} onClick={() => setSelected(plan.id)}>เลือกแผน {plan.name}</Button><ul className="mt-6 space-y-3">{plan.features.slice(0, compact ? 4 : undefined).map((feature) => <li key={feature} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-success"/><span>{feature}</span></li>)}</ul></div>
          </Card>
        ))}
      </div>
      <div className="mt-6 text-center"><Button variant="ghost" asChild><Link href="/plan-comparison">ดูตารางเปรียบเทียบทุกฟีเจอร์ →</Link></Button></div>
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent><DialogHeader><DialogTitle>ยืนยันเลือกแผน {selected ? SUBSCRIPTION_PLANS[selected].name : ""}</DialogTitle><DialogDescription>เดโมนี้จะอัปเดตสถานะแผนใน Local Storage เท่านั้น ไม่มีการเรียกเก็บเงินจริง</DialogDescription></DialogHeader><div className="rounded-lg bg-muted p-4 text-sm"><strong>โหมดสาธิต</strong><p className="mt-1 text-muted-foreground">คุณสามารถเปลี่ยนแผนหรือรีเซ็ตข้อมูลได้ตลอดเวลาจากหน้า Subscription</p></div><DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>ยกเลิก</Button><Button onClick={confirm}>ยืนยันแผนจำลอง</Button></DialogFooter></DialogContent>
      </Dialog>
    </>
  );
}
