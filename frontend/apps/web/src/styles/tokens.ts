export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type BreakpointName = keyof typeof breakpoints;

export const breakpointQueries = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
} as const satisfies Record<BreakpointName, string>;

export const colors = {
  brand: {
    50: "#eff6ff",
    100: "#dbeafe",
    500: "#2a6dff",
    600: "#1d4ed8",
    700: "#1e40af",
  },
  accent: {
    cyan: "#22d3ee",
    emerald: "#10b981",
    amber: "#f59e0b",
    rose: "#f43f5e",
  },
  neutral: {
    0: "#ffffff",
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    500: "#64748b",
    700: "#334155",
    900: "#0f172a",
    950: "#020617",
  },
} as const;

export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const typography = {
  family: {
    sans: "Arial, Helvetica, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  size: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
  lineHeight: {
    tight: "1.2",
    snug: "1.35",
    normal: "1.5",
    relaxed: "1.65",
  },
} as const;

export const radii = {
  xs: "0.25rem",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "999px",
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(15, 23, 42, 0.08)",
  md: "0 12px 28px rgba(15, 23, 42, 0.1)",
  lg: "0 18px 42px rgba(15, 23, 42, 0.14)",
  focus: "0 0 0 4px rgba(42, 109, 255, 0.18)",
} as const;

export const designTokens = {
  breakpoints,
  breakpointQueries,
  colors,
  spacing,
  typography,
  radii,
  shadows,
} as const;

export type DesignTokens = typeof designTokens;
