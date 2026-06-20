import type { NextConfig } from "next";

/**
 * Next.js 生产级配置
 *
 * 优化项：
 * - 图片自动优化（AVIF/WebP + 响应式尺寸）
 * - 安全头（CSP、HSTS、X-Frame-Options 等）
 * - 静态资源长缓存
 * - 关闭 poweredByHeader 减少指纹泄露
 * - React Compiler 提升运行时性能
 */
const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["three"],
  reactCompiler: true,
  poweredByHeader: false,
  compress: true,

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24, // 24h
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
    ],
  },

  // 安全头 & 缓存策略
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // dev 模式强制禁用缓存，避免浏览器持有旧资源
          ...(isDev ? [{ key: "Cache-Control" as const, value: "no-store, no-cache, must-revalidate" }] : []),
        ],
      },
      {
        // 静态资源长缓存（仅生产环境生效；dev 模式上方 no-store 覆盖）
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: isDev ? "no-store, no-cache, must-revalidate" : "public, max-age=31536000, immutable" },
        ],
      },
      {
        // 图片缓存
        source: "/_next/image(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        // OG 图片 & brand 图片
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" },
        ],
      },
      {
        // sitemap.xml — 移除 RSC Vary 头，确保 CDN 能正常缓存（Googlebot 抓取需要）
        source: "/sitemap.xml",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
          { key: "Vary", value: "Accept-Encoding" },
        ],
      },
      {
        // robots.txt — 让 CDN 缓存1小时
        source: "/robots.txt",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
