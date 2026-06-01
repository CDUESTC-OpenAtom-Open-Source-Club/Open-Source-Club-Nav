import { apiClient } from "@/lib/api-client";

type AdminStatsResponse = {
  today: { stat_date: string; page_views: number; unique_visitors: number; link_clicks: number };
  days: unknown[];
  trend7: unknown[];
  hourly24: Array<{ hour: number; page_views: number; unique_visitors: number; link_clicks: number }>;
  popularRepos: unknown[];
  popularCategories: unknown[];
};

/** Stats service for dashboard widgets and client tracking. */
export async function getAdminStats(): Promise<AdminStatsResponse> {
  try {
    return await apiClient.get<AdminStatsResponse>("/api/admin/stats", { cache: "no-store" });
  } catch {
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
    return await apiClient.post<{ newVisitor: boolean }>("/api/metrics/visit", { visitor_id: visitorId });
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
    await apiClient.post("/api/metrics/click", {
      nav_item_id: params?.navItemId ?? null,
      visitor_id: params?.visitorId ?? null,
      page_path: params?.pagePath ?? null,
      referrer: params?.referrer ?? null,
      user_agent: params?.userAgent ?? null,
      target_url: params?.targetUrl ?? null,
      target_label: params?.targetLabel ?? null,
      source_context: params?.sourceContext ?? null,
    });
  } catch {
    // keep silent
  }
}
