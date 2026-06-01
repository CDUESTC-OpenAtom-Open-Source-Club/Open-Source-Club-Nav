// 单个作品操作 - 代理到 Go 后端
import { proxyRequest } from "@/lib/backend-proxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // 这里需要用新的 Request 来保留 cookie
  const req = new Request(`http://localhost/api/works/${id}`);
  return proxyRequest(req, `/api/works/${id}`);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyRequest(request, `/api/admin/works/${id}`, { method: "PATCH" });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyRequest(request, `/api/admin/works/${id}`);
}
