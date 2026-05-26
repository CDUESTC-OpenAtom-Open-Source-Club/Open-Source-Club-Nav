import type { FriendLink } from "@/types/links";

export const FALLBACK_LINKS: FriendLink[] = [
  { id: 1, title: "Cooo Wiki 友链页", url: "https://wiki.cooo.site/links", description: "Cooo Wiki 友情链接", sort: 1, active: 1, created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" },
  { id: 2, title: "HDU CS Wiki", url: "https://hdu-cs.wiki/", description: "杭电计算机知识库", sort: 2, active: 1, created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" },
];

export const MOCK_ADMIN_LINKS = [
  { id: 1, title: "OpenAtom Docs", url: "https://openatom.cn", description: "OpenAtom 开放原子开源基金会", sort: 1, active: 1 },
  { id: 2, title: "GitHub", url: "https://github.com", description: "全球代码托管平台", sort: 2, active: 1 },
  { id: 3, title: "Next.js", url: "https://nextjs.org", description: "React 全栈开发框架", sort: 3, active: 0 },
];
