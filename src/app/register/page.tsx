import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
export const metadata: Metadata = { title: "สมัครใช้งาน", description: "สร้างร้านใหม่หรือส่งคำขอเข้าร่วมร้านอาหารบน Flukex POS", robots: { index: true, follow: true } };
export default function RegisterPage() { return <AuthShell title="สร้างบัญชี Flukex POS" description="เจ้าของร้านสร้าง Workspace ใหม่ ส่วนพนักงานส่งคำขอเข้าร่วมร้านเดิมและรอผู้ดูแลร้านกำหนดสิทธิ์"><RegisterForm/></AuthShell>; }
