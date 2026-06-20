import type { Metadata } from "next";
import { absoluteSiteUrl, SITE_URL } from "@/lib/site";
import { buildPageMetadata, buildBreadcrumbJsonLd, buildWebPageJsonLd, jsonLdToString } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "工具 | KCOS 开放原子开源社团",
  description: "KCOS 开放原子开源社团工具资源，汇集GitHub、VS Code、Docker、设计工具、文档平台等开发利器，提升开发效率。",
  path: "/resources/armory",
  keywords: ["开源社团工具", "GitHub", "VS Code", "Docker", "设计工具", "KCOS开发工具"],
});

export default function ArmoryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd("/resources/armory", "工具 | KCOS 开放原子开源社团", "KCOS 开放原子开源社团工具资源，汇集GitHub、VS Code、Docker、设计工具、文档平台等开发利器。"),
      buildBreadcrumbJsonLd([
        { name: "首页", url: SITE_URL },
        { name: "资源导航", url: absoluteSiteUrl("/resources") },
        { name: "工具", url: absoluteSiteUrl("/resources/armory") },
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