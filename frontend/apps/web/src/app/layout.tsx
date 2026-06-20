import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import {
  SITE_DESCRIPTION,
  SITE_IMAGE_PATH,
  SITE_NAME,
  SITE_SHORT_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
  absoluteSiteUrl,
} from "@/lib/site";
import {
  buildJsonLdGraph,
  buildWebPageJsonLd,
  buildFaqJsonLd,
  buildBreadcrumbJsonLd,
  SITE_FAQ,
  jsonLdToString,
} from "@/lib/seo";
import WebVitalsReporter from "@/components/shared/WebVitalsReporter";
import VisitTracker from "@/components/shared/VisitTracker";
import BaiduAutoPush from "@/components/shared/BaiduAutoPush";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

const enableProductionIntegrations = process.env.NODE_ENV === "production";

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
  other: {
    // 百度自动推送（轻量级，页面加载后异步触发）
    "baidu-push": "enabled",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 完整 JSON-LD @graph：Organization + WebSite(含搜索) + WebPage + Breadcrumb + FAQ
  const jsonLd = buildJsonLdGraph([
    buildWebPageJsonLd("/", SITE_TITLE, SITE_DESCRIPTION),
    buildBreadcrumbJsonLd([
      { name: "首页", url: SITE_URL },
    ]),
    buildFaqJsonLd(SITE_FAQ),
  ]);

  return (
    <html lang="zh-CN" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* dev 模式：在 HTML 解析阶段同步注销残留 Service Worker，防止 SW 拦截返回旧资源 */}
        {process.env.NODE_ENV === "development" ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `if("serviceWorker" in navigator){navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(x){x.unregister()})})}if(window.caches&&caches.keys){caches.keys().then(function(k){k.forEach(function(n){caches.delete(n)})})}`,
            }}
          />
        ) : null}
        {/* 结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdToString(jsonLd) }}
        />

        {enableProductionIntegrations ? (
          <>
            {/* DNS 预连接：加速第三方资源 */}
            <link rel="preconnect" href="https://sdk.51.la" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://sdk.51.la" />

            {/* 51.LA 统计：降级为 lazyOnload，不阻塞首屏渲染 */}
            <Script
              id="LA_COLLECT"
              src="https://sdk.51.la/js-sdk-pro.min.js"
              strategy="lazyOnload"
            />
            <Script
              id="la-collect-init"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `
                  (function initLA(retries) {
                    var sdk = window.LA;
                    if (sdk && typeof sdk.init === "function") {
                      sdk.init({
                        id: "3QJPple08RRBVP8s",
                        ck: "3QJPple08RRBVP8s",
                        autoTrack: true,
                        hashMode: true,
                        screenRecord: true
                      });
                      return;
                    }
                    if (retries > 0) {
                      window.setTimeout(function () {
                        initLA(retries - 1);
                      }, 500);
                    }
                  })(10);
                `,
              }}
            />
          </>
        ) : null}
      </head>
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {children}
        {/* 页面访问埋点 + Core Web Vitals 采集 + 百度自动推送（零 UI、不阻塞渲染） */}
        <VisitTracker />
        <WebVitalsReporter />
        {enableProductionIntegrations ? <BaiduAutoPush /> : null}
      </body>
    </html>
  );
}
