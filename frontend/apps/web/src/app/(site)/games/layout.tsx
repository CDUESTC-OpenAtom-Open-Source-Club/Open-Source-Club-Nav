import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "小游戏",
  description: "KCOS 开放原子开源社团小游戏入口",
};

export default function GamesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
