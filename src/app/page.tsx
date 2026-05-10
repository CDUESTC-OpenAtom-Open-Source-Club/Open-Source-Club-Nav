"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Menu,
  X,
  Brain,
  MapPin,
  Wrench,
} from "lucide-react";
import HUDHeader from "@/components/HUDHeader";
import LeftPanel from "@/components/LeftPanel";
import CentralHub from "@/components/CentralHub";
import RightPanel from "@/components/RightPanel";
import StartupSplash from "@/components/StartupSplash";
import AboutModal from "@/components/AboutModal";
import { RESOURCE_CATEGORIES } from "@/data/resources";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Brain,
  MapPin,
  Wrench,
};

export default function Home() {
  const [booted, setBooted] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if already booted this session
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "kcos_booted";
    if (sessionStorage.getItem(key)) {
      setBooted(true);
    }
  }, []);

  const handleBootComplete = useCallback(() => {
    sessionStorage.setItem("kcos_booted", "1");
    setBooted(true);
  }, []);

  // Mouse parallax
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setParallax({
        x: ((e.clientX - cx) / cx) * 12,
        y: ((e.clientY - cy) / cy) * 8,
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <>
      {!booted && <StartupSplash onComplete={handleBootComplete} />}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          background: "linear-gradient(160deg, #F4F8FC 0%, #FFFFFF 50%, #F0F7FF 100%)",
          opacity: booted ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      >
        {/* HUD Header */}
        <HUDHeader />

        {/* Main content: 3-column layout */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
          {/* Left Panel — hidden on mobile */}
          <div className="hidden-mobile" style={{ display: "contents" }}>
            <LeftPanel
              activeCategory={activeCategory}
              onCategorySelect={setActiveCategory}
            />
          </div>

          {/* Central Hub */}
          <CentralHub
            activeCategory={activeCategory}
            parallax={parallax}
            onClosePanel={() => setActiveCategory(null)}
          />

          {/* Right Panel — hidden on mobile */}
          <div className="hidden-mobile" style={{ display: "contents" }}>
            <RightPanel />
          </div>
        </div>

        {/* Mobile category pills — shown only on mobile */}
        <div className="mobile-only" style={{ display: "none" }}>
          <div
            style={{
              padding: "8px 12px",
              borderTop: "1px solid #E5E7EB",
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(8px)",
              display: "flex",
              gap: 6,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {RESOURCE_CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.icon];
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(isActive ? null : cat.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: `1px solid ${isActive ? cat.color + "55" : "#E5E7EB"}`,
                    background: isActive ? `${cat.color}12` : "white",
                    fontSize: 10,
                    color: isActive ? cat.color : "#64748B",
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  {Icon && <Icon size={12} color={isActive ? cat.color : "#94A3B8"} />}
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            height: 32,
            background: "rgba(255,255,255,0.9)",
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            backdropFilter: "blur(8px)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "#CBD5E1",
              fontFamily: '"Courier New", monospace',
              letterSpacing: 1,
            }}
          >
            KCOS.CLUB · 科成开放原子开源社团
          </span>
          <div style={{ display: "flex", gap: 16 }}>
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              style={{
                fontSize: 10,
                color: "#94A3B8",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#0A84FF"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; }}
            >
              关于我们
            </button>
            <a
              href="https://github.com/CDUESTC-OpenAtom-Club/OpenAtom-Club-Blog"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 10, color: "#94A3B8", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#0A84FF"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; }}
            >
              GitHub
            </a>
            <a
              href="https://opensouce-club.top/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 10, color: "#94A3B8", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#0A84FF"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; }}
            >
              社团官网
            </a>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(15,23,42,0.4)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "24px 20px",
              width: "85vw",
              maxWidth: 320,
              boxShadow: "0 24px 48px rgba(15,23,42,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "1px solid #E5E7EB",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={12} color="#94A3B8" />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {RESOURCE_CATEGORIES.map((cat) => {
                const Icon = ICON_MAP[cat.icon];
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #E5E7EB",
                      background: "white",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: `${cat.color}18`,
                        border: `1px solid ${cat.color}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {Icon && <Icon size={14} color={cat.color} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>
                        {cat.label}
                      </div>
                      <div style={{ fontSize: 9, color: "#94A3B8" }}>{cat.sublabel}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile {
            display: none !important;
          }
          .mobile-only {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
