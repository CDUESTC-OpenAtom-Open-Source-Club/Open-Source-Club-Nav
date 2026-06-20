"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";

export type AdminConsoleUser = {
  id: number;
  username: string;
  role: "super" | "editor";
};

export type AdminUserRecord = {
  id: number;
  username: string;
  role: "super" | "editor";
  created_at: string;
  last_login_at: string | null;
};

type AdminNavModule = "resource_matrix" | "friend_links" | "mini_games";
type AdminResourceSubModule = "think_tank" | "campus" | "tools";

export type AdminLinkHealth = {
  id?: number;
  link_id: number;
  title: string;
  url?: string;
  status_code: number | null;
  is_ok: boolean | number;
  message?: string | null;
  checked_at: string;
  module?: AdminNavModule;
  resource_sub_module?: AdminResourceSubModule | null;
};

export type AdminHealthProgress = {
  checked: number;
  total: number;
  failed: number;
  skipped?: number;
  current_title?: string;
  current_url?: string;
} | null;

export type AdminLinkLog = {
  id: number;
  link_id: number | null;
  link_title?: string | null;
  action: string;
  actor_username: string;
  actor_role: string;
  created_at: string;
  detail?: unknown;
};

type UserFormState = {
  username: string;
  password: string;
  role: "super" | "editor";
};

type ActionTag = { text: string; fg: string; bg: string };

