"use client";

import { useEffect } from "react";

/**
 * WebVitalsReporter — 采集 Core Web Vitals 指标并上报
 *
 * 采集指标：
 * - LCP (Largest Contentful Paint)  最大内容绘制
 * - INP (Interaction to Next Paint)  交互到下次绘制
 * - CLS (Cumulative Layout Shift)   累积布局偏移
 * - FCP (First Contentful Paint)    首次内容绘制
 * - TTFB (Time to First Byte)       首字节时间
 *
 * 使用浏览器原生 PerformanceObserver API，零依赖。
 * 数据通过 navigator.sendBeacon 异步上报，不阻塞页面。
 */
export default function WebVitalsReporter() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const vitals: Record<string, number> = {};

    // ─── LCP ───
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        vitals.lcp = lastEntry.startTime;
      }
    });
    try {
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // 浏览器不支持
    }

    // ─── CLS ───
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShiftEntry = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value ?? 0;
        }
      }
      vitals.cls = clsValue;
    });
    try {
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch {
      // 浏览器不支持
    }

    // ─── INP (通过 event timing 估算) ───
    let maxInteraction = 0;
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = entry.duration;
        if (duration > maxInteraction) {
          maxInteraction = duration;
        }
      }
      vitals.inp = maxInteraction;
    });
    try {
      inpObserver.observe({ type: "event", buffered: true });
    } catch {
      // 浏览器不支持
    }

    // ─── FCP ───
    const fcpObserver = new PerformanceObserver((list) => {
      const entry = list.getEntries()[0];
      if (entry) {
        vitals.fcp = entry.startTime;
      }
    });
    try {
      fcpObserver.observe({ type: "paint", buffered: true });
    } catch {
      // 浏览器不支持
    }

    // ─── TTFB ───
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0) {
      const navEntry = navEntries[0] as PerformanceNavigationTiming;
      vitals.ttfb = navEntry.responseStart;
    }

    // ─── 页面卸载时上报 ───
    const report = () => {
      if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
      const payload = JSON.stringify({
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer,
        vitals,
        ts: Date.now(),
      });
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/metrics/web-vitals", blob);
    };

    window.addEventListener("pagehide", report);
    window.addEventListener("beforeunload", report);

    return () => {
      lcpObserver.disconnect();
      clsObserver.disconnect();
      inpObserver.disconnect();
      fcpObserver.disconnect();
      window.removeEventListener("pagehide", report);
      window.removeEventListener("beforeunload", report);
    };
  }, []);

  return null;
}
