import type { Metadata } from "next";
import { absoluteSiteUrl, SITE_URL } from "@/lib/site";
import { buildPageMetadata, buildBreadcrumbJsonLd, buildWebPageJsonLd, jsonLdToString } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "校园 | KCOS 开放原子开源社团",
  description: "KCOS 开放原子开源社团校园资源，汇集教务系统、图书馆、校园卡、就业信息等校园服务，方便师生快速访问。",
  path: "/resources/surface",
  keywords: ["开源社团校园", "教务系统", "图书馆", "校园卡", "就业信息", "KCOS校园服务"],
});

export default function SurfaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd("/resources/surface", "校园 | KCOS 开放原子开源社团", "KCOS 开放原子开源社团校园资源，汇集教务系统、图书馆、校园卡、就业信息等校园服务。"),
      buildBreadcrumbJsonLd([
        { name: "首页", url: SITE_URL },
        { name: "资源导航", url: absoluteSiteUrl("/resources") },
        { name: "校园", url: absoluteSiteUrl("/resources/surface") },
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