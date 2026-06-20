import type { Metadata } from "next";
import { absoluteSiteUrl, SITE_URL } from "@/lib/site";
import { buildPageMetadata, buildBreadcrumbJsonLd, buildWebPageJsonLd, jsonLdToString } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "智库 | KCOS 开放原子开源社团",
  description: "KCOS 开放原子开源社团智库资源，汇集计算机科学自学路线、算法训练、学术论文、在线课程等学习资源，助力技术成长。",
  path: "/resources/intelligence",
  keywords: ["开源社团智库", "CS自学路线", "算法训练", "学术论文", "在线课程", "KCOS学习资源"],
});

export default function IntelligenceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd("/resources/intelligence", "智库 | KCOS 开放原子开源社团", "KCOS 开放原子开源社团智库资源，汇集计算机科学自学路线、算法训练、学术论文、在线课程等学习资源。"),
      buildBreadcrumbJsonLd([
        { name: "首页", url: SITE_URL },
        { name: "资源导航", url: absoluteSiteUrl("/resources") },
        { name: "智库", url: absoluteSiteUrl("/resources/intelligence") },
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