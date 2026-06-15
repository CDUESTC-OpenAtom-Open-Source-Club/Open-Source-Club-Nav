"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

type Particle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
};

type DataStream = {
  x: number;
  y: number;
  len: number;
  speed: number;
  opacity: number;
};

type Orbit = {
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
};

type GridPulse = {
  x: number;
  y: number;
  phase: number;
  amp: number;
};

type TechBackgroundProps = {
  isDarkMode?: boolean;
};

const getTheme = (isDarkMode: boolean) => ({
  primaryRgb: isDarkMode ? "59,130,246" : "37,99,235",
  gridAlpha: isDarkMode ? 0.035 : 0.018,
  pulseBaseAlpha: isDarkMode ? 0.05 : 0.025,
  scanAlpha: isDarkMode ? 0.09 : 0.04,
  glowAlpha: isDarkMode ? 0.06 : 0.025,
  mouseGlowAlpha: isDarkMode ? 0.12 : 0.05,
  mouseStrokeAlpha: isDarkMode ? 0.2 : 0.08,
  particleLinkAlpha: isDarkMode ? 0.08 : 0.035,
  mouseLinkAlpha: isDarkMode ? 0.12 : 0.05,
  orbitAlpha: isDarkMode ? 0.2 : 0.08,
  canvasOpacity: isDarkMode ? 0.65 : 0.36,
  canvasFilter: isDarkMode ? "saturate(1)" : "saturate(0.78) brightness(1.08)",
  blendMode: isDarkMode ? "screen" : "multiply",
});

