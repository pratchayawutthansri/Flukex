"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main-content" className="grid min-h-dvh place-items-center bg-background p-6"><div className="max-w-lg rounded-2xl border bg-card p-8 text-center shadow-soft"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-100 text-destructive"><AlertTriangle/></span><h1 className="mt-5 text-2xl font-bold">เกิดข้อผิดพลาดในการแสดงผล</h1><p className="mt-2 text-sm text-muted-foreground">{error.message || "กรุณาลองใหม่อีกครั้ง ข้อมูลที่บันทึกไว้จะยังคงอยู่"}</p><Button className="mt-6" onClick={reset}><RotateCcw/>ลองโหลดใหม่</Button></div></main>;
}
