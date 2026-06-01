export type AdminRole = "super" | "editor";

export interface AdminSession {
  userId: number;
  username: string;
  role: AdminRole;
  exp: number;
}

export interface AdminUser {
  id: number;
  username: string;
  role: AdminRole;
  created_at: string;
  last_login_at: string | null;
}

export interface DailyStats {
  stat_date: string;
  page_views: number;
  unique_visitors: number;
  link_clicks: number;
}

export interface LinkLog {
  id: number;
  link_id: number | null;
  action: string;
  actor_username: string;
  actor_role: string;
  detail: Record<string, unknown> | null;
  created_at: string;
}

export interface LinkHealth {
  link_id: number;
  url: string;
  status_code: number | null;
  is_ok: number;
  checked_at: string;
  message: string;
  title: string;
}
