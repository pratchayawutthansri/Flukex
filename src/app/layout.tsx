import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://demo.flukexpos.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "Flukex POS — ระบบ POS ร้านอาหารพร้อม QR Ordering", template: "%s | Flukex POS" },
  description: "ระบบ POS ร้านอาหาร จัดการออเดอร์ QR Ordering จอครัว และรายงานยอดขายในแพลตฟอร์มเดียว เริ่มใช้ฟรี",
  keywords: ["ระบบ POS ร้านอาหาร", "QR Ordering", "โปรแกรมร้านอาหาร", "จอครัว", "Restaurant POS Thailand"],
  applicationName: "Flukex POS",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "Flukex POS",
    title: "Flukex POS — ร้านคล่อง ครัวชัด ยอดขายโต",
    description: "POS ร้านอาหารพร้อม QR Ordering จอครัวเรียลไทม์ และรายงานยอดขาย ทดลองใช้งานฟรี",
    url: appUrl,
  },
  twitter: { card: "summary_large_image", title: "Flukex POS", description: "ระบบจัดการร้านอาหารครบวงจร เริ่มใช้ฟรี" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#c81e1e", colorScheme: "light dark" };

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Flukex POS",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "AggregateOffer", lowPrice: "0", highPrice: "1990", priceCurrency: "THB" },
  description: "ระบบ POS ร้านอาหารพร้อม QR Ordering จอครัว และรายงานยอดขาย",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>
        <a href="#main-content" className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-card px-4 py-2 font-semibold shadow-lg focus:translate-y-0">ข้ามไปเนื้อหาหลัก</a>
        <AppProviders>{children}</AppProviders>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </body>
    </html>
  );
}
