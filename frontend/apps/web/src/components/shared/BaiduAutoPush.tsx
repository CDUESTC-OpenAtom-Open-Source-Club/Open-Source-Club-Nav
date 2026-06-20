"use client";

import { useEffect } from "react";

/**
 * BaiduAutoPush — 百度自动推送组件
 *
 * 页面加载后自动将当前 URL 提交到百度搜索引擎，
 * 加速新页面的收录。仅在浏览器端执行，不阻塞渲染。
 *
 * 集成方式：在根 layout 或页面中引入即可
 * <BaiduAutoPush />
 */
export default function BaiduAutoPush() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 仅对可索引页面推送（排除 /admin、/api 等）
    const path = window.location.pathname;
    if (path.startsWith("/admin") || path.startsWith("/api")) return;

    const fullUrl = window.location.href;

    // 延迟推送，避免与首屏资源竞争
    const timer = window.setTimeout(() => {
      fetch("/api/seo/baidu-auto-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fullUrl }),
        keepalive: true,
      }).catch(() => {
        // 静默失败，不影响用户体验
      });
    }, 3000);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
