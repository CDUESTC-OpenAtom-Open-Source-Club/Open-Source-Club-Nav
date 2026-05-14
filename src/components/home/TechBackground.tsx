"use client";

import { useEffect, useRef } from "react";

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

export default function TechBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const parent = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    if (!parent || !ctx) return undefined;

    let animationFrameId = 0;
    let particles: Particle[] = [];
    let dataStreams: DataStream[] = [];
    let orbits: Orbit[] = [];
    let time = 0;

    const mouse = { x: 0, y: 0, active: false };

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
      for (let i = 0; i < 3; i += 1) {
        orbits.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: 0,
          speed: Math.random() * 0.5 + 0.2,
          opacity: 0.2,
        });
      }
    };

    const drawGrid = () => {
      const step = 40;
      ctx.lineWidth = 0.5;

      for (let x = 0; x <= canvas.width; x += step) {
        ctx.strokeStyle = "rgba(59,130,246,0.035)";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y <= canvas.height; y += step) {
        ctx.strokeStyle = "rgba(59,130,246,0.035)";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      for (let x = 0; x <= canvas.width; x += step) {
        for (let y = 0; y <= canvas.height; y += step) {
          if (Math.random() > 0.992) {
            ctx.fillStyle = `rgba(59,130,246,${Math.sin(time * 2) * 0.1 + 0.08})`;
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    };

    const drawScanLine = () => {
      time += 0.005;
      const scanY = (Math.sin(time) * 0.5 + 0.5) * canvas.height;
      const grad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      grad.addColorStop(0, "rgba(59,130,246,0)");
      grad.addColorStop(0.5, "rgba(59,130,246,0.09)");
      grad.addColorStop(1, "rgba(59,130,246,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 40, canvas.width, 80);
    };

    const drawAtmosphericGlow = () => {
      const grad = ctx.createRadialGradient(
        canvas.width * (0.5 + Math.sin(time * 0.3) * 0.18),
        canvas.height * (0.5 + Math.cos(time * 0.3) * 0.18),
        0,
        canvas.width * 0.5,
        canvas.height * 0.5,
        canvas.width * 0.8,
      );
      grad.addColorStop(0, "rgba(59,130,246,0.06)");
      grad.addColorStop(1, "rgba(59,130,246,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawMouseEffect = () => {
      if (!mouse.active) return;

      const grad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        100,
      );
      grad.addColorStop(0, "rgba(59,130,246,0.12)");
      grad.addColorStop(1, "rgba(59,130,246,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 100, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(59,130,246,0.2)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(mouse.x - 15, mouse.y);
      ctx.lineTo(mouse.x + 15, mouse.y);
      ctx.moveTo(mouse.x, mouse.y - 15);
      ctx.lineTo(mouse.x, mouse.y + 15);
      ctx.stroke();
    };

    const updateAndDrawParticles = () => {
      particles.forEach((p1, i) => {
        if (mouse.active) {
          const dx = mouse.x - p1.x;
          const dy = mouse.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120 && dist > 0.001) {
            const force = (120 - dist) / 120;
            p1.x -= (dx / dist) * force * 2;
            p1.y -= (dy / dist) * force * 2;
          }
        }

        p1.x += p1.speedX;
        p1.y += p1.speedY;

        if (p1.x > canvas.width) p1.x = 0;
        if (p1.x < 0) p1.x = canvas.width;
        if (p1.y > canvas.height) p1.y = 0;
        if (p1.y < 0) p1.y = canvas.height;

        ctx.fillStyle = `rgba(59,130,246,${p1.opacity})`;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
        ctx.fill();

        if (mouse.active) {
          const dist = Math.sqrt(
            (mouse.x - p1.x) ** 2 + (mouse.y - p1.y) ** 2,
          );
          if (dist < 150) {
            ctx.strokeStyle = `rgba(59,130,246,${0.12 * (1 - dist / 150)})`;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
          }
        }

        for (let j = i + 1; j < particles.length; j += 1) {
          const p2 = particles[j];
          const dist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
          if (dist < 100) {
            ctx.strokeStyle = `rgba(59,130,246,${0.08 * (1 - dist / 100)})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
    };

    const updateAndDrawStreams = () => {
      dataStreams.forEach((stream) => {
        stream.y += stream.speed;
        if (stream.y > canvas.height) stream.y = -stream.len;

        const grad = ctx.createLinearGradient(
          0,
          stream.y,
          0,
          stream.y + stream.len,
        );
        grad.addColorStop(0, "rgba(59,130,246,0)");
        grad.addColorStop(
          1,
          `rgba(59,130,246,${stream.opacity})`,
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
          orbit.opacity = 0.2;
          orbit.x = Math.random() * canvas.width;
          orbit.y = Math.random() * canvas.height;
        }

        ctx.strokeStyle = `rgba(59,130,246,${orbit.opacity})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(orbit.x, orbit.y, orbit.r, 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    const animate = () => {
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
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      mouse.active = true;
    };

    const handlePointerLeave = () => {
      mouse.active = false;
    };

    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(parent);
    parent.addEventListener("mousemove", handlePointerMove);
    parent.addEventListener("mouseleave", handlePointerLeave);

    resizeCanvas();
    animate();

    return () => {
      resizeObserver.disconnect();
      parent.removeEventListener("mousemove", handlePointerMove);
      parent.removeEventListener("mouseleave", handlePointerLeave);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: 0.65,
      }}
      aria-hidden="true"
    />
  );
}

