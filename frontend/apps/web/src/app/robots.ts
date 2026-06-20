import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * 动态 robots.txt 生成
 *
 * - 允许主要搜索引擎抓取公开页面
 * - 禁止抓取 /admin、/api、/home（仪表盘）
 * - 声明 Sitemap 位置
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/home"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/home"],
      },
      {
        userAgent: "Baiduspider",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/home"],
      },
      {
        userAgent: "bingbot",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/home"],
      },
      {
        userAgent: "Sogou web spider",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/home"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
