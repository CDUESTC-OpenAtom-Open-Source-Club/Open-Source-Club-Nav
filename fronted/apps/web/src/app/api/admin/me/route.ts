// 获取当前登录管理员信息 - 代理到 Go 后端并包装响应格式
import { proxyToBackend } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const resp = await proxyToBackend(request, "/api/admin/me");
  if (!resp.ok) return resp;

  try {
    const raw = await resp.json();
    // Go 后端返回 { userId, username, role }，前端期望 { user: { id, username, role } }
    const user = {
      id: raw.userId ?? raw.id,
      username: raw.username,
      role: raw.role,
    };
    return Response.json({ user });
  } catch {
    return Response.json({ error: "解析用户信息失败" }, { status: 500 });
  }
}