const ADMIN_RESPONSIVE_CRITICAL_CSS = `
.admin-console-content{container-type:inline-size;min-width:0;max-width:100%;overflow-x:hidden}
.admin-responsive-section,.admin-links-panel,.admin-health-panel,.admin-logs-panel,.admin-users-panel,.admin-links-submodule-tabs,.admin-links-form-shell,.admin-links-module-meta,.admin-link-create-form,.admin-health-summary-grid,.admin-health-toolbar,.admin-health-toolbar-main,.admin-health-progress,.admin-health-meta,.admin-health-actions,.admin-links-table-shell,.admin-health-table-shell,.admin-console-logs-table-shell,.admin-users-table-shell,.admin-links-table,.admin-health-table,.admin-console-logs-table,.admin-users-table{min-width:0;max-width:100%}
.admin-console-user-card{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0;max-width:100%;padding:14px;border-color:#93c5fd;background:linear-gradient(135deg,rgba(226,238,252,.96),rgba(248,250,252,.98));box-shadow:0 14px 34px rgba(37,99,235,.18)}
.admin-console-user-card__main{display:grid;gap:4px;min-width:0}
.admin-console-user-card__title{color:#0f172a;font-size:20px;font-weight:800;line-height:1.25}
.admin-console-user-card__meta{color:#64748b;font-size:12px;line-height:1.5;word-break:break-word}
.admin-console-user-card__actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;min-width:0}
.admin-console-pagehead{position:relative;overflow:hidden;min-width:0;max-width:100%;padding:16px;background:linear-gradient(135deg,rgba(239,246,255,.96),rgba(248,250,252,.98))!important;border-color:#dbeafe!important}
.admin-console-pagehead-title{position:relative;z-index:1;font-size:18px;font-weight:800;color:#0f172a}
.admin-console-pagehead-desc{position:relative;z-index:1;margin-top:6px;font-size:13px;line-height:1.6;color:#64748b;max-width:680px}
.admin-links-panel,.admin-health-panel,.admin-logs-panel,.admin-users-panel{display:grid;gap:12px;padding:16px;overflow-x:clip}
.admin-links-panel{border-color:#e6ecf5;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.04)}
.admin-links-module-meta{line-height:1.5;overflow-wrap:anywhere}
.admin-link-create-form{align-items:center}
.admin-link-create-form__submit{width:100%}
.admin-health-panel{gap:16px;border-color:#e6ecf5;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,250,252,.96))!important;box-shadow:0 8px 24px rgba(15,23,42,.04)}
.admin-logs-panel{border-color:#e6ecf5;background:#f5f7fa}
.admin-users-panel{background:#fff}
.admin-health-summary-grid{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:12px}
.admin-health-summary-card{min-width:0;border:1px solid #e8eef6;border-radius:10px;background:#fff;padding:14px}
.admin-health-summary-card--score{box-shadow:inset 0 0 0 1px rgba(24,144,255,.06)}
.admin-health-summary-label{color:#64748b;font-size:12px;letter-spacing:.02em}
.admin-health-summary-value{color:#0f172a;font-size:22px;font-weight:800;line-height:1.35}
.admin-health-summary-value--primary{color:#1890ff;font-size:26px}
.admin-health-summary-value--danger{color:#dc2626}
.admin-health-latest-time{color:#0f172a;font-size:18px;font-weight:800;line-height:1.35;white-space:nowrap}
.admin-health-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid #e8eef6;border-radius:10px;background:#fff}
.admin-health-toolbar-main{display:flex;align-items:center;flex:1 1 240px;gap:12px}
.admin-health-progress{display:grid;gap:4px;min-width:280px}
.admin-health-progress__track{height:8px;overflow:hidden;border-radius:999px;background:#e2e8f0}
.admin-health-progress__bar{height:100%;border-radius:inherit;background:linear-gradient(90deg,#93c5fd,#2563eb);transition:width .15s ease}
.admin-health-progress__bar--pending{background:linear-gradient(90deg,#bfdbfe,#2563eb,#bfdbfe);background-size:200% 100%;animation:admin-health-progress-pending 1.1s linear infinite}
.admin-health-progress__meta{color:#475569;font-size:12px;line-height:1.4;white-space:nowrap}
.admin-health-progress__danger{margin-left:4px;color:#dc2626}
.admin-monthly-chart-layout,.admin-monthly-control-panel,.admin-monthly-metric-tabs,.admin-monthly-date-group,.admin-monthly-date-head,.admin-monthly-date-inputs,.admin-monthly-summary-grid,.admin-monthly-chart-surface,.admin-monthly-chart-inner,.admin-monthly-bars,.admin-monthly-bar-item{min-width:0;max-width:100%}
.admin-monthly-date-inputs .admin-input{min-width:0;width:100%}
.admin-monthly-bar{justify-self:center}
@keyframes admin-health-progress-pending{0%{background-position:200% 0}100%{background-position:-200% 0}}
@container (max-width:1280px){
.admin-console-content .admin-monthly-chart-layout{grid-template-columns:minmax(0,1fr)!important}
.admin-console-content .admin-monthly-control-panel,.admin-console-content .admin-monthly-chart-surface{width:100%}
.admin-console-content .admin-monthly-chart-surface{min-height:300px!important}
}
@container (max-width:900px){
.admin-console-content .admin-links-panel{padding:12px!important;overflow-x:clip}
.admin-console-content .admin-link-create-form{grid-template-columns:minmax(0,1fr)!important}
.admin-console-content .admin-link-create-form__submit{grid-column:auto}
.admin-console-content .admin-links-table-shell{overflow:visible!important;background:transparent!important;border:0!important}
.admin-console-content .admin-links-table{width:100%!important;min-width:0!important;table-layout:fixed!important}
.admin-console-content .admin-links-table thead{display:none!important}
.admin-console-content .admin-links-table tbody{display:grid!important;gap:10px}
.admin-console-content .admin-links-table tr{display:grid!important;width:100%;min-width:0;gap:8px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#fff!important;box-shadow:0 8px 18px rgba(15,23,42,.04)}
.admin-console-content .admin-links-table td{display:grid!important;grid-template-columns:minmax(84px,30%) minmax(0,1fr);gap:8px;min-width:0!important;max-width:100%;padding:0!important;border-bottom:0!important;background:transparent!important;white-space:normal!important;word-break:break-word;overflow-wrap:anywhere;line-height:1.5}
.admin-console-content .admin-links-table td:before{content:attr(data-label);color:#64748b;font-size:11px;font-weight:800;letter-spacing:.02em}
.admin-console-content .admin-links-table td>*{min-width:0;max-width:100%;overflow-wrap:anywhere}
.admin-console-content .admin-links-actions-cell{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
.admin-console-content .admin-links-actions-cell:before{grid-column:1/-1;margin-bottom:-2px}
.admin-console-content .admin-links-actions-cell .admin-btn,.admin-console-content .admin-links-actions-cell .admin-btn-ghost{width:100%}
.admin-console-content .admin-links-table .admin-link-url-preview-trigger{max-width:100%!important;white-space:normal;word-break:break-all}
}
.admin-health-meta{display:grid;gap:4px}
.admin-health-meta__title{color:#475569;font-size:13px;font-weight:700}
.admin-health-meta__desc{color:#64748b;font-size:12px;line-height:1.5;overflow-wrap:anywhere}
.admin-health-actions{display:flex;align-items:center;gap:8px}
.admin-health-auto-button[data-enabled=true]{border-color:#86efac;color:#166534}
.admin-links-table-shell,.admin-health-table-shell,.admin-console-logs-table-shell,.admin-users-table-shell{background:#fff;border:1px solid #e8eef6;border-radius:10px;overflow-x:auto}
.admin-links-table,.admin-health-table,.admin-console-logs-table,.admin-users-table{width:100%;border-collapse:collapse;font-size:13px;min-width:0}
.admin-console-logs-table{min-width:920px}
.admin-links-table th,.admin-health-table th,.admin-console-logs-table th,.admin-users-table th{padding:12px 14px;border-bottom:1px solid #e8eef6;text-align:left;color:#334155;font-weight:700;background:#f8fafd}
.admin-links-table td,.admin-health-table td,.admin-console-logs-table td,.admin-users-table td{padding:11px 14px;border-bottom:1px solid #f1f5f9;min-width:0;vertical-align:top}
.admin-health-table tbody tr{background:#fff1f0}
.admin-health-target-button{min-height:0;height:auto;padding:2px 8px;border-radius:6px}
.admin-health-status-cell{min-width:0;word-break:break-word;overflow-wrap:anywhere}
.admin-health-status-text{color:#dc2626;font-weight:800}
.admin-health-status-message{margin-left:8px;color:#64748b;font-size:12px;overflow-wrap:anywhere;word-break:break-word}
.admin-health-empty-row{padding:14px;border-top:1px solid #f1f5f9;color:#64748b;font-size:13px}
.admin-log-actor-cell{color:#0f172a;font-weight:700}
.admin-log-role-badge,.admin-log-action-badge{display:inline-flex;align-items:center;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:700;line-height:1.4}
.admin-log-role-badge{color:#475569;background:#f1f5f9}
.admin-log-detail-cell{color:#64748b;line-height:1.5;max-width:360px;overflow-wrap:anywhere;word-break:break-all}
.admin-users-form{display:grid;grid-template-columns:1fr 1fr 140px 120px;gap:8px}
.admin-users-actions-cell{display:flex;align-items:center;gap:8px;min-width:360px}
.admin-users-password-input{width:110px;min-width:0}
.admin-danger-button{border-color:#fca5a5;color:#b91c1c}
@media (max-width:640px),(max-device-width:640px){
.admin-console-user-card{align-items:stretch;flex-direction:column}
.admin-console-user-card__actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%}
.admin-console-user-card__actions .admin-btn-ghost{width:100%}
.admin-health-panel,.admin-logs-panel,.admin-users-panel{padding:12px!important;overflow-x:clip}
.admin-health-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
.admin-health-summary-card{padding:12px!important}
.admin-health-summary-card--score,.admin-health-summary-card--latest{grid-column:span 2}
.admin-health-latest-time{font-size:15px!important;white-space:normal!important;word-break:break-word}
.admin-health-toolbar{display:grid!important;grid-template-columns:minmax(0,1fr)!important;justify-content:stretch!important;justify-items:stretch;gap:12px!important;padding:12px!important}
.admin-health-toolbar-main{display:grid!important;grid-template-columns:minmax(0,1fr);width:100%;gap:10px!important}
.admin-health-progress{width:100%;min-width:0!important}
.admin-health-progress__meta{white-space:normal}
.admin-health-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%;gap:8px!important}
.admin-health-actions .admin-btn,.admin-health-actions .admin-btn-ghost{width:100%;min-width:0}
.admin-monthly-chart-layout{grid-template-columns:minmax(0,1fr)!important}
.admin-monthly-chart-surface{min-height:auto!important;overflow:visible!important;padding:12px!important}
.admin-monthly-chart-surface::after{display:none!important}
.admin-monthly-chart-inner{gap:10px!important}
.admin-monthly-date-inputs{grid-template-columns:minmax(0,1fr)!important}
.admin-monthly-date-inputs>span{text-align:center}
.admin-monthly-bars{display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-items:stretch!important;gap:8px!important;min-height:0!important;overflow:visible!important;padding:4px 0 0!important}
.admin-monthly-bar-item{display:grid!important;grid-template-columns:54px minmax(0,1fr) 44px!important;align-items:center!important;justify-items:stretch!important;gap:8px!important;width:100%!important;min-width:0!important;min-height:44px;padding:7px 8px!important;border:1px solid #e2e8f0!important;border-radius:8px;background:#fff!important;text-align:left}
.admin-monthly-bar-date{order:1;transform:none!important;white-space:nowrap!important;text-align:left;font-size:11px!important}
.admin-monthly-bar{order:2;justify-self:start!important;width:var(--admin-monthly-bar-percent)!important;max-width:100%;height:10px!important;border-radius:999px!important;transform:none!important}
.admin-monthly-bar-value{order:3;text-align:right;font-size:11px!important}
.admin-health-table-shell,.admin-console-logs-table-shell,.admin-users-table-shell{overflow:visible!important;background:transparent!important;border:0!important}
.admin-health-table,.admin-console-logs-table,.admin-users-table{width:100%!important;min-width:0!important;table-layout:fixed!important}
.admin-health-table thead,.admin-console-logs-table thead,.admin-users-table thead{display:none!important}
.admin-health-table tbody,.admin-console-logs-table tbody,.admin-users-table tbody{display:grid!important;gap:10px}
.admin-health-table tr,.admin-console-logs-table tr,.admin-users-table tr{display:grid!important;width:100%;min-width:0;gap:8px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#fff!important;box-shadow:0 8px 18px rgba(15,23,42,.04)}
.admin-health-table td,.admin-console-logs-table td,.admin-users-table td{display:grid!important;grid-template-columns:minmax(84px,30%) minmax(0,1fr);gap:8px;min-width:0!important;max-width:100%;padding:0!important;border-bottom:0!important;background:transparent!important;white-space:normal!important;word-break:break-word;overflow-wrap:anywhere;line-height:1.5}
.admin-health-table td:before,.admin-console-logs-table td:before,.admin-users-table td:before{content:attr(data-label);color:#64748b;font-size:11px;font-weight:800;letter-spacing:.02em}
.admin-health-table td>*,.admin-console-logs-table td>*,.admin-users-table td>*{min-width:0;max-width:100%;overflow-wrap:anywhere}
.admin-health-status-cell{grid-template-columns:1fr!important}
.admin-health-status-cell:before,.admin-users-actions-cell:before{margin-bottom:-2px}
.admin-health-status-message{display:block;margin-top:4px;margin-left:0!important}
.admin-log-detail-cell{max-width:none}
.admin-users-form{grid-template-columns:minmax(0,1fr)!important}
.admin-users-actions-cell{display:grid!important;grid-template-columns:minmax(0,1fr)!important;min-width:0!important;gap:8px!important}
.admin-users-actions-cell .admin-btn,.admin-users-actions-cell .admin-btn-ghost,.admin-users-password-input{width:100%!important;min-width:0}
.admin-table-empty-row td{display:block!important;padding:12px!important}
.admin-table-empty-row td:before{content:none!important}
}
@container (max-width:640px){
.admin-console-user-card{align-items:stretch;flex-direction:column}
.admin-console-user-card__actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%}
.admin-console-user-card__actions .admin-btn-ghost{width:100%}
.admin-health-panel,.admin-logs-panel,.admin-users-panel{padding:12px!important;overflow-x:clip}
.admin-health-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
.admin-health-summary-card--score,.admin-health-summary-card--latest{grid-column:span 2}
.admin-health-latest-time{font-size:15px!important;white-space:normal!important;word-break:break-word}
.admin-health-toolbar{display:grid!important;grid-template-columns:minmax(0,1fr)!important;justify-content:stretch!important;justify-items:stretch;gap:12px!important;padding:12px!important}
.admin-health-toolbar-main{display:grid!important;grid-template-columns:minmax(0,1fr);width:100%;gap:10px!important}
.admin-health-progress{width:100%;min-width:0!important}
.admin-health-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%;gap:8px!important}
.admin-health-actions .admin-btn,.admin-health-actions .admin-btn-ghost{width:100%;min-width:0}
.admin-monthly-chart-layout{grid-template-columns:minmax(0,1fr)!important}
.admin-monthly-chart-surface{min-height:auto!important;overflow:visible!important;padding:12px!important}
.admin-monthly-chart-surface::after{display:none!important}
.admin-monthly-chart-inner{gap:10px!important}
.admin-monthly-date-inputs{grid-template-columns:minmax(0,1fr)!important}
.admin-monthly-date-inputs>span{text-align:center}
.admin-monthly-bars{display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-items:stretch!important;gap:8px!important;min-height:0!important;overflow:visible!important;padding:4px 0 0!important}
.admin-monthly-bar-item{display:grid!important;grid-template-columns:54px minmax(0,1fr) 44px!important;align-items:center!important;justify-items:stretch!important;gap:8px!important;width:100%!important;min-width:0!important;min-height:44px;padding:7px 8px!important;border:1px solid #e2e8f0!important;border-radius:8px;background:#fff!important;text-align:left}
.admin-monthly-bar-date{order:1;transform:none!important;white-space:nowrap!important;text-align:left;font-size:11px!important}
.admin-monthly-bar{order:2;justify-self:start!important;width:var(--admin-monthly-bar-percent)!important;max-width:100%;height:10px!important;border-radius:999px!important;transform:none!important}
.admin-monthly-bar-value{order:3;text-align:right;font-size:11px!important}
.admin-health-table-shell,.admin-console-logs-table-shell,.admin-users-table-shell{overflow:visible!important;background:transparent!important;border:0!important}
.admin-health-table,.admin-console-logs-table,.admin-users-table{width:100%!important;min-width:0!important;table-layout:fixed!important}
.admin-health-table thead,.admin-console-logs-table thead,.admin-users-table thead{display:none!important}
.admin-health-table tbody,.admin-console-logs-table tbody,.admin-users-table tbody{display:grid!important;gap:10px}
.admin-health-table tr,.admin-console-logs-table tr,.admin-users-table tr{display:grid!important;width:100%;min-width:0;gap:8px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#fff!important;box-shadow:0 8px 18px rgba(15,23,42,.04)}
.admin-health-table td,.admin-console-logs-table td,.admin-users-table td{display:grid!important;grid-template-columns:minmax(84px,30%) minmax(0,1fr);gap:8px;min-width:0!important;max-width:100%;padding:0!important;border-bottom:0!important;background:transparent!important;white-space:normal!important;word-break:break-word;overflow-wrap:anywhere;line-height:1.5}
.admin-health-table td:before,.admin-console-logs-table td:before,.admin-users-table td:before{content:attr(data-label);color:#64748b;font-size:11px;font-weight:800;letter-spacing:.02em}
.admin-health-table td>*,.admin-console-logs-table td>*,.admin-users-table td>*{min-width:0;max-width:100%;overflow-wrap:anywhere}
.admin-health-status-cell{grid-template-columns:1fr!important}
.admin-health-status-message{display:block;margin-top:4px;margin-left:0!important}
.admin-log-detail-cell{max-width:none}
.admin-users-form{grid-template-columns:minmax(0,1fr)!important}
.admin-users-actions-cell{display:grid!important;grid-template-columns:minmax(0,1fr)!important;min-width:0!important;gap:8px!important}
.admin-users-actions-cell .admin-btn,.admin-users-actions-cell .admin-btn-ghost,.admin-users-password-input{width:100%!important;min-width:0}
}
`;

