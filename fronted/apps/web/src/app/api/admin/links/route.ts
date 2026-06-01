// 后台链接管理 - 代理到 Go 后端
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  return proxyRequest(request, `/api/links${params ? `?${params}` : ""}`);
}

export async function POST(request: Request) {
  return proxyRequest(request, "/api/admin/links");
}

export async function PUT(request: Request) {
  const body = await request.json() as { id?: number };
  const id = body.id;
  if (!id) {
    return Response.json({ error: "缺少 id" }, { status: 400 });
  }
  return proxyRequest(request, `/api/admin/links/${id}`, { body, method: "PUT" });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "缺少 id" }, { status: 400 });
  }
  // 链接删除暂时走软删除（由后端 nav_items 的 active=0 处理）
  return proxyRequest(request, `/api/admin/links/${id}`, { method: "DELETE" });
}
