export const GITHUB_ORG = import.meta.env.VITE_GITHUB_ORG || "cdcas-uestc";

export const EVENT_TYPE_LABELS = {
  PushEvent: "PUSH",
  PullRequestEvent: "PR",
  CreateEvent: "INIT",
  IssuesEvent: "ISSUE",
  ReleaseEvent: "RELEASE",
  ForkEvent: "FORK",
  WatchEvent: "STAR",
  IssueCommentEvent: "COMMENT",
};

export const EVENT_TYPE_COLORS = {
  PushEvent: "#0A84FF",
  PullRequestEvent: "#06E5CC",
  CreateEvent: "#7C3AED",
  IssuesEvent: "#F59E0B",
  ReleaseEvent: "#10B981",
  ForkEvent: "#EC4899",
  WatchEvent: "#38BDF8",
  IssueCommentEvent: "#F97316",
};

export const MOCK_ACTIVITY = [
  {
    id: "evt_001",
    type: "PushEvent",
    actor: { login: "zhang-wei", avatar: "ZW" },
    repo: "cdcas/course-assistant",
    message: "feat: add conflict detection algorithm",
    branch: "main",
    commits: 3,
    isMergedPr: false,
    time: "2 分钟前",
    color: "#0A84FF",
  },
  {
    id: "evt_002",
    type: "PullRequestEvent",
    actor: { login: "liu-fang", avatar: "LF" },
    repo: "cdcas/price-compare",
    message: "PR opened: implement real-time price diff engine",
    branch: "feat/realtime",
    commits: 0,
    isMergedPr: false,
    time: "15 分钟前",
    color: "#06E5CC",
  },
  {
    id: "evt_003",
    type: "CreateEvent",
    actor: { login: "chen-hao", avatar: "CH" },
    repo: "cdcas/moyuClock",
    message: "init: project scaffold with Vite + TS",
    branch: "main",
    commits: 1,
    isMergedPr: false,
    time: "38 分钟前",
    color: "#7C3AED",
  },
  {
    id: "evt_004",
    type: "IssuesEvent",
    actor: { login: "wang-jing", avatar: "WJ" },
    repo: "cdcas/openai-lab",
    message: "issue: GPT streaming response bug",
    branch: null,
    commits: 0,
    isMergedPr: false,
    time: "1 小时前",
    color: "#F59E0B",
  },
  {
    id: "evt_005",
    type: "PushEvent",
    actor: { login: "li-ming", avatar: "LM" },
    repo: "cdcas/campus-nav",
    message: "fix: indoor positioning accuracy +12%",
    branch: "hotfix/gps",
    commits: 2,
    isMergedPr: false,
    time: "2 小时前",
    color: "#EF4444",
  },
  {
    id: "evt_006",
    type: "ReleaseEvent",
    actor: { login: "zhao-yu", avatar: "ZY" },
    repo: "cdcas/hexboard",
    message: "release: v1.2.0 - plugin API",
    branch: null,
    commits: 0,
    isMergedPr: false,
    time: "3 小时前",
    color: "#10B981",
  },
  {
    id: "evt_007",
    type: "PushEvent",
    actor: { login: "sun-lei", avatar: "SL" },
    repo: "cdcas/starlink-cli",
    message: "perf: reduce binary size by 40%",
    branch: "feat/compression",
    commits: 5,
    isMergedPr: false,
    time: "4 小时前",
    color: "#38BDF8",
  },
  {
    id: "evt_008",
    type: "ForkEvent",
    actor: { login: "huang-xin", avatar: "HX" },
    repo: "cdcas/contrib-dashboard",
    message: "forked from: github-stats/core",
    branch: null,
    commits: 0,
    isMergedPr: false,
    time: "5 小时前",
    color: "#EC4899",
  },
];

const API_BASE = "https://api.github.com";

const getAvatarLetters = (login) => {
  if (!login) return "GH";
  const chunks = String(login)
    .split(/[-_.\s]+/)
    .filter(Boolean);
  if (chunks.length >= 2) {
    return (chunks[0][0] + chunks[1][0]).toUpperCase();
  }
  return String(login).slice(0, 2).toUpperCase();
};

const formatRelativeTime = (dateValue) => {
  if (!dateValue) return "刚刚";
  const time = new Date(dateValue).getTime();
  if (!Number.isFinite(time)) return "刚刚";

  const diffSec = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (diffSec < 10) return "刚刚";
  if (diffSec < 60) return `${diffSec} 秒前`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} 分钟前`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} 天前`;
};

const getRepoFromEvent = (event) => event?.repo?.name || "unknown/repo";

const getBranchFromEvent = (event) => {
  const ref = event?.payload?.ref || event?.payload?.master_branch || null;
  if (!ref || typeof ref !== "string") return null;
  return ref.replace(/^refs\/heads\//, "");
};

const getMessageFromEvent = (event) => {
  const type = event?.type;
  const payload = event?.payload || {};

  if (type === "PushEvent") {
    const head = Array.isArray(payload.commits)
      ? payload.commits[0]?.message
      : "";
    return head ? `push: ${head}` : `push ${payload.size || 0} commits`;
  }

  if (type === "PullRequestEvent") {
    const action = payload.action || "updated";
    const title = payload.pull_request?.title || "pull request";
    return `PR ${action}: ${title}`;
  }

  if (type === "CreateEvent") {
    return `create ${payload.ref_type || "resource"} ${payload.ref || ""}`.trim();
  }

  if (type === "IssuesEvent") {
    const action = payload.action || "updated";
    const title = payload.issue?.title || "issue";
    return `issue ${action}: ${title}`;
  }

  if (type === "IssueCommentEvent") {
    const action = payload.action || "commented";
    const title = payload.issue?.title || "issue";
    return `comment ${action}: ${title}`;
  }

  if (type === "ReleaseEvent") {
    const tagName = payload.release?.tag_name || "release";
    return `release: ${tagName}`;
  }

  if (type === "ForkEvent") {
    const forkName = payload.forkee?.full_name;
    return forkName ? `forked to ${forkName}` : "fork repository";
  }

  if (type === "WatchEvent") {
    return "starred repository";
  }

  return type ? type.replace(/Event$/, "") : "event";
};

export const mapGitHubEventToActivity = (event) => {
  const type = event?.type || "PushEvent";
  const color = EVENT_TYPE_COLORS[type] || "#0A84FF";
  const commits = Array.isArray(event?.payload?.commits)
    ? event.payload.commits.length
    : 0;
  const merged =
    type === "PullRequestEvent" &&
    event?.payload?.action === "closed" &&
    !!event?.payload?.pull_request?.merged;

  return {
    id: event?.id || `evt_${Math.random().toString(36).slice(2, 10)}`,
    type,
    actor: {
      login: event?.actor?.login || "github-user",
      avatar: getAvatarLetters(event?.actor?.login),
    },
    repo: getRepoFromEvent(event),
    message: getMessageFromEvent(event),
    branch: getBranchFromEvent(event),
    commits,
    isMergedPr: merged,
    time: formatRelativeTime(event?.created_at),
    color,
  };
};

export async function fetchOrgActivity({
  org = GITHUB_ORG,
  perPage = 12,
  signal,
} = {}) {
  if (!org) {
    throw new Error("Missing GitHub org");
  }

  const url = `${API_BASE}/orgs/${encodeURIComponent(org)}/events?per_page=${perPage}`;
  const response = await fetch(url, {
    method: "GET",
    signal,
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Invalid GitHub API response");
  }

  return data.map(mapGitHubEventToActivity);
}
