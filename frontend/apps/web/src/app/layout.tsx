import "./globals.css";
import type { Metadata } from "next";

const SITE_URL = "https://nav.kcos.club";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "KCOS 开放原子开源社团 - 开源导航平台",
    template: "%s | KCOS 开放原子开源社团",
  },
  description:
    "科成开放原子开源社团导航平台，汇集开源工具、学习资源、校园服务、开发利器，助力高校开源社区建设与发展。",
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
  authors: [{ name: "KCOS 开放原子开源社团", url: SITE_URL }],
  creator: "KCOS 开放原子开源社团",
  publisher: "KCOS 开放原子开源社团",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "KCOS 开放原子开源社团",
    title: "KCOS 开放原子开源社团 - 开源导航平台",
    description:
      "科成开放原子开源社团导航平台，汇集开源工具、学习资源、校园服务、开发利器，助力高校开源社区建设与发展。",
    images: [
      {
        url: `${SITE_URL}/images/brand/club-logo-user.jpg`,
        width: 714,
        height: 672,
        alt: "KCOS 开放原子开源社团",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KCOS 开放原子开源社团 - 开源导航平台",
    description:
      "科成开放原子开源社团导航平台，汇集开源工具、学习资源、校园服务、开发利器。",
    images: [`${SITE_URL}/images/brand/club-logo-user.jpg`],
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
    name: "KCOS 开放原子开源社团",
    alternateName: ["OpenAtom Club Nav", "KCOS 导航"],
    url: SITE_URL,
    description:
      "科成开放原子开源社团导航平台，汇集开源工具、学习资源、校园服务、开发利器。",
    publisher: {
      "@type": "Organization",
      name: "KCOS 开放原子开源社团",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/brand/club-logo-user.jpg`,
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
