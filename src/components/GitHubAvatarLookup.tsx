"use client";

import { useState } from "react";

const normalizeUsername = (value: string) =>
  value
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\/.*$/, "");

export default function GitHubAvatarLookup({
  username,
  fallbackSrc = "",
  alt,
  className,
  size = 96,
}: {
  username: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  size?: number;
}) {
  const [useFallback, setUseFallback] = useState(false);
  const safeUsername = normalizeUsername(username);
  const githubAvatar = safeUsername
    ? `https://github.com/${safeUsername}.png?size=${size}`
    : fallbackSrc;

  return (
    <img
      className={className}
      src={!useFallback && githubAvatar ? githubAvatar : fallbackSrc}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setUseFallback(true)}
    />
  );
}
