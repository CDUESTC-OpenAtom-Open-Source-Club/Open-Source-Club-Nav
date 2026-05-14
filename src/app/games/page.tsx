"use client";

import Link from "next/link";
import { PacmanMiniGame } from "../../components/WorksCarousel";
import {
  pacmanLeaderboardFields,
  pacmanLeaderboardStoragePlans,
  pacmanMockLeaderboard,
} from "../../data/pacmanLeaderboard";

const boardCardStyle = {
  border: "1px solid #E2E8F0",
  borderRadius: 20,
  background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,251,255,0.96))",
  padding: "16px 18px",
  display: "grid",
  gap: 10,
} as const;

export default function GamesPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px 16px 36px",
        background:
          "radial-gradient(circle at top, rgba(250,204,21,0.18), transparent 30%), radial-gradient(circle at 85% 18%, rgba(59,130,246,0.16), transparent 26%), linear-gradient(180deg, #f8fbff 0%, #eef5ff 48%, #f8fbff 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <div
          style={{
            border: "1px solid #dbeafe",
            borderRadius: 28,
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 28px 70px rgba(15,23,42,0.10)",
            padding: "22px 24px",
            display: "grid",
            gap: 18,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -40,
              top: -46,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(250,204,21,0.22), rgba(250,204,21,0.02) 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -36,
              bottom: -52,
              width: 170,
              height: 170,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(59,130,246,0.18), rgba(59,130,246,0.02) 72%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              position: "relative",
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#F59E0B",
                  letterSpacing: 2,
                  fontWeight: 700,
                  fontFamily: '"Courier New", monospace',
                }}
              >
                KCOS PAC-MAN ROOM
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>
                吃豆人隐藏游戏页
              </div>
              <div style={{ fontSize: 14, color: "#64748B", maxWidth: 760, lineHeight: 1.6 }}>
                首页只保留隐藏式彩蛋入口，点击后进入这个独立游戏页面。这里保留完整的游戏空间，并预留排行榜与历史积分区域，方便后续继续扩展。
              </div>
            </div>

            <Link
              href="/"
              style={{
                borderRadius: 999,
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
                color: "#0A84FF",
                textDecoration: "none",
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 700,
                whiteSpace: "nowrap",
                position: "relative",
              }}
            >
              返回首页
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            {[
              { label: "操控方式", value: "鼠标 / 键盘 / 触屏", color: "#0A84FF" },
              { label: "游戏节奏", value: "新手慢速模式", color: "#10B981" },
              { label: "积分扩展", value: "当前使用模拟排行数据", color: "#F59E0B" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  border: `1px solid ${item.color}22`,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.82)",
                  padding: "12px 14px",
                  display: "grid",
                  gap: 4,
                  position: "relative",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: item.color,
                    letterSpacing: 1.2,
                    fontWeight: 700,
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#0F172A",
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <section
          style={{
            border: "1px solid #dbeafe",
            borderRadius: 28,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 20px 48px rgba(37,99,235,0.08)",
            padding: 20,
            display: "grid",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 340px)",
              gap: 18,
              alignItems: "start",
            }}
          >
            <div style={{ display: "grid", gap: 16 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.2fr) minmax(260px, 0.8fr)",
                  gap: 16,
                  alignItems: "start",
                }}
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700, letterSpacing: 1.5 }}>
                    HIDDEN GAME
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>PAC-MAN</div>
                  <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
                    支持鼠标点击引导方向、键盘方向键控制，以及移动端按钮操作。页面已调整为独立游戏布局，不会像首页那样压在主要信息内容前面。
                  </div>
                </div>

                <div style={boardCardStyle}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>快速提示</div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>
                    建议先点击游戏面板聚焦，再使用方向键操作。鼠标点击吃豆人周边区域时，会自动选择更接近的移动方向。
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 24,
                  border: "1px solid rgba(219,234,254,0.9)",
                  background:
                    "radial-gradient(circle at top, rgba(250,204,21,0.08), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,251,255,0.96))",
                  padding: "18px 14px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <PacmanMiniGame standalone />
              </div>
            </div>

            <aside style={{ display: "grid", gap: 14 }}>
              <div style={boardCardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700, letterSpacing: 1.4 }}>
                      LEADERBOARD
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>
                      排行榜
                    </div>
                  </div>
                  <div
                    style={{
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#0A84FF",
                      background: "#EFF6FF",
                      border: "1px solid #BFDBFE",
                    }}
                  >
                    模拟数据
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {pacmanMockLeaderboard.map((item) => (
                    <div
                      key={item.rank}
                      style={{
                        border: "1px solid #E2E8F0",
                        borderRadius: 16,
                        background: item.rank === 1 ? "linear-gradient(135deg, #FFF8E1, #FFFFFF)" : "#FFFFFF",
                        padding: "12px 14px",
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 12,
                              fontWeight: 800,
                              color: item.rank === 1 ? "#92400E" : "#0F172A",
                              background: item.rank === 1 ? "#FDE68A" : "#E2E8F0",
                            }}
                          >
                            {item.rank}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: "#94A3B8" }}>{item.updatedAt}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#0A84FF" }}>{item.score}</div>
                          <div style={{ fontSize: 11, color: "#64748B" }}>第 {item.level} 关</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={boardCardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>历史积分存储预留</div>
                <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
                  当前先使用前端模拟数据驱动排行榜界面，后续接数据库或后台接口时，只需要替换数据来源，不必重做页面结构。
                </div>
                <div
                  style={{
                    borderRadius: 14,
                    border: "1px dashed #BFDBFE",
                    background: "rgba(239,246,255,0.68)",
                    padding: "12px 14px",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                    字段预留：{pacmanLeaderboardFields.join(" / ")}
                  </div>
                  {pacmanLeaderboardStoragePlans.map((text) => (
                    <div key={text} style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
