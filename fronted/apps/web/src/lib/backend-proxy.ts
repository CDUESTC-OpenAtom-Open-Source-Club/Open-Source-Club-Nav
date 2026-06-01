// lib/backend-proxy.ts
// 轻量级后端代理工具 - 所有前端 BFF API Routes 统一使用此模块调用 Go 后端

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";

/**
 * 代理请求到 Go 后端，自动透传 Cookie 和转发响应
 */
export async function proxyToBackend(
  request: Request,
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  },
): Promise<Response> {
  const method = options?.method || request.method;
  const url = `${BACKEND_API_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  // 透传 Cookie
  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers["Cookie"] = cookie;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (options?.body !== undefined && method !== "GET" && method !== "HEAD") {
    fetchOptions.body = JSON.stringify(options.body);
  } else if (method !== "GET" && method !== "HEAD") {
    // 没有显式提供 body 时，从原始请求中透传 body
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
    // 透传 Set-Cookie 头
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
    return Response.json({ error: "后端服务不可用" }, { status: 502 });
  }
}

/**
 * 透传 Cookie + 转发 Set-Cookie 的简化版
 */
export async function proxyRequest(
  request: Request,
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  },
): Promise<Response> {
  return proxyToBackend(request, path, options);
}

export { BACKEND_API_URL };
