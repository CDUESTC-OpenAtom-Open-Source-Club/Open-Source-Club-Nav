"use client";
import React, { useRef, useEffect } from 'react';

const SphereWithAnnotations: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = container.clientWidth;
    let height = canvas.height = container.clientHeight;

    const PARTICLE_COUNT = 160;
    const RADIUS = Math.min(width, height) * 0.4;
    const CONNECTION_DIST = RADIUS * 0.6;
    let rotationAngle = 0;

    interface Particle {
      x: number; y: number; z: number;
      px: number; py: number;
    }

    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
        const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
        particles.push({
          x: RADIUS * Math.cos(theta) * Math.sin(phi),
          y: RADIUS * Math.sin(theta) * Math.sin(phi),
          z: RADIUS * Math.cos(phi),
          px: 0, py: 0
        });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      rotationAngle += 0.002;

      // 投影 3D 到 2D
      particles.forEach(p => {
        const x1 = p.x * Math.cos(rotationAngle) - p.z * Math.sin(rotationAngle);
        const z1 = p.x * Math.sin(rotationAngle) + p.z * Math.cos(rotationAngle);
        const perspective = 800 / (800 - z1);
        p.px = x1 * perspective + width / 2;
        p.py = p.y * perspective + height / 2;

        // 绘制微小的点
        ctx.fillStyle = `rgba(0, 120, 255, ${0.2 + (z1 / RADIUS)})`;
        ctx.beginPath();
        ctx.arc(p.px, p.py, 1, 0, Math.PI * 2);
        ctx.fill();
      });

      // 绘制几何连线
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dist = Math.hypot(p1.px - p2.px, p1.py - p2.py);

          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.4;
            ctx.strokeStyle = `rgba(0, 140, 255, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    initParticles();
    render();

    const handleResize = () => {
      if (!container) return;
      width = canvas.width = container.clientWidth;
      height = canvas.height = container.clientHeight;
      initParticles();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '600px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        overflow: 'hidden'
      }}
    >
      {/* 这里的容器控制了 Canvas 和文字的布局范围 */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '600px',
          height: '600px'
        }}
      >
        {/* 右上角注释 */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '0',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          CONTACT!
        </div>

        {/* 左下角注释 */}
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '0',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          WELCOME!!
        </div>

        {/* 核心球体 Canvas */}
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>
    </div>
  );
};

export default SphereWithAnnotations;
