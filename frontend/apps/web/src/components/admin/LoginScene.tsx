"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type CubeLayer = "near" | "mid" | "far";

type CubeMotion = {
  id: number;
  size: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  layer: CubeLayer;
  delay: string;
};

export function LoginScene() {
  const [cubeMotions, setCubeMotions] = useState<CubeMotion[]>(() =>
    Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      size: [152, 96, 130, 108, 84][i],
      x: [560, 600, 640, 680, 720][i],
      y: [80, 260, 460, 640, 320][i],
      z: [-80, -300, -150, -240, -360][i],
      vx: [-0.52, -0.34, 0.24, 0.4, 0.56][i],
      vy: [1.2, 1.36, 1.12, 1.28, 1.18][i],
      layer: (["near", "far", "mid", "mid", "far"] as const)[i],
      delay: ["0s", "-5s", "-10s", "-15s", "-20s"][i],
    })),
  );

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const topY = Math.max(70, height * 0.18);
    const midY = Math.max(140, height * 0.5);
    const bottomY = Math.max(220, height * 0.8);
    const centerX = width * 0.5;
    setCubeMotions((prev) =>
      prev.map((c, i) => ({
        ...c,
        x: centerX + [-120, -60, 0, 60, 120][i],
        y: [topY - 24, midY - 90, bottomY + 12, topY + 170, midY + 210][i],
        vx: [-0.56, -0.36, 0.22, 0.42, 0.6][i],
      })),
    );

    let frameId = 0;
    let lastTs = performance.now();

    const step = (ts: number) => {
      const dt = Math.min(32, ts - lastTs);
      lastTs = ts;
      const factor = dt / 16.67;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      setCubeMotions((prev) =>
        prev.map((c) => {
          const gravity = 0.015 * factor;
          const airDrag = 0.996;
          const restitutionX = 0.92;
          const restitutionY = 0.88;

          let vx = c.vx * Math.pow(airDrag, factor);
          let vy = c.vy * Math.pow(airDrag, factor) + gravity;
          let x = c.x + vx * factor;
          let y = c.y + vy * factor;
          const half = c.size / 2;
          const minSpeedX = 0.12;
          const minSpeedY = 0.28;

          if (x - half <= 0) {
            x = half;
            vx = Math.abs(vx) * restitutionX;
            vy *= 0.985;
          } else if (x + half >= viewportWidth) {
            x = viewportWidth - half;
            vx = -Math.abs(vx) * restitutionX;
            vy *= 0.985;
          }

          if (y - half <= 0) {
            y = half;
            vy = Math.abs(vy) * restitutionY;
            vx += (Math.random() - 0.5) * 0.02;
          } else if (y + half >= viewportHeight) {
            y = viewportHeight - half;
            vy = -Math.abs(vy) * restitutionY;
            vx += (Math.random() - 0.5) * 0.03;
          }

          if (Math.abs(vx) < minSpeedX) {
            vx = minSpeedX * (vx >= 0 ? 1 : -1);
          }
          if (Math.abs(vy) < minSpeedY) {
            vy = minSpeedY * (vy >= 0 ? 1 : -1);
          }

          return { ...c, x, y, vx, vy };
        }),
      );

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <>
      <div className="admin-login-pro-media" aria-hidden="true">
        <div className="admin-login-pro-media__gradient" />
        <div className="admin-login-pro-media__brandPattern" />
        <div className="admin-login-pro-media__halo" />
        <div className="admin-login-pro-cubefield">
          {cubeMotions.map((c) => (
            <div
              key={c.id}
              className={`admin-login-pro-cube admin-login-pro-cube--${c.layer}`}
              style={
                {
                  "--cube-size": `${c.size}px`,
                  "--cube-x": `${c.x}px`,
                  "--cube-y": `${c.y}px`,
                  "--cube-z": `${c.z}px`,
                  "--cube-delay": c.delay,
                } as CSSProperties
              }
            >
              <div className="admin-login-pro-cube__rotor">
                <span className="face f-front" />
                <span className="face f-back" />
                <span className="face f-right" />
                <span className="face f-left" />
                <span className="face f-top" />
                <span className="face f-bottom" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-login-pro-grid" aria-hidden="true">
        <span />
      </div>
      <div className="admin-login-pro-lines" aria-hidden="true">
        <i className="line line-1" />
        <i className="line line-2" />
        <i className="line line-3" />
      </div>
      <div className="admin-login-pro-shine" aria-hidden="true" />
      <div className="admin-login-pro-dots" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            style={
              {
                "--dot-left": `${8 + ((index * 11) % 82)}%`,
                "--dot-top": `${10 + ((index * 13) % 78)}%`,
                "--dot-delay": `${index * 0.12}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}
