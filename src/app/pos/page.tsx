import type { Metadata } from "next";
import { RoleGuard } from "@/components/auth/role-guard";
import { PosInterface } from "@/components/pos/pos-interface";
export const metadata:Metadata={title:"ระบบขายหน้าร้าน POS",robots:{index:false,follow:false}};
export default function PosPage(){return <RoleGuard><PosInterface/></RoleGuard>}
