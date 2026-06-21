const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://localhost:8080";
const BACKEND_API_PREFIX = process.env.BACKEND_API_PREFIX || "/api";

export type FetchBackendOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
  forwardCookies?: boolean;
  nextRevalidateSeconds?: number;
};

export type PublicBackendCacheOptions = FetchBackendOptions & {
  browserMaxAgeSeconds?: number;
  sharedMaxAgeSeconds?: number;
  staleWhileRevalidateSeconds?: number;
};

export async function fetchBackend(
  request: Request,
  path: string,
  options?: FetchBackendOptions,
): Promise<Response> {
  const method = options?.method || request.method;
  const normalizedPath = normalizeBackendPath(path);
  const url = `${BACKEND_API_URL}${normalizedPath}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  const cookie = request.headers.get("cookie");
  if ((options?.forwardCookies ?? true) && cookie) {
    headers.Cookie = cookie;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
    cache: options?.cache,
  };
  if (
    (method === "GET" || method === "HEAD") &&
    options?.cache !== "no-store" &&
    options?.nextRevalidateSeconds !== undefined
  ) {
    (fetchOptions as RequestInit & { next?: { revalidate: number } }).next = {
      revalidate: options.nextRevalidateSeconds,
    };
  }

  if (options?.body !== undefined && method !== "GET" && method !== "HEAD") {
    fetchOptions.body = JSON.stringify(options.body);
  } else if (method !== "GET" && method !== "HEAD") {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => undefined);
      if (body !== undefined) {
        fetchOptions.body = JSON.stringify(body);
      }
    } else {
      const body = await request.arrayBuffer().catch(() => null);
      if (body) {
        fetchOptions.body = body;
      }
    }
  }

  try {
    const response = await fetch(url, fetchOptions);
    const respHeaders = new Headers(response.headers);
    const setCookie = response.headers.get("set-cookie");
    const resp = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    });
    if (setCookie) {
      resp.headers.set("set-cookie", setCookie);
    }
    return resp;
  } catch (error) {
    console.error(`[proxy] ${method} ${path} failed:`, error);
    return Response.json({ error: "Backend service unavailable" }, { status: 502 });
  }
}

export async function proxyRequest(
  request: Request,
  path: string,
  options?: FetchBackendOptions,
): Promise<Response> {
  return fetchBackend(request, path, options);
}

export async function fetchPublicBackend(
  request: Request,
  path: string,
  options?: PublicBackendCacheOptions,
): Promise<Response> {
  const sharedMaxAgeSeconds = options?.sharedMaxAgeSeconds ?? 300;
  const response = await fetchBackend(request, path, {
    ...options,
    forwardCookies: false,
    nextRevalidateSeconds: options?.nextRevalidateSeconds ?? sharedMaxAgeSeconds,
  });
  return withPublicCache(response, options);
}

export const proxyToBackend = fetchBackend;

export { BACKEND_API_URL };

function normalizeBackendPath(path: string): string {
  if (!path.startsWith("/api/")) {
    return path;
  }

  const normalizedPrefix = BACKEND_API_PREFIX.startsWith("/")
    ? BACKEND_API_PREFIX
    : `/${BACKEND_API_PREFIX}`;
  const trimmedPrefix = normalizedPrefix.endsWith("/")
    ? normalizedPrefix.slice(0, -1)
    : normalizedPrefix;

  if (trimmedPrefix === "/api") {
    return path;
  }

  return `${trimmedPrefix}${path.slice(4)}`;
}

function withPublicCache(response: Response, options?: PublicBackendCacheOptions): Response {
  const browserMaxAgeSeconds = options?.browserMaxAgeSeconds ?? 60;
  const sharedMaxAgeSeconds = options?.sharedMaxAgeSeconds ?? 300;
  const staleWhileRevalidateSeconds = options?.staleWhileRevalidateSeconds ?? 86400;

  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  if (!response.ok) {
    headers.set("Cache-Control", "no-store");
    headers.delete("CDN-Cache-Control");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  if (options?.cache === "no-store") {
    headers.set("Cache-Control", "no-store");
    headers.delete("CDN-Cache-Control");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  headers.set(
    "Cache-Control",
    `public, max-age=${browserMaxAgeSeconds}, s-maxage=${sharedMaxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`,
  );
  headers.set("CDN-Cache-Control", `public, max-age=${sharedMaxAgeSeconds}`);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
