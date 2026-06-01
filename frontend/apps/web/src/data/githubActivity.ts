export const GITHUB_ORG =
  process.env.NEXT_PUBLIC_GITHUB_ORG ||
  process.env.GITHUB_ORG ||
  "CDUESTC-OpenAtom-Open-Source-Club";

export const SUPPORTED_GITHUB_ACTIVITY_TYPES = [
  "PushEvent",
  "PullRequestEvent",
  "PullRequestReviewEvent",
  "PullRequestReviewCommentEvent",
  "CreateEvent",
  "DeleteEvent",
  "IssuesEvent",
  "ReleaseEvent",
  "ForkEvent",
  "WatchEvent",
  "IssueCommentEvent",
] as const;

export type GitHubActivityType =
  (typeof SUPPORTED_GITHUB_ACTIVITY_TYPES)[number];

export type ActivitySource = "github" | "mock";

export interface GitHubActivityActor {
  login: string;
  avatar: string;
  avatarUrl?: string | null;
  profileUrl?: string | null;
}

export interface GitHubActivity {
  id: string;
  type: GitHubActivityType;
  actor: GitHubActivityActor;
  repo: string;
  repoUrl?: string | null;
  message: string;
  details: string[];
  branch: string | null;
  commits: number;
  isMergedPr: boolean;
  time: string;
  color: string;
  createdAt?: string | null;
  linkUrl?: string | null;
}

export interface GitHubActivityResponse {
  activities: GitHubActivity[];
  source: ActivitySource;
}

export interface GitHubCommitSummary {
  sha?: string;
  url?: string;
  message?: string;
}

interface GitHubReviewPayload {
  state?: string;
  commit_id?: string;
}

interface GitHubCommentPayload {
  path?: string;
  body?: string;
  html_url?: string;
}

interface GitHubIssuePayload {
  title?: string;
  state?: string;
  html_url?: string;
  pull_request?: Record<string, unknown> | null;
  labels?: Array<{ name?: string }>;
}

interface GitHubReleasePayload {
  tag_name?: string;
  name?: string;
  html_url?: string;
}

interface GitHubForkeePayload {
  full_name?: string;
  html_url?: string;
}

interface GitHubPullRequestRef {
  ref?: string;
}

interface GitHubPullRequestPayload {
  title?: string;
  state?: string;
  html_url?: string;
  merged?: boolean;
  base?: GitHubPullRequestRef;
  head?: GitHubPullRequestRef;
}

export interface GitHubOrgEventPayload {
  action?: string;
  before?: string;
  head?: string;
  ref?: string | null;
  ref_type?: string | null;
  size?: number;
  distinct_size?: number;
  compare?: string;
  master_branch?: string | null;
  commits?: GitHubCommitSummary[];
  pull_request?: GitHubPullRequestPayload;
  review?: GitHubReviewPayload;
  comment?: GitHubCommentPayload;
  issue?: GitHubIssuePayload;
  release?: GitHubReleasePayload;
  forkee?: GitHubForkeePayload;
}

export interface GitHubOrgEvent {
  id?: string;
  type?: string;
  actor?: {
    login?: string | null;
    avatar_url?: string | null;
    html_url?: string | null;
  };
  repo?: {
    name?: string | null;
    url?: string | null;
  };
  payload?: GitHubOrgEventPayload;
  created_at?: string;
}

export interface GitHubCompareResponse {
  commits?: Array<{
    sha?: string;
    html_url?: string;
    commit?: {
      message?: string;
    };
  }>;
  total_commits?: number;
  html_url?: string;
}

export interface GitHubCommitResponse {
  sha?: string;
  html_url?: string;
  commit?: {
    message?: string;
  };
}

export const EVENT_TYPE_LABELS: Record<GitHubActivityType, string> = {
  PushEvent: "PUSH",
  PullRequestEvent: "PR",
  PullRequestReviewEvent: "REVIEW",
  PullRequestReviewCommentEvent: "REVIEW",
  CreateEvent: "INIT",
  DeleteEvent: "DELETE",
  IssuesEvent: "ISSUE",
  ReleaseEvent: "RELEASE",
  ForkEvent: "FORK",
  WatchEvent: "STAR",
  IssueCommentEvent: "COMMENT",
};

