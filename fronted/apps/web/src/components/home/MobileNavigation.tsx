"use client";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Brain,
  ExternalLink,
  GitBranch,
  Info,
  LayoutGrid,
  MapPin,
  Newspaper,
  Sparkles,
  Wrench,
} from "lucide-react";

export type MobileNavItem = {
  id: string;
  label: string;
  description?: string;
  href?: string;
  action?: () => void;
  external?: boolean;
  icon?: "grid" | "sparkles" | "newspaper" | "info" | "github" | "branch" | "Brain" | "MapPin" | "Wrench";
  active?: boolean;
  children?: MobileNavItem[];
};

export type MobileNavSection = {
  id: string;
  label: string;
  items: MobileNavItem[];
};

const ICON_MAP = {
  grid: LayoutGrid,
  sparkles: Sparkles,
  newspaper: Newspaper,
  info: Info,
  github: GitHubMark,
  branch: GitBranch,
  Brain,
  MapPin,
  Wrench,
} as const;

function GitHubMark({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0.45C3.82 0.45 0.45 3.82 0.45 8c0 3.34 2.17 6.17 5.18 7.17 0.38 0.07 0.52-0.16 0.52-0.36 0-0.18-0.01-0.77-0.01-1.39-2.1 0.46-2.54-0.89-2.54-0.89-0.34-0.87-0.84-1.1-0.84-1.1-0.69-0.47 0.05-0.46 0.05-0.46 0.76 0.05 1.16 0.78 1.16 0.78 0.68 1.16 1.78 0.83 2.21 0.63 0.07-0.49 0.27-0.83 0.49-1.02-1.68-0.19-3.44-0.84-3.44-3.73 0-0.82 0.29-1.5 0.78-2.03-0.08-0.19-0.34-0.96 0.07-2 0 0 0.64-0.2 2.08 0.78A7.2 7.2 0 0 1 8 4.32c0.64 0 1.28 0.09 1.88 0.26 1.44-0.98 2.08-0.78 2.08-0.78 0.41 1.04 0.15 1.81 0.07 2 0.49 0.53 0.78 1.2 0.78 2.03 0 2.9-1.77 3.54-3.45 3.73 0.27 0.23 0.51 0.69 0.51 1.39 0 1-0.01 1.8-0.01 2.05 0 0.2 0.14 0.44 0.52 0.36A7.56 7.56 0 0 0 15.55 8C15.55 3.82 12.18 0.45 8 0.45Z"
      />
    </svg>
  );
}

function MobileActionButton({
  label,
  isDarkMode,
  active = false,
  onClick,
}: {
  label: string;
  isDarkMode: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={active}
      aria-controls={active ? "mobile-nav-panel" : undefined}
      data-ui-touch="true"
      onClick={onClick}
      style={{
        width: 44,
        height: 44,
        border: "none",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: active ? "#0A84FF" : isDarkMode ? "#CBD5E1" : "#334155",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 22,
          height: 16,
          position: "relative",
          display: "inline-block",
        }}
      >
        {[0, 1, 2].map((line) => {
          const top = line === 0 ? 0 : line === 1 ? 7 : 14;
          const transform = active
            ? line === 0
              ? "translateY(7px) rotate(45deg)"
              : line === 1
                ? "scaleX(0)"
                : "translateY(-7px) rotate(-45deg)"
            : "translateY(0) rotate(0deg)";
          return (
            <span
              key={line}
              style={{
                position: "absolute",
                left: 0,
                top,
                width: "100%",
                height: 2,
                borderRadius: 999,
                background: "currentColor",
                transform,
                transformOrigin: "center",
                opacity: active && line === 1 ? 0 : 1,
                transition:
                  "transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease",
              }}
            />
          );
        })}
      </span>
    </button>
  );
}

export function MobileHeaderActions({
  isDarkMode,
  menuOpen,
  onToggleMenu,
  children,
}: {
  isDarkMode: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {children}
      <MobileActionButton
        label={menuOpen ? "关闭移动菜单" : "打开移动菜单"}
        isDarkMode={isDarkMode}
        active={menuOpen}
        onClick={onToggleMenu}
      />
    </div>
  );
}

