import { RESOURCE_CATEGORIES } from "@/data/resources";
import type { MobileNavItem, MobileNavSection } from "@/components/home/MobileNavigation";

type PublicNavLink = {
  title?: unknown;
  label?: unknown;
  url?: unknown;
  href?: unknown;
  description?: unknown;
};

const BASE_FRIEND_LINKS = [
  { title: "电子科技大学成都学院", url: "https://www.cduestc.fun/" },
  { title: "科成星球", url: "https://github.com/CDUESTC-OpenAtom-Open-Source-Club" },
];

const BASE_MINI_GAME_LINKS = [
  { title: "吃豆人小游戏", url: "/games", description: "站内经典小游戏入口" },
];

const toPublicNavLink = (item: PublicNavLink) => ({
  title: String(item?.title || item?.label || "").trim(),
  url: String(item?.url || item?.href || "").trim(),
  description: String(item?.description || "").trim(),
});

const mergePublicNavLinks = (baseLinks: PublicNavLink[], remoteLinks: PublicNavLink[] = []) => {
  const seen = new Set<string>();
  return [...baseLinks, ...remoteLinks]
    .map(toPublicNavLink)
    .filter((item) => item.title && item.url)
    .filter((item) => {
      const key = `${item.title}::${item.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const describeLink = (item: ReturnType<typeof toPublicNavLink>) => {
  if (item.description) return item.description;
  return item.url.replace(/^https?:\/\//, "");
};

const isExternalHref = (url: string) => /^https?:\/\//.test(url);

export function buildMobileNavSections({
  resourceCategories = RESOURCE_CATEGORIES,
  activeCategory,
  onCategorySelect,
  onOpenAbout,
  onOpenActivity,
  friendLinks = [],
  miniGameLinks = [],
}: {
  resourceCategories?: typeof RESOURCE_CATEGORIES;
  activeCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  onOpenAbout: () => void;
  onOpenActivity: () => void;
  friendLinks?: PublicNavLink[];
  miniGameLinks?: PublicNavLink[];
}): MobileNavSection[] {
  const mergedFriendLinks = mergePublicNavLinks(BASE_FRIEND_LINKS, friendLinks);
  const mergedMiniGameLinks = mergePublicNavLinks(BASE_MINI_GAME_LINKS, miniGameLinks);

  return [
    {
      id: "resources",
      label: "资源分类",
      items: resourceCategories.map((category) => ({
        id: category.id,
        label: category.label,
        description: category.sublabel,
        action: () => onCategorySelect(category.id),
        icon: category.icon as MobileNavItem["icon"],
        active: activeCategory === category.id,
      })),
    },
    {
      id: "surfaces",
      label: "页面入口",
      items: [
        {
          id: "activity",
          label: "成员动态",
          description: "展开移动端动态摘要区",
          action: onOpenActivity,
          icon: "newspaper",
        },
        {
          id: "about",
          label: "关于我们",
          description: "打开社团介绍和组织信息",
          action: onOpenAbout,
          icon: "info",
        },
      ],
    },
    {
      id: "friend-links",
      label: "友情链接",
      items: mergedFriendLinks.map((link) => ({
        id: `friend-${link.title}-${link.url}`,
        label: link.title,
        description: describeLink(link),
        href: link.url,
        external: isExternalHref(link.url),
        icon: link.url.toLowerCase().includes("github.com") ? "github" : "branch",
      })),
    },
    {
      id: "mini-games",
      label: "小游戏",
      items: mergedMiniGameLinks.map((link) => ({
        id: `game-${link.title}-${link.url}`,
        label: link.title,
        description: describeLink(link),
        href: link.url,
        external: isExternalHref(link.url),
        icon: "gamepad",
      })),
    },
  ];
}
