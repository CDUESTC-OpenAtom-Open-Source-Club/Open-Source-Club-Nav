import { MOCK_ORG_STATS } from "@/data/mock/stats";

const GITHUB_ORG = "CDUESTC-OpenAtom-Open-Source-Club";

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

export async function fetchOrgStats() {
  const USE_MOCK = process.env.USE_MOCK_DATA === "true";
  if (USE_MOCK) return MOCK_ORG_STATS;

  try {
    const headers = ghHeaders();
    const [orgRes, membersRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/orgs/${GITHUB_ORG}`, { headers, next: { revalidate: 300 } }),
      fetch(`https://api.github.com/orgs/${GITHUB_ORG}/members?per_page=100`, { headers, next: { revalidate: 300 } }),
      fetch(`https://api.github.com/orgs/${GITHUB_ORG}/repos?per_page=100`, { headers, next: { revalidate: 300 } }),
    ]);

    if (!orgRes.ok || !membersRes.ok || !reposRes.ok) throw new Error("GitHub API error");

    const org = await orgRes.json() as Record<string, unknown>;
    const members = await membersRes.json() as unknown[];
    const repos = await reposRes.json() as Record<string, unknown>[];
    const totalStars = repos.reduce((sum, r) => sum + ((r.stargazers_count as number) || 0), 0);

    return {
      members: (org.public_members_count as number) || members.length,
      projects: repos.length,
      stars: totalStars,
      source: "github",
    };
  } catch {
    return { ...MOCK_ORG_STATS, source: "fallback" };
  }
}

export async function fetchGitHubUsers(logins: string[]) {
  const headers = ghHeaders();
  const results: Record<string, unknown>[] = [];

  for (const login of logins.slice(0, 20)) {
    try {
      const res = await fetch(`https://api.github.com/users/${login}`, { headers });
      if (res.ok) {
        const data = await res.json() as Record<string, unknown>;
        results.push({
          login: data.login,
          name: data.name || data.login,
          avatarUrl: data.avatar_url,
          htmlUrl: data.html_url,
          blog: data.blog || "",
        });
      }
    } catch { /* skip failed user */ }
  }
  return results;
}
