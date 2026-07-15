import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
export const metadata: Metadata = { title: "เข้าสู่ระบบเดโม", description: "เข้าสู่ระบบ Flukex POS ด้วยบัญชีเดโม", robots: { index: false, follow: false } };
export default function LoginPage() { return <AuthShell title="เข้าสู่ Workspace ตามบทบาท" description="ทดลองมุมมอง Owner, Manager, Cashier, Kitchen, Bar และ Platform Admin โดยแต่ละบัญชีมีสิทธิ์ต่างกัน"><LoginForm/></AuthShell>; }
