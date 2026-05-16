"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Swords, Target } from "lucide-react";
import { AdminGateJumpGame } from "@/components/home/AdminGateJumpGame";

const infoCard = {
  border: "1px solid #dbeafe",
  borderRadius: 18,
  background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,251,255,0.96))",
  boxShadow: "0 16px 34px rgba(15,23,42,0.08)",
} as const;

export default function AdminGatePage() {
  const router = useRouter();

  return (
    <main
      className="admin-gate-page"
      style={{
        background:
          "radial-gradient(circle at top, rgba(250,204,21,0.16), transparent 26%), radial-gradient(circle at 86% 18%, rgba(59,130,246,0.16), transparent 26%), linear-gradient(180deg, #f8fbff 0%, #eef5ff 50%, #f8fbff 100%)",
      }}
    >
      <div className="admin-gate-shell">
        <section
          style={{
            ...infoCard,
            position: "relative",
            overflow: "hidden",
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -36,
              top: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(250,204,21,0.22), rgba(250,204,21,0.02) 72%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -36,
              bottom: -42,
              width: 150,
              height: 150,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(59,130,246,0.18), rgba(59,130,246,0.02) 72%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", position: "relative" }}>
            <div style={{ display: "grid", gap: 6, flex: "1 1 420px", minWidth: 260 }}>
              <div style={{ display: "inline-flex", width: "fit-content", alignItems: "center", gap: 8, borderRadius: 999, border: "1px solid #bfdbfe", background: "#eff6ff", padding: "6px 10px", fontSize: 11, fontWeight: 800, letterSpacing: 1.6, color: "#0A84FF", fontFamily: '"Courier New", monospace' }}>
                <Sparkles size={12} /> ADMIN ENTRY CHALLENGE
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: "#0F172A", lineHeight: 1.05, letterSpacing: "-0.01em" }}>
                后台入口挑战
              </div>
              <div style={{ maxWidth: 760, fontSize: 13, color: "#64748B", lineHeight: 1.65 }}>
                先通关，再进入登录页
              </div>
            </div>

            <div className="admin-gate-top-actions" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginLeft: "auto" }}>
              <Link
                href="/"
                className="admin-gate-home-link"
                style={{
                  borderRadius: 999,
                  border: "1px solid #bfdbfe",
                  background: "#f0f9ff",
                  color: "#0369a1",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  minWidth: 132,
                  height: 42,
                  padding: "0 18px",
                  fontSize: 14,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  boxShadow: "0 6px 18px rgba(14,116,144,0.12)",
                }}
              >
                返回首页
              </Link>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 340px)",
            gap: 14,
            alignItems: "start",
          }}
          className="admin-gate-layout"
        >
          <div
            style={{
              ...infoCard,
              padding: 14,
              display: "grid",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: 2 }}>
                <div style={{ fontSize: 11, color: "#F59E0B", fontWeight: 800, letterSpacing: 1.4 }}>HIDDEN GAME</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>剑客行</div>
              </div>
              <div style={{ display: "grid", gap: 8, minWidth: 156 }}>
                <div style={{ borderRadius: 999, border: "1px solid #dbeafe", background: "#f8fbff", padding: "8px 12px", textAlign: "center", fontSize: 12, fontWeight: 800, color: "#0A84FF" }}>
                  主游戏区
                </div>
                <div style={{ borderRadius: 999, border: "1px solid #e2e8f0", background: "#fff", padding: "8px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#475569" }}>
                  自适应布局
                </div>
              </div>
            </div>

            <div
              style={{
                borderRadius: 24,
                border: "1px solid rgba(219,234,254,0.9)",
                background:
                  "radial-gradient(circle at top, rgba(250,204,21,0.08), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,251,255,0.96))",
                padding: 14,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <AdminGateJumpGame onComplete={() => router.replace("/admin/login")} />
            </div>
          </div>

          <aside style={{ display: "grid", gap: 14 }}>
            <div style={{ ...infoCard, padding: 14, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#F59E0B", fontWeight: 800, letterSpacing: 1.4 }}>TIPS</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>操作提示</div>
                </div>
                <Swords size={18} className="text-sky-500" />
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["起跳方式", "长按蓄力，松开起跳"],
                  ["输入方式", "鼠标、空格、触屏都可"],
                  ["目标", "到达最后一段平台自动通关"],
                ].map(([label, value]) => (
                  <div key={label} style={{ border: "1px solid #E2E8F0", borderRadius: 14, background: "#fff", padding: "10px 12px", display: "grid", gap: 4 }}>
                    <div style={{ fontSize: 11, color: "#0A84FF", fontWeight: 800, letterSpacing: 1.2 }}>{label}</div>
                    <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...infoCard, padding: 14, display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0F172A" }}>
                <Target size={16} className="text-emerald-500" />
                <div style={{ fontSize: 16, fontWeight: 900 }}>通关目标</div>
              </div>
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 14, background: "#fff", padding: "10px 12px", fontSize: 13, color: "#334155", lineHeight: 1.65 }}>
                连续落在平台上，到达终点后自动跳转后台登录。
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
