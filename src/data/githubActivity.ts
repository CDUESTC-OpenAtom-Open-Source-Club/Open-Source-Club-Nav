export interface GitHubEvent {
  id: string;
  type: string;
  actor: { login: string; avatar: string };
  repo: string;
  message: string;
  branch: string | null;
  commits: number | null;
  time: string;
  color: string;
}

export const GITHUB_ORG = "CDUESTC-OpenAtom-Open-Source-Club";

export const MOCK_ACTIVITY: GitHubEvent[] = [
  {
    id: "evt_001",
    type: "PushEvent",
    actor: { login: "zhang-wei", avatar: "ZW" },
    repo: "cdcas/course-assistant",
    message: "feat: add conflict detection algorithm",
    branch: "main",
    commits: 3,
    time: "2 分钟前",
    color: "#0A84FF",
  },
  {
    id: "evt_002",
    type: "PullRequestEvent",
    actor: { login: "liu-fang", avatar: "LF" },
    repo: "cdcas/price-compare",
    message: "PR: implement real-time price diff engine",
    branch: "feat/realtime",
    commits: null,
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
    time: "38 分钟前",
    color: "#7C3AED",
  },
  {
    id: "evt_004",
    type: "IssuesEvent",
    actor: { login: "wang-jing", avatar: "WJ" },
    repo: "cdcas/openai-lab",
    message: "issue: GPT-4o streaming response bug",
    branch: null,
    commits: null,
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
    time: "2 小时前",
    color: "#EF4444",
  },
  {
    id: "evt_006",
    type: "ReleaseEvent",
    actor: { login: "zhao-yu", avatar: "ZY" },
    repo: "cdcas/hexboard",
    message: "release: v1.2.0 – dark mode & plugin API",
    branch: null,
    commits: null,
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
    commits: null,
    time: "5 小时前",
    color: "#EC4899",
  },
];

export const EVENT_TYPE_LABELS: Record<string, string> = {
  PushEvent: "PUSH",
  PullRequestEvent: "PR",
  CreateEvent: "INIT",
  IssuesEvent: "ISSUE",
  ReleaseEvent: "RELEASE",
  ForkEvent: "FORK",
};