export default function TechBackground({ isDarkMode = false }: TechBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef(getTheme(isDarkMode));

  useEffect(() => {
    themeRef.current = getTheme(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const parent = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    if (!parent || !ctx) return undefined;

    // ── IntersectionObserver：离开视口时暂停动画，节省 CPU/GPU ──
    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { rootMargin: "100px" },
    );
    visibilityObserver.observe(parent);

    let animationFrameId = 0;
    let particles: Particle[] = [];
    let dataStreams: DataStream[] = [];
    let orbits: Orbit[] = [];
    let gridPulses: GridPulse[] = [];
    let time = 0;

    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      prevX: 0,
      prevY: 0,
      speed: 0,
      active: false,
    };

    const resizeCanvas = () => {
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      particles = [];
      const particleCount = Math.max(
        28,
        Math.floor((canvas.width * canvas.height) / 12000),
      );
      for (let i = 0; i < particleCount; i += 1) {
        const speedFactor = Math.random() * 0.6 + 0.1;
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size:
            Math.random() > 0.9
              ? (Math.random() * 3 + 1) * 20
              : (Math.random() * 1.5 + 0.3) * 20,
          speedX: (Math.random() - 0.5) * speedFactor,
          speedY: (Math.random() - 0.5) * speedFactor,
          opacity: Math.random() * 0.5 + 0.08,
        });
      }

      dataStreams = [];
      const streamCount = Math.max(8, Math.floor(canvas.width / 90));
      for (let i = 0; i < streamCount; i += 1) {
        dataStreams.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          len: Math.random() * 90 + 50,
          speed: Math.random() * 2 + 0.8,
          opacity: Math.random() * 0.09 + 0.02,
        });
      }

      orbits = [];
      const theme = themeRef.current;
      for (let i = 0; i < 3; i += 1) {
        orbits.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: 0,
          speed: Math.random() * 0.5 + 0.2,
          opacity: theme.orbitAlpha,
        });
      }

      gridPulses = [];
      const step = 40;
      for (let x = 0; x <= canvas.width; x += step) {
        for (let y = 0; y <= canvas.height; y += step) {
          // Stable pulse dots instead of per-frame random flicker.
          if (Math.random() > 0.935) {
            gridPulses.push({
              x,
              y,
              phase: Math.random() * Math.PI * 2,
              amp: Math.random() * 0.08 + 0.02,
            });
          }
        }
      }
    };

    const drawGrid = () => {
      const theme = themeRef.current;
      const step = 40;
      ctx.lineWidth = 0.5;

      for (let x = 0; x <= canvas.width; x += step) {
        ctx.strokeStyle = `rgba(${theme.primaryRgb},${theme.gridAlpha})`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y <= canvas.height; y += step) {
        ctx.strokeStyle = `rgba(${theme.primaryRgb},${theme.gridAlpha})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      for (let i = 0; i < gridPulses.length; i += 1) {
        const pulse = gridPulses[i];
        const alpha = Math.max(
          0,
          Math.sin(time * 1.6 + pulse.phase) * pulse.amp + theme.pulseBaseAlpha,
        );
        ctx.fillStyle = `rgba(${theme.primaryRgb},${alpha})`;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawScanLine = () => {
      const theme = themeRef.current;
      time += 0.005;
      const scanY = (Math.sin(time) * 0.5 + 0.5) * canvas.height;
      const grad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      grad.addColorStop(0, `rgba(${theme.primaryRgb},0)`);
      grad.addColorStop(0.5, `rgba(${theme.primaryRgb},${theme.scanAlpha})`);
      grad.addColorStop(1, `rgba(${theme.primaryRgb},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 40, canvas.width, 80);
    };

    const drawAtmosphericGlow = () => {
      const theme = themeRef.current;
      const grad = ctx.createRadialGradient(
        canvas.width * (0.5 + Math.sin(time * 0.3) * 0.18),
        canvas.height * (0.5 + Math.cos(time * 0.3) * 0.18),
        0,
        canvas.width * 0.5,
        canvas.height * 0.5,
        canvas.width * 0.8,
      );
      grad.addColorStop(0, `rgba(${theme.primaryRgb},${theme.glowAlpha})`);
      grad.addColorStop(1, `rgba(${theme.primaryRgb},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawMouseEffect = () => {
      if (!mouse.active) return;
      const theme = themeRef.current;

      const grad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        100,
      );
      grad.addColorStop(0, `rgba(${theme.primaryRgb},${theme.mouseGlowAlpha})`);
      grad.addColorStop(1, `rgba(${theme.primaryRgb},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 100, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(${theme.primaryRgb},${theme.mouseStrokeAlpha})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(mouse.x - 15, mouse.y);
      ctx.lineTo(mouse.x + 15, mouse.y);
      ctx.moveTo(mouse.x, mouse.y - 15);
      ctx.lineTo(mouse.x, mouse.y + 15);
      ctx.stroke();
    };

    const updateAndDrawParticles = () => {
      const theme = themeRef.current;
      const speedFactor = Math.min(1, mouse.speed / 48);
      const mouseInfluenceScale = 1 - speedFactor * 0.5;
      const particleLinkScale = 1 - speedFactor * 0.7;
      const mouseLinkScale = 1 - speedFactor * 0.75;

      particles.forEach((p1, i) => {
        if (mouse.active) {
          const dx = mouse.x - p1.x;
          const dy = mouse.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120 && dist > 0.001) {
            const force = (120 - dist) / 120;
            p1.x -= (dx / dist) * force * 2 * mouseInfluenceScale;
            p1.y -= (dy / dist) * force * 2 * mouseInfluenceScale;
          }
        }

        p1.x += p1.speedX;
        p1.y += p1.speedY;

        if (p1.x > canvas.width) p1.x = 0;
        if (p1.x < 0) p1.x = canvas.width;
        if (p1.y > canvas.height) p1.y = 0;
        if (p1.y < 0) p1.y = canvas.height;

        ctx.fillStyle = `rgba(${theme.primaryRgb},${p1.opacity})`;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
        ctx.fill();

        if (mouse.active) {
          const dist = Math.sqrt(
            (mouse.x - p1.x) ** 2 + (mouse.y - p1.y) ** 2,
          );
          if (dist < 150) {
            ctx.strokeStyle = `rgba(${theme.primaryRgb},${theme.mouseLinkAlpha * (1 - dist / 150) * mouseLinkScale})`;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
          }
        }

        for (let j = i + 1; j < particles.length; j += 1) {
          if (particleLinkScale < 0.2 && (j + i) % 2 === 1) continue;
          const p2 = particles[j];
          const dist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
          if (dist < 100) {
            ctx.strokeStyle = `rgba(${theme.primaryRgb},${theme.particleLinkAlpha * (1 - dist / 100) * particleLinkScale})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
    };

    const updateAndDrawStreams = () => {
      const theme = themeRef.current;
      dataStreams.forEach((stream) => {
        stream.y += stream.speed;
        if (stream.y > canvas.height) stream.y = -stream.len;

        const grad = ctx.createLinearGradient(
          0,
          stream.y,
          0,
          stream.y + stream.len,
        );
        grad.addColorStop(0, `rgba(${theme.primaryRgb},0)`);
        grad.addColorStop(
          1,
          `rgba(${theme.primaryRgb},${stream.opacity})`,
        );

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(stream.x, stream.y);
        ctx.lineTo(stream.x, stream.y + stream.len);
        ctx.stroke();
      });
    };

    const updateAndDrawOrbits = () => {
      const theme = themeRef.current;
      orbits.forEach((orbit) => {
        let currentSpeed = orbit.speed;
        let decay = 0.002;

        if (mouse.active) {
          const dx = mouse.x - orbit.x;
          const dy = mouse.y - orbit.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const factor = (120 - dist) / 120;
            currentSpeed += factor * 0.5;
            decay = 0.002 * (1 - factor * 0.8);
          }
        }

        orbit.r += currentSpeed;
        orbit.opacity -= decay;
        if (orbit.opacity <= 0) {
          orbit.r = 0;
          orbit.opacity = theme.orbitAlpha;
          orbit.x = Math.random() * canvas.width;
          orbit.y = Math.random() * canvas.height;
        }

        ctx.strokeStyle = `rgba(${theme.primaryRgb},${orbit.opacity})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(orbit.x, orbit.y, orbit.r, 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    const animate = () => {
      // 不可见时跳过绘制，仅保留 rAF 调度（开销极低）
      if (!isVisible) {
        animationFrameId = window.requestAnimationFrame(animate);
        return;
      }

      // Smooth mouse follow to avoid jitter when pointer moves fast.
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.x += (mouse.targetX - mouse.x) * 0.2;
      mouse.y += (mouse.targetY - mouse.y) * 0.2;
      const dx = mouse.x - mouse.prevX;
      const dy = mouse.y - mouse.prevY;
      const instantSpeed = Math.sqrt(dx * dx + dy * dy);
      mouse.speed += (instantSpeed - mouse.speed) * 0.18;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawAtmosphericGlow();
      drawGrid();
      drawScanLine();
      drawMouseEffect();
      updateAndDrawStreams();
      updateAndDrawOrbits();
      updateAndDrawParticles();
      animationFrameId = window.requestAnimationFrame(animate);
    };

    const handlePointerMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = event.clientX - rect.left;
      mouse.targetY = event.clientY - rect.top;
      if (!mouse.active) {
        mouse.x = mouse.targetX;
        mouse.y = mouse.targetY;
      }
      mouse.active = true;
    };

    const handlePointerLeave = () => {
      mouse.active = false;
    };

    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(parent);
    parent.addEventListener("mousemove", handlePointerMove, { passive: true });
    parent.addEventListener("mouseleave", handlePointerLeave);

    resizeCanvas();
    animate();

    return () => {
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      parent.removeEventListener("mousemove", handlePointerMove);
      parent.removeEventListener("mouseleave", handlePointerLeave);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const renderedTheme = getTheme(isDarkMode);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: renderedTheme.canvasOpacity,
        filter: renderedTheme.canvasFilter,
        mixBlendMode: renderedTheme.blendMode as CSSProperties["mixBlendMode"],
      }}
      aria-hidden="true"
    />
  );
}
