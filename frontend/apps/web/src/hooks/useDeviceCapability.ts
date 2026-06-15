"use client";

import { useEffect, useState } from "react";

export type DeviceTier = "high" | "medium" | "low";

/**
 * useDeviceCapability — 检测设备性能等级。
 * 通过 CPU 核心数、内存、网络状况综合判断：
 *   - "high"   → 全量 3D / Canvas 动画
 *   - "medium" → 降低粒子数、关闭部分特效
 *   - "low"    → 使用 CSS fallback，完全跳过 Canvas / WebGL
 */
export function useDeviceCapability(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>("high");

  useEffect(() => {
    // SSR 安全
    if (typeof window === "undefined") return;

    let score = 0;

    // CPU 核心数（权重最高）
    const cores = navigator.hardwareConcurrency ?? 4;
    if (cores >= 8) score += 3;
    else if (cores >= 4) score += 2;
    else score += 0;

    // 设备内存（部分浏览器支持）
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (memory !== undefined) {
      if (memory >= 8) score += 3;
      else if (memory >= 4) score += 2;
      else score += 0;
    } else {
      // 无法获取时给默认分
      score += 1;
    }

    // 网络类型（部分浏览器支持）
    const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    if (conn?.effectiveType) {
      if (conn.effectiveType === "4g") score += 2;
      else if (conn.effectiveType === "3g") score += 1;
      else score += 0;
    } else {
      score += 1;
    }

    // GPU 能力（简单检测）
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          // 集成显卡或软件渲染器 → 降低评分
          if (/SwiftShader|Software|Intel.*HD|Intel.*UHD/i.test(renderer)) {
            score -= 1;
          }
        }
        score += 1;
      }
    } catch {
      // WebGL 不可用
      score -= 1;
    }

    // 评分阈值
    if (score >= 7) setTier("high");
    else if (score >= 4) setTier("medium");
    else setTier("low");
  }, []);

  return tier;
}
