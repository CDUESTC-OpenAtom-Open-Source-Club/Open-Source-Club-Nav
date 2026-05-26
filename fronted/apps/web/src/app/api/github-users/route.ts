const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const MAX_LOGINS = 20;

type GitHubUserPayload = {
  login?: string;
  name?: string | null;
  avatar_url?: string;
  html_url?: string;
  blog?: string | null;
};
type GitHubUserInfo = {
  login: string;
  name: string;
  avatarUrl: string;
  htmlUrl: string;
  blog: string;
};
type GitHubUserEntry = readonly [string, GitHubUserInfo];

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

function normalizeLogin(login: string) {
  const trimmed = login.trim();
  return /^[A-Za-z0-9-]{1,39}$/.test(trimmed) ? trimmed : "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const logins = Array.from(
    new Set(
      (searchParams.get("logins") || "")
        .split(",")
        .map(normalizeLogin)
        .filter(Boolean)
    )
  ).slice(0, MAX_LOGINS);

  if (logins.length === 0) {
    return Response.json(
      { users: {}, source: "github" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const headers = ghHeaders();
    const entries = await Promise.all(
      logins.map(async (login) => {
        const res = await fetch(`https://api.github.com/users/${login}`, {
          headers,
          cache: "no-store",
        });
        if (!res.ok) return null;

        const user = (await res.json()) as GitHubUserPayload;
        return [
          login,
          {
            login: user.login || login,
            name: user.name || "",
            avatarUrl: user.avatar_url || `https://github.com/${login}.png?size=160`,
            htmlUrl: user.html_url || `https://github.com/${login}`,
            blog: user.blog || "",
          },
        ] as const;
      })
    );
    const users = Object.fromEntries(
      entries.filter((entry): entry is GitHubUserEntry => entry !== null)
    );

    return Response.json(
      { users, source: "github" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[github-users] GitHub API 请求失败：", error);
    return Response.json(
      { users: {}, source: "fallback" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
