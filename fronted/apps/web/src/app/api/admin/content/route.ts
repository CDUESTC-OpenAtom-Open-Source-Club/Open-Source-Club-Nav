// 内容管理 - 代理到 Go 后端
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  return proxyRequest(request, `/api/content${params ? `?${params}` : ""}`);
}

export async function POST(request: Request) {
  return proxyRequest(request, "/api/content");
}

export async function PUT(request: Request) {
  const body = await request.json() as { id?: number };
  const id = body.id;
  if (!id) {
    return Response.json({ error: "缺少 id" }, { status: 400 });
  }
  const { id: _id, ...data } = body;
  return proxyRequest(request, `/api/content/${id}`, { body: data, method: "PUT" });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "缺少 id" }, { status: 400 });
  }
  return proxyRequest(request, `/api/content/${id}`);
}
