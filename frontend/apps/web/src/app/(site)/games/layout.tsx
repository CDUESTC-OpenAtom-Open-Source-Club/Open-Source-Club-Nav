import type { Metadata } from "next";
import { absoluteSiteUrl, SITE_URL } from "@/lib/site";
import { buildPageMetadata, buildBreadcrumbJsonLd, buildWebPageJsonLd, jsonLdToString } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "小游戏",
  description: "KCOS 开放原子开源社团小游戏入口，提供吃豆人等站内互动玩法和社团小游戏资源导航。",
  path: "/games",
  keywords: ["开源社团小游戏", "吃豆人", "KCOS 游戏", "校园小游戏", "Pac-Man"],
});

export default function GamesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd("/games", "小游戏 | KCOS 开放原子开源社团", "KCOS 开放原子开源社团小游戏入口，提供吃豆人等站内互动玩法和社团小游戏资源导航。"),
      buildBreadcrumbJsonLd([
        { name: "首页", url: SITE_URL },
        { name: "小游戏", url: absoluteSiteUrl("/games") },
      ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdToString(jsonLd) }}
      />
      {children}
    </>
  );
}