export function AdminResponsiveCriticalStyles() {
  return (
    <style
      id="admin-responsive-critical-styles"
      dangerouslySetInnerHTML={{ __html: ADMIN_RESPONSIVE_CRITICAL_CSS }}
    />
  );
}

function adminModuleLabel(moduleValue: unknown, subModuleValue?: unknown): string {
  const moduleKey = String(moduleValue || "");
  if (moduleKey === "resource_matrix") {
    const subKey = String(subModuleValue || "");
    if (subKey === "campus") return "资源矩阵/校园";
    if (subKey === "tools") return "资源矩阵/工具";
    return "资源矩阵/智库";
  }
  if (moduleKey === "mini_games") return "小游戏";
  if (moduleKey === "friend_links") return "友情链接";
  return "未分类";
}

function adminHealthOk(item: AdminLinkHealth): boolean {
  return item.is_ok === true || item.is_ok === 1;
}

function adminHealthStatusText(item: AdminLinkHealth): string {
  if (adminHealthOk(item)) return "运行正常";
  if (item.status_code) return `HTTP ${item.status_code}`;
  return "连接失败";
}

function formatAdminDateTime(value?: string | null): string {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 19);
}

export function AdminUserCard({
  user,
  onHome,
  onLogout,
}: {
  user: AdminConsoleUser;
  onHome: () => void;
  onLogout: () => void;
}) {
  return (
    <div id="overview" className="admin-card admin-console-anchor-card admin-console-user-card">
      <div className="admin-console-user-card__main">
        <div className="admin-console-user-card__title">管理后台</div>
        <div className="admin-console-user-card__meta">
          当前用户：{user.username}（{user.role === "super" ? "超级管理员" : "编辑"}）
        </div>
      </div>
      <div className="admin-console-user-card__actions">
        <button type="button" onClick={onHome} className="admin-btn-ghost">
          返回首页
        </button>
        <button type="button" onClick={onLogout} className="admin-btn-ghost">
          退出登录
        </button>
      </div>
    </div>
  );
}

