import BackgroundGrid from "@/components/backgroundGrid";
import Header from "@/components/header";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-full flex flex-col">
        <BackgroundGrid />
        <Header />
        {children}
      </body>
    </html>
  );
}
