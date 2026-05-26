const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const MAX_REPOS = 12;

type ContributorPayload = {
  login?: string;
  avatar_url?: string;
  html_url?: string;
  contributions?: number;
};

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

function normalizeRepo(repo: string) {
  const trimmed = repo.trim();
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(trimmed) ? trimmed : "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repos = Array.from(
    new Set(
      (searchParams.get("repos") || "")
        .split(",")
        .map(normalizeRepo)
        .filter(Boolean),
    ),
  ).slice(0, MAX_REPOS);

  if (repos.length === 0) {
    return Response.json(
      { contributors: {}, source: "github" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const headers = ghHeaders();
    const entries = await Promise.all(
      repos.map(async (repo) => {
        const res = await fetch(`https://api.github.com/repos/${repo}/contributors`, {
          headers,
          cache: "no-store",
        });
        if (!res.ok) {
          return [repo, []] as const;
        }

        const payload = (await res.json()) as ContributorPayload[];
        const list = Array.isArray(payload)
          ? payload.slice(0, 5).map((item) => ({
              login: item.login || "",
              avatar: item.avatar_url || "",
              url: item.html_url || "",
              contributions: Number(item.contributions || 0),
            }))
          : [];

        return [repo, list] as const;
      }),
    );

    return Response.json(
      { contributors: Object.fromEntries(entries), source: "github" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[github-contributors] GitHub API 请求失败：", error);
    return Response.json(
      { contributors: {}, source: "fallback" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
