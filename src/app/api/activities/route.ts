// GitHub 成员动态 API
// 接入真实 GitHub Events API，获取组织最近活动

import {
  GITHUB_ORG,
  MOCK_ACTIVITY,
  SUPPORTED_GITHUB_ACTIVITY_TYPES,
  type GitHubActivityResponse,
  type GitHubCommitResponse,
  type GitHubCompareResponse,
  type GitHubOrgEvent,
  mapGitHubEventToActivity,
} from "@/data/githubActivity";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DEFAULT_ACTIVITY_LIMIT = 20;
const MAX_ACTIVITY_LIMIT = 100;
const MAX_ACTIVITY_PAGES = 5;

const SUPPORTED_EVENT_TYPES = new Set(SUPPORTED_GITHUB_ACTIVITY_TYPES);

const MAX_ENRICHED_PUSHES = 8;

const createGitHubHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "OpenAtom-Club-Nav",
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  return headers;
};

async function fetchGitHubJson<T>(
  url: string,
  headers: Record<string, string>,
): Promise<T | null> {
  const response = await fetch(url, {
    headers,
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

async function fetchGitHubEvents(
  headers: Record<string, string>,
  activityLimit: number,
): Promise<GitHubOrgEvent[]> {
  const events: GitHubOrgEvent[] = [];
  const seenEventIds = new Set<string>();
  const perPage = Math.min(activityLimit, MAX_ACTIVITY_LIMIT);

  for (let page = 1; page <= MAX_ACTIVITY_PAGES; page += 1) {
    const batch = await fetchGitHubJson<GitHubOrgEvent[]>(
      `https://api.github.com/orgs/${GITHUB_ORG}/events?per_page=${perPage}&page=${page}`,
      headers,
    );

    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    for (const event of batch) {
      const eventId = event?.id;
      if (!eventId || seenEventIds.has(eventId)) {
        continue;
      }
      seenEventIds.add(eventId);
      events.push(event);
      if (events.length >= activityLimit) {
        return events;
      }
    }
  }

  return events;
}

async function enrichPushEvent(
  event: GitHubOrgEvent,
  headers: Record<string, string>,
): Promise<GitHubOrgEvent> {
  if (event?.type !== "PushEvent") {
    return event;
  }

  const repoName = event?.repo?.name;
  const before = event?.payload?.before;
  const head = event?.payload?.head;

  if (!repoName || !head) {
    return event;
  }

  const existingCommits = Array.isArray(event?.payload?.commits)
    ? event.payload.commits
    : [];
  if (existingCommits.length > 0) {
    return event;
  }

  const nextPayload = { ...(event.payload || {}) };

  if (
    before &&
    typeof before === "string" &&
    !/^0+$/.test(before) &&
    before !== head
  ) {
    const compare = await fetchGitHubJson<GitHubCompareResponse>(
      `https://api.github.com/repos/${repoName}/compare/${before}...${head}`,
      headers,
    );

    if (compare) {
      nextPayload.commits = Array.isArray(compare.commits)
        ? compare.commits.map((commit) => ({
            sha: commit.sha,
            url: commit.html_url,
            message: commit.commit?.message || "",
          }))
        : [];
      nextPayload.size =
        typeof compare.total_commits === "number"
          ? compare.total_commits
          : nextPayload.size;
      nextPayload.compare = compare.html_url || nextPayload.compare;
      return { ...event, payload: nextPayload };
    }
  }

  const headCommit = await fetchGitHubJson<GitHubCommitResponse>(
    `https://api.github.com/repos/${repoName}/commits/${head}`,
    headers,
  );

  if (!headCommit) {
    return event;
  }

  nextPayload.commits = [
    {
      sha: headCommit.sha,
      url: headCommit.html_url,
      message: headCommit.commit?.message || "",
    },
  ];
  nextPayload.size = nextPayload.size || 1;

  return { ...event, payload: nextPayload };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestedLimit = Number(requestUrl.searchParams.get("limit"));
  const activityLimit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.floor(requestedLimit), MAX_ACTIVITY_LIMIT)
      : DEFAULT_ACTIVITY_LIMIT;

  // 模拟数据模式：直接返回本地数据
  if (USE_MOCK) {
    return Response.json<GitHubActivityResponse>({
      activities: MOCK_ACTIVITY.slice(0, activityLimit),
      source: "mock",
    });
  }

  try {
    const headers = createGitHubHeaders();
    const events = await fetchGitHubEvents(headers, activityLimit);
    const filteredEvents = events
      .filter((event) => SUPPORTED_EVENT_TYPES.has(event?.type ?? ""))
      .slice(0, activityLimit);

    let enrichedPushes = 0;
    const enrichedEvents = await Promise.all(
      filteredEvents.map((event) => {
        if (event?.type !== "PushEvent" || enrichedPushes >= MAX_ENRICHED_PUSHES) {
          return event;
        }
        enrichedPushes += 1;
        return enrichPushEvent(event, headers);
      }),
    );

    const activities = enrichedEvents
      .map(mapGitHubEventToActivity)
      .sort((left, right) => {
        const leftTime = new Date(left.createdAt || 0).getTime();
        const rightTime = new Date(right.createdAt || 0).getTime();
        return rightTime - leftTime;
      })
      .slice(0, activityLimit);

    return Response.json<GitHubActivityResponse>({
      activities,
      source: "github",
    });
  } catch (error) {
    console.error("[activities] GitHub API 请求失败：", error);
    // 降级：网络错误时返回本地 mock 数据
    const { MOCK_ACTIVITY } = await import("@/data/githubActivity");
    return Response.json<GitHubActivityResponse>({
      activities: MOCK_ACTIVITY.slice(0, activityLimit),
      source: "mock",
    });
  }
}
