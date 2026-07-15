import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
export const metadata: Metadata = { title: "เข้าสู่ระบบ", description: "เข้าสู่ระบบ Flukex POS ด้วยบัญชีที่ได้รับจากผู้ดูแล", robots: { index: false, follow: false } };
export default function LoginPage() { return <AuthShell title="เข้าสู่ระบบ Flukex POS" description="กรอกอีเมลและรหัสผ่านที่ได้รับจากผู้ดูแล แต่ละบทบาทจะเห็นเครื่องมือที่เหมาะกับหน้าที่"><LoginForm/></AuthShell>; }
