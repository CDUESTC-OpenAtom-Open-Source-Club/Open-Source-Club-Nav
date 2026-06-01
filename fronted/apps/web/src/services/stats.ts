// 统计服务 - 统一调用 Go 后端 API
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";

export async function getAdminStats() {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/admin/stats`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!response.ok) throw new Error(`Backend API ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("[stats] Go 后端不可用:", (error as Error).message);
    return {
      today: { stat_date: new Date().toISOString().slice(0, 10), page_views: 0, unique_visitors: 0, link_clicks: 0 },
      days: [],
      trend7: [],
      hourly24: Array.from({ length: 24 }, (_, hour) => ({ hour, page_views: 0, unique_visitors: 0, link_clicks: 0 })),
      popularRepos: [],
      popularCategories: [],
    };
  }
}

export async function recordVisit(visitorId: string): Promise<{ newVisitor: boolean }> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/metrics/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ visitor_id: visitorId }),
    });

    if (!response.ok) return { newVisitor: false };
    return await response.json();
  } catch {
    return { newVisitor: false };
  }
}

export async function recordClick(params?: {
  navItemId?: number | null;
  visitorId?: string | null;
  pagePath?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  targetUrl?: string | null;
  targetLabel?: string | null;
  sourceContext?: string | null;
}): Promise<void> {
  try {
    await fetch(`${BACKEND_API_URL}/api/metrics/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nav_item_id: params?.navItemId ?? null,
        visitor_id: params?.visitorId ?? null,
        page_path: params?.pagePath ?? null,
        referrer: params?.referrer ?? null,
        user_agent: params?.userAgent ?? null,
        target_url: params?.targetUrl ?? null,
        target_label: params?.targetLabel ?? null,
        source_context: params?.sourceContext ?? null,
      }),
    });
  } catch {
    // 静默失败
  }
}
