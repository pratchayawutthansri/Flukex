"use client";

import { useState } from "react";
import { Building2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createId } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { services } from "@/services/container";

export function BranchManager() {
  const branches = useDemoStore((state) => state.branches);
  const saveBranch = useDemoStore((state) => state.saveBranch);
  const removeBranch = useDemoStore((state) => state.removeBranch);
  const restaurantId = useDemoStore((state) => state.restaurants[0]?.id ?? "");
  const [open,setOpen]=useState(false); const [name,setName]=useState(""); const [code,setCode]=useState("");
  const add=(e:React.FormEvent)=>{e.preventDefault(); const now=new Date().toISOString(); saveBranch({id:createId("branch"),tenantId:useDemoStore.getState().activeTenantId,restaurantId,name,code,address:"กรุงเทพมหานคร",isActive:true,createdAt:now,updatedAt:now}); setOpen(false);setName("");setCode("");void services.notifications.notify({title:"เพิ่มสาขาแล้ว",message:`สร้าง ${name} ในร้านนี้แล้ว`});};
  return <><PageHeader title="สาขา" description="จัดการสาขาภายใต้ Restaurant tenant เดียวกัน" actions={<Button onClick={()=>setOpen(true)}><Plus/>เพิ่มสาขา</Button>}/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{branches.map((branch)=><Card key={branch.id} className="p-5"><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary"><Building2/></span><Badge variant={branch.isActive?"success":"secondary"}>{branch.isActive?"เปิดใช้งาน":"ปิดใช้งาน"}</Badge></div><h2 className="mt-4 text-lg font-bold">{branch.name}</h2><p className="text-xs text-muted-foreground">{branch.code} • {branch.address}</p><div className="mt-5 flex gap-2"><Button variant="outline" size="sm" onClick={()=>saveBranch({...branch,isActive:!branch.isActive,updatedAt:new Date().toISOString()})}>{branch.isActive?"ปิดชั่วคราว":"เปิดใช้งาน"}</Button><Button variant="ghost" size="icon" aria-label={`ลบ ${branch.name}`} onClick={()=>{if(confirm(`ลบ ${branch.name}?`))removeBranch(branch.id)}}><Trash2/></Button></div></Card>)}</div><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>เพิ่มสาขา</DialogTitle><DialogDescription>ระบบจะตรวจ maxBranches จาก entitlement ในการเชื่อม production</DialogDescription></DialogHeader><form onSubmit={add} className="space-y-4"><div className="space-y-2"><Label htmlFor="branch-name">ชื่อสาขา</Label><Input id="branch-name" value={name} onChange={(e)=>setName(e.target.value)} required/></div><div className="space-y-2"><Label htmlFor="branch-code">รหัสสาขา</Label><Input id="branch-code" value={code} onChange={(e)=>setCode(e.target.value)} required/></div><DialogFooter><Button type="button" variant="outline" onClick={()=>setOpen(false)}>ยกเลิก</Button><Button type="submit">เพิ่มสาขา</Button></DialogFooter></form></DialogContent></Dialog></>;
}
