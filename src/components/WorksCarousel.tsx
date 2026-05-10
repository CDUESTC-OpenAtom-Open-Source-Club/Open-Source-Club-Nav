"use client";
import { useEffect, useRef, useState } from "react";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Pause,
  Play,
  TrendingUp,
  Layers,
  Radar,
  Sparkles,
  Activity,
} from "lucide-react";

// API 返回的作品格式
interface ApiWork {
  id: number;
  type: string;
  repo_url: string | null;
  title: string;
  description: string;
  author_name: string;
  author_avatar: string;
  tags: string[];
  color: string;
  status: string;
  stars: number;
  preview_url: string | null;
  is_featured: number;
  display_order: number;
}

// 组件内部使用的格式（兼容旧接口）
interface Work {
  id: number;
  title: string;
  desc: string;
  author: string;
  avatar: string;
  tags: string[];
  color: string;
  status: string;
  stars: number;
  preview: string | null;
  repoUrl: string | null;
}

function adaptWork(w: ApiWork): Work {
  return {
    id: w.id,
    title: w.title,
    desc: w.description,
    author: w.author_name,
    avatar: w.author_avatar,
    tags: w.tags || [],
    color: w.color,
    status: w.status,
    stars: w.stars,
    preview: w.preview_url,
    repoUrl: w.repo_url,
  };
}

