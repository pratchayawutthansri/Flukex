import type { Metadata } from "next";
import { QrOrderingInterface } from "@/components/order/qr-ordering-interface";
export const metadata:Metadata={title:"เมนูสั่งอาหาร",description:"QR Ordering demo",robots:{index:false,follow:false,nocache:true}};
export default async function OrderPage({params}:{params:Promise<{restaurantSlug:string;tableToken:string}>}){const{restaurantSlug,tableToken}=await params;return <QrOrderingInterface restaurantSlug={restaurantSlug} tableToken={tableToken}/>}
