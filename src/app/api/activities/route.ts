// GitHub 成员动态 API
// 接入真实 GitHub Events API，获取组织最近活动

import { GITHUB_ORG, MOCK_ACTIVITY } from "@/data/githubActivity";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// GitHub Event 类型映射为前端展示格式
const EVENT_TYPE_MAP: Record<string, string> = {
  PushEvent: "PushEvent",
  PullRequestEvent: "PullRequestEvent",
  CreateEvent: "CreateEvent",
  IssuesEvent: "IssuesEvent",
  ReleaseEvent: "ReleaseEvent",
  ForkEvent: "ForkEvent",
};

const EVENT_COLORS: Record<string, string> = {
  PushEvent: "#0A84FF",
  PullRequestEvent: "#06E5CC",
  CreateEvent: "#7C3AED",
  IssuesEvent: "#F59E0B",
  ReleaseEvent: "#10B981",
  ForkEvent: "#EC4899",
};

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function getInitials(login: string): string {
  const parts = login.split(/[-_\s]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return login.slice(0, 2).toUpperCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformEvent(event: any) {
  const type = event.type;
  if (!EVENT_TYPE_MAP[type]) return null;

  let message = "";
  let branch: string | null = null;
  let commits: number | null = null;

  switch (type) {
    case "PushEvent":
      message = event.payload?.commits?.[0]?.message || "push";
      branch = event.payload?.ref?.replace("refs/heads/", "") || null;
      commits = event.payload?.commits?.length || null;
      break;
    case "PullRequestEvent":
      message = `PR: ${event.payload?.pull_request?.title || ""}`;
      branch = event.payload?.pull_request?.head?.ref || null;
      break;
    case "CreateEvent":
      message = `init: ${event.payload?.ref_type} ${event.payload?.ref || ""}`;
      branch = event.payload?.ref || null;
      break;
    case "IssuesEvent":
      message = `issue: ${event.payload?.issue?.title || ""}`;
      break;
    case "ReleaseEvent":
      message = `release: ${event.payload?.release?.tag_name || ""}`;
      break;
    case "ForkEvent":
      message = `forked from: ${event.payload?.forkee?.full_name || ""}`;
      break;
  }

  return {
    id: event.id,
    type,
    actor: {
      login: event.actor?.login || "unknown",
      avatar: getInitials(event.actor?.login || "un"),
    },
    repo: event.repo?.name || "",
    message,
    branch,
    commits,
    time: formatTime(event.created_at),
    color: EVENT_COLORS[type] || "#94A3B8",
  };
}

export async function GET() {
  // 模拟数据模式：直接返回本地数据
  if (USE_MOCK) {
    return Response.json({ activities: MOCK_ACTIVITY, source: "mock" });
  }

  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    }

    const res = await fetch(
      `https://api.github.com/orgs/${GITHUB_ORG}/events?per_page=30`,
      { headers, next: { revalidate: 60 } }
    );

    if (!res.ok) {
      // 降级：GitHub API 失败时返回本地 mock 数据
      const { MOCK_ACTIVITY } = await import("@/data/githubActivity");
      return Response.json({ activities: MOCK_ACTIVITY, source: "mock" });
    }

    const events = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activities = (events as any[])
      .map(transformEvent)
      .filter(Boolean)
      .slice(0, 20);

    return Response.json({ activities, source: "github" });
  } catch (error) {
    console.error("[activities] GitHub API 请求失败：", error);
    // 降级：网络错误时返回本地 mock 数据
    const { MOCK_ACTIVITY } = await import("@/data/githubActivity");
    return Response.json({ activities: MOCK_ACTIVITY, source: "mock" });
  }
}
