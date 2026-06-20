"use client";

import React, { Suspense } from "react";
import { useInView } from "@/hooks/useInView";

type LazySectionProps = {
  children: React.ReactNode;
  /** 占位高度，防止布局偏移(CLS) */
  minHeight?: number | string;
  /** rootMargin 透传，默认 200px 提前加载 */
  rootMargin?: string;
  /** 加载占位符 */
  fallback?: React.ReactNode;
  className?: string;
};

/**
 * LazySection — 延迟加载视口外内容
 *
 * 利用 IntersectionObserver 在元素进入视口前 200px 时才渲染子组件，
 * 显著减少首屏 JS 执行量和 DOM 节点数，提升 LCP 和 INP 指标。
 *
 * 用法：
 * <LazySection minHeight={400}>
 *   <HeavyComponent />
 * </LazySection>
 */
export default function LazySection({
  children,
  minHeight = 200,
  rootMargin = "200px",
  fallback = null,
  className,
}: LazySectionProps) {
  const { ref, inView } = useInView({ rootMargin });

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }}
    >
      {inView ? (
        <Suspense fallback={fallback}>{children}</Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}
