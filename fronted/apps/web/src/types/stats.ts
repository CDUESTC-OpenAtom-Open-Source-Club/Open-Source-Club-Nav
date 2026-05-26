export interface DailyStatRow {
  stat_date: string;
  page_views: number;
  unique_visitors: number;
  link_clicks: number;
}

export interface PopularCategory {
  category: string;
  clicks: number;
}

export interface StatsResponse {
  today: DailyStatRow;
  days: DailyStatRow[];
  trend7: DailyStatRow[];
  popularCategories: PopularCategory[];
}
