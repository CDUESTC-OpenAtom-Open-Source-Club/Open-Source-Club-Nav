/**
 * SEO 工具库
 *
 * 集中管理结构化数据(JSON-LD)生成、面包屑、社交分享元数据等。
 * 所有函数均为纯函数，可在服务端组件中直接调用。
 */

import type { Metadata } from "next";
import {
  SITE_ALTERNATE_NAMES,
  SITE_DESCRIPTION,
  SITE_GITHUB_URL,
  SITE_IMAGE_PATH,
  SITE_NAME,
  SITE_OFFICIAL_URL,
  SITE_SHORT_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
  absoluteSiteUrl,
} from "./site";

// ─── 类型定义 ──────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

// ─── JSON-LD 生成器 ────────────────────────────────────────

/**
 * 生成 Organization 结构化数据
 */
export function buildOrganizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAMES,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteSiteUrl(SITE_IMAGE_PATH),
      width: 714,
      height: 672,
    },
    sameAs: [SITE_GITHUB_URL, SITE_OFFICIAL_URL],
  };
}

/**
 * 生成 WebSite 结构化数据（含 SearchAction，启用站内搜索框）
 */
export function buildWebSiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAMES,
    url: SITE_URL,
    inLanguage: "zh-CN",
    description: SITE_SHORT_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * 生成 WebPage 结构化数据
 */
export function buildWebPageJsonLd(path: string, title: string, description: string) {
  return {
    "@type": "WebPage",
    "@id": absoluteSiteUrl(path),
    url: absoluteSiteUrl(path),
    title,
    description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    inLanguage: "zh-CN",
  };
}

/**
 * 生成 BreadcrumbList 结构化数据
 */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * 生成 FAQPage 结构化数据（可触发 Google 富结果）
 */
export function buildFaqJsonLd(items: FaqItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * 组装完整 JSON-LD @graph 结构
 */
export function buildJsonLdGraph(extraNodes: object[] = []) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationJsonLd(),
      buildWebSiteJsonLd(),
      ...extraNodes,
    ],
  };
}

/**
 * 将 JSON-LD 对象序列化为 script 标签的 dangerouslySetInnerHTML 内容
 */
export function jsonLdToString(data: object): string {
  return JSON.stringify(data);
}

// ─── 页面 Metadata 生成器 ──────────────────────────────────

export interface PageSeoInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  noindex?: boolean;
}

/**
 * 为子页面生成标准化的 Metadata 对象
 */
export function buildPageMetadata(input: PageSeoInput): Metadata {
  const url = absoluteSiteUrl(input.path);
  const ogImage = input.ogImage
    ? absoluteSiteUrl(input.ogImage)
    : absoluteSiteUrl(SITE_IMAGE_PATH);

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url,
      siteName: SITE_NAME,
      title: input.title,
      description: input.description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [ogImage],
    },
    robots: input.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

// ─── 社交分享链接生成器 ────────────────────────────────────

export interface ShareUrls {
  url: string;
  title: string;
  description: string;
}

export function buildShareUrls(input: ShareUrls) {
  const encodedUrl = encodeURIComponent(input.url);
  const encodedTitle = encodeURIComponent(input.title);
  const encodedDesc = encodeURIComponent(input.description);

  return {
    weibo: `https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}&pic=${encodeURIComponent(absoluteSiteUrl(SITE_IMAGE_PATH))}`,
    qq: `https://connect.qq.com/widget/shareqq/index.html?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDesc}`,
    qzone: `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDesc}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    copy: input.url,
  };
}

// ─── FAQ 常量数据 ──────────────────────────────────────────

export const SITE_FAQ: FaqItem[] = [
  {
    question: "KCOS 开放原子开源社团导航平台是什么？",
    answer:
      "KCOS 是科成开放原子开源社团打造的导航平台，汇集开源工具、学习资源、校园服务与开发利器，助力高校开源社区建设与发展。",
  },
  {
    question: "如何在 KCOS 平台上找到需要的开源工具？",
    answer:
      "访问平台首页即可浏览分类导航，涵盖开发工具、学习资源、校园服务等板块。你也可以通过站内搜索功能快速定位所需资源。",
  },
  {
    question: "KCOS 平台上的资源是免费的吗？",
    answer:
      "是的，KCOS 平台收录的开源工具和学习资源均为免费开放，欢迎高校开发者与开源爱好者自由使用和贡献。",
  },
  {
    question: "如何参与 KCOS 开放原子开源社团的贡献？",
    answer:
      "你可以通过 GitHub 仓库提交 Issue 或 Pull Request 参与项目贡献，也可加入社团参与线下活动与技术分享。",
  },
];

export { SITE_TITLE, SITE_DESCRIPTION, SITE_NAME, SITE_URL };
