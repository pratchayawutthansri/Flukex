import type { Metadata } from "next";
import { KdsDisplay } from "@/components/kds/kds-display";
export const metadata:Metadata={title:"Bar Display",robots:{index:false,follow:false}};
export default function BarPage(){return <KdsDisplay station="BAR"/>}
