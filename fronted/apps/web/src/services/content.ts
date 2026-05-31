// 内容管理服务 - 调用后端 /api/content 接口
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";

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

// 获取内容列表
export async function getContentByType(
  contentType?: ContentType,
  subType?: ResourceSubType,
): Promise<ContentItem[]> {
  try {
    const params = new URLSearchParams();
    if (contentType) params.set("content_type", contentType);
    if (subType) params.set("sub_type", subType);

    const response = await fetch(`${BACKEND_API_URL}/api/content?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch content:", response.status);
      return [];
    }

    const data = await response.json();
    return data.data || data || [];
  } catch (error) {
    console.error("Error fetching content:", error);
    return [];
  }
}

// 创建内容（需要认证）
export async function createContent(input: ContentCreateInput): Promise<ContentItem | null> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      console.error("Failed to create content:", response.status);
      return null;
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error creating content:", error);
    return null;
  }
}

// 更新内容（需要认证）
export async function updateContent(input: ContentUpdateInput): Promise<ContentItem | null> {
  try {
    const { id, ...data } = input;
    const response = await fetch(`${BACKEND_API_URL}/api/content/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error("Failed to update content:", response.status);
      return null;
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error("Error updating content:", error);
    return null;
  }
}

// 切换内容启用状态（需要认证）
export async function toggleContentActive(id: number): Promise<ContentItem | null> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/content/${id}/toggle`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      console.error("Failed to toggle content:", response.status);
      return null;
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error toggling content:", error);
    return null;
  }
}

// 删除内容（需要认证）
export async function deleteContent(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/content/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      console.error("Failed to delete content:", response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting content:", error);
    return false;
  }
}