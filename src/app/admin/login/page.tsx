"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push("/");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.replace("/admin");
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f4f7fb 0%, #eaf1f9 100%)", padding: "40px 24px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", borderRadius: 14, overflow: "hidden", border: "1px solid #dbeafe", background: "linear-gradient(125deg,#edf4fc 0%, #f6faff 58%, #eef4fb 100%)", display: "grid", gridTemplateColumns: "60% 40%", minHeight: 640, boxShadow: "0 28px 60px rgba(15,23,42,0.10)" }}>
        <div style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 18% 24%, rgba(147,197,253,0.42), transparent 42%), radial-gradient(circle at 70% 28%, rgba(191,219,254,0.35), transparent 38%), linear-gradient(180deg, rgba(255,255,255,0.42), rgba(236,246,255,0.75))" }} />
          <div style={{ position: "absolute", left: "7%", right: "22%", bottom: "18%", height: "34%", background: "linear-gradient(180deg,rgba(218,232,248,0.9),rgba(208,224,242,0.55))", borderRadius: 20, filter: "blur(0.5px)" }} />

          <div style={{ position: "absolute", left: "10%", bottom: "28%", width: 84, height: 220, borderRadius: "40px 40px 22px 22px", background: "linear-gradient(180deg,#f8fcff,#b8d4f6 55%,#84b6ea)", boxShadow: "inset -8px 0 16px rgba(59,130,246,0.22)" }} />
          <div style={{ position: "absolute", left: "18.2%", bottom: "43%", width: 28, height: 28, borderRadius: "50%", border: "3px solid #7fb2ea", background: "rgba(224,241,255,0.85)", boxShadow: "0 0 16px rgba(59,130,246,0.35)" }} />
          <div style={{ position: "absolute", left: "18.6%", bottom: "58%", width: 20, height: 20, borderRadius: "50%", border: "2px solid #7fb2ea", background: "rgba(224,241,255,0.9)" }} />
          <div style={{ position: "absolute", left: "20.1%", bottom: "63.5%", width: 3, height: 70, background: "linear-gradient(180deg,#7aa7d9,#4f84c0)" }} />

          <div style={{ position: "absolute", left: "31%", bottom: "27%", width: 92, height: 266, clipPath: "polygon(20% 0%, 78% 0%, 92% 100%, 0% 100%)", background: "linear-gradient(180deg,#f8fcff 0%, #c6dcf7 56%, #8db8e8 100%)", boxShadow: "inset -10px 0 20px rgba(37,99,235,0.20)" }} />
          <div style={{ position: "absolute", left: "44%", bottom: "27%", width: 70, height: 286, borderRadius: "38px 38px 16px 16px", background: "linear-gradient(180deg,#fafdff,#c6dcf8 58%,#7faee3)", transform: "skewX(-7deg)", boxShadow: "inset -10px 0 18px rgba(59,130,246,0.24)" }} />
          <div style={{ position: "absolute", left: "52%", bottom: "27%", width: 104, height: 248, clipPath: "polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)", background: "linear-gradient(180deg,#f7fbff,#c8dff8 57%,#89b5e7)", boxShadow: "inset -9px 0 18px rgba(30,64,175,0.22)" }} />

          <div style={{ position: "absolute", left: "8%", right: "14%", bottom: "22%", height: 3, background: "linear-gradient(90deg,transparent,#76a8df,transparent)", opacity: 0.8 }} />
          <div style={{ position: "absolute", left: "8%", right: "14%", bottom: "10%", height: "12%", background: "linear-gradient(180deg,rgba(147,197,253,0.24),rgba(191,219,254,0.06))", transform: "scaleY(-1)", filter: "blur(1px)" }} />
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "38px 30px 30px" }}>
          <div style={{ width: "100%", maxWidth: 380, background: "rgba(255,255,255,0.92)", borderRadius: 20, padding: 28, boxShadow: "0 22px 44px rgba(30,64,175,0.10)", position: "relative", display: "grid", gap: 12 }}>
            <button
              type="button"
              aria-label="关闭并返回首页"
              onClick={() => router.push("/")}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#475569",
                fontSize: 16,
                lineHeight: "26px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
              欢迎登录
            </div>
            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 4 }}>
              当前阶段为演示模式，点击登录将直接进入后台。
            </div>

            <input
              className="admin-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入账号"
              autoComplete="username"
              style={{ height: 44, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 12px", background: "#f9fafb" }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
              style={{ height: 44, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 12px", background: "#f9fafb" }}
            />
            <button type="submit" style={{ marginTop: 6, height: 44, border: "none", borderRadius: 22, background: "linear-gradient(90deg,#2563eb,#3b82f6)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
              登 录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
