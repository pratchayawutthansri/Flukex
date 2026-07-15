import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
export const metadata: Metadata = { title: "สมัครใช้งานฟรี", description: "สร้างร้านและทดลองระบบ POS ร้านอาหารฟรี", robots: { index: true, follow: true } };
export default function RegisterPage() { return <AuthShell title="เปิดร้านบนระบบในไม่กี่ขั้นตอน" description="สร้างบัญชี เลือกแผนจำลอง แล้วเริ่มสำรวจ Dashboard พร้อมข้อมูลตัวอย่าง"><RegisterForm/></AuthShell>; }
