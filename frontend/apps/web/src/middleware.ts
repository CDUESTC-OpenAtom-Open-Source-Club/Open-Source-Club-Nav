import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Dev 模式中间件：拦截 Service Worker 脚本请求，返回自注销脚本。
 *
 * 背景：项目本身不注册 SW，但浏览器可能残留其它项目/测试注册的 SW。
 * 残留 SW 会拦截 HTML 请求返回旧页面，形成"代码改了但永远不生效"的死循环。
 *
 * 浏览器默认每次导航都会重新获取 SW 脚本检查更新。本中间件在 dev 模式下
 * 拦截常见 SW 路径，返回一段会注销自身并清除缓存的脚本，从而打破死循环。
 */
const SW_PATHS = new Set([
  "/sw.js",
  "/service-worker.js",
  "/serviceWorker.js",
  "/worker.js",
  "/workbox-sw.js",
  "/sw.ts",
  "/firebase-messaging-sw.js",
  "/ngsw-worker.js",
]);

// Self-destructing service worker script
const SW_UNREGISTER_SCRIPT = `
self.addEventListener("install", function (e) { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(
    (async function () {
      try {
        var keys = await caches.keys();
        await Promise.all(keys.map(function (k) { return caches.delete(k); }));
      } catch (err) {}
      try {
        var regs = await self.registration.unregister();
        console.log("[dev] SW self-unregistered:", regs);
      } catch (err) {}
      var clients = await self.clients.matchAll({ type: "window" });
      clients.forEach(function (c) { c.navigate(c.url); });
    })()
  );
});
self.addEventListener("fetch", function (e) { e.respondWith(fetch(e.request)); });
`;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Intercept SW script requests in all environments (dev needs it most)
  if (SW_PATHS.has(pathname)) {
    return new NextResponse(SW_UNREGISTER_SCRIPT, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Service-Worker-Allowed": "/",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all SW-related paths
    "/sw.js",
    "/service-worker.js",
    "/serviceWorker.js",
    "/worker.js",
    "/workbox-sw.js",
    "/sw.ts",
    "/firebase-messaging-sw.js",
    "/ngsw-worker.js",
  ],
};
