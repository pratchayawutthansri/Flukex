import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
export const metadata: Metadata = { title: "สมัครใช้งานฟรี", description: "สร้างบัญชีร้านอาหารและเริ่มใช้งาน Flukex POS", robots: { index: true, follow: true } };
export default function RegisterPage() { return <AuthShell title="สร้างบัญชีเจ้าของร้าน" description="เจ้าของร้านสร้าง Workspace ใหม่พร้อมชื่อร้าน ส่วนบัญชีพนักงานให้เพิ่มจากหลังบ้านของร้านเพื่อไม่ให้ข้อมูลข้ามร้าน"><RegisterForm/></AuthShell>; }
