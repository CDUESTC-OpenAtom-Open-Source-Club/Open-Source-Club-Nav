import { NextRequest, NextResponse } from "next/server";
import { pushUrlsToAllEngines, type PushResult } from "@/lib/seo-push";
import { SEO_ROUTES, absoluteSiteUrl, SITE_URL } from "@/lib/site";

/**
 * SEO 主动推送 API
 *
 * POST /api/seo/push
 * Body: { urls?: string[], engines?: ("baidu"|"google"|"indexnow")[] }
 *
 * - 不传 urls 时，自动推送所有可索引路由
 * - 返回各搜索引擎的推送结果
 */
export async function POST(request: NextRequest) {
  let body: { urls?: string[]; engines?: ("baidu" | "google" | "indexnow")[] };

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // 默认推送所有可索引路由
  let urls: string[];
  if (body.urls && Array.isArray(body.urls) && body.urls.length > 0) {
    urls = body.urls;
  } else {
    urls = SEO_ROUTES.filter((r) => r.indexable).map((r) => absoluteSiteUrl(r.path));
  }

  // 安全限制：单次最多 100 条
  if (urls.length > 100) {
    return NextResponse.json(
      { error: "单次最多推送 100 条 URL" },
      { status: 400 },
    );
  }

  const results: PushResult[] = await pushUrlsToAllEngines(urls, {
    engines: body.engines,
  });

  const successCount = results.filter((r) => r.success).length;
  const allSuccess = successCount === results.length;

  return NextResponse.json(
    {
      ok: allSuccess,
      pushedUrls: urls,
      results,
      summary: `${successCount}/${results.length} 引擎推送成功`,
    },
    { status: allSuccess ? 200 : 207 },
  );
}

/**
 * GET /api/seo/push — 返回推送配置状态（不执行推送）
 */
export async function GET() {
  return NextResponse.json({
    site: SITE_URL,
    engines: {
      baidu: {
        configured: !!(process.env.BAIDU_PUSH_SITE && process.env.BAIDU_PUSH_TOKEN),
      },
      google: {
        configured: !!(process.env.GOOGLE_INDEXING_CLIENT_EMAIL && process.env.GOOGLE_INDEXING_PRIVATE_KEY),
      },
      indexnow: {
        configured: !!process.env.INDEXNOW_KEY,
      },
    },
    indexableRoutes: SEO_ROUTES.filter((r) => r.indexable).map((r) => ({
      path: r.path,
      url: absoluteSiteUrl(r.path),
      priority: r.priority,
    })),
  });
}
