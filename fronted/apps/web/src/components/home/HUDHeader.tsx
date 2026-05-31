"use client";
import { useEffect, useRef, useState } from "react";
import { Clock, Radio } from "lucide-react";
import { MobileHeaderActions } from "./MobileNavigation";
import { ThemeModeSwitch, type ThemeMode } from "./ThemeModeSwitch";

const TYPEWRITER_MESSAGES = [
  "KCOS 开放原子开源社团 · 探索、共创、分享",
  "KCOS HUB ONLINE · SYSTEM STATUS NORMAL",
  "Kecheng OpenAtom Open Source Club · Build with global developers",
  "OPEN SOURCE CONNECTS IDEAS AND PEOPLE",
] as const;

const HEADER_HEIGHT = "clamp(50px, 6vh, 56px)";
const HEADER_PADDING_X = "clamp(12px, 1.3vw, 20px)";
const LEFT_BLOCK_MIN_WIDTH = "clamp(156px, 18vw, 190px)";
const RIGHT_BLOCK_MIN_WIDTH = "clamp(210px, 24vw, 280px)";

type HUDHeaderProps = {
  compact?: boolean;
  isDarkMode?: boolean;
  themeMode?: ThemeMode;
  onThemeModeChange?: (mode: ThemeMode) => void;
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
};

export default function HUDHeader({
  compact = false,
  isDarkMode = false,
  themeMode = "auto",
  onThemeModeChange = () => {},
  mobileMenuOpen = false,
  onToggleMobileMenu = () => {},
}: HUDHeaderProps) {
  const [uptimeText, setUptimeText] = useState("--");
  const uptimeBaseSecRef = useRef(0);
  const uptimeAnchorMsRef = useRef(0);
  const [typeText, setTypeText] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const formatDuration = (totalSec: number) => {
    const safeSec = Math.max(0, Math.floor(totalSec));
    const days = Math.floor(safeSec / 86400);
    const hours = Math.floor((safeSec % 86400) / 3600);
    const minutes = Math.floor((safeSec % 3600) / 60);
    const seconds = safeSec % 60;
    return `${days}天 ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  useEffect(() => {
    const tick = () => {
      if (uptimeAnchorMsRef.current <= 0) return;
      const elapsedSec =
        uptimeBaseSecRef.current +
        Math.floor((Date.now() - uptimeAnchorMsRef.current) / 1000);
      setUptimeText(formatDuration(elapsedSec));
    };

    const syncSystemTime = async () => {
      try {
        const res = await fetch("/api/system", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { uptimeSec?: number };
        const nextUptime = Number(data?.uptimeSec || 0);
        uptimeBaseSecRef.current = Number.isFinite(nextUptime) ? nextUptime : 0;
        uptimeAnchorMsRef.current = Date.now();
        setUptimeText(formatDuration(uptimeBaseSecRef.current));
      } catch {
        // keep previous text
      }
    };

    tick();
    void syncSystemTime();
    const id = setInterval(tick, 1000);
    const refreshId = setInterval(() => {
      void syncSystemTime();
    }, 60000);
    return () => {
      clearInterval(id);
      clearInterval(refreshId);
    };
  }, []);

  useEffect(() => {
    if (compact) return undefined;

    const msg = TYPEWRITER_MESSAGES[msgIdx];
    let id: ReturnType<typeof setTimeout> | undefined;

    if (!deleting) {
      if (charIdx < msg.length) {
        id = setTimeout(() => {
          setTypeText(msg.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        }, 55);
      } else {
        id = setTimeout(() => setDeleting(true), 2200);
      }
    } else if (charIdx > 0) {
      id = setTimeout(() => {
        setTypeText(msg.slice(0, charIdx - 1));
        setCharIdx((c) => c - 1);
      }, 28);
    } else {
      id = setTimeout(() => {
        setDeleting(false);
        setMsgIdx((m) => (m + 1) % TYPEWRITER_MESSAGES.length);
      }, 0);
    }

    return () => {
      if (id) clearTimeout(id);
    };
  }, [charIdx, compact, deleting, msgIdx]);

  return (
    <header
      style={{
        height: compact ? 48 : HEADER_HEIGHT,
        background: isDarkMode
          ? "rgba(15,23,42,0.92)"
          : "rgba(255,255,255,0.92)",
        borderBottom: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        padding: `0 ${HEADER_PADDING_X}`,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <a
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: compact ? 8 : 10,
          minWidth: compact ? "auto" : LEFT_BLOCK_MIN_WIDTH,
          textDecoration: "none",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: compact ? 32 : 38,
            height: compact ? 32 : 38,
            borderRadius: "50%",
            border: `1px solid ${isDarkMode ? "#475569" : "#BFDBFE"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            background: isDarkMode ? "#0F172A" : "#FFFFFF",
            boxShadow: "0 2px 10px rgba(10,132,255,0.18)",
            flexShrink: 0,
          }}
        >
          <img
            src="/images/brand/club-logo-user.jpg"
            alt="开放原子开源社团 Logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "relative",
              left: "1.5px",
              top: "1.5px",
              transform: "scale(1.08)",
            }}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: compact ? 11 : 12,
              fontWeight: 600,
              color: isDarkMode ? "#F8FAFC" : "#0F172A",
              letterSpacing: 0.5,
            }}
          >
            KCOS
          </div>
          <div
            style={{
              fontSize: compact ? 8 : 9,
              color: isDarkMode ? "#94A3B8" : "#64748B",
              letterSpacing: compact ? 0.8 : 1.5,
              textTransform: "uppercase",
            }}
          >
            kcos.club
          </div>
        </div>
      </a>

      {!compact ? (
        <>
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Radio size={12} color={isDarkMode ? "#60A5FA" : "#0A84FF"} />
            <span
              style={{
                fontSize: 12,
                color: isDarkMode ? "#93C5FD" : "#0A84FF",
                fontWeight: 500,
                fontFamily: '"Courier New", monospace',
                letterSpacing: 0.5,
              }}
            >
              {typeText}
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 12,
                  background: isDarkMode ? "#93C5FD" : "#0A84FF",
                  verticalAlign: "middle",
                  marginLeft: 2,
                  animation: "blink 1s infinite",
                }}
              />
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(10px, 1vw, 16px)",
              minWidth: RIGHT_BLOCK_MIN_WIDTH,
              justifyContent: "flex-end",
            }}
          >
            <ThemeModeSwitch
              compact={false}
              isDarkMode={isDarkMode}
              onThemeModeChange={onThemeModeChange}
            />
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  justifyContent: "flex-end",
                }}
              >
                <Clock size={10} color="#10B981" />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#10B981",
                    fontFamily: '"Courier New", monospace',
                  }}
                >
                  {uptimeText}
                </span>
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: isDarkMode ? "#94A3B8" : "#64748B",
                  textAlign: "right",
                  letterSpacing: 0.5,
                }}
              >
                项目运行时长
              </div>
            </div>
          </div>
        </>
      ) : (
        <MobileHeaderActions
          isDarkMode={isDarkMode}
          menuOpen={mobileMenuOpen}
          onToggleMenu={onToggleMobileMenu}
        >
          <ThemeModeSwitch
            compact={true}
            isDarkMode={isDarkMode}
            onThemeModeChange={onThemeModeChange}
          />
        </MobileHeaderActions>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </header>
  );
}
