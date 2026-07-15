import type { Metadata } from "next";
import { KdsDisplay } from "@/components/kds/kds-display";
export const metadata:Metadata={title:"Kitchen Display",robots:{index:false,follow:false}};
export default function KitchenPage(){return <KdsDisplay station="KITCHEN"/>}
