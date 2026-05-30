import type { FriendLink } from "@/types/links";

export const FALLBACK_LINKS: FriendLink[] = [
  {
    id: 1,
    title: "Cooo Wiki 友链页",
    url: "https://wiki.cooo.site/links",
    description: "Cooo Wiki 友情链接",
    sort: 1,
    active: 1,
    module: "friend_links",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    title: "HDU CS Wiki",
    url: "https://hdu-cs.wiki/",
    description: "杭州电子科技大学计算机知识库",
    sort: 2,
    active: 1,
    module: "friend_links",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

export const MOCK_ADMIN_LINKS = [
  {
    id: 1,
    title: "OpenAtom Docs",
    url: "https://openatom.cn",
    description: "开放原子基金会官网",
    sort: 1,
    active: 1,
    module: "resource_matrix",
    resource_sub_module: "think_tank",
  },
  {
    id: 2,
    title: "GitHub",
    url: "https://github.com",
    description: "全球代码托管平台",
    sort: 2,
    active: 1,
    module: "friend_links",
  },
  {
    id: 3,
    title: "Next.js",
    url: "https://nextjs.org",
    description: "React 全栈框架",
    sort: 3,
    active: 0,
    module: "resource_matrix",
    resource_sub_module: "tools",
  },
  {
    id: 4,
    title: "吃豆人小游戏",
    url: "/games",
    description: "站内小游戏入口",
    sort: 1,
    active: 1,
    module: "mini_games",
  },
];
