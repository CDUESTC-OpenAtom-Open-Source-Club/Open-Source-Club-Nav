import { apiClient } from "@/lib/api-client";

/** Content type values supported by content APIs. */
export type ContentType = "resource" | "official_news";
export type ResourceSubType = "learning_material" | "open_source" | "tech_articles" | "activity_review" | "tools";

export interface ContentItem {
  id: number;
  content_type: ContentType;
  sub_type?: ResourceSubType;
  title: string;
  description?: string;
  link_url: string;
  cover_url?: string;
  sort: number;
  active: number;
  icon?: string;
  click_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ContentCreateInput {
  content_type: ContentType;
  sub_type?: ResourceSubType;
  title: string;
  description?: string;
  link_url: string;
  cover_url?: string;
  sort?: number;
  icon?: string;
}

export interface ContentUpdateInput {
  id: number;
  content_type?: ContentType;
  sub_type?: ResourceSubType;
  title?: string;
  description?: string;
  link_url?: string;
  cover_url?: string;
  sort?: number;
  active?: number;
  icon?: string;
}

type ContentListResponse = { data?: ContentItem[] } | ContentItem[];
type ContentSingleResponse = { data?: ContentItem } | ContentItem;

/** Client-facing service. Uses local Next.js API routes, not direct backend URLs. */
export async function getContentByType(contentType?: ContentType, subType?: ResourceSubType): Promise<ContentItem[]> {
  try {
    const params = new URLSearchParams();
    if (contentType) params.set("content_type", contentType);
    if (subType) params.set("sub_type", subType);
    const data = await apiClient.get<ContentListResponse>(`/api/admin/content?${params.toString()}`, {
      cache: "no-store",
    });
    return Array.isArray(data) ? data : (data.data ?? []);
  } catch {
    return [];
  }
}

export async function createContent(input: ContentCreateInput): Promise<ContentItem | null> {
  try {
    const data = await apiClient.post<ContentSingleResponse>("/api/admin/content", input);
    return "data" in data ? (data.data ?? null) : (data as ContentItem);
  } catch {
    return null;
  }
}

export async function updateContent(input: ContentUpdateInput): Promise<ContentItem | null> {
  try {
    const data = await apiClient.put<ContentSingleResponse>("/api/admin/content", input);
    return "data" in data ? (data.data ?? null) : (data as ContentItem);
  } catch {
    return null;
  }
}

export async function toggleContentActive(id: number): Promise<ContentItem | null> {
  try {
    const data = await apiClient.put<ContentSingleResponse>(`/api/content/${id}/toggle`);
    return "data" in data ? (data.data ?? null) : (data as ContentItem);
  } catch {
    return null;
  }
}

export async function deleteContent(id: number): Promise<boolean> {
  try {
    await apiClient.delete(`/api/content/${id}`);
    return true;
  } catch {
    return false;
  }
}
