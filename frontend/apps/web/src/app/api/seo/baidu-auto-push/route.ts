import { NextRequest, NextResponse } from "next/server";
import { pushToBaidu } from "@/lib/seo-push";
import { SITE_URL } from "@/lib/site";

/**
 * 百度自动推送（客户端触发）
 *
 * 当用户访问页面时，前端自动调用此接口，
 * 将当前页面 URL 提交给百度搜索引擎加速收录。
 *
 * POST /api/seo/baidu-auto-push
 * Body: { url: string }
 */
export async function POST(request: NextRequest) {
  let body: { url?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }

  const url = body.url;
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "缺少 url 参数" }, { status: 400 });
  }

  // 安全检查：只推送本站 URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "无效的 URL" }, { status: 400 });
  }

  if (parsedUrl.origin !== SITE_URL) {
    return NextResponse.json({ error: "仅支持推送本站 URL" }, { status: 403 });
  }

  const result = await pushToBaidu([url]);

  return NextResponse.json({
    ok: result.success,
    engine: "baidu",
    message: result.message,
  });
}
