"use client";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { DeviceTier } from "@/hooks/useDeviceCapability";
import * as THREE from "three";

/**
 * GlobeCanvasProps
 * - `pulse`: enable subtle pulse animation on globe mesh
 * - `size`: canvas width/height in pixels
 *
 * Example:
 * `<GlobeCanvas size={260} pulse />`
 */
export type GlobeCanvasProps = {
  isDarkMode?: boolean;
  pulse?: boolean;
  size?: number;
  /** "high" 全精度 | "medium" 降面数 | 传入时覆盖自动检测 */
  quality?: DeviceTier;
};

type SceneRuntime = {
  renderer?: { dispose: () => void } | null;
};

const getGlobeTheme = (isDarkMode: boolean) => ({
  sphereColor: isDarkMode ? 0x0a84ff : 0x2563eb,
  outerColor: isDarkMode ? 0x38bdf8 : 0x60a5fa,
  ringColor: isDarkMode ? 0x06e5cc : 0x0891b2,
  sphereOpacityBase: isDarkMode ? 0.32 : 0.18,
  sphereOpacityPulse: isDarkMode ? 0.06 : 0.025,
  outerOpacity: isDarkMode ? 0.1 : 0.045,
  ringOpacityBase: isDarkMode ? 0.5 : 0.24,
  ringOpacityPulse: isDarkMode ? 0.2 : 0.08,
  ring2Opacity: isDarkMode ? 0.4 : 0.16,
  particleOpacity: isDarkMode ? 0.6 : 0.28,
  canvasOpacity: isDarkMode ? 1 : 0.72,
  canvasFilter: isDarkMode
    ? "drop-shadow(0 0 24px rgba(10,132,255,0.2))"
    : "drop-shadow(0 0 14px rgba(37,99,235,0.12)) saturate(0.82) brightness(1.05)",
  blendMode: isDarkMode ? "screen" : "multiply",
});

export default function GlobeCanvas({ isDarkMode = false, pulse = false, size = 260, quality = "high" }: GlobeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const sceneRef = useRef<SceneRuntime>({});
  const themeRef = useRef(getGlobeTheme(isDarkMode));

  useEffect(() => {
    themeRef.current = getGlobeTheme(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    let cleanup = false;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── IntersectionObserver：离开视口时暂停 WebGL 渲染 ──
    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { rootMargin: "100px" },
    );
    visibilityObserver.observe(canvas);

    // 根据质量等级调整几何体面数和粒子数
    const isHigh = quality !== "medium" && quality !== "low";
    const sphereSegW = isHigh ? 22 : 12;
    const sphereSegH = isHigh ? 16 : 8;
    const outerSegW = isHigh ? 18 : 10;
    const outerSegH = isHigh ? 12 : 6;
    const ringSegments = isHigh ? 80 : 40;
    const particleCount = isHigh ? 60 : 24;
    const maxDpr = isHigh ? 2 : 1.5;

    const w = size;
    const h = size;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: isHigh, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.z = 3.8;

    const sphereGeo = new THREE.SphereGeometry(1.4, sphereSegW, sphereSegH);
    const initialTheme = themeRef.current;
    const sphereMat = new THREE.MeshBasicMaterial({
      color: initialTheme.sphereColor, wireframe: true, transparent: true, opacity: initialTheme.sphereOpacityBase,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    const outerGeo = new THREE.SphereGeometry(1.52, outerSegW, outerSegH);
    const outerMat = new THREE.MeshBasicMaterial({
      color: initialTheme.outerColor, wireframe: true, transparent: true, opacity: initialTheme.outerOpacity,
    });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outer);

    const ringGeo = new THREE.TorusGeometry(1.48, 0.006, 2, ringSegments);
    const ringMat = new THREE.MeshBasicMaterial({
      color: initialTheme.ringColor, transparent: true, opacity: initialTheme.ringOpacityBase,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    scene.add(ring);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.56, 0.004, 2, ringSegments),
      new THREE.MeshBasicMaterial({ color: initialTheme.sphereColor, transparent: true, opacity: initialTheme.ring2Opacity }),
    );
    const ring2Mat = ring2.material as THREE.MeshBasicMaterial;
    ring2.rotation.x = Math.PI / 3;
    scene.add(ring2);

    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 1.4 + Math.random() * 0.3;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: initialTheme.outerColor, size: 0.03, transparent: true, opacity: initialTheme.particleOpacity,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    sceneRef.current = { renderer };

    let t = 0;
    const animate = () => {
      if (cleanup) return;
      frameRef.current = requestAnimationFrame(animate);

      // 不可见时跳过渲染，仅保留 rAF 调度
      if (!isVisible) return;

      t += 0.01;
      sphere.rotation.y += 0.004;
      outer.rotation.y -= 0.002;
      outer.rotation.x += 0.001;
      particles.rotation.y += 0.001;
      particles.rotation.x += 0.0005;
      ring.rotation.z += 0.002;

      const theme = themeRef.current;
      sphereMat.color.setHex(theme.sphereColor);
      outerMat.color.setHex(theme.outerColor);
      ringMat.color.setHex(theme.ringColor);
      ring2Mat.color.setHex(theme.sphereColor);
      particleMat.color.setHex(theme.outerColor);
      outerMat.opacity = theme.outerOpacity;
      ring2Mat.opacity = theme.ring2Opacity;
      particleMat.opacity = theme.particleOpacity;

      const pulseMult = pulse ? 1 + Math.sin(t * 4) * 0.08 : 1;
      sphere.scale.setScalar(pulseMult);
      ringMat.opacity = theme.ringOpacityBase + Math.sin(t * 3) * theme.ringOpacityPulse;
      sphereMat.opacity = theme.sphereOpacityBase + Math.sin(t * 2) * theme.sphereOpacityPulse;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cleanup = true;
      visibilityObserver.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      sceneRef.current.renderer?.dispose();
      sceneRef.current = {};
    };
  }, [pulse, size, quality]);

  const renderedTheme = getGlobeTheme(isDarkMode);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        display: "block",
        filter: renderedTheme.canvasFilter,
        mixBlendMode: renderedTheme.blendMode as CSSProperties["mixBlendMode"],
        opacity: renderedTheme.canvasOpacity,
        flexShrink: 0,
      }}
    />
  );
}