function CardBody({ work }: { work: Work }) {
  return (
    <>
      <div style={{ height: 2.5, background: `linear-gradient(90deg, ${work.color}, ${work.color}44)`, borderRadius: 3, marginBottom: 3 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${work.color}18`, border: `1px solid ${work.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: work.color, flexShrink: 0 }}>
            {work.avatar}
          </div>
          <span style={{ fontSize: 9, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{work.author}</span>
        </div>
        <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 999, border: "1px solid #BFDBFE", color: "#2563EB", background: "#EFF6FF", flexShrink: 0, maxWidth: 62, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={work.status}>
          {work.status}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{work.title}</div>
        <div style={{ fontSize: 10, color: "#64748B", marginTop: 3, lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" as const, WebkitLineClamp: 2 }}>{work.desc}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: "auto" }}>
        {work.tags.slice(0, 3).map((tag) => (
          <span key={tag} style={{ fontSize: 8, padding: "1px 6px", borderRadius: 999, border: "1px solid #E5E7EB", color: "#64748B", background: "#F8FAFC" }}>{tag}</span>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, paddingTop: 5, borderTop: "1px solid #F1F5F9" }}>
        <Star size={10} color="#F59E0B" fill="#F59E0B" />
        <span style={{ fontSize: 10, fontWeight: 600, color: "#374151", fontFamily: '"Courier New", monospace' }}>{work.stars}</span>
      </div>
    </>
  );
}

function InsightCard({ icon: Icon, label, value, tint }: { icon: React.ComponentType<{ size?: number; color?: string }>; label: string; value: string; tint: string }) {
  return (
    <div style={{ border: `1px solid ${tint}33`, background: `linear-gradient(140deg, #FFFFFF, ${tint}0E)`, borderRadius: 11, padding: "8px 9px", display: "flex", alignItems: "center", gap: 7, minHeight: 44 }}>
      <div style={{ width: 22, height: 22, borderRadius: 7, border: `1px solid ${tint}44`, background: `${tint}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={12} color={tint} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 9, color: "#94A3B8", lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontSize: 12, color: "#1E293B", fontWeight: 700, lineHeight: 1.2, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
      </div>
    </div>
  );
}

export default function WorksCarousel() {
  const [works, setWorks] = useState<Work[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"carousel" | "list">("carousel");
  const [autoPlay, setAutoPlay] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/works")
      .then((res) => res.json())
      .then((data) => {
        if (data.works) setWorks(data.works.map(adaptWork));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = works.length;
  const focused = works[currentIndex];
  const totalStars = works.reduce((sum, w) => sum + w.stars, 0);
  const avgStars = Math.round(totalStars / Math.max(1, total));
  const onlineCount = works.filter((w) => w.status.includes("已上线")).length;
  const topTags = Object.entries(
    works.reduce((acc: Record<string, number>, work) => {
      work.tags.forEach((tag) => { acc[tag] = (acc[tag] || 0) + 1; });
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const go = (dir: number) => {
    if (total === 0) return;
    setCurrentIndex((i) => (i + dir + total) % total);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (isMobile) setAutoPlay(false);
  }, [isMobile]);

  useEffect(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    if (viewMode !== "carousel" || !autoPlay || isInteracting || isMobile || total === 0) return;
    autoRef.current = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % total);
    }, 3500);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [viewMode, autoPlay, isInteracting, isMobile, total]);

  const getCardStyle = (idx: number): React.CSSProperties | null => {
    if (total === 0) return null;
    const diff = (idx - currentIndex + total) % total;
    const normalized = diff > total / 2 ? diff - total : diff;
    const absD = Math.abs(normalized);
    if (absD > 2) return null;
    return {
      transform: `translateX(${normalized * 64}px) translateZ(${absD === 0 ? 0 : -82 * absD}px) rotateY(${normalized * 22}deg) scale(${absD === 0 ? 1 : 0.86 - absD * 0.08})`,
      opacity: absD === 0 ? 1 : 0.72 - absD * 0.1,
      zIndex: 10 - absD,
    };
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === " ") { e.preventDefault(); setAutoPlay((v) => !v); }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1, minHeight: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 6px", borderTop: "1px solid #F1F5F9", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Member Works</div>
            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>Loading...</div>
          </div>
        </div>
        <div style={{ padding: "0 16px 8px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7, flexShrink: 0 }}>
          {[1,2,3,4].map((i) => (
            <div key={i} style={{ border: "1px solid #E5E7EB", borderRadius: 11, padding: "8px 9px", minHeight: 44, background: "linear-gradient(90deg, #F8FAFC 25%, #EFF6FF 50%, #F8FAFC 75%)", backgroundSize: "200% 100%", animation: "skeletonShimmer 1.5s ease-in-out infinite" }} />
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 11 }}>
          Loading works data...
        </div>
        <style>{`@keyframes skeletonShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 6px", borderTop: "1px solid #F1F5F9", gap: 10, flexWrap: isMobile ? "wrap" : "nowrap", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Member Works</div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{total} items · Arrow keys / swipe supported</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!isMobile && (
            <>
              <button type="button" onClick={() => go(-1)} disabled={viewMode !== "carousel"} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #E5E7EB", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: viewMode === "carousel" ? "pointer" : "not-allowed", opacity: viewMode === "carousel" ? 1 : 0.45, transition: "all 0.18s ease" }}>
                <ChevronLeft size={13} color="#64748B" />
              </button>
              <button type="button" onClick={() => setAutoPlay((v) => !v)} disabled={viewMode !== "carousel"} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #E5E7EB", background: autoPlay && viewMode === "carousel" ? "#EFF6FF" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: viewMode === "carousel" ? "pointer" : "not-allowed", opacity: viewMode === "carousel" ? 1 : 0.45, transition: "all 0.18s ease" }}>
                {autoPlay ? <Pause size={12} color="#0A84FF" /> : <Play size={12} color="#64748B" />}
              </button>
              <button type="button" onClick={() => go(1)} disabled={viewMode !== "carousel"} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #E5E7EB", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: viewMode === "carousel" ? "pointer" : "not-allowed", opacity: viewMode === "carousel" ? 1 : 0.45, transition: "all 0.18s ease" }}>
                <ChevronRight size={13} color="#64748B" />
              </button>
              <div style={{ width: 1, height: 18, background: "#E5E7EB", margin: "0 2px" }} />
            </>
          )}
          {(["carousel", "list"] as const).map((mode) => (
            <button key={mode} type="button" onClick={() => setViewMode(mode)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${viewMode === mode ? "#0A84FF40" : "#E5E7EB"}`, background: viewMode === mode ? "#EFF6FF" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.18s ease" }}>
              {mode === "carousel" ? <LayoutGrid size={13} color={viewMode === mode ? "#0A84FF" : "#94A3B8"} /> : <List size={13} color={viewMode === mode ? "#0A84FF" : "#94A3B8"} />}
            </button>
          ))}
        </div>
      </div>

      {/* Insight cards */}
      <div style={{ padding: "0 16px 8px", display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 7, flexShrink: 0 }}>
        <InsightCard icon={TrendingUp} label="Total Stars" value={totalStars.toLocaleString()} tint="#0A84FF" />
        <InsightCard icon={Layers} label="Projects Online" value={`${onlineCount}/${total}`} tint="#10B981" />
        <InsightCard icon={Radar} label="Avg Stars" value={`${avgStars} / project`} tint="#F59E0B" />
        <InsightCard icon={Sparkles} label="Focused" value={focused?.title || "N/A"} tint={focused?.color || "#64748B"} />
      </div>

      {/* Tech heat */}
      <div style={{ padding: "0 16px 8px", display: "flex", alignItems: "center", gap: 6, overflowX: "auto", flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: "#94A3B8", letterSpacing: 0.6, whiteSpace: "nowrap" }}>Tech Heat:</span>
        {topTags.map(([tag, count]) => (
          <div key={tag} style={{ whiteSpace: "nowrap", border: "1px solid #E2E8F0", borderRadius: 999, background: "rgba(255,255,255,0.9)", padding: "3px 8px", fontSize: 9, color: "#475569", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span>{tag}</span>
            <span style={{ color: "#0A84FF", fontFamily: '"Courier New", monospace', fontWeight: 700 }}>{count}</span>
          </div>
        ))}
      </div>

      {/* Carousel view */}
      {viewMode === "carousel" && !isMobile && (
        <div
          tabIndex={0}
          onKeyDown={onKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onMouseEnter={() => setIsInteracting(true)}
          onMouseLeave={() => setIsInteracting(false)}
          onTouchStart={(e) => { touchStartRef.current = e.touches[0]?.clientX ?? null; setIsInteracting(true); }}
          onTouchEnd={(e) => {
            const startX = touchStartRef.current;
            const endX = e.changedTouches[0]?.clientX ?? null;
            if (startX !== null && endX !== null && Math.abs(endX - startX) > 36) go(endX - startX > 0 ? -1 : 1);
            touchStartRef.current = null;
            setIsInteracting(false);
          }}
          style={{ position: "relative", flex: 1, minHeight: 208, overflow: "hidden", outline: "none", boxShadow: isFocused ? "inset 0 0 0 1px #93C5FD" : "none" }}
        >
          {/* Aurora bg */}
          <div style={{ position: "absolute", inset: "-20% -10% auto -10%", height: "68%", background: "radial-gradient(circle at 14% 26%, rgba(10,132,255,0.18), transparent 45%), radial-gradient(circle at 78% 18%, rgba(6,229,204,0.16), transparent 40%), radial-gradient(circle at 52% 44%, rgba(245,158,11,0.12), transparent 38%)", filter: "blur(18px)", animation: "worksAuroraMove 16s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />

          {/* Grid bg */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(10,132,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(10,132,255,0.06) 1px, transparent 1px)", backgroundSize: "26px 26px", maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.52), transparent 72%)", animation: "worksGridFlow 14s linear infinite", pointerEvents: "none", zIndex: 0 }} />

          {/* Focus snapshot */}
          <div style={{ position: "absolute", left: 14, top: 10, zIndex: 15, width: 182, border: "1px solid #DBEAFE", borderRadius: 12, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", padding: "9px 10px", display: "grid", gap: 6 }}>
            <div style={{ fontSize: 9, color: "#94A3B8", letterSpacing: 0.5 }}>Focus Snapshot</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", lineHeight: 1.25 }}>{focused?.title}</div>
            <div style={{ fontSize: 10, color: "#64748B", lineHeight: 1.45 }}>{focused?.desc}</div>
          </div>

          {/* 3D cards */}
          <div style={{ position: "absolute", inset: 0, perspective: "620px", perspectiveOrigin: "50% 52%" }}>
            <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
              {works.map((work, idx) => {
                const cardStyle = getCardStyle(idx);
                if (!cardStyle) return null;
                const isCenter = idx === currentIndex;
                return (
                  <button
                    key={work.id}
                    onClick={() => {
                      if (isCenter && work.repoUrl) {
                        window.open(work.repoUrl, "_blank", "noopener,noreferrer");
                      } else if (!isCenter) {
                        go((idx - currentIndex + total) % total > total / 2 ? -1 : 1);
                      }
                    }}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: 160,
                      marginLeft: -80,
                      marginTop: -84,
                      height: 168,
                      background: "rgba(255,255,255,0.95)",
                      border: `1px solid ${isCenter ? work.color + "60" : "#E5E7EB"}`,
                      borderRadius: 14,
                      padding: "10px 10px",
                      cursor: "pointer",
                      transition: "transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.35s ease, box-shadow 0.25s ease, border-color 0.2s ease",
                      boxShadow: isCenter ? `0 0 22px ${work.color}14, 0 4px 12px rgba(0,0,0,0.05)` : "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      userSelect: "none",
                      textAlign: "left",
                      ...cardStyle,
                    }}
                  >
                    <CardBody work={work} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nav arrows */}
          <button type="button" onClick={() => go(-1)} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", zIndex: 20, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.92)", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)", transition: "all 0.18s ease" }}>
            <ChevronLeft size={14} color="#64748B" />
          </button>
          <button type="button" onClick={() => go(1)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", zIndex: 20, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.92)", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)", transition: "all 0.18s ease" }}>
            <ChevronRight size={14} color="#64748B" />
          </button>

          {/* Dots */}
          <div style={{ position: "absolute", bottom: 6, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4, zIndex: 20 }}>
            {works.map((work, i) => (
              <button key={work.id} type="button" onClick={() => setCurrentIndex(i)} style={{ width: 18, height: 18, borderRadius: 9, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                <span style={{ width: i === currentIndex ? 14 : 6, height: 6, borderRadius: 3, background: i === currentIndex ? "#0A84FF" : "#CBD5E1", transition: "all 0.25s ease", display: "block" }} />
              </button>
            ))}
          </div>

          {/* Live focus */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, display: "flex", justifyContent: "center", zIndex: 14, pointerEvents: "none" }}>
            <div style={{ border: "1px solid #DBEAFE", borderRadius: 999, background: "rgba(255,255,255,0.86)", backdropFilter: "blur(8px)", padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 9, color: "#64748B", letterSpacing: 0.35 }}>
              <Activity size={10} color={focused?.color || "#0A84FF"} />
              <span>Live focus on {focused?.author}</span>
              <span style={{ color: "#0A84FF", fontFamily: '"Courier New", monospace' }}>#{focused?.id}</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile carousel */}
      {viewMode === "carousel" && isMobile && (
        <div
          onTouchStart={(e) => { touchStartRef.current = e.touches[0]?.clientX ?? null; }}
          onTouchEnd={(e) => {
            const startX = touchStartRef.current;
            const endX = e.changedTouches[0]?.clientX ?? null;
            if (startX !== null && endX !== null && Math.abs(endX - startX) > 28) go(endX - startX > 0 ? -1 : 1);
            touchStartRef.current = null;
          }}
          style={{ position: "relative", padding: "0 12px 10px" }}
        >
          <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 8, textAlign: "center" }}>Swipe left or right to browse works</div>
          <div onClick={() => { const url = works[currentIndex]?.repoUrl; if (url) window.open(url, "_blank", "noopener,noreferrer"); }} style={{ width: "100%", maxWidth: 320, margin: "0 auto", minHeight: 188, background: "rgba(255,255,255,0.96)", border: `1px solid ${focused.color}44`, borderRadius: 14, padding: "11px 11px", boxShadow: `0 0 22px ${focused.color}12, 0 4px 14px rgba(0,0,0,0.05)`, display: "flex", flexDirection: "column", gap: 5, cursor: works[currentIndex]?.repoUrl ? "pointer" : "default" }}>
            <CardBody work={works[currentIndex]} />
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <button type="button" onClick={() => go(-1)} style={{ width: 34, height: 28, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <ChevronLeft size={14} color="#64748B" />
            </button>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
              {works.map((work, i) => (
                <button key={work.id} type="button" onClick={() => setCurrentIndex(i)} style={{ width: 16, height: 16, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ width: i === currentIndex ? 12 : 6, height: 6, borderRadius: 3, background: i === currentIndex ? "#0A84FF" : "#CBD5E1", transition: "all 0.25s ease" }} />
                </button>
              ))}
            </div>
            <button type="button" onClick={() => go(1)} style={{ width: 34, height: 28, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <ChevronRight size={14} color="#64748B" />
            </button>
          </div>
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 14px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
          {works.map((work) => (
            <a key={work.id} href={work.repoUrl || "#"} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 9, border: "1px solid #F1F5F9", background: "#FAFBFC", transition: "all 0.18s", textDecoration: "none", color: "inherit", cursor: work.repoUrl ? "pointer" : "default" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 12px rgba(15,23,42,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#F1F5F9"; e.currentTarget.style.background = "#FAFBFC"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: work.color, flexShrink: 0, boxShadow: `0 0 6px ${work.color}` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{work.title}</div>
                <div style={{ fontSize: 10, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{work.desc}</div>
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                {work.tags.slice(0, 2).map((t) => (
                  <span key={t} style={{ fontSize: 8, padding: "1px 6px", borderRadius: 999, border: "1px solid #E5E7EB", color: "#94A3B8" }}>{t}</span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                <Star size={9} color="#F59E0B" fill="#F59E0B" />
                <span style={{ fontSize: 10, fontWeight: 600, color: "#374151", fontFamily: '"Courier New", monospace' }}>{work.stars}</span>
              </div>
            </a>
          ))}
        </div>
      )}

      <style>{`
        @keyframes worksAuroraMove {
          0%, 100% { transform: translateX(-2%) translateY(0) scale(1); opacity: 0.8; }
          50% { transform: translateX(2%) translateY(2%) scale(1.04); opacity: 1; }
        }
        @keyframes worksGridFlow {
          0% { transform: translateY(0); }
          100% { transform: translateY(26px); }
        }
      `}</style>
    </div>
  );
}
