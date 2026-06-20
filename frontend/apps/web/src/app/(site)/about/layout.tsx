import type { Metadata } from "next";
import { absoluteSiteUrl, SITE_URL } from "@/lib/site";
import { buildPageMetadata, buildBreadcrumbJsonLd, buildWebPageJsonLd, jsonLdToString } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "关于我们",
  description:
    "了解 KCOS 开放原子开源社团——成都理工大学工程技术学院开源社区，我们的使命是推动高校开源文化建设，汇集开源工具与学习资源，助力学生开发者成长。",
  path: "/about",
  keywords: [
    "开放原子开源社团",
    "KCOS 关于我们",
    "高校开源社团",
    "成都理工大学工程技术学院",
    "开源社区",
    "学生开发者",
  ],
});

export default function AboutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd(
        "/about",
        "关于我们 | KCOS 开放原子开源社团",
        "了解 KCOS 开放原子开源社团——成都理工大学工程技术学院开源社区，推动高校开源文化建设。",
      ),
      buildBreadcrumbJsonLd([
        { name: "首页", url: SITE_URL },
        { name: "关于我们", url: absoluteSiteUrl("/about") },
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
