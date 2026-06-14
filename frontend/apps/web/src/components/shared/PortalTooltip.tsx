"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface PortalTooltipProps {
  /** The element that triggers the tooltip on hover/focus */
  trigger: ReactNode;
  /** The tooltip content. If falsy, no tooltip is rendered. */
  content?: ReactNode;
  /** Additional class for the tooltip container */
  className?: string;
  /** Tooltip id for aria-describedby */
  id?: string;
  /** Native title attribute for the trigger (fallback when no content) */
  title?: string;
  /** Pixel offset from the trigger element, default 10 */
  offset?: number;
}

/**
 * A tooltip that renders via React Portal at document.body level,
 * escaping any `overflow: hidden` ancestor containers.
 */
export default function PortalTooltip({
  trigger,
  content,
  className,
  id,
  title,
  offset = 10,
}: PortalTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const computePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      top: rect.bottom + offset,
      left: rect.left + rect.width / 2,
    });
  }, [offset]);

  const show = useCallback(() => {
    computePosition();
    setVisible(true);
  }, [computePosition]);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  /* Recalculate on scroll/resize while visible */
  useEffect(() => {
    if (!visible) return;
    const onMove = () => computePosition();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [visible, computePosition]);

  return (
    <>
      <span
        ref={triggerRef}
        className="admin-link-url-preview-trigger"
        style={{ display: "inline-block", maxWidth: "min(360px, 52vw)" }}
        tabIndex={content ? 0 : undefined}
        title={title}
        aria-describedby={content && id ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {trigger}
      </span>

      {content &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            className={className ?? "admin-link-url-tooltip"}
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              transform: "translateX(-50%)",
              opacity: visible ? 1 : 0,
              visibility: visible ? "visible" : "hidden",
              transition: "opacity 0.14s ease, visibility 0.14s ease",
              zIndex: 10000,
              pointerEvents: "none",
            }}
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  );
}
