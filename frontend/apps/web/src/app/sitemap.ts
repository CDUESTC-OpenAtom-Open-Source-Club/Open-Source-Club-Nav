import type { MetadataRoute } from "next";
import { SITEMAP_ROUTES, absoluteSiteUrl } from "@/lib/site";

const lastModified = new Date("2026-06-14");

export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_ROUTES.map((route) => ({
    url: absoluteSiteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
