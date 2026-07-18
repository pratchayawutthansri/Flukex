import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { return { rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard/", "/pos", "/kitchen", "/bar", "/order/"] }], sitemap: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://flukex.store"}/sitemap.xml` }; }
