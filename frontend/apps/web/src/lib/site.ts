/**
 * 站点全局常量与 SEO 路由配置
 *
 * 所有与站点身份、URL、路由优先级相关的常量集中管理，
 * 供 layout / sitemap / robots / SEO 工具复用。
 */

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
export const SITE_ALTERNATE_NAMES = [
  "OpenAtom Club Nav",
  "KCOS 导航",
  "科成开放原子开源社团",
];

// ─── SEO 路由定义 ──────────────────────────────────────────
// 每个路由包含：路径、变更频率、优先级、是否可索引、页面标题与描述

export interface SeoRoute {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
  indexable: boolean;
  title: string;
  description: string;
}

export const SEO_ROUTES: SeoRoute[] = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1.0,
    indexable: true,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  {
    path: "/games",
    changeFrequency: "monthly",
    priority: 0.6,
    indexable: true,
    title: "小游戏 | KCOS 开放原子开源社团",
    description:
      "KCOS 开放原子开源社团小游戏入口，提供吃豆人等站内互动玩法和社团小游戏资源导航。",
  },
  {
    path: "/home",
    changeFrequency: "weekly",
    priority: 0.3,
    indexable: false, // 资料区为仪表盘，不索引
    title: "资料区 | KCOS 开放原子开源社团",
    description: "KCOS 开放原子开源社团资料区与动态面板。",
  },
  {
    path: "/about",
    changeFrequency: "monthly",
    priority: 0.8,
    indexable: true,
    title: "关于我们 | KCOS 开放原子开源社团",
    description: "了解 KCOS 开放原子开源社团——成都理工大学工程技术学院开源社区，推动高校开源文化建设，汇集开源工具与学习资源。",
  },
  {
    path: "/resources/intelligence",
    changeFrequency: "weekly",
    priority: 0.7,
    indexable: true,
    title: "智库 | KCOS 开放原子开源社团",
    description: "KCOS 开放原子开源社团智库资源，汇集计算机科学自学路线、算法训练、学术论文、在线课程等学习资源。",
  },
  {
    path: "/resources/surface",
    changeFrequency: "weekly",
    priority: 0.7,
    indexable: true,
    title: "校园 | KCOS 开放原子开源社团",
    description: "KCOS 开放原子开源社团校园资源，汇集教务系统、图书馆、校园卡、就业信息等校园服务。",
  },
  {
    path: "/resources/armory",
    changeFrequency: "weekly",
    priority: 0.7,
    indexable: true,
    title: "工具 | KCOS 开放原子开源社团",
    description: "KCOS 开放原子开源社团工具资源，汇集GitHub、VS Code、Docker、设计工具、文档平台等开发利器。",
  },
];

// 兼容旧引用名
export const SITEMAP_ROUTES = SEO_ROUTES;

export function absoluteSiteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * 获取所有可索引路由（用于 sitemap）
 */
export function getIndexableRoutes(): SeoRoute[] {
  return SEO_ROUTES.filter((r) => r.indexable);
}

/**
 * 根据路径查找路由配置
 */
export function findRoute(path: string): SeoRoute | undefined {
  return SEO_ROUTES.find((r) => r.path === path);
}
