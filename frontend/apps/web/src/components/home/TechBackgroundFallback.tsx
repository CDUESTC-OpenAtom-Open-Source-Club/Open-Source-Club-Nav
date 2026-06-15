"use client";

import type { CSSProperties } from "react";

/**
 * TechBackgroundFallback — 低端设备降级方案。
 * 用纯 CSS 渐变 + 微动画替代 Canvas 2D 粒子系统，
 * CPU/GPU 开销极低，同时保留科技感视觉氛围。
 */
export default function TechBackgroundFallback({ isDarkMode = false }: { isDarkMode?: boolean }) {
  const bg: CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
    background: isDarkMode
      ? "radial-gradient(ellipse at 30% 40%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(6,222,204,0.05) 0%, transparent 50%), #030712"
      : "radial-gradient(ellipse at 30% 40%, rgba(37,99,235,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(8,145,178,0.04) 0%, transparent 50%), #f8fafc",
    mixBlendMode: isDarkMode ? "screen" : "multiply",
  };

  return (
    <div style={bg} aria-hidden="true">
      {/* 网格线 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: isDarkMode
            ? "linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)"
            : "linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.6,
        }}
      />
      {/* 扫描线 — 纯 CSS 动画 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "80px",
          background: isDarkMode
            ? "linear-gradient(transparent, rgba(59,130,246,0.06), transparent)"
            : "linear-gradient(transparent, rgba(37,99,235,0.04), transparent)",
          animation: "techScanLine 6s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      {/* 几个静态光点替代粒子 */}
      {[
        { left: "15%", top: "25%", size: 3, delay: "0s" },
        { left: "45%", top: "60%", size: 2, delay: "1s" },
        { left: "75%", top: "35%", size: 4, delay: "2s" },
        { left: "30%", top: "80%", size: 2, delay: "0.5s" },
        { left: "85%", top: "15%", size: 3, delay: "1.5s" },
      ].map((dot, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            borderRadius: "50%",
            background: isDarkMode ? "rgba(59,130,246,0.4)" : "rgba(37,99,235,0.25)",
            animation: `techPulse 3s ease-in-out ${dot.delay} infinite`,
            willChange: "opacity",
          }}
        />
      ))}
      <style>{`
        @keyframes techScanLine {
          0%, 100% { transform: translateY(-100%); }
          50% { transform: translateY(calc(100vh + 100%)); }
        }
        @keyframes techPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
