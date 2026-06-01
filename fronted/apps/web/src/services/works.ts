// 作品服务 - 统一调用 Go 后端 API
import type { Work, WorkCreateInput, WorkUpdateInput } from "@/types/works";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";

export async function getWorks(): Promise<{ works: Work[]; source: string }> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/works`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!response.ok) throw new Error(`Backend API ${response.status}`);

    const data = await response.json();
    return { works: data.works || [], source: data.source || "backend" };
  } catch (error) {
    console.warn("[works] Go 后端不可用:", (error as Error).message);
    return { works: [], source: "fallback" };
  }
}

export async function getAllWorks(): Promise<Work[]> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/admin/works`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.works || [];
  } catch {
    return [];
  }
}

export async function createWork(input: WorkCreateInput): Promise<Work> {
  const response = await fetch(`${BACKEND_API_URL}/api/admin/works`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error("创建失败");
  const data = await response.json();
  return data.work;
}

export async function updateWork(id: number, input: WorkUpdateInput): Promise<Work | null> {
  const response = await fetch(`${BACKEND_API_URL}/api/admin/works/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.work;
}

export async function deleteWork(id: number): Promise<boolean> {
  const response = await fetch(`${BACKEND_API_URL}/api/admin/works/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) return false;
  const data = await response.json();
  return data.ok === true;
}
