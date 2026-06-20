"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PacmanMiniGame } from "@/components/home/WorksCarousel";
import ShareButtons from "@/components/shared/ShareButtons";
import { pacmanMockLeaderboard } from "@/data/pacmanLeaderboard";

const boardCardStyle = {
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: 22,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(247,250,255,0.96))",
  padding: "16px 18px",
  display: "grid",
  gap: 10,
  boxShadow: "0 16px 36px rgba(15,23,42,0.06)",
} as const;

type LinkItem = {
  title: string;
  url: string;
  description?: string;
};

const BASE_MINI_GAME_LINKS: LinkItem[] = [
  { title: "吃豆人小游戏", url: "/games", description: "站内经典小游戏入口" },
];
const PUBLIC_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export default function GamesPage() {
  const [remoteMiniGameLinks, setRemoteMiniGameLinks] = useState<LinkItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const syncMiniGameLinks = async () => {
      try {
        const res = await fetch("/api/links?module=mini_games");
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const list = Array.isArray(data?.links) ? data.links : [];
        if (cancelled) return;
        const normalized = list
          .map((item: { title?: unknown; url?: unknown; description?: unknown }) => ({
            title: String(item?.title || "").trim(),
            url: String(item?.url || "").trim(),
            description: String(item?.description || "").trim(),
          }))
          .filter((item: LinkItem) => item.title && item.url);
        setRemoteMiniGameLinks(normalized);
      } catch {
        // ignore network errors, keep base links
      }
    };

    void syncMiniGameLinks();
    const timer = window.setInterval(() => {
      void syncMiniGameLinks();
    }, PUBLIC_REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const miniGameLinks = useMemo(() => {
    const seen = new Set<string>();
    const merged = [...BASE_MINI_GAME_LINKS, ...remoteMiniGameLinks];
    return merged.filter((item) => {
      const key = `${item.title}::${item.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [remoteMiniGameLinks]);

  return (
    <main
      className="games-page"
    >
      <div className="games-shell">
        <div
          className="games-hero"
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

          <div className="games-hero__topbar">
            <div className="games-hero__brand">
              <span className="games-hero__eyebrow">PAC-MAN ROOM</span>
              <span className="games-hero__title">吃豆人</span>
            </div>
            <Link
              href="/"
              className="games-hero__back"
              title="返回开放原子社团导航主页"
            >
              返回社团导航主页
            </Link>
          </div>

          {/* 社交分享 */}
          <div style={{ padding: "0 4px" }}>
            <ShareButtons compact />
          </div>

          <div className="games-metrics">
            {[
              { label: "操控方式", value: "鼠标 / 键盘 / 触屏", color: "#005FCC" },
              { label: "游戏节奏", value: "新手慢速模式", color: "#10B981" },
              { label: "积分扩展", value: "排行榜", color: "#F59E0B" },
            ].map((item) => (
              <div
                key={item.label}
                className="games-metric"
                style={{ ["--metric-accent" as never]: item.color }}
              >
                <span className="games-metric__label">{item.label}</span>
                <span className="games-metric__value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <section className="games-main-card">
          <div className="games-main-grid">
            <div className="games-stage-column">
              <div className="games-intro-grid">
                <div style={boardCardStyle}>
                  <div className="games-card-title">快速提示</div>
                  <div className="games-card-copy">
                    建议先点击游戏面板聚焦，再使用方向键操作。鼠标点击吃豆人周边区域时，会自动选择更接近的移动方向。
                  </div>
                </div>
                <div style={boardCardStyle}>
                  <div className="games-card-title">小游戏链接</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {miniGameLinks.map((item, index) => {
                      const isExternal = item.url.startsWith("http");
                      return (
                        <a
                          key={`${item.title}-${index}`}
                          href={item.url}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                          style={{
                            border: "1px solid rgba(191,219,254,0.9)",
                            borderRadius: 10,
                            padding: "8px 10px",
                            textDecoration: "none",
                            background: "rgba(255,255,255,0.85)",
                            display: "grid",
                            gap: 2,
                          }}
                        >
                          <span style={{ fontSize: 13, color: "#0F172A", fontWeight: 700 }}>{item.title}</span>
                          <span style={{ fontSize: 11, color: "#595959" }}>{item.description || item.url}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div
                className="games-board-shell"
              >
                <PacmanMiniGame standalone />
              </div>
            </div>

            <aside className="games-side-column">
              <div style={boardCardStyle}>
                <div className="games-side-head">
                  <div>
                    <div className="games-side-kicker">
                      LEADERBOARD
                    </div>
                    <div className="games-side-title">
                      排行榜
                    </div>
                  </div>
                </div>

                <div className="games-leaderboard">
                  {pacmanMockLeaderboard.map((item) => (
                    <div
                      key={item.rank}
                      className={`games-rank ${item.rank === 1 ? "games-rank--gold" : ""}`}
                    >
                      <div className="games-rank__top">
                        <div className="games-rank__left">
                          <div className="games-rank__badge">{item.rank}</div>
                          <div className="games-rank__meta">
                            <div className="games-rank__name">{item.name}</div>
                            <div className="games-rank__time">{item.updatedAt}</div>
                          </div>
                        </div>
                        <div className="games-rank__scorebox">
                          <div className="games-rank__score">{item.score}</div>
                          <div className="games-rank__level">第 {item.level} 关</div>
                        </div>
                      </div>
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
