export interface DailyStatRow {
  stat_date: string;
  page_views: number;
  unique_visitors: number;
  link_clicks: number;
}

export interface PopularCategory {
  repo: string;
  url: string;
  clicks: number;
  trend7: Array<{
    stat_date: string;
    clicks: number;
  }>;
  isValid: boolean | null;
}

export interface StatsResponse {
  today: DailyStatRow;
  days: DailyStatRow[];
  trend7: DailyStatRow[];
  popularCategories: PopularCategory[];
}
