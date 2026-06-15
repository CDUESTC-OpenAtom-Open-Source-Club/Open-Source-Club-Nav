"use client";

import type { CSSProperties } from "react";

/**
 * GlobeCanvasFallback — 低端设备降级方案。
 * 用纯 CSS 球体 + 环带 + 微动画替代 Three.js WebGL 渲染，
 * 不依赖 three.js，零 WebGL 开销。
 */
export default function GlobeCanvasFallback({
  isDarkMode = false,
  size = 260,
}: {
  isDarkMode?: boolean;
  size?: number;
}) {
  const theme = {
    sphereColor: isDarkMode ? "rgba(10,132,255,0.35)" : "rgba(37,99,235,0.2)",
    ringColor: isDarkMode ? "rgba(6,222,204,0.5)" : "rgba(8,145,178,0.25)",
    glowColor: isDarkMode ? "rgba(10,132,255,0.15)" : "rgba(37,99,235,0.08)",
    filter: isDarkMode
      ? "drop-shadow(0 0 24px rgba(10,132,255,0.2))"
      : "drop-shadow(0 0 14px rgba(37,99,235,0.12)) saturate(0.82) brightness(1.05)",
    blendMode: (isDarkMode ? "screen" : "multiply") as CSSProperties["mixBlendMode"],
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        filter: theme.filter,
        mixBlendMode: theme.blendMode,
        opacity: isDarkMode ? 1 : 0.72,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {/* 主球体 */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: size * 0.75,
          height: size * 0.75,
          borderRadius: "50%",
          border: `1px solid ${theme.sphereColor}`,
          background: `radial-gradient(circle at 35% 35%, ${theme.glowColor}, transparent 70%)`,
          transform: "translate(-50%, -50%)",
          animation: "globeRotate 12s linear infinite",
          boxShadow: `inset 0 0 ${size * 0.15}px ${theme.glowColor}`,
        }}
      />
      {/* 纬线 */}
      {[0.3, 0.5, 0.7].map((ratio, i) => (
        <div
          key={`lat-${i}`}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: size * 0.75 * ratio,
            height: size * 0.75 * ratio,
            borderRadius: "50%",
            border: `0.5px solid ${theme.sphereColor}`,
            transform: "translate(-50%, -50%)",
            animation: `globeRotate ${10 + i * 2}s linear infinite`,
            opacity: 0.5,
          }}
        />
      ))}
      {/* 环带 */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: size * 0.85,
          height: size * 0.15,
          borderRadius: "50%",
          border: `1px solid ${theme.ringColor}`,
          transform: "translate(-50%, -50%) rotateX(75deg)",
          animation: "globeRingPulse 4s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: size * 0.9,
          height: size * 0.12,
          borderRadius: "50%",
          border: `0.5px solid ${theme.sphereColor}`,
          transform: "translate(-50%, -50%) rotateX(60deg) rotateZ(30deg)",
          animation: "globeRingPulse 5s ease-in-out 1s infinite",
          opacity: 0.4,
        }}
      />
      {/* 小光点 */}
      {[
        { angle: 30, dist: 0.38 },
        { angle: 120, dist: 0.35 },
        { angle: 210, dist: 0.4 },
        { angle: 300, dist: 0.36 },
      ].map((p, i) => (
        <div
          key={`dot-${i}`}
          style={{
            position: "absolute",
            top: `${50 + Math.sin((p.angle * Math.PI) / 180) * p.dist * 100}%`,
            left: `${50 + Math.cos((p.angle * Math.PI) / 180) * p.dist * 100}%`,
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: isDarkMode ? "rgba(56,189,248,0.6)" : "rgba(96,165,250,0.4)",
            animation: `techPulse 2.5s ease-in-out ${i * 0.6}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes globeRotate {
          from { transform: translate(-50%, -50%) rotateZ(0deg); }
          to { transform: translate(-50%, -50%) rotateZ(360deg); }
        }
        @keyframes globeRingPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes techPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
