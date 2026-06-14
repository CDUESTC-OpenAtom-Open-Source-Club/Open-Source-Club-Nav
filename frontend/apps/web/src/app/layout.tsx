import "./globals.css";
import type { Metadata } from "next";
import {
  SITE_DESCRIPTION,
  SITE_IMAGE_PATH,
  SITE_NAME,
  SITE_SHORT_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
  absoluteSiteUrl,
} from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "开放原子开源社团",
    "KCOS",
    "开源导航",
    "开源社区",
    "开源工具",
    "学习资源",
    "校园服务",
    "开发者工具",
    "开源项目",
    "高校开源",
    "成都理工大学工程技术学院",
    "OpenAtom",
    "开源软件",
    "编程学习",
    "GitHub",
  ],
  applicationName: "OpenAtom Club Nav",
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: absoluteSiteUrl(SITE_IMAGE_PATH),
        width: 714,
        height: 672,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_SHORT_DESCRIPTION,
    images: [absoluteSiteUrl(SITE_IMAGE_PATH)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: "google48ddc25dbc63e4c3.html",
    other: {
      "baidu-site-verification": "codeva-zDtYCzcU4Y",
      "sogou_site_verification": "aB0gc2Byrd",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["OpenAtom Club Nav", "KCOS 导航"],
    url: SITE_URL,
    description: SITE_SHORT_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: absoluteSiteUrl(SITE_IMAGE_PATH),
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icon.png" type="image/png" sizes="64x64" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
