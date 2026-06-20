import { NextRequest, NextResponse } from "next/server";

/**
 * Web Vitals 上报端点
 *
 * 接收前端 PerformanceObserver 采集的 Core Web Vitals 数据。
 * 此处仅做日志记录，可扩展为写入数据库或发送到分析平台。
 *
 * POST /api/metrics/web-vitals
 * Body: { url, path, referrer, vitals: { lcp, inp, cls, fcp, ttfb }, ts }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 开发环境打印，便于调试
    if (process.env.NODE_ENV === "development") {
      console.log("[WebVitals]", {
        path: body.path,
        vitals: body.vitals,
      });
    }

    // TODO: 可扩展为写入数据库或发送到 51.la / Google Analytics
    // 当前仅返回成功，保证 sendBeacon 不重试
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