export function AdminHealthSection({
  health,
  failedHealth,
  healthProgress,
  latestHealthCheckedAt,
  autoDetectEnabled,
  autoDetectIntervalMinutes,
  lastAutoDetectAt,
  healthChecking,
  onOpenAutoDetect,
  onRunHealthCheck,
  onJumpToLink,
}: {
  health: AdminLinkHealth[];
  failedHealth: AdminLinkHealth[];
  healthProgress: AdminHealthProgress;
  latestHealthCheckedAt: string;
  autoDetectEnabled: boolean;
  autoDetectIntervalMinutes: number;
  lastAutoDetectAt: string | null;
  healthChecking: boolean;
  onOpenAutoDetect: () => void;
  onRunHealthCheck: () => void;
  onJumpToLink: (item: AdminLinkHealth) => void | Promise<void>;
}) {
  const healthScore = health.length
    ? `${Math.round(((health.length - failedHealth.length) / health.length) * 100)}%`
    : "-";
  const visibleHealthProgress = healthChecking || healthProgress !== null;
  const progressChecked = healthProgress?.checked ?? 0;
  const progressTotal = healthProgress?.total ?? 0;
  const progressFailed = healthProgress?.failed ?? 0;
  const progressPercent = progressTotal > 0 ? Math.min(100, Math.round((progressChecked / progressTotal) * 100)) : 0;
  const visibleProgressPercent = progressPercent > 0 ? progressPercent : healthChecking ? 4 : 0;
  const progressBarWidth = progressTotal > 0 ? `${visibleProgressPercent}%` : healthChecking ? "34%" : "0%";
  const progressMeta = progressTotal > 0
    ? `${progressPercent}% · ${progressChecked}/${progressTotal}`
    : healthChecking ? "准备探测..." : "探测已提交";

  return (
    <div className="admin-section-transition admin-responsive-section">
      <div className="admin-card admin-console-pagehead">
        <div className="admin-console-pagehead-title">链接健康检测</div>
        <div className="admin-console-pagehead-desc">
          逐个探测所有启用链接；下方仅展示异常对象，正常状态在内容管理中查看。
        </div>
      </div>
      <div id="health" className="admin-card admin-health-panel">
        <div className="admin-health-summary-grid">
          <div className="admin-health-summary-card admin-health-summary-card--score">
            <div className="admin-health-summary-label">健康度评估</div>
            <div className="admin-health-summary-value admin-health-summary-value--primary">{healthScore}</div>
          </div>
          <div className="admin-health-summary-card">
            <div className="admin-health-summary-label">已检测项</div>
            <div className="admin-health-summary-value">{health.length}</div>
          </div>
          <div className="admin-health-summary-card">
            <div className="admin-health-summary-label">异常</div>
            <div className="admin-health-summary-value admin-health-summary-value--danger">{failedHealth.length}</div>
          </div>
          <div className="admin-health-summary-card admin-health-summary-card--latest">
            <div className="admin-health-summary-label">最近探测</div>
            <div className="admin-health-latest-time">{latestHealthCheckedAt}</div>
          </div>
        </div>

        <div className="admin-health-toolbar">
          <div className="admin-health-toolbar-main">
            {visibleHealthProgress ? (
              <div className="admin-health-progress">
                <div className="admin-health-progress__track">
                  <div
                    className={`admin-health-progress__bar${progressTotal > 0 ? "" : " admin-health-progress__bar--pending"}`}
                    style={{ width: progressBarWidth }}
                  />
                </div>
                <div className="admin-health-progress__meta">
                  {progressMeta}
                  {progressFailed > 0 ? (
                    <span className="admin-health-progress__danger">异常 {progressFailed}</span>
                  ) : null}
                  {healthProgress?.current_title ? ` · ${healthProgress.current_title}` : null}
                </div>
              </div>
            ) : null}
            <div className="admin-health-meta">
              <div className="admin-health-meta__title">监控对象状态面板</div>
              <div className="admin-health-meta__desc">
                {autoDetectEnabled
                  ? `自动检测已开启：每 ${autoDetectIntervalMinutes} 分钟执行一次${lastAutoDetectAt ? `，最近一次 ${formatAdminDateTime(lastAutoDetectAt)}` : ""}`
                  : "自动检测未开启"}
              </div>
            </div>
          </div>
          <div className="admin-health-actions">
            <button
              type="button"
              onClick={onOpenAutoDetect}
              className="admin-btn-ghost admin-health-auto-button"
              data-enabled={autoDetectEnabled ? "true" : "false"}
            >
              自动检测
            </button>
            <button type="button" onClick={onRunHealthCheck} className="admin-btn" disabled={healthChecking}>
              {healthChecking ? "探测中..." : "全量探测"}
            </button>
          </div>
        </div>

        <div className="admin-health-table-shell">
          <table className="admin-health-table">
            <thead>
              <tr>
                <th>监控对象</th>
                <th>来源</th>
                <th>探测状态</th>
                <th>最近探测时间</th>
              </tr>
            </thead>
            <tbody>
              {failedHealth.map((item) => (
                <tr key={item.link_id}>
                  <td data-label="监控对象">
                    <button
                      type="button"
                      onClick={() => {
                        void onJumpToLink(item);
                      }}
                      className="admin-btn-ghost admin-health-target-button"
                    >
                      {item.title || `#${item.link_id}`}
                    </button>
                  </td>
                  <td data-label="来源">{adminModuleLabel(item.module, item.resource_sub_module)}</td>
                  <td data-label="探测状态" className="admin-health-status-cell">
                    <span className="admin-health-status-text">{adminHealthStatusText(item)}</span>
                    {item.message ? <span className="admin-health-status-message">{item.message}</span> : null}
                  </td>
                  <td data-label="最近探测时间" title={String(item.checked_at || "")}>
                    {formatAdminDateTime(item.checked_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!failedHealth.length ? <div className="admin-health-empty-row">当前没有异常链接</div> : null}
        </div>
      </div>
    </div>
  );
}

export function AdminLogsSection({
  logs,
  getActionTag,
  formatLogObjectAndDetail,
}: {
  logs: AdminLinkLog[];
  getActionTag: (action: string) => ActionTag;
  formatLogObjectAndDetail: (log: AdminLinkLog) => string;
}) {
  const rows = logs.length
    ? logs
    : [{ id: 0, link_id: null, action: "暂无操作日志", actor_username: "-", actor_role: "-", created_at: "-" }];

  return (
    <div className="admin-section-transition admin-responsive-section">
      <div className="admin-card admin-console-pagehead">
        <div className="admin-console-pagehead-title">操作日志</div>
        <div className="admin-console-pagehead-desc">按时间、操作人、动作和目标追踪后台行为。</div>
      </div>
      <div className="admin-card admin-logs-panel">
        <div className="admin-console-logs-table-shell">
          <table className="admin-console-logs-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>操作人</th>
                <th>角色</th>
                <th>动作</th>
                <th>对象/详情</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((log) => {
                const tag = getActionTag(log.action);
                return (
                  <tr key={log.id}>
                    <td data-label="时间">{formatAdminDateTime(log.created_at)}</td>
                    <td data-label="操作人" className="admin-log-actor-cell">
                      {log.actor_username || "-"}
                    </td>
                    <td data-label="角色">
                      <span className="admin-log-role-badge">{log.actor_role || "-"}</span>
                    </td>
                    <td data-label="动作">
                      <span className="admin-log-action-badge" style={{ color: tag.fg, background: tag.bg }} title={log.action || "-"}>
                        {tag.text}
                      </span>
                    </td>
                    <td data-label="对象/详情" className="admin-log-detail-cell">
                      {formatLogObjectAndDetail(log)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminUsersSection({
  users,
  userForm,
  onUserFormChange,
  onSubmitUser,
  userPasswordDrafts,
  setUserPasswordDrafts,
  onToggleUserRole,
  onResetUserPassword,
  onRemoveUser,
}: {
  users: AdminUserRecord[];
  userForm: UserFormState;
  onUserFormChange: (next: UserFormState) => void;
  onSubmitUser: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  userPasswordDrafts: Record<number, string>;
  setUserPasswordDrafts: Dispatch<SetStateAction<Record<number, string>>>;
  onToggleUserRole: (user: AdminUserRecord) => void | Promise<void>;
  onResetUserPassword: (user: AdminUserRecord) => void | Promise<void>;
  onRemoveUser: (user: AdminUserRecord) => void | Promise<void>;
}) {
  return (
    <div className="admin-section-transition admin-responsive-section">
      <div className="admin-card admin-console-pagehead">
        <div className="admin-console-pagehead-title">用户管理</div>
        <div className="admin-console-pagehead-desc">管理后台账号、角色权限和最近登录时间。</div>
      </div>
      <div id="users" className="admin-card admin-users-panel">
        <form onSubmit={onSubmitUser} className="admin-users-form">
          <input
            className="admin-input"
            placeholder="用户名"
            value={userForm.username}
            onChange={(event) => onUserFormChange({ ...userForm, username: event.target.value })}
          />
          <input
            className="admin-input"
            type="password"
            placeholder="密码"
            value={userForm.password}
            onChange={(event) => onUserFormChange({ ...userForm, password: event.target.value })}
          />
          <select
            className="admin-input"
            value={userForm.role}
            onChange={(event) => onUserFormChange({ ...userForm, role: event.target.value as "super" | "editor" })}
          >
            <option value="editor">editor</option>
            <option value="super">super</option>
          </select>
          <button type="submit" className="admin-btn">
            创建用户
          </button>
        </form>

        <div className="admin-users-table-shell">
          <table className="admin-users-table">
            <thead>
              <tr>
                {["ID", "用户名", "角色", "创建时间", "最近登录", "操作"].map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td data-label="ID">{user.id}</td>
                  <td data-label="用户名">{user.username}</td>
                  <td data-label="角色">{user.role}</td>
                  <td data-label="创建时间">{formatAdminDateTime(user.created_at)}</td>
                  <td data-label="最近登录">{user.last_login_at ? formatAdminDateTime(user.last_login_at) : "-"}</td>
                  <td data-label="操作" className="admin-users-actions-cell">
                    <button type="button" onClick={() => void onToggleUserRole(user)} className="admin-btn-ghost">
                      {user.role === "super" ? "降为 editor" : "升为 super"}
                    </button>
                    <input
                      className="admin-input admin-users-password-input"
                      type="password"
                      placeholder="新密码"
                      value={userPasswordDrafts[user.id] || ""}
                      onChange={(event) => setUserPasswordDrafts((prev) => ({ ...prev, [user.id]: event.target.value }))}
                    />
                    <button type="button" onClick={() => void onResetUserPassword(user)} className="admin-btn-ghost">
                      改密
                    </button>
                    <button type="button" onClick={() => void onRemoveUser(user)} className="admin-btn-ghost admin-danger-button">
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length ? (
                <tr className="admin-table-empty-row">
                  <td data-label="用户" colSpan={6}>
                    暂无用户数据
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
