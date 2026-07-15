"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { services } from "@/services/container";

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); setSubmitting(true); await new Promise((resolve) => setTimeout(resolve, 650)); setSubmitting(false); setSent(true); void services.notifications.notify({ title: "ส่งข้อความแล้ว", message: "ทีมงานเดโมได้รับข้อความจำลองของคุณแล้ว" }); };
  if (sent) return <div className="rounded-xl border bg-green-50 p-8 text-center dark:bg-green-950/30"><div className="mx-auto grid size-12 place-items-center rounded-full bg-green-100 text-success"><Send/></div><h2 className="mt-4 text-xl font-bold">ส่งข้อความเรียบร้อย</h2><p className="mt-2 text-sm text-muted-foreground">นี่คือการส่งแบบจำลอง ไม่มีข้อมูลถูกส่งออกไปภายนอก</p><Button variant="outline" className="mt-5" onClick={() => setSent(false)}>ส่งข้อความใหม่</Button></div>;
  return <form onSubmit={submit} className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="contact-name">ชื่อผู้ติดต่อ</Label><Input id="contact-name" required autoComplete="name"/></div><div className="space-y-2"><Label htmlFor="contact-phone">เบอร์โทร</Label><Input id="contact-phone" type="tel" required autoComplete="tel"/></div></div><div className="space-y-2"><Label htmlFor="contact-email">อีเมล</Label><Input id="contact-email" type="email" required autoComplete="email"/></div><div className="space-y-2"><Label htmlFor="contact-restaurant">ชื่อร้าน / จำนวนสาขา</Label><Input id="contact-restaurant" required/></div><div className="space-y-2"><Label htmlFor="contact-message">สิ่งที่อยากให้เราช่วย</Label><Textarea id="contact-message" required placeholder="เล่ารูปแบบร้านหรือระบบที่กำลังใช้อยู่"/></div><Button type="submit" className="w-full" disabled={submitting}>{submitting ? "กำลังส่ง..." : <><Send/>ส่งข้อความ</>}</Button></form>;
}
