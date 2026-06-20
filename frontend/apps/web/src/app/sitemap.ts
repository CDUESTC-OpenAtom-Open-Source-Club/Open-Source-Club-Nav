import type { MetadataRoute } from "next";
import { getIndexableRoutes, absoluteSiteUrl } from "@/lib/site";

/**
 * 动态 Sitemap 生成
 *
 * - 仅包含可索引路由（排除 /home 等仪表盘页面）
 * - lastModified 使用当前时间，确保搜索引擎感知内容更新
 * - 可扩展：后续从后端拉取动态页面列表合并
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const indexableRoutes = getIndexableRoutes();
  const now = new Date();

  return indexableRoutes.map((route) => ({
    url: absoluteSiteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
