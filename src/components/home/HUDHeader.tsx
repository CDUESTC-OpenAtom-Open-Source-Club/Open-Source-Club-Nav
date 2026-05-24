"use client";
import { useEffect, useRef, useState } from "react";
import { Clock, Radio } from "lucide-react";
import styled from "styled-components";

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

type ThemeMode = "light" | "dark" | "auto";

const THEME_MODES: Array<{ key: ThemeMode; label: string }> = [
  { key: "light", label: "白天" },
  { key: "dark", label: "夜间" },
  { key: "auto", label: "自动" },
];

type ThemeModeSwitchProps = {
  compact: boolean;
  isDarkMode: boolean;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
};

type HUDHeaderProps = {
  compact?: boolean;
  isDarkMode?: boolean;
  themeMode?: ThemeMode;
  onThemeModeChange?: (mode: ThemeMode) => void;
};

const StyledWrapper = styled.div`
  /* Theme Switch */
  /* The switch - the box around the slider */
  .switch {
    font-size: inherit;
    position: relative;
    display: inline-block;
    width: 4em;
    height: 2.2em;
    border-radius: 30px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  /* Hide default HTML checkbox */
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  /* The slider */
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #2a2a2a;
    transition: 0.4s;
    border-radius: 30px;
    overflow: hidden;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 1.2em;
    width: 1.2em;
    border-radius: 20px;
    left: 0.5em;
    bottom: 0.5em;
    transition: 0.4s;
    transition-timing-function: cubic-bezier(0.81, -0.04, 0.38, 1.5);
    box-shadow: inset 8px -4px 0px 0px #fff;
  }

  .switch input:checked + .slider {
    background-color: #00a6ff;
  }

  .switch input:checked + .slider:before {
    transform: translateX(1.8em);
    box-shadow: inset 15px -4px 0px 15px #ffcf48;
  }

  .star {
    background-color: #fff;
    border-radius: 50%;
    position: absolute;
    width: 5px;
    transition: all 0.4s;
    height: 5px;
  }

  .star_1 {
    left: 2.5em;
    top: 0.5em;
  }

  .star_2 {
    left: 2.2em;
    top: 1.2em;
  }

  .star_3 {
    left: 3em;
    top: 0.9em;
  }

  .switch input:checked ~ .slider .star {
    opacity: 0;
  }

  .cloud {
    width: 3.5em;
    position: absolute;
    bottom: -1.4em;
    left: -1.1em;
    opacity: 0;
    transition: all 0.4s;
  }

  .switch input:checked ~ .slider .cloud {
    opacity: 1;
  }
`;

function ThemeModeSwitch({
  compact,
  isDarkMode,
  themeMode,
  onThemeModeChange,
}: ThemeModeSwitchProps) {
  return (
    <StyledWrapper
      style={{
        fontSize: compact ? "11px" : "15px",
        display: "inline-block",
        verticalAlign: "middle",
      }}
    >
      <label className="switch">
        <input
          type="checkbox"
          checked={!isDarkMode}
          onChange={() => onThemeModeChange(isDarkMode ? "light" : "dark")}
        />
        <span className="slider">
          <span className="star star_1" />
          <span className="star star_2" />
          <span className="star star_3" />
          <svg viewBox="0 0 16 16" className="cloud_1 cloud">
            <path
              transform="matrix(.77976 0 0 .78395-299.99-418.63)"
              fill="#fff"
              d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
            />
          </svg>
        </span>
      </label>
    </StyledWrapper>
  );
}

export default function HUDHeader({
  compact = false,
  isDarkMode = false,
  themeMode = "auto",
  onThemeModeChange = () => {},
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: compact ? 8 : 10,
          minWidth: compact ? "auto" : LEFT_BLOCK_MIN_WIDTH,
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
      </div>

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
              themeMode={themeMode}
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
        <div
          style={{
            marginLeft: "auto",
            display: "grid",
            gap: 2,
            justifyItems: "end",
            color: isDarkMode ? "#94A3B8" : "#64748B",
            fontSize: 10,
            fontFamily: '"Courier New", monospace',
          }}
        >
          <ThemeModeSwitch
            compact={true}
            isDarkMode={isDarkMode}
            themeMode={themeMode}
            onThemeModeChange={onThemeModeChange}
          />
          <span>项目运行时长</span>
          <span style={{ color: "#10B981", fontWeight: 700 }}>{uptimeText}</span>
        </div>
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
