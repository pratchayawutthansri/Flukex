import type { Metadata } from "next";
import { PosInterface } from "@/components/pos/pos-interface";
export const metadata:Metadata={title:"POS Demo",robots:{index:false,follow:false}};
export default function PosPage(){return <PosInterface/>}
