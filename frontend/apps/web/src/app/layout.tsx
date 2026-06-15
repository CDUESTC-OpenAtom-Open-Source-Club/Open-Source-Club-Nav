import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
} from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

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
  manifest: "/manifest.webmanifest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "64x64" }],
    apple: [{ url: "/icon.png", type: "image/png", sizes: "64x64" }],
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
    canonical: absoluteSiteUrl("/"),
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
    "@graph": [
      {
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
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAMES,
        url: SITE_URL,
        inLanguage: "zh-CN",
        description: SITE_SHORT_DESCRIPTION,
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
      },
    ],
  };

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
