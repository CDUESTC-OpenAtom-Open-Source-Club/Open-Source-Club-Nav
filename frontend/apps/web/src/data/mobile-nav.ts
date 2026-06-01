import { FOOTER_QUICK_LINKS } from "@/constants/about";
import { RESOURCE_CATEGORIES } from "@/data/resources";
import type { MobileNavItem, MobileNavSection } from "@/components/home/MobileNavigation";

export function buildMobileNavSections({
  activeCategory,
  onCategorySelect,
  onOpenAbout,
  onOpenActivity,
}: {
  activeCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  onOpenAbout: () => void;
  onOpenActivity: () => void;
}): MobileNavSection[] {
  return [
    {
      id: "resources",
      label: "资源分类",
      items: RESOURCE_CATEGORIES.map((category) => ({
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
      id: "links",
      label: "外部链接",
      items: FOOTER_QUICK_LINKS.map((link) => ({
        id: link.label,
        label: link.label.toLowerCase().includes("github") ? "项目地址" : link.label,
        description: link.href.replace(/^https?:\/\//, ""),
        href: link.href,
        external: true,
        icon: link.label.toLowerCase().includes("github") ? "github" : "branch",
      })),
    },
  ];
}
