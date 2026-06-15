export const SITE_URL = "https://nav.kcos.club";
export const SITE_NAME = "KCOS 开放原子开源社团";
export const SITE_TITLE = "KCOS 开放原子开源社团 - 开源导航平台";
export const SITE_DESCRIPTION =
  "科成开放原子开源社团导航平台，汇集开源工具、学习资源、校园服务、开发利器，助力高校开源社区建设与发展。";
export const SITE_SHORT_DESCRIPTION =
  "科成开放原子开源社团导航平台，汇集开源工具、学习资源、校园服务、开发利器。";
export const SITE_IMAGE_PATH = "/images/brand/club-logo-user.jpg";
export const SITE_GITHUB_URL =
  "https://github.com/CDUESTC-OpenAtom-Open-Source-Club/Open-Source-Club-Nav";
export const SITE_OFFICIAL_URL = "https://opensouce-club.top/";
export const SITE_ALTERNATE_NAMES = ["OpenAtom Club Nav", "KCOS 导航", "科成开放原子开源社团"];

export const SITEMAP_ROUTES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/home", changeFrequency: "weekly", priority: 0.8 },
  { path: "/games", changeFrequency: "monthly", priority: 0.6 },
] as const;

export function absoluteSiteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}
