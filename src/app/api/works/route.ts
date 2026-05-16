// 作品列表接口。
// GET：优先读取 GitHub 组织仓库，其次读取 MySQL，最后回退到静态数据。
// POST：支持手动新增作品，也支持根据 GitHub 仓库地址补全信息。

import { getWorks, createWork } from "@/services/works";

export async function GET() {
  const result = await getWorks();
  return Response.json(result);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.author_name) {
      return Response.json({ error: "title 和 author_name 为必填项" }, { status: 400 });
    }
    const work = await createWork(body);
    return Response.json({ work }, { status: 201 });
  } catch (error) {
    console.error("[works] 新增作品失败:", error);
    return Response.json({ error: "数据库未配置或新增失败" }, { status: 503 });
  }
}