export const EVENT_TYPE_COLORS: Record<GitHubActivityType, string> = {
  PushEvent: "#0A84FF",
  PullRequestEvent: "#06E5CC",
  PullRequestReviewEvent: "#14B8A6",
  PullRequestReviewCommentEvent: "#0EA5E9",
  CreateEvent: "#7C3AED",
  DeleteEvent: "#EF4444",
  IssuesEvent: "#F59E0B",
  ReleaseEvent: "#10B981",
  ForkEvent: "#EC4899",
  WatchEvent: "#38BDF8",
  IssueCommentEvent: "#F97316",
};

export const MOCK_ACTIVITY: GitHubActivity[] = [
  {
    id: "evt_001",
    type: "PushEvent",
    actor: { login: "zhang-wei", avatar: "ZW" },
    repo: "cdcas/course-assistant",
    message: "push to main",
    details: [
      "feat: add conflict detection algorithm",
      "fix: improve merge queue fallback",
    ],
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
    details: ["base: main", "head: feat/realtime"],
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
    details: ["create branch: main"],
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
    details: ["opened by QA triage"],
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
    message: "push to hotfix/gps",
    details: [
      "fix: indoor positioning accuracy +12%",
      "test: calibrate indoor beacon matrix",
    ],
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
    details: ["tag: v1.2.0"],
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
    message: "push to feat/compression",
    details: [
      "perf: reduce binary size by 40%",
      "build: strip optional native assets",
    ],
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
    details: ["new repo: huang-xin/contrib-dashboard"],
    branch: null,
    commits: 0,
    isMergedPr: false,
    time: "5 小时前",
    color: "#EC4899",
  },
];

const API_BASE = "https://api.github.com";

const isGitHubActivityType = (value: string): value is GitHubActivityType =>
  SUPPORTED_GITHUB_ACTIVITY_TYPES.includes(value as GitHubActivityType);

const getAvatarLetters = (login?: string | null) => {
  if (!login) return "GH";
  const chunks = String(login)
    .split(/[-_.\s]+/)
    .filter(Boolean);
  if (chunks.length >= 2) {
    return (chunks[0][0] + chunks[1][0]).toUpperCase();
  }
  return String(login).slice(0, 2).toUpperCase();
};

