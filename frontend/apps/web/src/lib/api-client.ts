export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export class ApiError extends Error {
  code: ApiErrorCode;
  status?: number;
  details?: unknown;

  constructor(message: string, code: ApiErrorCode, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  cache?: RequestCache;
};

const DEFAULT_TIMEOUT_MS = 10000;

function mapStatusToCode(status: number): ApiErrorCode {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

async function request<T>(url: string, init: RequestInit, options?: RequestOptions): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const signal = options?.signal
    ? AbortSignal.any([options.signal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch(url, {
      credentials: "include",
      ...init,
      cache: options?.cache ?? init.cache,
      signal,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(
        payload?.error || payload?.msg || `Request failed: ${response.status}`,
        mapStatusToCode(response.status),
        response.status,
        payload,
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error).name === "AbortError") {
      throw new ApiError("请求超时或已取消", "NETWORK_ERROR");
    }
    throw new ApiError("网络异常，请稍后重试", "NETWORK_ERROR");
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Unified HTTP client for frontend services. */
export const apiClient = {
  get<T>(url: string, options?: RequestOptions) {
    return request<T>(url, { method: "GET" }, options);
  },
  post<T>(url: string, body?: unknown, options?: RequestOptions) {
    return request<T>(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      options,
    );
  },
  put<T>(url: string, body?: unknown, options?: RequestOptions) {
    return request<T>(
      url,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      options,
    );
  },
  patch<T>(url: string, body?: unknown, options?: RequestOptions) {
    return request<T>(
      url,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      options,
    );
  },
  delete<T>(url: string, options?: RequestOptions) {
    return request<T>(url, { method: "DELETE" }, options);
  },
};
