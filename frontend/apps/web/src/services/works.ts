import { apiClient } from "@/lib/api-client";
import type { Work, WorkCreateInput, WorkUpdateInput } from "@/types";

type WorksResponse = { works?: Work[]; source?: string };
type WorkResponse = { work?: Work; ok?: boolean };

/** Client-facing works service via local BFF routes. */
export async function getWorks(): Promise<{ works: Work[]; source: string }> {
  try {
    const data = await apiClient.get<WorksResponse>("/api/works");
    return { works: data.works || [], source: data.source || "bff" };
  } catch {
    return { works: [], source: "fallback" };
  }
}

export async function getAllWorks(): Promise<Work[]> {
  try {
    const data = await apiClient.get<WorksResponse>("/api/admin/works", { cache: "no-store" });
    return data.works || [];
  } catch {
    return [];
  }
}

export async function createWork(input: WorkCreateInput): Promise<Work> {
  const data = await apiClient.post<WorkResponse>("/api/admin/works", input);
  return data.work as Work;
}

export async function updateWork(id: number, input: WorkUpdateInput): Promise<Work | null> {
  try {
    const data = await apiClient.patch<WorkResponse>(`/api/admin/works/${id}`, input);
    return data.work || null;
  } catch {
    return null;
  }
}

export async function deleteWork(id: number): Promise<boolean> {
  try {
    const data = await apiClient.delete<WorkResponse>(`/api/admin/works/${id}`);
    return data.ok === true;
  } catch {
    return false;
  }
}
