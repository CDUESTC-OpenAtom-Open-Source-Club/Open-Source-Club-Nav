import { useEffect, useRef } from "react";

export default function GlobeCanvas({ pulse = false, size = 260 }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const sceneRef = useRef({});

  useEffect(() => {
    let THREE;
    let cleanup = false;

    import("three").then((mod) => {
      if (cleanup) return;
      THREE = mod;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const w = size;
      const h = size;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
      camera.position.z = 3.8;

      // Main wireframe globe
      const sphereGeo = new THREE.SphereGeometry(1.4, 22, 16);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x0a84ff,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      scene.add(sphere);

      // Outer glow ring
      const outerGeo = new THREE.SphereGeometry(1.52, 18, 12);
      const outerMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.1,
      });
      const outer = new THREE.Mesh(outerGeo, outerMat);
      scene.add(outer);

      // Equatorial ring
      const ringGeo = new THREE.TorusGeometry(1.48, 0.006, 2, 80);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x06e5cc,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      scene.add(ring);

      // Second ring (tilted)
      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(1.56, 0.004, 2, 80),
        new THREE.MeshBasicMaterial({
          color: 0x0a84ff,
          transparent: true,
          opacity: 0.4,
        }),
      );
      ring2.rotation.x = Math.PI / 3;
      scene.add(ring2);

      // Orbit particles
      const particleCount = 60;
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
      particleGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      const particleMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.03,
        transparent: true,
        opacity: 0.6,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      sceneRef.current = {
        sphere,
        outer,
        ring,
        ring2,
        particles,
        renderer,
        scene,
        camera,
      };

      let t = 0;
      const animate = () => {
        if (cleanup) return;
        frameRef.current = requestAnimationFrame(animate);
        t += 0.01;
        sphere.rotation.y += 0.004;
        outer.rotation.y -= 0.002;
        outer.rotation.x += 0.001;
        particles.rotation.y += 0.001;
        particles.rotation.x += 0.0005;
        ring.rotation.z += 0.002;

        // Pulse effect
        const pulseMult = pulse ? 1 + Math.sin(t * 4) * 0.08 : 1;
        sphere.scale.setScalar(pulseMult);
        ring.material.opacity = 0.5 + Math.sin(t * 3) * 0.2;
        sphereMat.opacity = 0.32 + Math.sin(t * 2) * 0.06;

        renderer.render(scene, camera);
      };
      animate();
    });

    return () => {
      cleanup = true;
      cancelAnimationFrame(frameRef.current);
      if (sceneRef.current.renderer) {
        const { renderer } = sceneRef.current;
        renderer.dispose();
      }
      sceneRef.current = {};
    };
  }, [size]);

  // Pulse reactivity
  useEffect(() => {
    const { sphereMat, sphere } = sceneRef.current;
    if (!sphereMat) return;
  }, [pulse]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        display: "block",
        filter: "drop-shadow(0 0 24px rgba(10,132,255,0.2))",
        flexShrink: 0,
      }}
    />
  );
}
