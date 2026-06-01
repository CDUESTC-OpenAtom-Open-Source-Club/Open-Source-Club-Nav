// @route-desc BFF API route proxy/handler for /api/healthz/route.ts
import { NextResponse } from "next/server";

/**
 * GET /api/healthz
 * 轻量级健康检查端点，供 Docker / 负载均衡器探活。
 * 不依赖数据库、不产生副作用。
 */
export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
