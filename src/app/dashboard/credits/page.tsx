import type { Metadata } from "next";
import { CreditWallet } from "@/components/credits/credit-wallet";

export const metadata: Metadata = { title: "เครดิต Flukex", robots: { index: false, follow: false } };

export default function CreditsPage() {
  return <CreditWallet />;
}
