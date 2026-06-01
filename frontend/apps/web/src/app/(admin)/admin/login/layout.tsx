import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "后台登录",
  description: "KCOS 开放原子开源社团后台登录",
};

export default function AdminLoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