const formatRelativeTime = (dateValue?: string | null) => {
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

const getRepoFromEvent = (event: GitHubOrgEvent) =>
  event.repo?.name || "unknown/repo";

const getBranchFromEvent = (event: GitHubOrgEvent) => {
  const ref = event?.payload?.ref || event?.payload?.master_branch || null;
  if (!ref || typeof ref !== "string") return null;
  return ref.replace(/^refs\/heads\//, "");
};

const truncateLine = (value?: string | null, maxLength = 96) => {
  if (!value) return "";
  const normalized = String(value).replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
};

const extractIssueLabel = (payload: GitHubOrgEventPayload) =>
  payload?.issue?.pull_request ? "pull request" : "issue";

const getMessageFromEvent = (event: GitHubOrgEvent) => {
  const type = event?.type;
  const payload = event?.payload || {};

  if (type === "PushEvent") {
    const branch = getBranchFromEvent(event);
    const size = Number(payload.size || payload.distinct_size || payload.commits?.length || 0);
    if (branch && size > 0) {
      return `push to ${branch} · ${size} commit${size > 1 ? "s" : ""}`;
    }
    if (branch) {
      return `push to ${branch}`;
    }
    return "push update";
  }

  if (type === "PullRequestEvent") {
    const action = payload.action || "updated";
    const title = payload.pull_request?.title || "pull request";
    return `PR ${action}: ${title}`;
  }

  if (type === "PullRequestReviewEvent") {
    const action = payload.action || payload.review?.state || "reviewed";
    const title = payload.pull_request?.title || "pull request";
    return `review ${action.toLowerCase()}: ${title}`;
  }

  if (type === "PullRequestReviewCommentEvent") {
    const action = payload.action || "commented";
    const title = payload.pull_request?.title || "pull request";
    return `review comment ${action}: ${title}`;
  }

  if (type === "CreateEvent") {
    return `create ${payload.ref_type || "resource"} ${payload.ref || ""}`.trim();
  }

  if (type === "DeleteEvent") {
    return `delete ${payload.ref_type || "resource"} ${payload.ref || ""}`.trim();
  }

  if (type === "IssuesEvent") {
    const action = payload.action || "updated";
    const title = payload.issue?.title || extractIssueLabel(payload);
    return `${extractIssueLabel(payload)} ${action}: ${title}`;
  }

  if (type === "IssueCommentEvent") {
    const action = payload.action || "commented";
    const title = payload.issue?.title || extractIssueLabel(payload);
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

const getDetailsFromEvent = (event: GitHubOrgEvent) => {
  const type = event?.type;
  const payload = event?.payload || {};

  if (type === "PushEvent") {
    const commitMessages = Array.isArray(payload.commits)
      ? payload.commits
          .map((commit) => truncateLine(commit?.message?.split("\n")[0], 88))
          .filter(Boolean)
      : [];
    if (commitMessages.length > 0) {
      return commitMessages.slice(0, 4);
    }

    return [
      payload.head ? `head: ${String(payload.head).slice(0, 7)}` : "",
      payload.compare ? "compare ready" : "",
    ].filter(Boolean);
  }

  if (type === "PullRequestEvent") {
    const action = payload.action || "updated";
    const state = payload.pull_request?.state;
    const baseRef = payload.pull_request?.base?.ref;
    const headRef = payload.pull_request?.head?.ref;
    return [
      `action: ${action}`,
      state ? `state: ${state}` : "",
      baseRef ? `base: ${baseRef}` : "",
      headRef ? `head: ${headRef}` : "",
    ].filter(Boolean);
  }

  if (type === "PullRequestReviewEvent") {
    const state = payload.review?.state;
    const commitId = payload.review?.commit_id;
    return [
      state ? `state: ${String(state).toLowerCase()}` : "",
      commitId ? `commit: ${String(commitId).slice(0, 7)}` : "",
    ].filter(Boolean);
  }

  if (type === "PullRequestReviewCommentEvent") {
    const path = payload.comment?.path;
    const body = truncateLine(payload.comment?.body, 88);
    return [path ? `file: ${path}` : "", body].filter(Boolean);
  }

  if (type === "CreateEvent" || type === "DeleteEvent") {
    return [
      payload.ref_type ? `type: ${payload.ref_type}` : "",
      payload.ref ? `ref: ${payload.ref}` : "",
    ].filter(Boolean);
  }

  if (type === "IssuesEvent") {
    const state = payload.issue?.state;
    const labelCount = Array.isArray(payload.issue?.labels)
      ? payload.issue.labels.length
      : 0;
    return [
      payload.action ? `action: ${payload.action}` : "",
      state ? `state: ${state}` : "",
      labelCount > 0 ? `labels: ${labelCount}` : "",
    ].filter(Boolean);
  }

  if (type === "IssueCommentEvent") {
    const comment = truncateLine(payload.comment?.body, 88);
    return [
      payload.action ? `action: ${payload.action}` : "",
      comment,
    ].filter(Boolean);
  }

  if (type === "ReleaseEvent") {
    return [
      payload.release?.tag_name ? `tag: ${payload.release.tag_name}` : "",
      truncateLine(payload.release?.name, 88),
    ].filter(Boolean);
  }

  if (type === "ForkEvent") {
    return [payload.forkee?.full_name ? `target: ${payload.forkee.full_name}` : ""].filter(Boolean);
  }

  if (type === "WatchEvent") {
    return [payload.action ? `action: ${payload.action}` : "action: started"].filter(Boolean);
  }

  return [];
};

export const mapGitHubEventToActivity = (
  event: GitHubOrgEvent,
): GitHubActivity => {
  const rawType = event?.type || "PushEvent";
  const type = isGitHubActivityType(rawType) ? rawType : "PushEvent";
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
      avatarUrl: event?.actor?.avatar_url || null,
      profileUrl: event?.actor?.html_url || null,
    },
    repo: getRepoFromEvent(event),
    repoUrl: event?.repo?.url || null,
    message: getMessageFromEvent(event),
    details: getDetailsFromEvent(event),
    branch: getBranchFromEvent(event),
    commits,
    isMergedPr: merged,
    time: formatRelativeTime(event?.created_at),
    color,
    createdAt: event?.created_at || null,
    linkUrl:
      event?.payload?.pull_request?.html_url ||
      event?.payload?.issue?.html_url ||
      event?.payload?.release?.html_url ||
      event?.payload?.comment?.html_url ||
      event?.payload?.forkee?.html_url ||
      null,
  };
};

export async function fetchOrgActivity({
  org = GITHUB_ORG,
  perPage = 12,
  signal,
}: {
  org?: string;
  perPage?: number;
  signal?: AbortSignal;
} = {}): Promise<GitHubActivity[]> {
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

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("Invalid GitHub API response");
  }

  return (data as GitHubOrgEvent[]).map(mapGitHubEventToActivity);
}
