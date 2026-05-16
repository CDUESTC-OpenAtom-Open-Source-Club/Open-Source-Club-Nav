"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, RefreshCcw } from "lucide-react";

interface JumpGameProps {
  onComplete: () => void;
}

type GameState = "ready" | "playing" | "gameover" | "victory";
type PlayerState = "idle" | "charging" | "jumping" | "landing" | "flying";
type LandingType = "steady" | "stumble";

type Platform = {
  x: number;
  y: number;
  width: number;
  height: number;
  hillHeight: number;
  curveOffset: number;
  decoration: "none" | "pavilion" | "nature";
  isFlightTrigger?: boolean;
};

type BackgroundItem = {
  x: number;
  y: number;
  size: number;
  speed: number;
  type: "cloud" | "mountain";
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};

type Player = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  charging: boolean;
  chargePower: number;
  lastX: number;
};

type GameData = {
  player: Player;
  platforms: Platform[];
  background: BackgroundItem[];
  particles: Particle[];
  currentPlatformIndex: number;
  allowWideLanding: boolean;
  cameraX: number;
  targetCameraX: number;
  animationId: number;
  frame: number;
  playerState: PlayerState;
  landingTimer: number;
  flightTimer: number;
  landingType: LandingType;
};

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const CONSTANTS = {
  WORLD_WIDTH: 600,
  WORLD_HEIGHT: 400,
  GRAVITY: 0.35,
  MAX_CHARGE: 100,
  MAX_PARTICLES: 160,
  PLATFORM_WIDTH: 130,
  PLATFORM_HEIGHT: 60,
  PLAYER_SIZE: 30,
  LEVEL_LENGTH: 8,
};

