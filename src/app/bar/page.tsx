import type { Metadata } from "next";
import { RoleGuard } from "@/components/auth/role-guard";
import { KdsDisplay } from "@/components/kds/kds-display";
export const metadata:Metadata={title:"จอบาร์",robots:{index:false,follow:false}};
export default function BarPage(){return <RoleGuard><KdsDisplay station="BAR"/></RoleGuard>}
