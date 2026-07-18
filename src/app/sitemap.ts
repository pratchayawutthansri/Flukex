import type { MetadataRoute } from "next";
const routes = ["", "/features", "/pricing", "/plan-comparison", "/restaurant-pos", "/qr-ordering", "/kitchen-display", "/faq", "/contact", "/register", "/login", "/privacy", "/terms"];
export default function sitemap(): MetadataRoute.Sitemap { const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://flukex.store"; return routes.map((route) => ({ url: `${base}${route}`, lastModified: new Date("2026-07-15"), changeFrequency: route === "" ? "weekly" : "monthly", priority: route === "" ? 1 : 0.7 })); }
