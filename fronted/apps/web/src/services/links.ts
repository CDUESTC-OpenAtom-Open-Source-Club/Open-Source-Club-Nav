// 链接服务 - 统一调用 Go 后端 API
import type { FriendLink, LinkCreateInput, LinkUpdateInput, NavModule, ResourceMatrixSubModule } from "@/types/links";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";

const DEFAULT_MODULE: NavModule = "friend_links";

export async function getLinks(
  navModule: NavModule = DEFAULT_MODULE,
  resourceSubModule?: ResourceMatrixSubModule,
): Promise<{ links: FriendLink[]; source: string }> {
  try {
    const params = new URLSearchParams();
    if (navModule) params.set("module", navModule);
    if (resourceSubModule) params.set("resource_sub_module", resourceSubModule);

    const response = await fetch(`${BACKEND_API_URL}/api/links?${params.toString()}`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Backend API ${response.status}`);
    }

    const data = await response.json();
    return { links: data.links || data.data || [], source: "backend" };
  } catch (error) {
    console.warn("[links] Go 后端不可用:", (error as Error).message);
    return { links: [], source: "fallback" };
  }
}

export async function getAllLinks(navModule?: NavModule, resourceSubModule?: ResourceMatrixSubModule): Promise<FriendLink[]> {
  try {
    const params = new URLSearchParams();
    if (navModule) params.set("module", navModule);
    if (resourceSubModule) params.set("resource_sub_module", resourceSubModule);

    const response = await fetch(`${BACKEND_API_URL}/api/links?${params.toString()}`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.links || data.data || [];
  } catch {
    return [];
  }
}

export async function getLinkById(id: number): Promise<FriendLink | null> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/links?keyword=&id=${id}`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = await response.json();
    const links = data.links || data.data || [];
    return links[0] || null;
  } catch {
    return null;
  }
}

export async function createLink(input: LinkCreateInput): Promise<FriendLink> {
  const response = await fetch(`${BACKEND_API_URL}/api/admin/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error("创建失败");
  const data = await response.json();
  return data.data || data.link || data;
}

export async function updateLink(input: LinkUpdateInput): Promise<FriendLink | null> {
  const response = await fetch(`${BACKEND_API_URL}/api/admin/links/${input.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.data || data.link || data;
}

export async function deleteLink(id: number): Promise<void> {
  await fetch(`${BACKEND_API_URL}/api/admin/links/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}

// Mock store 重置（仅在 mock 模式下有用，代理模式下为空操作）
export function resetMockLinksStore(): FriendLink[] {
  return [];
}
