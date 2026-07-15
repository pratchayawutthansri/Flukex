import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
export const metadata: Metadata = { title: "สมัครใช้งานฟรี", description: "สร้างบัญชีร้านอาหารและเริ่มใช้งาน Flukex POS", robots: { index: true, follow: true } };
export default function RegisterPage() { return <AuthShell title="เปิดร้านบนระบบในไม่กี่ขั้นตอน" description="สร้างบัญชี เลือกแผน และเริ่มตั้งค่าร้านของคุณโดยข้อมูลแต่ละร้านแยกจากกัน"><RegisterForm/></AuthShell>; }
