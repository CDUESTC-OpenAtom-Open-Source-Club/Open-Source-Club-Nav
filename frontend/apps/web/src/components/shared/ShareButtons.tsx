"use client";

import { useState, useCallback } from "react";
import { buildShareUrls } from "@/lib/seo";
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";

type SharePlatform =
  | "weibo"
  | "qq"
  | "qzone"
  | "twitter"
  | "facebook"
  | "linkedin"
  | "telegram"
  | "reddit"
  | "copy";

interface ShareButtonConfig {
  platform: SharePlatform;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const SHARE_BUTTONS: ShareButtonConfig[] = [
  {
    platform: "weibo",
    label: "微博",
    color: "#E6162D",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.31 8.17c-3.44.34-6.07 2.14-6.07 4.36 0 2.35 3.04 4.16 6.79 4.04 3.75-.12 6.58-2.12 6.58-4.47 0-2.35-2.83-4.16-6.58-4.04-.25.01-.5.05-.72.11zm.79 6.62c-1.84.12-3.42-.83-3.53-2.12-.11-1.29 1.29-2.42 3.13-2.54 1.84-.12 3.42.83 3.53 2.12.11 1.29-1.29 2.42-3.13 2.54z" />
        <path d="M19.5 7.2c-.5-.15-1.05-.2-1.6-.15-.25.02-.45-.15-.5-.4-.05-.25.15-.5.4-.5.7-.05 1.4.05 2.05.25.65.2 1.25.55 1.75 1s.85 1 1.05 1.6c.2.6.25 1.25.15 1.9-.05.25-.3.4-.5.35-.25-.05-.4-.3-.35-.5.05-.5.05-1-.1-1.45-.15-.45-.4-.85-.8-1.2-.4-.35-.85-.55-1.3-.65z" />
        <path d="M17.8 9.3c-.3-.1-.6-.1-.9-.05-.2.02-.35-.1-.4-.3-.02-.2.1-.38.3-.4.4-.05.8-.05 1.2.05.4.1.75.3 1.05.6.3.3.5.65.6 1.05.1.4.1.8 0 1.2-.05.2-.25.3-.42.25-.2-.05-.3-.25-.25-.42.05-.25.05-.5-.02-.75-.07-.25-.2-.5-.4-.7-.2-.2-.45-.35-.7-.45z" />
      </svg>
    ),
  },
  {
    platform: "qq",
    label: "QQ",
    color: "#12B7F5",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.003 0c-3.314 0-6.003 2.687-6.003 6.003 0 1.293.41 2.49 1.105 3.467-.39.736-.825 1.654-1.155 2.625-.42 1.24-.66 2.55-.45 3.59.1.49.41 1.03.96 1.03.34 0 .62-.22.82-.54.16.34.39.64.68.85-.28.3-.46.7-.46 1.14 0 .42.16.76.42 1.02.26.26.6.42 1.02.42.24 0 .46-.06.66-.16.2.62.72 1.06 1.34 1.06.62 0 1.14-.44 1.34-1.06.2.1.42.16.66.16.42 0 .76-.16 1.02-.42.26-.26.42-.6.42-1.02 0-.44-.18-.84-.46-1.14.29-.21.52-.51.68-.85.2.32.48.54.82.54.55 0 .86-.54.96-1.03.21-1.04-.03-2.35-.45-3.59-.33-.97-.76-1.89-1.155-2.625.695-.977 1.105-2.174 1.105-3.467C18.006 2.687 15.317 0 12.003 0z" />
      </svg>
    ),
  },
  {
    platform: "twitter",
    label: "X",
    color: "#000000",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    platform: "facebook",
    label: "Facebook",
    color: "#1877F2",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    platform: "telegram",
    label: "Telegram",
    color: "#26A5E4",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    platform: "copy",
    label: "复制链接",
    color: "#64748B",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
];

interface ShareButtonsProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

/**
 * ShareButtons — 社交分享按钮组件
 *
 * 支持微博、QQ、X(Twitter)、Facebook、Telegram 和复制链接。
 * 优先使用浏览器原生 Web Share API（移动端体验更佳）。
 */
export default function ShareButtons({
  url,
  title = SITE_TITLE,
  description = SITE_DESCRIPTION,
  className = "",
  compact = false,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : SITE_URL);
  const shareUrls = buildShareUrls({ url: shareUrl, title, description });

  const handleShare = useCallback(
    async (platform: SharePlatform) => {
      if (platform === "copy") {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // fallback
          const textarea = document.createElement("textarea");
          textarea.value = shareUrl;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
        return;
      }

      window.open(shareUrls[platform], "_blank", "noopener,noreferrer,width=600,height=500");
    },
    [shareUrl, shareUrls],
  );

  const handleNativeShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: description, url: shareUrl });
      } catch {
        // 用户取消分享，忽略
      }
    }
  }, [title, description, shareUrl]);

  const showNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div
      className={`flex items-center gap-2 flex-wrap ${className}`}
      role="group"
      aria-label="社交分享"
    >
      {showNativeShare && (
        <button
          onClick={handleNativeShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: "#1D4ED8" }}
          aria-label="分享"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {!compact && "分享"}
        </button>
      )}

      {SHARE_BUTTONS.map((btn) => (
        <button
          key={btn.platform}
          onClick={() => handleShare(btn.platform)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: btn.color }}
          aria-label={`分享到${btn.label}`}
          title={`分享到${btn.label}`}
        >
          {btn.icon}
          {!compact && (btn.platform === "copy" && copied ? "已复制" : btn.label)}
        </button>
      ))}
    </div>
  );
}
