const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://localhost:8080";
const BACKEND_API_PREFIX = process.env.BACKEND_API_PREFIX || "/api";

export type FetchBackendOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
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
  if (cookie) {
    headers.Cookie = cookie;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

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
