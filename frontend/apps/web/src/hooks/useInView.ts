"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useInView — 利用 IntersectionObserver 检测元素是否进入视口。
 * 可用于延迟加载/暂停非关键动画，减少不必要的渲染开销。
 *
 * @param options.rootMargin  根据视口外扩/内缩像素，默认 "200px"（提前200px开始加载）
 * @param options.threshold   可见比例阈值，默认 0
 */
export function useInView(options?: { rootMargin?: string; threshold?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // 只在状态变化时更新，避免不必要的 re-render
        setInView(entry.isIntersecting);
      },
      {
        rootMargin: options?.rootMargin ?? "200px",
        threshold: options?.threshold ?? 0,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.rootMargin, options?.threshold]);

  return { ref, inView };
}
