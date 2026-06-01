// 后台作品管理 - 代理到 Go 后端
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  return proxyRequest(request, "/api/admin/works");
}

export async function POST(request: Request) {
  return proxyRequest(request, "/api/admin/works");
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "缺少 id" }, { status: 400 });
  }
  return proxyRequest(request, `/api/admin/works/${id}`);
}
