import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_DESCRIPTION } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "KCOS 导航",
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F3F6FA",
    theme_color: "#1D4ED8",
    lang: "zh-CN",
    categories: ["education", "developer", "productivity"],
    icons: [
      {
        src: "/icon.png",
        sizes: "64x64",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "小游戏",
        short_name: "游戏",
        description: "打开 KCOS 站内小游戏入口",
        url: "/games",
      },
      {
        name: "首页导航",
        short_name: "首页",
        description: SITE_SHORT_DESCRIPTION,
        url: "/",
      },
    ],
  };
}
