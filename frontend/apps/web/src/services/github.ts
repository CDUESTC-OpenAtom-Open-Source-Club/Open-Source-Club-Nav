const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_ORG = process.env.NEXT_PUBLIC_GITHUB_ORG || process.env.GITHUB_ORG || "CDUESTC-OpenAtom-Open-Source-Club";

function ghHeaders(includeAuth = true): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "OpenAtom-Club-Nav",
  };
  if (includeAuth && process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function fetchGitHub(
  url: string,
  options: { allowAnonymousRetry?: boolean; revalidate?: number } = {},
): Promise<Response> {
  const response = await fetch(url, {
    headers: ghHeaders(true),
    next: { revalidate: options.revalidate ?? 300 },
  });

  if (
    options.allowAnonymousRetry &&
    process.env.GITHUB_TOKEN &&
    (response.status === 401 || response.status === 403)
  ) {
    return fetch(url, {
      headers: ghHeaders(false),
      next: { revalidate: options.revalidate ?? 300 },
    });
  }

  return response;
}

async function fetchGitHubJSON<T>(
  url: string,
  options: { allowAnonymousRetry?: boolean; revalidate?: number } = {},
): Promise<{ data: T; response: Response }> {
  const response = await fetchGitHub(url, options);
  if (!response.ok) throw new Error(`GitHub API error ${response.status}`);
  const data = (await response.json()) as T;
  return { data, response };
}

function parseLastPageFromLink(linkHeader: string | null): number | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/);
  if (!match) return null;
  const page = Number(match[1]);
  return Number.isFinite(page) && page > 0 ? page : null;
}

async function fetchGitHubListCount(url: string): Promise<number> {
  const { data, response } = await fetchGitHubJSON<unknown[]>(url);
  const lastPage = parseLastPageFromLink(response.headers.get("link"));
  if (lastPage !== null) return lastPage;
  return Array.isArray(data) ? data.length : 0;
}

async function fetchOrgMemberCount(org: string): Promise<number | null> {
  if (!process.env.GITHUB_TOKEN) return null;

  const membership = await fetchGitHub(
    `${GITHUB_API_BASE}/user/memberships/orgs/${encodeURIComponent(org)}`,
    { revalidate: 300 },
  );
  if (!membership.ok) return null;

  return fetchGitHubListCount(
    `${GITHUB_API_BASE}/orgs/${encodeURIComponent(org)}/members?per_page=1`,
  );
}

export async function fetchOrgStats() {
  try {
    const org = encodeURIComponent(GITHUB_ORG);
    const [orgPayload, reposPayload, memberCount] = await Promise.all([
      fetchGitHubJSON<Record<string, unknown>>(`${GITHUB_API_BASE}/orgs/${org}`, {
        allowAnonymousRetry: true,
        revalidate: 300,
      }),
      fetchGitHubJSON<Record<string, unknown>[]>(`${GITHUB_API_BASE}/orgs/${org}/repos?per_page=100&sort=updated`, {
        allowAnonymousRetry: true,
        revalidate: 300,
      }),
      fetchOrgMemberCount(GITHUB_ORG).catch(() => null),
    ]);

    const repos = Array.isArray(reposPayload.data) ? reposPayload.data : [];
    const totalStars = repos.reduce((sum, r) => sum + ((r.stargazers_count as number) || 0), 0);

    return {
      members: memberCount,
      membersSource: memberCount === null ? "github-unavailable" : "github-members",
      projects: repos.length,
      stars: totalStars,
      org: orgPayload.data.login || GITHUB_ORG,
      source: "github",
    };
  } catch {
    return { members: null, membersSource: "github-unavailable", projects: 0, stars: 0, source: "error" };
  }
}

export async function fetchGitHubUsers(logins: string[]) {
  const results: Record<string, unknown>[] = [];

  for (const login of logins.slice(0, 20)) {
    try {
      const { data } = await fetchGitHubJSON<Record<string, unknown>>(
        `${GITHUB_API_BASE}/users/${login}`,
        { allowAnonymousRetry: true, revalidate: 300 },
      );
      results.push({
        login: data.login,
        name: data.name || data.login,
        avatarUrl: data.avatar_url,
        htmlUrl: data.html_url,
        blog: data.blog || "",
      });
    } catch { /* skip failed user */ }
  }
  return results;
}
