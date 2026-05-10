"use client";
import { useState, useEffect } from "react";

const STARTUP_LINES = [
  "KCOS HUB INITIALIZING",
  "Loading kernel modules OK",
  "Mounting resource sectors OK",
  "Connecting to GitHub upstream OK",
  "Calibrating holographic matrix OK",
  "Syncing member activity streams OK",
  "Establishing orbital link OK",
  "Rendering spatial coordinates OK",
  "SYSTEM READY · WELCOME TO KCOS",
];

function getLineColor(text: string): string {
  if (text.indexOf("OK") !== -1) return "#10B981";
  if (text.indexOf("READY") !== -1) return "#0A84FF";
  return "#374151";
}

function getLineWeight(text: string): number {
  return text.indexOf("READY") !== -1 ? 700 : 400;
}

interface StartupSplashProps {
  onComplete: () => void;
}

export default function StartupSplash({ onComplete }: StartupSplashProps) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let index = 0;
    let done = false;
    const tick = setInterval(() => {
      if (index < STARTUP_LINES.length) {
        const value = STARTUP_LINES[index];
        setVisibleLines((prev) => [...prev, value]);
        setProgress(Math.round(((index + 1) / STARTUP_LINES.length) * 100));
        index += 1;
      } else if (!done) {
        done = true;
        clearInterval(tick);
        setTimeout(() => setFadeOut(true), 400);
        setTimeout(() => onComplete(), 1000);
      }
    }, 230);
    return () => clearInterval(tick);
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#F4F8FC",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transform: fadeOut ? "scale(1.04)" : "scale(1)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
        fontFamily: '"Courier New", monospace',
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(10,132,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(10,132,255,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Corner decorations */}
      {[
        { top: 20, left: 20, borderTop: "2px solid #0A84FF", borderLeft: "2px solid #0A84FF" },
        { top: 20, right: 20, borderTop: "2px solid #0A84FF", borderRight: "2px solid #0A84FF" },
        { bottom: 20, left: 20, borderBottom: "2px solid #0A84FF", borderLeft: "2px solid #0A84FF" },
        { bottom: 20, right: 20, borderBottom: "2px solid #0A84FF", borderRight: "2px solid #0A84FF" },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 24,
            height: 24,
            ...pos,
          }}
        />
      ))}

      {/* Logo */}
      <div style={{ position: "relative", marginBottom: 40, textAlign: "center" }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "2px solid #0A84FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            position: "relative",
            boxShadow: "0 0 30px rgba(10,132,255,0.25), inset 0 0 20px rgba(10,132,255,0.05)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 4,
              borderRadius: "50%",
              border: "1px solid rgba(10,132,255,0.3)",
            }}
          />
          <span style={{ fontSize: 24, fontWeight: 700, color: "#0A84FF", letterSpacing: 2 }}>
            KC
          </span>
        </div>
        <div style={{ fontSize: 11, letterSpacing: 6, color: "#64748B", textTransform: "uppercase" }}>
          KCOS OPEN SOURCE CLUB
        </div>
      </div>

      {/* Terminal */}
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "rgba(255,255,255,0.9)",
          border: "1px solid #E5E7EB",
          borderRadius: 8,
          padding: "20px 24px",
          minHeight: 220,
          position: "relative",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ position: "absolute", top: 12, left: 16, display: "flex", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", opacity: 0.7 }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B", opacity: 0.7 }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", opacity: 0.7 }} />
        </div>
        <div style={{ marginTop: 8 }}>
          {visibleLines.map((text, idx) => (
            <div
              key={idx}
              style={{
                fontSize: 11,
                lineHeight: "22px",
                color: getLineColor(text),
                fontWeight: getLineWeight(text),
              }}
            >
              {"> "}{text}
            </div>
          ))}
          {visibleLines.length < STARTUP_LINES.length && (
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 13,
                background: "#0A84FF",
                verticalAlign: "middle",
                animation: "blink 1s infinite",
              }}
            />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 560, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: "#64748B", letterSpacing: 2 }}>LOADING SYSTEM</span>
          <span style={{ fontSize: 10, color: "#0A84FF", letterSpacing: 2, fontWeight: 600 }}>
            {progress}%
          </span>
        </div>
        <div style={{ height: 2, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #0A84FF, #06E5CC)",
              transition: "width 0.2s ease",
              boxShadow: "0 0 8px rgba(10,132,255,0.4)",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