function NavSection({
  section,
  isDarkMode,
  onItemSelect,
}: {
  section: MobileNavSection;
  isDarkMode: boolean;
  onItemSelect: (item: MobileNavItem) => void;
}) {
  return (
    <section style={{ display: "grid", gap: 10 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.2,
          color: isDarkMode ? "#94A3B8" : "#64748B",
          textTransform: "uppercase",
        }}
      >
        {section.label}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {section.items.map((item) => {
          const Icon = item.icon ? ICON_MAP[item.icon] : LayoutGrid;

          return (
            <div
              key={item.id}
              style={{
                width: "100%",
                borderRadius: 18,
                border: `1px solid ${item.active ? "#93C5FD" : isDarkMode ? "#334155" : "#E5E7EB"}`,
                background: item.active
                  ? isDarkMode
                    ? "rgba(30,64,175,0.18)"
                    : "#EFF6FF"
                  : isDarkMode
                    ? "rgba(15,23,42,0.9)"
                    : "rgba(255,255,255,0.96)",
                boxShadow: item.active
                  ? "0 10px 24px rgba(59,130,246,0.12)"
                  : "0 6px 18px rgba(15,23,42,0.04)",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                data-ui-touch="true"
                onClick={() => {
                  onItemSelect(item);
                }}
                style={{
                  width: "100%",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  textAlign: "left",
                  cursor: "pointer",
                  background: "transparent",
                  border: "none",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    border: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
                    background: isDarkMode ? "#111827" : "#F8FAFC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: item.active ? "#0A84FF" : isDarkMode ? "#CBD5E1" : "#64748B",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: isDarkMode ? "#F8FAFC" : "#0F172A",
                      }}
                    >
                      {item.label}
                    </span>

                    {item.external ? (
                      <ExternalLink size={14} color={isDarkMode ? "#94A3B8" : "#64748B"} />
                    ) : null}
                  </div>

                  {item.description && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        lineHeight: 1.5,
                        color: isDarkMode ? "#94A3B8" : "#64748B",
                      }}
                    >
                      {item.description}
                    </div>
                  )}

                  {item.children && item.children.length > 0 && (
                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      {item.children.map((child) => (
                        <span
                          key={child.id}
                          style={{
                            fontSize: 11,
                            color: isDarkMode ? "#CBD5E1" : "#475569",
                            border: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
                            borderRadius: 999,
                            padding: "4px 8px",
                            background: isDarkMode ? "#111827" : "#FFFFFF",
                          }}
                        >
                          {child.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function MobileNavigationPanel({
  isDarkMode,
  sections,
  closeSignal = 0,
  onItemSelect,
  onClose,
}: {
  isDarkMode: boolean;
  sections: MobileNavSection[];
  closeSignal?: number;
  onItemSelect: (item: MobileNavItem) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"entering" | "open" | "closing">("entering");
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const closingRef = useRef(false);
  const lastCloseSignalRef = useRef(closeSignal);
  const closeFallbackRef = useRef<number | null>(null);
  const enterTimerRef = useRef<number | null>(null);

  useEffect(() => {
    enterTimerRef.current = window.setTimeout(() => setPhase("open"), 32);

    return () => {
      if (enterTimerRef.current) {
        window.clearTimeout(enterTimerRef.current);
      }
      if (closeFallbackRef.current) {
        window.clearTimeout(closeFallbackRef.current);
      }
    };
  }, []);

  const handleDismiss = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (enterTimerRef.current) {
      window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    setPhase("closing");
    closeFallbackRef.current = window.setTimeout(onClose, 1100);
  };

  useEffect(() => {
    if (closeSignal <= lastCloseSignalRef.current) return;
    lastCloseSignalRef.current = closeSignal;
    handleDismiss();
  }, [closeSignal]);

  return (
    <div
      className="mobile-nav-overlay"
      data-mobile-nav-overlay="true"
      data-mobile-nav-phase={phase}
      role="presentation"
      style={{
        position: "fixed",
        top: 48,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        overflow: "hidden",
      }}
      onClick={handleDismiss}
      onTouchStart={(event) => {
        if (event.target === event.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <div
        id="mobile-nav-panel"
        className="mobile-nav-panel"
        data-mobile-nav-panel="true"
        data-mobile-nav-phase={phase}
        role="navigation"
        aria-label="移动端主导航"
        onTransitionEnd={(event) => {
          if (event.currentTarget !== event.target) return;
          if (event.propertyName !== "transform") return;
          if (phase !== "closing") return;
          if (closeFallbackRef.current) {
            window.clearTimeout(closeFallbackRef.current);
            closeFallbackRef.current = null;
          }
          onClose();
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(event) => {
          touchStartXRef.current = event.touches[0]?.clientX ?? null;
          touchStartYRef.current = event.touches[0]?.clientY ?? null;
        }}
        onTouchEnd={(event) => {
          const startX = touchStartXRef.current;
          const startY = touchStartYRef.current;
          touchStartXRef.current = null;
          touchStartYRef.current = null;
          if (startX == null || startY == null) return;
          const endX = event.changedTouches[0]?.clientX ?? startX;
          const endY = event.changedTouches[0]?.clientY ?? startY;
          const deltaX = endX - startX;
          const deltaY = endY - startY;
          if (deltaX > 56 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
            handleDismiss();
          }
        }}
        style={{
          marginLeft: "auto",
          width: "min(92vw, 420px)",
          maxWidth: "100%",
          height: "100%",
          borderLeft: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
          background: isDarkMode ? "rgba(15,23,42,0.98)" : "rgba(255,255,255,0.98)",
          boxShadow: "-18px 0 42px rgba(15,23,42,0.22)",
          transform: phase === "open" ? "translate3d(0, 0, 0)" : "translate3d(108%, 0, 0)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          touchAction: "pan-y",
        } as CSSProperties}
      >
        <div
          data-mobile-nav-scroll="true"
          style={{
            padding: 16,
            display: "grid",
            gap: 18,
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
            height: "100%",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
          }}
        >
          {sections.map((section) => (
            <NavSection
              key={section.id}
              section={section}
              isDarkMode={isDarkMode}
              onItemSelect={onItemSelect}
            />
          ))}
        </div>
      </div>
      <style>{`
        .mobile-nav-overlay {
          background: rgba(2, 6, 23, 0);
          -webkit-backdrop-filter: blur(0);
          backdrop-filter: blur(0);
          transition:
            background 920ms cubic-bezier(0.17, 0.9, 0.2, 1.04),
            -webkit-backdrop-filter 920ms cubic-bezier(0.17, 0.9, 0.2, 1.04),
            backdrop-filter 920ms cubic-bezier(0.17, 0.9, 0.2, 1.04);
        }

        .mobile-nav-overlay[data-mobile-nav-phase="open"] {
          background: rgba(2, 6, 23, 0.42);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
        }

        .mobile-nav-panel {
          transition: transform 920ms cubic-bezier(0.17, 0.9, 0.2, 1.04);
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
