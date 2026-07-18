"use client";

import { useState } from "react";
import { Building2, Save } from "lucide-react";
import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDemoStore } from "@/store/demo-store";
import { services } from "@/services/container";

export function RestaurantForm() {
  const restaurant = useDemoStore((state) => state.restaurants[0]);
  const saveRestaurant = useDemoStore((state) => state.saveRestaurant);
  const [form, setForm] = useState(restaurant);
  if (!form) return null;
  const save = (event: React.FormEvent) => { event.preventDefault(); saveRestaurant({ ...form, updatedAt: new Date().toISOString() }); void services.notifications.notify({ title: "บันทึกข้อมูลร้านแล้ว", message: "ข้อมูลร้านถูกอัปเดตเรียบร้อย" }); };
  return <><PageHeader title="ข้อมูลร้านอาหาร" description="ข้อมูลหลักของ Tenant สำหรับแสดงบน POS, QR Ordering และใบเสร็จ"/><div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]"><Card><CardHeader><CardTitle>ข้อมูลทั่วไป</CardTitle></CardHeader><CardContent><form onSubmit={save} className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="restaurant-name">ชื่อร้าน</Label><Input id="restaurant-name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required/></div><div className="space-y-2"><Label htmlFor="restaurant-slug">Slug</Label><Input id="restaurant-slug" value={form.slug} onChange={(e)=>setForm({...form,slug:e.target.value})} required/><p className="text-xs text-muted-foreground">ใช้ใน URL สั่งอาหาร</p></div></div><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="restaurant-phone">เบอร์โทร</Label><Input id="restaurant-phone" type="tel" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/></div><div className="space-y-2"><Label htmlFor="restaurant-tax">เลขประจำตัวผู้เสียภาษี</Label><Input id="restaurant-tax" value={form.taxId ?? ""} onChange={(e)=>setForm({...form,taxId:e.target.value})}/></div></div><div className="space-y-2"><Label htmlFor="restaurant-address">ที่อยู่</Label><Textarea id="restaurant-address" value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})}/></div><Button type="submit"><Save/>บันทึกข้อมูล</Button></form></CardContent></Card><Card><CardHeader><CardTitle>ตัวอย่างแบรนด์</CardTitle></CardHeader><CardContent><div className="grid aspect-square place-items-center rounded-2xl bg-secondary"><div className="text-center"><span className="mx-auto grid size-20 place-items-center rounded-3xl bg-primary text-white shadow-lg"><Building2 className="size-10"/></span><p className="mt-5 text-xl font-bold">{form.name}</p><p className="text-sm text-muted-foreground">{form.phone}</p></div></div><p className="mt-4 text-xs text-muted-foreground">ระบบจริงสามารถต่อ Storage repository สำหรับโลโก้และรูปภาพภายหลัง</p></CardContent></Card></div></>;
}
