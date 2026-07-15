import type { Locale } from "@/domain/types";

export const defaultLocale: Locale = "th";
export const supportedLocales: Locale[] = ["th", "en"];

export const messages = {
  th: {
    common: { save: "บันทึก", cancel: "ยกเลิก", loading: "กำลังโหลด...", empty: "ยังไม่มีข้อมูล" },
    navigation: { dashboard: "ภาพรวม", orders: "ออเดอร์", products: "สินค้า", settings: "ตั้งค่า" },
  },
  en: {
    common: { save: "Save", cancel: "Cancel", loading: "Loading...", empty: "No data yet" },
    navigation: { dashboard: "Dashboard", orders: "Orders", products: "Products", settings: "Settings" },
  },
} as const;

export function getMessages(locale: Locale = defaultLocale) {
  return messages[locale];
}

// Future routing: move public/app routes under app/[locale] and resolve locale in middleware.
