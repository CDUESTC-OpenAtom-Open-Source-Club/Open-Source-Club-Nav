"use client";

import { useEffect, useMemo, useState } from "react";
import { breakpoints, type BreakpointName } from "@/styles/tokens";

export type Breakpoint = "base" | BreakpointName;

export type BreakpointState = {
  width: number | null;
  breakpoint: Breakpoint;
  isHydrated: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  atLeast: (name: BreakpointName) => boolean;
};

const orderedBreakpoints = [
  ["2xl", breakpoints["2xl"]],
  ["xl", breakpoints.xl],
  ["lg", breakpoints.lg],
  ["md", breakpoints.md],
  ["sm", breakpoints.sm],
] as const satisfies readonly (readonly [BreakpointName, number])[];

function resolveBreakpoint(width: number | null): Breakpoint {
  if (width === null) {
    return "base";
  }

  return orderedBreakpoints.find(([, minWidth]) => width >= minWidth)?.[0] ?? "base";
}

function subscribeToQuery(query: MediaQueryList, listener: () => void) {
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

export function useBreakpoint(): BreakpointState {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    const queries = Object.values(breakpoints).map((minWidth) =>
      window.matchMedia(`(min-width: ${minWidth}px)`),
    );
    const cleanups = queries.map((query) => subscribeToQuery(query, update));

    update();
    window.addEventListener("resize", update, { passive: true });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      window.removeEventListener("resize", update);
    };
  }, []);

  const breakpoint = useMemo(() => resolveBreakpoint(width), [width]);
  const atLeast = useMemo(
    () => (name: BreakpointName) => width !== null && width >= breakpoints[name],
    [width],
  );

  return {
    width,
    breakpoint,
    isHydrated: width !== null,
    isMobile: width !== null && width < breakpoints.md,
    isTablet: width !== null && width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width !== null && width >= breakpoints.lg,
    atLeast,
  };
}
