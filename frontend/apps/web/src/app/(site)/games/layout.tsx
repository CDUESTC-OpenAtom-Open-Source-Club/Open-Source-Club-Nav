import type { Metadata } from "next";
import { SITE_SHORT_DESCRIPTION, absoluteSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "小游戏",
  description: "KCOS 开放原子开源社团小游戏入口，提供吃豆人等站内互动玩法和社团小游戏资源导航。",
  alternates: {
    canonical: absoluteSiteUrl("/games"),
  },
  openGraph: {
    type: "website",
    url: absoluteSiteUrl("/games"),
    title: "小游戏",
    description: "KCOS 开放原子开源社团小游戏入口，提供吃豆人等站内互动玩法和社团小游戏资源导航。",
  },
  twitter: {
    card: "summary_large_image",
    title: "小游戏",
    description: SITE_SHORT_DESCRIPTION,
  },
};

export default function GamesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
