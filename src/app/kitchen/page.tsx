import type { Metadata } from "next";
import { RoleGuard } from "@/components/auth/role-guard";
import { KdsDisplay } from "@/components/kds/kds-display";
export const metadata:Metadata={title:"จอครัว",robots:{index:false,follow:false}};
export default function KitchenPage(){return <RoleGuard><KdsDisplay station="KITCHEN"/></RoleGuard>}