export const AdminGateJumpGame: React.FC<JumpGameProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("ready");
  const [score, setScore] = useState(0);
  const victoryTriggeredRef = useRef(false);
  const gameStateRef = useRef<GameState>("ready");
  const scoreRef = useRef(0);
  const gameData = useRef<GameData>({
    player: { x: 50, y: 0, vx: 0, vy: 0, charging: false, chargePower: 0, lastX: 50 },
    platforms: [],
    background: [],
    particles: [],
    currentPlatformIndex: 0,
    allowWideLanding: false,
    cameraX: 0,
    targetCameraX: 0,
    animationId: 0,
    frame: 0,
    playerState: "idle",
    landingTimer: 0,
    flightTimer: 0,
    landingType: "steady",
  });

  const audioCtx = useRef<AudioContext | null>(null);
  const chargeOsc = useRef<OscillatorNode | null>(null);
  const chargeGain = useRef<GainNode | null>(null);

  const initAudio = () => {
    if (!audioCtx.current) {
      const Ctx = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
      if (Ctx) audioCtx.current = new Ctx();
    }
  };

  const playSound = useCallback((type: "jump" | "land" | "score" | "victory" | "fail") => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case "jump":
        osc.type = "triangle";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case "land":
        osc.type = "sine";
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.1);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case "score":
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case "victory":
        [440, 554.37, 659.25, 880].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.setValueAtTime(freq, now + i * 0.15);
          g.gain.setValueAtTime(0, now + i * 0.15);
          g.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.15);
          o.stop(now + i * 0.15 + 0.3);
        });
        break;
      case "fail":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      default:
        break;
    }
  }, []);

  const stopChargeSound = useCallback(() => {
    if (chargeOsc.current && chargeGain.current && audioCtx.current) {
      const now = audioCtx.current.currentTime;
      chargeGain.current.gain.cancelScheduledValues(now);
      chargeGain.current.gain.linearRampToValueAtTime(0, now + 0.05);
      chargeOsc.current.stop(now + 0.1);
      chargeOsc.current = null;
      chargeGain.current = null;
    }
  }, []);

  const startChargeSound = useCallback(() => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    if (chargeOsc.current) stopChargeSound();
    chargeOsc.current = ctx.createOscillator();
    chargeGain.current = ctx.createGain();
    chargeOsc.current.type = "sine";
    chargeOsc.current.frequency.setValueAtTime(100, ctx.currentTime);
    chargeGain.current.gain.setValueAtTime(0, ctx.currentTime);
    chargeGain.current.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
    chargeOsc.current.connect(chargeGain.current);
    chargeGain.current.connect(ctx.destination);
    chargeOsc.current.start();
  }, [stopChargeSound]);

  const updateChargeSound = (ratio: number) => {
    if (chargeOsc.current && audioCtx.current) {
      chargeOsc.current.frequency.setTargetAtTime(100 + ratio * 400, audioCtx.current.currentTime, 0.1);
    }
  };

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    let noiseSource: AudioBufferSourceNode | null = null;
    if (gameState === "playing" && audioCtx.current) {
      const ctx = audioCtx.current;
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) output[i] = Math.random() * 2 - 1;
      noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      const bGain = ctx.createGain();
      bGain.gain.setValueAtTime(0, ctx.currentTime);
      bGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2);
      noiseSource.connect(filter);
      filter.connect(bGain);
      bGain.connect(ctx.destination);
      noiseSource.start();
    }
    return () => {
      if (noiseSource) noiseSource.stop();
    };
  }, [gameState]);

  const initGame = () => {
    initAudio();
    victoryTriggeredRef.current = false;
    gameStateRef.current = "playing";

    const platforms: Platform[] = [];
    const background: BackgroundItem[] = [];
    let currentX = 50;

    platforms.push({
      x: currentX,
      y: 320,
      width: CONSTANTS.PLATFORM_WIDTH,
      height: 20,
      hillHeight: 40,
      curveOffset: 0,
      decoration: "nature",
    });

    for (let i = 1; i < CONSTANTS.LEVEL_LENGTH; i += 1) {
      const distance = 40 + Math.random() * 100;
      currentX += distance + CONSTANTS.PLATFORM_WIDTH;
      platforms.push({
        x: currentX,
        y: 320,
        width: CONSTANTS.PLATFORM_WIDTH + (Math.random() * 40 - 20),
        height: 20,
        hillHeight: 30 + Math.random() * 40,
        curveOffset: (Math.random() - 0.5) * 30,
        decoration: Math.random() > 0.6 ? "pavilion" : Math.random() > 0.3 ? "nature" : "none",
        isFlightTrigger: i === 3,
      });
    }

    for (let i = 0; i < 8; i += 1) {
      background.push({ x: i * 300 + Math.random() * 100, y: 400, size: 150 + Math.random() * 100, speed: 0.2, type: "mountain" });
    }

    for (let i = 0; i < 10; i += 1) {
      background.push({ x: Math.random() * 2000, y: 50 + Math.random() * 150, size: 30 + Math.random() * 40, speed: 0.5 + Math.random() * 0.5, type: "cloud" });
    }

    gameData.current = {
      player: {
        x: 50 + CONSTANTS.PLATFORM_WIDTH / 2,
        y: 320 - CONSTANTS.PLAYER_SIZE,
        vx: 0,
        vy: 0,
        charging: false,
        chargePower: 0,
        lastX: 50 + CONSTANTS.PLATFORM_WIDTH / 2,
      },
      platforms,
      background,
      particles: [],
      currentPlatformIndex: 0,
      allowWideLanding: false,
      cameraX: 0,
      targetCameraX: 0,
      animationId: 0,
      frame: 0,
      playerState: "idle",
      landingTimer: 0,
      flightTimer: 0,
      landingType: "steady",
    };

    setScore(0);
    setGameState("playing");
  };

  const createParticles = (x: number, y: number, count: number, color: string, speedMult = 1) => {
    const overflow = gameData.current.particles.length + count - CONSTANTS.MAX_PARTICLES;
    if (overflow > 0) {
      gameData.current.particles.splice(0, overflow);
    }
    for (let i = 0; i < count; i += 1) {
      gameData.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5 * speedMult,
        vy: (Math.random() - 0.5) * 5 * speedMult,
        life: 1,
        size: 2 + Math.random() * 4,
        color,
      });
    }
  };

  const drawSwordmaster = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    chargePower: number,
    vy: number,
    state: PlayerState,
    frame: number,
  ) => {
    ctx.save();
    ctx.translate(x, y);

    const chargeRatio = chargePower / CONSTANTS.MAX_CHARGE;
    const isCharging = state === "charging";

    if (state === "jumping" || state === "flying") {
      if (state === "flying") ctx.rotate(0.1 * Math.sin(frame * 0.1));
      else if (vy < -2) ctx.rotate(0.2);
      else if (vy > 2) ctx.rotate(frame * 0.2);
    }

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    let bodySquash = isCharging ? chargeRatio * 15 : state === "landing" ? 10 : 0;
    if (state === "idle") bodySquash = Math.sin(frame * 0.1) * 2;

    const headX = state === "idle" || state === "charging" ? 3 : 0;
    const headY = -size + bodySquash + 5;
    const neckY = -size + bodySquash + 11;
    const hipsY = -size / 2 + bodySquash;

    ctx.beginPath();
    ctx.arc(headX, headY, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#92400e";
    ctx.beginPath();
    ctx.moveTo(headX - 15, headY - 2);
    ctx.lineTo(headX, headY - 12);
    ctx.lineTo(headX + 15, headY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(headX, neckY);
    ctx.lineTo(0, hipsY);
    ctx.stroke();

    let armAngleL = Math.PI * 0.8;
    let armAngleR = Math.PI * 0.2;
    if (isCharging) {
      armAngleL = Math.PI * 0.1;
      armAngleR = Math.PI * 0.7;
    } else if (state === "idle") {
      armAngleL = Math.PI * 0.6 + Math.sin(frame * 0.1) * 0.1;
      armAngleR = Math.PI * 0.4 - Math.sin(frame * 0.1) * 0.1;
    }

    ctx.beginPath();
    ctx.moveTo(headX, neckY);
    ctx.lineTo(headX + Math.cos(armAngleL) * 12, neckY + Math.sin(armAngleL) * 12);
    ctx.stroke();

    const handRX = headX + Math.cos(armAngleR) * 12;
    const handRY = neckY + Math.sin(armAngleR) * 12;
    ctx.beginPath();
    ctx.moveTo(headX, neckY);
    ctx.lineTo(handRX, handRY);
    ctx.stroke();

    ctx.save();
    ctx.translate(handRX, handRY);
    ctx.rotate(armAngleR + Math.PI / 2);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -5);
    ctx.stroke();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(0, -30);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(0, hipsY);
    if (state === "idle" || state === "charging") {
      ctx.lineTo(-12 - bodySquash / 2, 0);
      ctx.moveTo(0, hipsY);
      ctx.lineTo(8 + bodySquash / 3, 0);
    } else {
      ctx.lineTo(-8 - bodySquash / 2, 0);
      ctx.moveTo(0, hipsY);
      ctx.lineTo(8 + bodySquash / 2, 0);
    }
    ctx.stroke();
    ctx.restore();
  };

  const drawHill = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    hillHeight: number,
    curveOffset: number,
    active: boolean,
    decoration: Platform["decoration"],
    isFlightTrigger = false,
  ) => {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(x - 30, y + height);
    ctx.bezierCurveTo(
      x + width / 3 + curveOffset,
      y - hillHeight,
      x + width * 0.6 + curveOffset,
      y - hillHeight * 0.8,
      x + width + 30,
      y + height,
    );
    ctx.fillStyle = isFlightTrigger && !active ? "#fde047" : active ? "#3b82f6" : "#94a3b8";
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x + width / 2, y, width / 2, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = active ? "#60a5fa" : isFlightTrigger ? "#fef08a" : "#cbd5e1";
    ctx.fill();

    if (decoration === "pavilion") {
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(x + width * 0.42, y - 22, 22, 14);
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(x + width * 0.38, y - 22);
      ctx.lineTo(x + width * 0.53, y - 34);
      ctx.lineTo(x + width * 0.68, y - 22);
      ctx.closePath();
      ctx.fill();
    }

    if (decoration === "nature") {
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(x + width * 0.2, y - 10, 7, 0, Math.PI * 2);
      ctx.arc(x + width * 0.76, y - 8, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const drawSea = (ctx: CanvasRenderingContext2D, width: number, height: number, frame: number, cameraX: number) => {
    const seaLevel = 332;
    const seaGradient = ctx.createLinearGradient(0, seaLevel, 0, height);
    seaGradient.addColorStop(0, "#0ea5e9");
    seaGradient.addColorStop(1, "#0369a1");
    ctx.fillStyle = seaGradient;
    ctx.fillRect(0, seaLevel, width, height - seaLevel);

    ctx.save();
    ctx.translate(-(cameraX % 40), 0);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;
    for (let i = -40; i < width + 40; i += 40) {
      const waveX = i + (frame % 40);
      const waveY = seaLevel + Math.sin((frame + i) * 0.05) * 4;
      ctx.beginPath();
      ctx.moveTo(waveX - 20, seaLevel);
      ctx.quadraticCurveTo(waveX - 10, waveY, waveX, seaLevel);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, cameraX: number) => {
    const { background } = gameData.current;

    for (const item of background) {
      if (item.type === "mountain") {
        const x = item.x - cameraX * item.speed;
        ctx.fillStyle = "rgba(100, 116, 139, 0.18)";
        ctx.beginPath();
        ctx.moveTo(x - item.size, 332);
        ctx.lineTo(x, 332 - item.size * 0.7);
        ctx.lineTo(x + item.size, 332);
        ctx.closePath();
        ctx.fill();
      } else {
        const x = (item.x - cameraX * item.speed * 0.6) % (width + 260);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.ellipse(x, item.y, item.size * 0.6, item.size * 0.3, 0, 0, Math.PI * 2);
        ctx.ellipse(x + item.size * 0.35, item.y + 2, item.size * 0.45, item.size * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    const particles = gameData.current.particles;
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.life -= 0.02;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  const drawJumpIndicator = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    vx: number,
    vy: number,
    chargePower: number,
    state: PlayerState,
    platforms: Platform[],
    currentPlatformIndex: number,
    allowWideLanding: boolean,
  ) => {
    const isPreview = state === "charging";
    const isMoving = state === "jumping" || state === "flying";
    if (!isPreview && !isMoving) return;

    let ivx = vx;
    let ivy = vy;
    if (isPreview) {
      const ratio = chargePower / CONSTANTS.MAX_CHARGE;
      ivx = 1.2 + ratio * 4.2;
      ivy = -(4.8 + ratio * 4.4);
    }
    if (Math.abs(ivx) < 0.01 && Math.abs(ivy) < 0.01) return;

    const points: Array<{ x: number; y: number }> = [];
    let px = x;
    let py = y;
    const pvx = ivx;
    let pvy = ivy;
    let landingPoint: { x: number; y: number } | null = null;

    for (let t = 0; t < 110; t += 1) {
      px += pvx;
      py += pvy;
      pvy += CONSTANTS.GRAVITY;
      points.push({ x: px, y: py - CONSTANTS.PLAYER_SIZE * 0.35 });

      if (pvy > 0) {
        for (let i = 0; i < platforms.length; i += 1) {
          const p = platforms[i];
          const allowAdjacentOnly = i === currentPlatformIndex || i === currentPlatformIndex + 1;
          if (!allowWideLanding && !allowAdjacentOnly) continue;

          if (
            px > p.x - 10 &&
            px < p.x + p.width + 10 &&
            py >= p.y - 15 &&
            py <= p.y + p.height + pvy
          ) {
            landingPoint = { x: px, y: p.y - CONSTANTS.PLAYER_SIZE * 0.35 };
            break;
          }
        }
      }

      if (landingPoint || py > CONSTANTS.WORLD_HEIGHT + 120) break;
    }

    if (points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = isPreview ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.9)";
    ctx.lineWidth = isPreview ? 4 : 3;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y - CONSTANTS.PLAYER_SIZE * 0.35);
    points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.stroke();

    ctx.strokeStyle = isPreview ? "rgba(14,165,233,0.98)" : "rgba(37,99,235,0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - CONSTANTS.PLAYER_SIZE * 0.35);
    points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.stroke();
    ctx.setLineDash([]);

    const endPoint = landingPoint ?? points[points.length - 1];
    ctx.fillStyle = landingPoint ? "rgba(34,197,94,0.96)" : "rgba(37,99,235,0.96)";
    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = landingPoint ? "rgba(134,239,172,0.98)" : "rgba(147,197,253,0.98)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };

  const handleChargeStart = () => {
    if (gameState !== "playing") return;
    const player = gameData.current.player;
    if (player.vx !== 0 || player.vy !== 0) return;
    initAudio();
    player.charging = true;
    player.chargePower = 0;
    gameData.current.playerState = "charging";
    startChargeSound();
  };

  const handleChargeEnd = () => {
    if (gameState !== "playing") return;
    const player = gameData.current.player;
    if (!player.charging) return;

    player.charging = false;
    const ratio = player.chargePower / CONSTANTS.MAX_CHARGE;
    // Extend charge duration and limit non-special jump distance to near-adjacent platforms.
    player.vx = 1.2 + ratio * 4.2;
    player.vy = -(4.8 + ratio * 4.4);
    player.lastX = player.x;
    gameData.current.playerState = "jumping";

    createParticles(player.x, player.y + 4, 10, "#60a5fa", 0.8);
    stopChargeSound();
    playSound("jump");
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      if (gameStateRef.current !== "playing") return;
      const player = gameData.current.player;
      if (player.vx !== 0 || player.vy !== 0 || player.charging) return;
      initAudio();
      player.charging = true;
      player.chargePower = 0;
      gameData.current.playerState = "charging";
      startChargeSound();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      if (gameStateRef.current !== "playing") return;
      const player = gameData.current.player;
      if (!player.charging) return;
      player.charging = false;
      const ratio = player.chargePower / CONSTANTS.MAX_CHARGE;
      // Keep keyboard jump behavior aligned with mouse/touch: slower charge payoff, shorter non-special leap.
      player.vx = 1.2 + ratio * 4.2;
      player.vy = -(4.8 + ratio * 4.4);
      player.lastX = player.x;
      gameData.current.playerState = "jumping";
      createParticles(player.x, player.y + 4, 10, "#60a5fa", 0.8);
      stopChargeSound();
      playSound("jump");
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [playSound, startChargeSound, stopChargeSound]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setupCanvas = () => {
      canvas.width = CONSTANTS.WORLD_WIDTH;
      canvas.height = CONSTANTS.WORLD_HEIGHT;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    setupCanvas();

    const render = () => {
      const { player, platforms } = gameData.current;
      gameData.current.frame += 1;
      const frame = gameData.current.frame;

      if (gameData.current.landingTimer > 0) {
        gameData.current.landingTimer -= 1;
      } else if (gameData.current.playerState === "landing") {
        gameData.current.playerState = "idle";
      }

      if (gameData.current.playerState === "flying") {
        player.x += player.vx;
        player.y += player.vy;
        gameData.current.flightTimer -= 1;
        gameData.current.targetCameraX = Math.max(0, player.x - 180);
        gameData.current.cameraX += (gameData.current.targetCameraX - gameData.current.cameraX) * 0.08;
        createParticles(player.x, player.y + 4, 1, "#fef08a", 0.6);

        if (gameData.current.flightTimer <= 0) {
          gameData.current.playerState = "jumping";
          player.vy = 0.6;
        }
      } else if (player.charging) {
        player.chargePower = Math.min(player.chargePower + 0.6, CONSTANTS.MAX_CHARGE);
        updateChargeSound(player.chargePower / CONSTANTS.MAX_CHARGE);
      } else if (player.vy !== 0 || player.vx !== 0) {
        player.y += player.vy;
        player.x += player.vx;
        player.vy += CONSTANTS.GRAVITY;

        gameData.current.targetCameraX = Math.max(0, player.x - 180);
        gameData.current.cameraX += (gameData.current.targetCameraX - gameData.current.cameraX) * 0.08;

        if (player.vy > 0) {
          let landedOn: Platform | null = null;
          let landedIndex = -1;

          for (let i = 0; i < platforms.length; i += 1) {
            const p = platforms[i];
            const allowAdjacentOnly =
              i === gameData.current.currentPlatformIndex ||
              i === gameData.current.currentPlatformIndex + 1;
            // Only adjacent boards can be landed on during normal jumps.
            // Special states (e.g. flight trigger) can temporarily bypass this.
            if (!gameData.current.allowWideLanding && !allowAdjacentOnly) continue;

            if (
              player.x > p.x - 10 &&
              player.x < p.x + p.width + 10 &&
              player.y >= p.y - 15 &&
              player.y <= p.y + p.height + player.vy
            ) {
              landedOn = p;
              landedIndex = i;
              break;
            }
          }

          if (landedOn) {
            const impact = Math.abs(player.vy);
            gameData.current.landingType = impact > 8 ? "stumble" : "steady";
            gameData.current.landingTimer = 8;

            player.y = landedOn.y;
            player.vy = 0;
            player.vx = 0;
            gameData.current.playerState = "landing";

            createParticles(player.x, player.y + 4, impact > 8 ? 18 : 10, "#cbd5e1", impact > 8 ? 1.4 : 1);
            playSound("land");

            const platIndex = landedIndex;
            gameData.current.currentPlatformIndex = platIndex;
            gameData.current.allowWideLanding = false;
            if (platIndex > scoreRef.current) {
              setScore(platIndex);
              playSound("score");
            }

            if (landedOn.isFlightTrigger && platIndex < CONSTANTS.LEVEL_LENGTH - 1) {
              gameData.current.playerState = "flying";
              gameData.current.flightTimer = 42;
              gameData.current.allowWideLanding = true;
              player.vx = 8.2;
              player.vy = -0.5;
              createParticles(player.x, player.y, 16, "#fde047", 1.3);
            }

            if (platIndex === CONSTANTS.LEVEL_LENGTH - 1 && !victoryTriggeredRef.current) {
              victoryTriggeredRef.current = true;
              gameStateRef.current = "victory";
              setGameState("victory");
              playSound("victory");
              window.setTimeout(() => onComplete(), 500);
            }
          }
        }

        if (player.y > 500) {
          gameStateRef.current = "gameover";
          setGameState("gameover");
          playSound("fail");
        }
      } else {
        gameData.current.targetCameraX = Math.max(0, player.x - 180);
        gameData.current.cameraX += (gameData.current.targetCameraX - gameData.current.cameraX) * 0.08;
      }

      const width = CONSTANTS.WORLD_WIDTH;
      const height = CONSTANTS.WORLD_HEIGHT;
      ctx.clearRect(0, 0, width, height);

      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#eff6ff");
      sky.addColorStop(1, "#dbeafe");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      drawBackground(ctx, width, gameData.current.cameraX);
      drawSea(ctx, width, height, frame, gameData.current.cameraX);

      ctx.save();
      ctx.translate(-gameData.current.cameraX, 0);
      platforms.forEach((p, i) =>
        drawHill(
          ctx,
          p.x,
          p.y,
          p.width,
          p.height,
          p.hillHeight,
          p.curveOffset,
          i <= scoreRef.current,
          p.decoration,
          Boolean(p.isFlightTrigger),
        ),
      );
      drawSwordmaster(
        ctx,
        player.x,
        player.y,
        CONSTANTS.PLAYER_SIZE,
        player.chargePower,
        player.vy,
        gameData.current.playerState,
        frame,
      );
      drawJumpIndicator(
        ctx,
        player.x,
        player.y,
        player.vx,
        player.vy,
        player.chargePower,
        gameData.current.playerState,
        platforms,
        gameData.current.currentPlatformIndex,
        gameData.current.allowWideLanding,
      );
      drawParticles(ctx);
      ctx.restore();

      if (gameState === "playing") {
        gameData.current.animationId = requestAnimationFrame(render);
      }
    };

    gameData.current.animationId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(gameData.current.animationId);
    };
  }, [gameState, playSound, onComplete]);

  useEffect(() => {
    return () => {
      stopChargeSound();
      cancelAnimationFrame(gameData.current.animationId);
    };
  }, [stopChargeSound]);

  return (
    <div className="rounded-[24px] border border-sky-100 bg-white p-3 shadow-[0_18px_56px_rgba(15,23,42,0.12)] md:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">剑客行</h2>
          <p className="text-xs text-slate-500">长按蓄力，松开起跳，通关自动跳转后台登录</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={initGame}
            className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50"
          >
            重整旗鼓
          </button>
          <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
            进度 {score + 1}/{CONSTANTS.LEVEL_LENGTH}
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-2 md:p-3">
        <div className="relative mx-auto w-full max-w-[780px] rounded-xl border-2 border-white shadow-[0_10px_30px_rgba(15,23,42,0.12)] overflow-hidden">
          <canvas
            ref={canvasRef}
            width={CONSTANTS.WORLD_WIDTH}
            height={CONSTANTS.WORLD_HEIGHT}
            style={{ width: "100%", height: "auto", display: "block" }}
            className="bg-white shadow-inner cursor-pointer touch-none"
            onClick={() => {
              if (gameState === "ready") initGame();
            }}
            onMouseDown={handleChargeStart}
            onMouseUp={handleChargeEnd}
            onMouseLeave={handleChargeEnd}
            onTouchStart={(e) => {
              e.preventDefault();
              handleChargeStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleChargeEnd();
            }}
          />

          <AnimatePresence mode="wait">
            {gameState === "ready" ? (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={initGame}
                className="absolute inset-0 rounded-xl bg-slate-900/52 backdrop-blur-[1px] flex items-center justify-center"
              >
                <button
                  onClick={initGame}
                  className="rounded-full bg-white px-10 py-3 text-base font-extrabold text-slate-900 shadow-xl transition hover:scale-[1.03] md:px-12 md:text-lg"
                >
                  点击开始
                </button>
              </motion.div>
            ) : null}

            {gameState === "gameover" ? (
              <motion.div
                key="gameover"
                initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/82 p-4 text-white flex flex-col items-center justify-center"
            >
              <h3 className="text-3xl font-black mb-2 italic">功亏一篑</h3>
              <button
                onClick={initGame}
                  className="flex items-center gap-2 rounded-full bg-blue-500 px-7 py-3 font-bold transition hover:bg-blue-400"
                >
                  <RefreshCcw size={20} /> 重整旗鼓
                </button>
              </motion.div>
            ) : null}

            {gameState === "victory" ? (
              <motion.div
                key="victory"
                initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/72 p-4 text-white flex flex-col items-center justify-center"
            >
                <div className="flex items-center gap-2 text-3xl font-black mb-2">
                  <Trophy size={30} className="text-amber-300" /> 通关成功
                </div>
                <p className="text-sm text-slate-200">正在前往后台登录页...</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
