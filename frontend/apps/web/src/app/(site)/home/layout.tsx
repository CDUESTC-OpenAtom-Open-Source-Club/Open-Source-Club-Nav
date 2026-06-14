import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "资料区",
  description: "KCOS 开放原子开源社团资料区与动态面板。",
  alternates: {
    canonical: "/",
  },
};

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
