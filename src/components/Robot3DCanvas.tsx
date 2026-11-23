import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type RobotMood =
  | 'tracking'
  | 'happy'
  | 'love'
  | 'laugh'
  | 'curious'
  | 'surprised'
  | 'shy'
  | 'cool'
  | 'proud'
  | 'dizzy'
  | 'scan'
  | 'wink'
  | 'excited'
  | 'dance'
  | 'radar'
  | 'wave'
  | 'overdrive'
  | 'sleep';

export type RobotSection = 'about' | 'work' | 'experience' | 'contact';

export interface Robot3DCanvasProps {
  mood: RobotMood;
  activeSection: RobotSection;
  lookRef: React.MutableRefObject<{ x: number; y: number }>;
  scrollVelocityRef: React.MutableRefObject<number>;
  isHovered: boolean;
  isDragging: boolean;
  isFastPointer: boolean;
  radarActive: boolean;
  danceActive: boolean;
  waveActive: boolean;
  roamActive: boolean;
  roamFacing: 1 | -1;
  spinCount: number;
  hopKey: number;
  showThruster: boolean;
  prefersReducedMotion: boolean;
}

const _lightChassisColor = new THREE.Color('#191A20');
const _darkChassisColor = new THREE.Color('#F3F4F6');
const _orangeBase = new THREE.Color('#FF721A');
const _orangeHot = new THREE.Color('#FFB066');

function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const hw = w / 2;
  const hh = h / 2;
  const rad = Math.min(r, hw, hh);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + rad, -hh);
  shape.lineTo(hw - rad, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + rad);
  shape.lineTo(hw, hh - rad);
  shape.quadraticCurveTo(hw, hh, hw - rad, hh);
  shape.lineTo(-hw + rad, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - rad);
  shape.lineTo(-hw, -hh + rad);
  shape.quadraticCurveTo(-hw, -hh, -hw + rad, -hh);
  return shape;
}

function createBezelFrameShape(
  outerW: number,
  outerH: number,
  outerR: number,
  innerW: number,
  innerH: number,
  innerR: number
): THREE.Shape {
  const outer = createRoundedRectShape(outerW, outerH, outerR);
  const hole = new THREE.Path();
  const hw = innerW / 2;
  const hh = innerH / 2;
  const rad = Math.min(innerR, hw, hh);
  hole.moveTo(-hw + rad, -hh);
  hole.lineTo(hw - rad, -hh);
  hole.quadraticCurveTo(hw, -hh, hw, -hh + rad);
  hole.lineTo(hw, hh - rad);
  hole.quadraticCurveTo(hw, hh, hw - rad, hh);
  hole.lineTo(-hw + rad, hh);
  hole.quadraticCurveTo(-hw, hh, -hw, hh - rad);
  hole.lineTo(-hw, -hh + rad);
  hole.quadraticCurveTo(-hw, -hh, -hw + rad, -hh);
  outer.holes.push(hole);
  return outer;
}

function createWingShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.07, -0.22);
  shape.quadraticCurveTo(0.08, -0.24, 0.1, -0.06);
  shape.lineTo(0.09, 0.16);
  shape.quadraticCurveTo(0.07, 0.25, -0.04, 0.23);
  shape.quadraticCurveTo(-0.11, 0.18, -0.1, 0.0);
  shape.quadraticCurveTo(-0.1, -0.18, -0.07, -0.22);
  return shape;
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.72);
  ctx.bezierCurveTo(
    cx - size * 1.15,
    cy + size * 0.05,
    cx - size * 0.9,
    cy - size * 0.9,
    cx,
    cy - size * 0.28
  );
  ctx.bezierCurveTo(
    cx + size * 0.9,
    cy - size * 0.9,
    cx + size * 1.15,
    cy + size * 0.05,
    cx,
    cy + size * 0.72
  );
  ctx.closePath();
  ctx.fill();
}

function drawSpiral(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  angleOffset: number
) {
  ctx.beginPath();
  const turns = 2.15;
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const theta = angleOffset + t * turns * Math.PI * 2;
    const r = t * radius;
    const px = cx + Math.cos(theta) * r;
    const py = cy + Math.sin(theta) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawVisorFace(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  mood: RobotMood,
  activeSection: RobotSection,
  lookX: number,
  lookY: number,
  blink: number,
  elapsed: number,
  isFastPointer: boolean
) {
  // Deep recessed OLED visor screen backdrop
  const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, w * 0.65);
  bgGrad.addColorStop(0, '#16161C');
  bgGrad.addColorStop(1, '#08080B');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle architectural scanline texture on visor glass
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  for (let y = 0; y < h; y += 8) {
    ctx.fillRect(0, y, w, 2);
  }

  // Subtle horizontal telemetry glint in Works section when idling
  if (activeSection === 'work' && mood === 'tracking') {
    const sweepPos = ((elapsed * 0.45) % 1) * (w + 160) - 80;
    const sweepGrad = ctx.createLinearGradient(sweepPos - 60, 0, sweepPos + 60, 0);
    sweepGrad.addColorStop(0, 'rgba(255, 114, 26, 0)');
    sweepGrad.addColorStop(0.5, 'rgba(255, 114, 26, 0.09)');
    sweepGrad.addColorStop(1, 'rgba(255, 114, 26, 0)');
    ctx.fillStyle = sweepGrad;
    ctx.fillRect(0, 0, w, h);
  }

  const staticOptics =
    mood === 'dance' ||
    mood === 'radar' ||
    mood === 'wave' ||
    mood === 'overdrive' ||
    mood === 'dizzy' ||
    mood === 'cool' ||
    mood === 'sleep';

  const gx = staticOptics ? 0 : lookX * 36;
  const gy = staticOptics ? 0 : lookY * 22;

  ctx.save();
  ctx.translate(gx, gy);

  const orange = '#FF721A';
  const brightOrange = '#FFA45B';
  ctx.fillStyle = orange;
  ctx.strokeStyle = orange;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(255, 114, 26, 0.72)';
  ctx.shadowBlur = mood === 'overdrive' ? 28 : 16;

  // Cheek blush for warm / joyful moods
  if (
    mood === 'happy' ||
    mood === 'love' ||
    mood === 'laugh' ||
    mood === 'shy' ||
    mood === 'excited' ||
    mood === 'wave'
  ) {
    ctx.save();
    ctx.fillStyle = mood === 'shy' || mood === 'love' ? 'rgba(255, 114, 26, 0.55)' : 'rgba(255, 114, 26, 0.34)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(w * 0.2, h * 0.69, 26, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.8, h * 0.69, 26, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const lx = w * 0.34;
  const rx = w * 0.66;
  const cy = h * 0.48;

  if (mood === 'overdrive') {
    const pulse = 1 + Math.sin(elapsed * 18) * 0.12;
    ctx.fillStyle = brightOrange;
    for (const ex of [lx, rx]) {
      ctx.save();
      ctx.translate(ex, cy);
      ctx.scale(pulse, pulse);
      ctx.beginPath();
      ctx.moveTo(0, -42);
      ctx.lineTo(13, -13);
      ctx.lineTo(42, 0);
      ctx.lineTo(13, 13);
      ctx.lineTo(0, 42);
      ctx.lineTo(-13, 13);
      ctx.lineTo(-42, 0);
      ctx.lineTo(-13, -13);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.72, 24, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (mood === 'dance') {
    const barCount = 5;
    const barW = 24;
    const gap = 20;
    const startX = w * 0.5 - ((barCount * barW + (barCount - 1) * gap) / 2);
    for (let i = 0; i < barCount; i++) {
      const wave = 0.45 + 0.55 * Math.abs(Math.sin(elapsed * 9 + i * 0.9));
      const bh = 36 + wave * 92;
      drawRoundedRectPath(ctx, startX + i * (barW + gap), h * 0.72 - bh, barW, bh, 12);
      ctx.fill();
    }
  } else if (mood === 'radar') {
    const p = (elapsed * 1.15) % 1;
    ctx.lineWidth = 10;
    for (let ring = 0; ring < 2; ring++) {
      const rp = (p + ring * 0.5) % 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - rp);
      ctx.beginPath();
      ctx.arc(w * 0.5, cy, 24 + rp * 86, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(w * 0.5, cy, 18, 0, Math.PI * 2);
    ctx.fill();
  } else if (mood === 'love') {
    const beat = 1 + Math.sin(elapsed * 7) * 0.08;
    for (const ex of [lx, rx]) {
      ctx.save();
      ctx.translate(ex, cy);
      ctx.scale(beat, beat);
      drawHeart(ctx, 0, 0, 38);
      ctx.restore();
    }
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.7, 20, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (mood === 'laugh') {
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(lx - 26, cy - 22);
    ctx.lineTo(lx + 18, cy);
    ctx.lineTo(lx - 26, cy + 22);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rx + 26, cy - 22);
    ctx.lineTo(rx - 18, cy);
    ctx.lineTo(rx + 26, cy + 22);
    ctx.stroke();

    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.66, 26, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  } else if (mood === 'shy') {
    ctx.lineWidth = 14;
    for (const ex of [lx, rx]) {
      ctx.beginPath();
      ctx.arc(ex, cy + 8, 28, 1.15 * Math.PI, 1.85 * Math.PI);
      ctx.stroke();
    }
    // Diagonal shy blush strokes
    ctx.lineWidth = 8;
    for (const bx of [w * 0.19, w * 0.77]) {
      ctx.beginPath();
      ctx.moveTo(bx - 12, h * 0.73);
      ctx.lineTo(bx + 2, h * 0.63);
      ctx.moveTo(bx + 4, h * 0.73);
      ctx.lineTo(bx + 18, h * 0.63);
      ctx.stroke();
    }
  } else if (mood === 'cool') {
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(w * 0.21, cy - 24);
    ctx.lineTo(w * 0.79, cy - 24);
    ctx.stroke();

    // Angular shades lenses
    for (const side of [-1, 1]) {
      const cx = side < 0 ? lx + 6 : rx - 6;
      ctx.beginPath();
      ctx.moveTo(cx - 46, cy - 24);
      ctx.lineTo(cx + 46, cy - 24);
      ctx.lineTo(cx + 38, cy + 26);
      ctx.lineTo(cx - 38, cy + 26);
      ctx.closePath();
      ctx.fill();

      // Glint slash inside lens
      ctx.save();
      ctx.strokeStyle = '#0D0D12';
      ctx.shadowBlur = 0;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy - 10);
      ctx.lineTo(cx - 2, cy + 12);
      ctx.stroke();
      ctx.restore();
    }

    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.74);
    ctx.quadraticCurveTo(w * 0.53, h * 0.79, w * 0.6, h * 0.69);
    ctx.stroke();
  } else if (mood === 'proud') {
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(lx - 26, cy - 42);
    ctx.lineTo(lx + 24, cy - 28);
    ctx.moveTo(rx + 26, cy - 42);
    ctx.lineTo(rx - 24, cy - 28);
    ctx.stroke();

    drawRoundedRectPath(ctx, lx - 18, cy - 16, 36, 46, 18);
    ctx.fill();
    drawRoundedRectPath(ctx, rx - 18, cy - 16, 36, 46, 18);
    ctx.fill();

    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.7, 22, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (mood === 'dizzy') {
    ctx.lineWidth = 11;
    drawSpiral(ctx, lx, cy, 34, elapsed * 6);
    drawSpiral(ctx, rx, cy, 34, -elapsed * 6);
  } else if (mood === 'sleep') {
    ctx.lineWidth = 16;
    ctx.globalAlpha = 0.78;
    ctx.beginPath();
    ctx.moveTo(lx - 26, cy + 4);
    ctx.lineTo(lx + 26, cy + 4);
    ctx.moveTo(rx - 26, cy + 4);
    ctx.lineTo(rx + 26, cy + 4);
    ctx.stroke();
  } else if (mood === 'happy' || mood === 'wave') {
    ctx.lineWidth = 17;
    for (const ex of [lx, rx]) {
      ctx.beginPath();
      ctx.arc(ex, cy + 12, 28, 1.12 * Math.PI, 1.88 * Math.PI);
      ctx.stroke();
    }
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.69, 20, 0.16 * Math.PI, 0.84 * Math.PI);
    ctx.stroke();
  } else if (mood === 'excited' || mood === 'surprised' || isFastPointer) {
    const eyeRadius = mood === 'surprised' ? 32 : 29;
    ctx.beginPath();
    ctx.arc(lx, cy, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rx, cy, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    if (mood === 'surprised') {
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.73, 14, 17, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.69, 21, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  } else if (mood === 'wink') {
    drawRoundedRectPath(ctx, lx - 19, cy - 30, 38, 60, 19);
    ctx.fill();

    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(rx, cy + 10, 26, 1.14 * Math.PI, 1.86 * Math.PI);
    ctx.stroke();

    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.73);
    ctx.quadraticCurveTo(w * 0.53, h * 0.78, w * 0.59, h * 0.69);
    ctx.stroke();
  } else if (mood === 'scan') {
    const beamX = w * 0.5 + Math.sin(elapsed * 4.5) * 34;
    const scaleW = 165 + Math.sin(elapsed * 4.5) * 28;
    drawRoundedRectPath(ctx, beamX - scaleW / 2, cy - 13, scaleW, 26, 13);
    ctx.fill();
  } else if (mood === 'curious') {
    ctx.beginPath();
    ctx.arc(lx, cy, 29, 0, Math.PI * 2);
    ctx.fill();
    drawRoundedRectPath(ctx, rx - 28, cy - 12, 56, 24, 12);
    ctx.fill();
  } else {
    // Default live tracking eyes with natural smooth blink
    const eyeH = Math.max(10, 62 * (1 - blink));
    const eyeY = cy - eyeH / 2;
    drawRoundedRectPath(ctx, lx - 19, eyeY, 38, eyeH, Math.min(19, eyeH / 2));
    ctx.fill();
    drawRoundedRectPath(ctx, rx - 19, eyeY, 38, eyeH, Math.min(19, eyeH / 2));
    ctx.fill();

    if (blink < 0.35) {
      ctx.save();
      ctx.fillStyle = '#FFF3E6';
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.75 * (1 - blink);
      ctx.beginPath();
      ctx.arc(lx - 7, eyeY + 14, 5, 0, Math.PI * 2);
      ctx.arc(rx - 7, eyeY + 14, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

export const Robot3DCanvas: React.FC<Robot3DCanvasProps> = ({
  mood,
  activeSection,
  lookRef,
  scrollVelocityRef,
  isHovered,
  isDragging,
  isFastPointer,
  radarActive,
  danceActive,
  waveActive,
  roamActive,
  roamFacing,
  spinCount,
  hopKey,
  showThruster,
  prefersReducedMotion,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const liveStateRef = useRef({
    mood,
    activeSection,
    isHovered,
    isDragging,
    isFastPointer,
    radarActive,
    danceActive,
    waveActive,
    roamActive,
    roamFacing,
    spinCount,
    hopKey,
    showThruster,
    prefersReducedMotion,
  });

  liveStateRef.current = {
    mood,
    activeSection,
    isHovered,
    isDragging,
    isFastPointer,
    radarActive,
    danceActive,
    waveActive,
    roamActive,
    roamFacing,
    spinCount,
    hopKey,
    showThruster,
    prefersReducedMotion,
  };

  const renderDirtyTriggerRef = useRef<(() => void) | null>(null);

  // Trigger a redraw in reduced-motion mode whenever state updates
  useEffect(() => {
    renderDirtyTriggerRef.current?.();
  }, [
    mood,
    activeSection,
    isHovered,
    isDragging,
    isFastPointer,
    radarActive,
    danceActive,
    waveActive,
    roamActive,
    roamFacing,
    spinCount,
    hopKey,
    showThruster,
    prefersReducedMotion,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || typeof window === 'undefined') return;

    const width = container.clientWidth || 96;
    const height = container.clientHeight || 108;

    // Software WebGL detection from GPU renderer string
    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 30);
    camera.position.set(0, 0.06, 4.45);
    camera.lookAt(0, 0.04, 0);

    // Mandatory studio environment reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // Balanced 3-point warm/cool studio lighting rig
    const hemiLight = new THREE.HemisphereLight('#DBEAFE', '#4B2B1B', 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#FFF5EB', 2.2);
    keyLight.position.set(2.8, 3.8, 4.2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#93C5FD', 1.35);
    rimLight.position.set(-3.2, 2.2, -3.0);
    scene.add(rimLight);

    const underFillLight = new THREE.PointLight('#FF721A', 1.1, 6, 2);
    underFillLight.position.set(0, -1.6, 1.4);
    scene.add(underFillLight);

    // Procedural dynamic OLED Visor CanvasTexture
    const visorCanvas = document.createElement('canvas');
    visorCanvas.width = 512;
    visorCanvas.height = 320;
    const visorCtx = visorCanvas.getContext('2d');
    const visorTexture = new THREE.CanvasTexture(visorCanvas);
    visorTexture.colorSpace = THREE.SRGBColorSpace;
    visorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // PBR Materials with distinct roughness & metalness contrast
    const isInitiallyDark = document.documentElement.classList.contains('dark');
    const chassisMat = new THREE.MeshPhysicalMaterial({
      color: (isInitiallyDark ? _darkChassisColor : _lightChassisColor).clone(),
      roughness: isInitiallyDark ? 0.3 : 0.36,
      metalness: isInitiallyDark ? 0.18 : 0.34,
      clearcoat: 0.65,
      clearcoatRoughness: 0.2,
    });

    const metalTrimMat = new THREE.MeshStandardMaterial({
      color: '#9BA2AE',
      roughness: 0.2,
      metalness: 0.88,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: '#FF721A',
      roughness: 0.32,
      metalness: 0.42,
      emissive: '#FF721A',
      emissiveIntensity: 0.15,
    });

    const visorBezelMat = new THREE.MeshStandardMaterial({
      color: '#101015',
      roughness: 0.48,
      metalness: 0.25,
    });

    const visorDisplayMat = new THREE.MeshPhysicalMaterial({
      color: '#0B0B10',
      map: visorTexture,
      emissive: '#FFFFFF',
      emissiveMap: visorTexture,
      emissiveIntensity: 1.35,
      roughness: 0.12,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const coreGlowMat = new THREE.MeshStandardMaterial({
      color: '#FF721A',
      emissive: '#FF721A',
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0.1,
    });

    const thrusterMat = new THREE.MeshBasicMaterial({
      color: '#FF8A38',
      transparent: true,
      opacity: 0.88,
    });

    const disposables: Array<{ dispose: () => void }> = [
      chassisMat,
      metalTrimMat,
      accentMat,
      visorBezelMat,
      visorDisplayMat,
      coreGlowMat,
      thrusterMat,
      visorTexture,
    ];

    // Root Robot Hierarchy
    const robotRoot = new THREE.Group();
    scene.add(robotRoot);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.2, 0);
    robotRoot.add(headPivot);

    // 1. Primary Head Shell (ExtrudeGeometry with smooth bevels)
    const headShape = createRoundedRectShape(1.16, 0.86, 0.28);
    const headGeo = new THREE.ExtrudeGeometry(headShape, {
      depth: 0.56,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.12,
      bevelSegments: 6,
      curveSegments: 16,
    });
    headGeo.translate(0, 0, -0.28);
    headGeo.computeVertexNormals();
    disposables.push(headGeo);
    const headMesh = new THREE.Mesh(headGeo, chassisMat);
    headPivot.add(headMesh);

    // 2. Front Recessed Visor Bezel Frame
    const bezelShape = createBezelFrameShape(1.06, 0.68, 0.2, 0.94, 0.56, 0.15);
    const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.02,
      bevelSegments: 3,
      curveSegments: 16,
    });
    bezelGeo.translate(0, 0, 0.37);
    disposables.push(bezelGeo);
    const bezelMesh = new THREE.Mesh(bezelGeo, visorBezelMat);
    headPivot.add(bezelMesh);

    // 3. Glossy OLED Visor Faceplate
    const visorGeo = new THREE.PlaneGeometry(0.96, 0.58, 12, 1);
    // Subtle convex curvature along X for authentic 3D visor depth
    const vPos = visorGeo.attributes.position;
    for (let i = 0; i < vPos.count; i++) {
      const vx = vPos.getX(i);
      const curveZ = Math.cos((vx / 0.48) * (Math.PI / 2)) * 0.045;
      vPos.setZ(i, curveZ);
    }
    visorGeo.computeVertexNormals();
    disposables.push(visorGeo);
    const visorMesh = new THREE.Mesh(visorGeo, visorDisplayMat);
    visorMesh.position.set(0, 0, 0.405);
    headPivot.add(visorMesh);

    // 4. Metallic Ear Hub Collars
    const earGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.09, 20);
    earGeo.rotateZ(Math.PI / 2);
    disposables.push(earGeo);
    const leftEar = new THREE.Mesh(earGeo, metalTrimMat);
    leftEar.position.set(-0.71, 0, 0);
    headPivot.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, metalTrimMat);
    rightEar.position.set(0.71, 0, 0);
    headPivot.add(rightEar);

    // 5. Top Precision Antenna Mast + Signal Beacon + Halo
    const collarGeo = new THREE.CylinderGeometry(0.1, 0.13, 0.06, 20);
    disposables.push(collarGeo);
    const antennaCollar = new THREE.Mesh(collarGeo, metalTrimMat);
    antennaCollar.position.set(0, 0.58, 0);
    headPivot.add(antennaCollar);

    const antennaPivot = new THREE.Group();
    antennaPivot.position.set(0, 0.6, 0);
    headPivot.add(antennaPivot);

    const mastGeo = new THREE.CylinderGeometry(0.025, 0.036, 0.28, 14);
    mastGeo.translate(0, 0.14, 0);
    disposables.push(mastGeo);
    const mastMesh = new THREE.Mesh(mastGeo, metalTrimMat);
    antennaPivot.add(mastMesh);

    const orbGeo = new THREE.SphereGeometry(0.088, 20, 20);
    disposables.push(orbGeo);
    const antennaOrb = new THREE.Mesh(orbGeo, coreGlowMat);
    antennaOrb.position.set(0, 0.31, 0);
    antennaPivot.add(antennaOrb);

    const antennaHaloGeo = new THREE.TorusGeometry(0.14, 0.014, 10, 28);
    disposables.push(antennaHaloGeo);
    const antennaHalo = new THREE.Mesh(antennaHaloGeo, accentMat);
    antennaHalo.position.set(0, 0.31, 0);
    antennaHalo.rotation.x = Math.PI / 2.4;
    antennaPivot.add(antennaHalo);

    // 6. Articulated Stabilizer Wings / Arms
    const wingGeo = new THREE.ExtrudeGeometry(createWingShape(), {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 12,
    });
    wingGeo.translate(0, 0, -0.07);
    disposables.push(wingGeo);

    const jointBallGeo = new THREE.SphereGeometry(0.085, 16, 16);
    disposables.push(jointBallGeo);

    const leftWingPivot = new THREE.Group();
    leftWingPivot.position.set(-0.79, -0.02, 0.02);
    headPivot.add(leftWingPivot);
    const leftJoint = new THREE.Mesh(jointBallGeo, metalTrimMat);
    leftWingPivot.add(leftJoint);
    const leftWingMesh = new THREE.Mesh(wingGeo, accentMat);
    leftWingMesh.position.set(-0.08, -0.02, 0);
    leftWingPivot.add(leftWingMesh);

    const rightWingPivot = new THREE.Group();
    rightWingPivot.position.set(0.79, -0.02, 0.02);
    headPivot.add(rightWingPivot);
    const rightJoint = new THREE.Mesh(jointBallGeo, metalTrimMat);
    rightWingPivot.add(rightJoint);
    const rightWingMesh = new THREE.Mesh(wingGeo, accentMat);
    rightWingMesh.scale.x = -1;
    rightWingMesh.position.set(0.08, -0.02, 0);
    rightWingPivot.add(rightWingMesh);

    // 7. Neck Collar + Sculpted Lathe Torso Pod + Reactor Core + Thruster
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, -0.42, 0);
    robotRoot.add(torsoGroup);

    const neckGeo = new THREE.TorusGeometry(0.24, 0.045, 12, 28);
    neckGeo.rotateX(Math.PI / 2);
    disposables.push(neckGeo);
    const neckMesh = new THREE.Mesh(neckGeo, metalTrimMat);
    neckMesh.position.set(0, 0.12, 0);
    torsoGroup.add(neckMesh);

    const torsoProfile = [
      new THREE.Vector2(0.0, -0.34),
      new THREE.Vector2(0.18, -0.34),
      new THREE.Vector2(0.32, -0.24),
      new THREE.Vector2(0.42, -0.08),
      new THREE.Vector2(0.38, 0.06),
      new THREE.Vector2(0.22, 0.12),
      new THREE.Vector2(0.0, 0.12),
    ];
    const torsoGeo = new THREE.LatheGeometry(torsoProfile, 28);
    disposables.push(torsoGeo);
    const torsoMesh = new THREE.Mesh(torsoGeo, chassisMat);
    torsoGroup.add(torsoMesh);

    const chestBezelGeo = new THREE.TorusGeometry(0.12, 0.022, 10, 24);
    disposables.push(chestBezelGeo);
    const chestBezel = new THREE.Mesh(chestBezelGeo, metalTrimMat);
    chestBezel.position.set(0, -0.1, 0.39);
    torsoGroup.add(chestBezel);

    const chestCoreGeo = new THREE.SphereGeometry(0.082, 18, 18);
    disposables.push(chestCoreGeo);
    const chestCore = new THREE.Mesh(chestCoreGeo, coreGlowMat);
    chestCore.position.set(0, -0.1, 0.38);
    chestCore.scale.z = 0.55;
    torsoGroup.add(chestCore);

    const nozzleGeo = new THREE.CylinderGeometry(0.17, 0.24, 0.11, 20);
    disposables.push(nozzleGeo);
    const nozzleMesh = new THREE.Mesh(nozzleGeo, metalTrimMat);
    nozzleMesh.position.set(0, -0.37, 0);
    torsoGroup.add(nozzleMesh);

    const plumeGeo = new THREE.ConeGeometry(0.16, 0.42, 18);
    plumeGeo.rotateX(Math.PI);
    plumeGeo.translate(0, -0.21, 0);
    disposables.push(plumeGeo);
    const thrusterPlume = new THREE.Mesh(plumeGeo, thrusterMat);
    thrusterPlume.position.set(0, -0.4, 0);
    thrusterPlume.visible = false;
    torsoGroup.add(thrusterPlume);

    // 8. Orbiting Calibration Gimbal Torus + Instanced Calibration Nodes
    const orbitalPivot = new THREE.Group();
    orbitalPivot.position.set(0, 0.1, -0.08);
    orbitalPivot.rotation.set(0.38, 0.12, -0.22);
    robotRoot.add(orbitalPivot);

    const orbitRingGeo = new THREE.TorusGeometry(1.16, 0.015, 10, 64);
    disposables.push(orbitRingGeo);
    const orbitRingMesh = new THREE.Mesh(orbitRingGeo, accentMat);
    orbitalPivot.add(orbitRingMesh);

    const nodeGeo = new THREE.SphereGeometry(0.042, 12, 12);
    disposables.push(nodeGeo);
    const orbitNodes = new THREE.InstancedMesh(nodeGeo, coreGlowMat, 4);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      dummy.position.set(Math.cos(ang) * 1.16, Math.sin(ang) * 1.16, 0);
      dummy.scale.setScalar(i % 2 === 0 ? 1.1 : 0.78);
      dummy.updateMatrix();
      orbitNodes.setMatrixAt(i, dummy.matrix);
    }
    orbitNodes.instanceMatrix.needsUpdate = true;
    orbitNodes.computeBoundingSphere();
    disposables.push(orbitNodes);
    orbitalPivot.add(orbitNodes);

    // Pre-warm shaders on hardware GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Track theme switches dynamically
    let isDarkTheme = isInitiallyDark;
    const themeObserver = new MutationObserver(() => {
      isDarkTheme = document.documentElement.classList.contains('dark');
      renderDirtyTriggerRef.current?.();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // ResizeObserver for crisp layout transitions
    const handleResize = () => {
      const w = container.clientWidth || 96;
      const h = container.clientHeight || 108;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      renderDirtyTriggerRef.current?.();
    };
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(container);

    // Animation & Damping State
    const clock = new THREE.Clock();
    let smoothYaw = 0;
    let smoothPitch = 0;
    let smoothScrollVel = 0;
    let currentSpinY = 0;
    let lastHopKey = liveStateRef.current.hopKey;
    let lastSection: RobotSection = liveStateRef.current.activeSection;
    let hopImpulse = 0;
    let sectionPerkImpulse = 0;
    let blinkTimer = 2.8;
    let blinkAmount = 0;
    let lastVisorDrawTime = -1;
    let frameId = 0;
    let disposed = false;

    const updateFrame = (dt: number, elapsed: number) => {
      const s = liveStateRef.current;

      // Smoothly transition Light/Dark mode chassis color & roughness
      const targetColor = isDarkTheme ? _darkChassisColor : _lightChassisColor;
      chassisMat.color.lerp(targetColor, s.prefersReducedMotion ? 1 : Math.min(1, dt * 10));
      chassisMat.roughness = THREE.MathUtils.damp(
        chassisMat.roughness,
        isDarkTheme ? 0.3 : 0.36,
        10,
        dt
      );
      chassisMat.metalness = THREE.MathUtils.damp(
        chassisMat.metalness,
        isDarkTheme ? 0.18 : 0.34,
        10,
        dt
      );

      // Detect hop pulse & section-change micro-perk
      if (s.hopKey !== lastHopKey) {
        lastHopKey = s.hopKey;
        if (!s.prefersReducedMotion) hopImpulse = 1;
      }
      if (s.activeSection !== lastSection) {
        lastSection = s.activeSection;
        if (!s.prefersReducedMotion) sectionPerkImpulse = 1;
      }
      hopImpulse = Math.max(0, hopImpulse - dt * 3.2);
      sectionPerkImpulse = Math.max(0, sectionPerkImpulse - dt * 2.1);
      const hopArc = Math.sin(hopImpulse * Math.PI);
      const perkArc = Math.sin(sectionPerkImpulse * Math.PI);

      // Smooth scroll velocity telemetry for kinetic banking & thruster ignition
      const rawScrollVel = s.prefersReducedMotion ? 0 : scrollVelocityRef.current;
      smoothScrollVel = THREE.MathUtils.damp(smoothScrollVel, rawScrollVel, 9, dt);
      const absScrollVel = Math.abs(smoothScrollVel);

      // Section-based subtle idle motion choreography (when calm/tracking)
      const isCalmIdle =
        !s.prefersReducedMotion &&
        !s.isDragging &&
        !s.danceActive &&
        !s.radarActive &&
        !s.waveActive &&
        s.mood !== 'sleep' &&
        s.mood !== 'overdrive' &&
        s.mood !== 'dizzy';

      let idleYaw = 0;
      let idlePitch = 0;
      let idleRoll = 0;
      let idleFloatX = 0;
      let idleFloatY = 0;
      let idleZoomZ = 0;
      let sectionWingLeft = 0;
      let sectionWingRight = 0;
      let sectionOrbitSpeed = 0.65;
      let sectionOrbitTilt = 0.38;
      let sectionCorePulse = 1.45 + Math.sin(elapsed * 3) * 0.2;

      if (isCalmIdle) {
        if (s.activeSection === 'about') {
          // Friendly inquisitive hover + periodic curious peek & wing perk
          const peekPhase = elapsed % 5.4;
          const peekBurst = peekPhase < 1.3 ? Math.sin((peekPhase / 1.3) * Math.PI) : 0;
          idleYaw = Math.sin(elapsed * 0.75) * 0.08;
          idlePitch = -peekBurst * 0.07;
          idleRoll = peekBurst * 0.12 + Math.sin(elapsed * 1.1) * 0.035;
          idleFloatX = Math.sin(elapsed * 1.25) * 0.045;
          idleFloatY = Math.sin(elapsed * 2.1) * 0.065;
          sectionWingLeft = peekBurst * 0.22;
          sectionWingRight = -peekBurst * 0.22;
          sectionOrbitSpeed = 0.72;
        } else if (s.activeSection === 'work') {
          // Focused scout posture: smooth analytical scan sweep & alert wing flare
          idleYaw = Math.sin(elapsed * 1.15) * 0.2;
          idlePitch = Math.sin(elapsed * 2.3) * 0.04 + 0.03;
          idleRoll = -idleYaw * 0.25;
          idleFloatY = Math.sin(elapsed * 2.5) * 0.055;
          sectionWingLeft = 0.14 + Math.sin(elapsed * 3.1) * 0.05;
          sectionWingRight = -0.14 - Math.sin(elapsed * 3.1) * 0.05;
          sectionOrbitSpeed = 1.25;
          sectionOrbitTilt = 0.54;
          sectionCorePulse = 1.65 + Math.sin(elapsed * 4.4) * 0.28;
        } else if (s.activeSection === 'experience') {
          // Poised rhythmic nod cadence + balanced stabilizer trim
          const nodCycle = elapsed % 4.2;
          const doubleNod = nodCycle < 0.9 ? Math.sin((nodCycle / 0.9) * Math.PI * 2) * 0.11 : 0;
          idlePitch = doubleNod;
          idleYaw = Math.sin(elapsed * 0.65) * 0.06;
          idleRoll = Math.sin(elapsed * 1.6) * 0.045;
          idleFloatY = Math.sin(elapsed * 2.8) * 0.06 + 0.03;
          sectionWingLeft = Math.sin(elapsed * 2.8) * 0.12;
          sectionWingRight = Math.sin(elapsed * 2.8) * 0.12;
          sectionOrbitSpeed = 0.95;
          sectionOrbitTilt = 0.34 + Math.sin(elapsed * 1.4) * 0.16;
          sectionCorePulse = 1.55 + Math.abs(Math.sin(elapsed * 2.8)) * 0.32;
        } else if (s.activeSection === 'contact') {
          // Warm inviting lean + periodic friendly right-wing mini-wave + heartbeat glow
          const waveCycle = elapsed % 4.4;
          const waveWindow =
            waveCycle < 1.35 ? Math.sin((waveCycle / 1.35) * Math.PI) : 0;
          idleYaw = -0.05 + Math.sin(elapsed * 0.9) * 0.06;
          idlePitch = -0.04 + Math.sin(elapsed * 2.2) * 0.03;
          idleRoll = waveWindow * 0.08;
          idleFloatY = Math.sin(elapsed * 2.4) * 0.07;
          idleZoomZ = 0.09 + waveWindow * 0.05;
          sectionWingLeft = 0.06;
          sectionWingRight =
            -0.08 + waveWindow * (0.52 + Math.sin(elapsed * 13) * 0.28);
          sectionOrbitSpeed = 0.85;
          const hb = Math.pow(Math.max(0, Math.sin(elapsed * 3.1)), 6);
          sectionCorePulse = 1.4 + hb * 0.9;
        }
      }

      // Smooth cursor tracking blended smoothly with section idle posture
      const lx = s.prefersReducedMotion || s.mood === 'sleep' ? 0 : lookRef.current.x;
      const ly = s.prefersReducedMotion || s.mood === 'sleep' ? 0 : lookRef.current.y;
      const cursorActivity = Math.min(1, Math.hypot(lx, ly) * 1.45);
      const idleBlend = 1 - cursorActivity * 0.65;

      const targetYaw =
        lx * 0.48 +
        idleYaw * idleBlend +
        (s.roamActive ? s.roamFacing * 0.2 : 0);
      const targetPitch =
        ly * 0.28 +
        idlePitch * idleBlend +
        smoothScrollVel * 0.14 +
        (s.mood === 'sleep' ? 0.24 : 0);

      smoothYaw = THREE.MathUtils.damp(smoothYaw, targetYaw, 10, dt);
      smoothPitch = THREE.MathUtils.damp(smoothPitch, targetPitch, 10, dt);

      headPivot.rotation.y = smoothYaw;
      headPivot.rotation.x = smoothPitch;
      headPivot.rotation.z = THREE.MathUtils.damp(
        headPivot.rotation.z,
        s.mood === 'curious'
          ? 0.2
          : s.mood === 'shy'
            ? -0.12
            : idleRoll * idleBlend - smoothYaw * 0.18,
        8,
        dt
      );

      // Torso follow-through & scroll kinetic banking
      torsoGroup.rotation.y = THREE.MathUtils.damp(torsoGroup.rotation.y, smoothYaw * 0.42, 8, dt);
      torsoGroup.rotation.x = THREE.MathUtils.damp(
        torsoGroup.rotation.x,
        smoothPitch * 0.32 + smoothScrollVel * 0.22,
        9,
        dt
      );
      torsoGroup.rotation.z = THREE.MathUtils.damp(
        torsoGroup.rotation.z,
        -smoothYaw * 0.18,
        8,
        dt
      );

      // Root levitation, hover depth lean, dance bounce, spin & squash/stretch
      const floatY = s.prefersReducedMotion
        ? 0
        : s.danceActive
          ? Math.abs(Math.sin(elapsed * 8.2)) * 0.16
          : s.mood === 'sleep'
            ? Math.sin(elapsed * 1.4) * 0.03
            : isCalmIdle
              ? idleFloatY
              : Math.sin(elapsed * 2.1) * 0.065;

      robotRoot.position.y = floatY + hopArc * 0.22 + perkArc * 0.11;
      robotRoot.position.x = THREE.MathUtils.damp(
        robotRoot.position.x,
        s.prefersReducedMotion ? 0 : smoothYaw * 0.14 + idleFloatX,
        8,
        dt
      );
      robotRoot.position.z = THREE.MathUtils.damp(
        robotRoot.position.z,
        s.prefersReducedMotion
          ? 0
          : (s.isHovered ? 0.15 : 0) + idleZoomZ + absScrollVel * 0.08,
        8,
        dt
      );

      const targetSpin = s.prefersReducedMotion ? 0 : s.spinCount * Math.PI * 2;
      currentSpinY = THREE.MathUtils.damp(currentSpinY, targetSpin, 7, dt);
      const danceTwist = s.danceActive && !s.prefersReducedMotion ? Math.sin(elapsed * 8.2) * 0.24 : 0;
      const dizzySway = s.mood === 'dizzy' && !s.prefersReducedMotion ? Math.sin(elapsed * 10) * 0.18 : 0;
      robotRoot.rotation.y = currentSpinY + danceTwist;
      robotRoot.rotation.z =
        dizzySway +
        (s.danceActive && !s.prefersReducedMotion ? Math.cos(elapsed * 8.2) * 0.12 : 0);

      const scaleBoost =
        s.mood === 'surprised' ? 1.07 : s.isHovered || s.isDragging ? 1.045 : 1.0;
      const stretchY = scaleBoost + hopArc * 0.12 + perkArc * 0.06;
      const squashXZ = scaleBoost - hopArc * 0.06 - perkArc * 0.03;
      robotRoot.scale.x = THREE.MathUtils.damp(robotRoot.scale.x, squashXZ, 12, dt);
      robotRoot.scale.y = THREE.MathUtils.damp(robotRoot.scale.y, stretchY, 12, dt);
      robotRoot.scale.z = THREE.MathUtils.damp(robotRoot.scale.z, squashXZ, 12, dt);

      // Wing articulations (Wave, Dance, Drag, Fast pointer, Scroll sweep, Section idle, Cursor counter-balance)
      const scrollWingSweep = absScrollVel * 0.34;
      let targetLeftWingZ =
        Math.sin(elapsed * 2.2) * 0.05 + sectionWingLeft + perkArc * 0.24 + scrollWingSweep;
      let targetRightWingZ =
        -Math.sin(elapsed * 2.2) * 0.05 + sectionWingRight - perkArc * 0.24 - scrollWingSweep;
      let targetLeftWingX = smoothPitch * 0.3 + smoothScrollVel * 0.28;
      let targetRightWingX = smoothPitch * 0.3 + smoothScrollVel * 0.28;

      if (!s.prefersReducedMotion) {
        if (s.waveActive || s.mood === 'wave') {
          targetRightWingZ = 0.85 + Math.sin(elapsed * 14) * 0.42;
          targetRightWingX = -0.35;
          targetLeftWingZ = -0.15;
        } else if (s.isDragging || s.danceActive || s.isFastPointer || s.mood === 'overdrive') {
          const flap = Math.sin(elapsed * 16) * 0.45;
          targetLeftWingZ = 0.25 + flap;
          targetRightWingZ = -0.25 - flap;
        } else if (s.isHovered) {
          targetLeftWingZ = 0.14 + scrollWingSweep;
          targetRightWingZ = -0.14 - Math.sin(elapsed * 6) * 0.16 - scrollWingSweep;
        } else {
          // Subtle asymmetric wing banking as robot turns toward cursor
          targetLeftWingZ += Math.max(0, smoothYaw) * 0.14;
          targetRightWingZ += Math.min(0, smoothYaw) * 0.14;
        }
      }

      leftWingPivot.rotation.z = THREE.MathUtils.damp(leftWingPivot.rotation.z, targetLeftWingZ, 12, dt);
      rightWingPivot.rotation.z = THREE.MathUtils.damp(rightWingPivot.rotation.z, targetRightWingZ, 12, dt);
      leftWingPivot.rotation.x = THREE.MathUtils.damp(leftWingPivot.rotation.x, targetLeftWingX, 10, dt);
      rightWingPivot.rotation.x = THREE.MathUtils.damp(rightWingPivot.rotation.x, targetRightWingX, 10, dt);

      // Antenna wobble & beacon glow
      const antennaTargetZ = s.prefersReducedMotion
        ? 0
        : s.isDragging || s.radarActive || s.waveActive || s.mood === 'overdrive'
          ? Math.sin(elapsed * 18) * 0.24
          : s.mood === 'sleep'
            ? -0.18
            : Math.sin(elapsed * 2.4) * 0.06 - smoothYaw * 0.15;
      antennaPivot.rotation.z = THREE.MathUtils.damp(antennaPivot.rotation.z, antennaTargetZ, 10, dt);
      antennaPivot.rotation.x = THREE.MathUtils.damp(
        antennaPivot.rotation.x,
        s.prefersReducedMotion ? 0 : smoothScrollVel * 0.35,
        10,
        dt
      );
      antennaHalo.rotation.z = s.prefersReducedMotion
        ? 0
        : elapsed * (s.radarActive ? 6 : 1.8 + absScrollVel * 4);

      const coreIntensity =
        s.mood === 'overdrive'
          ? 2.4 + Math.sin(elapsed * 20) * 0.6
          : s.radarActive || s.waveActive
            ? 2.0 + Math.sin(elapsed * 10) * 0.45
            : s.mood === 'sleep'
              ? 0.55
              : sectionCorePulse + absScrollVel * 0.5 + perkArc * 0.45;
      coreGlowMat.emissiveIntensity = coreIntensity;
      coreGlowMat.emissive.lerp(
        s.mood === 'overdrive' || s.activeSection === 'contact' ? _orangeHot : _orangeBase,
        0.18
      );
      underFillLight.intensity = THREE.MathUtils.damp(
        underFillLight.intensity,
        (s.activeSection === 'contact' ? 1.45 : 1.1) + absScrollVel * 0.8 + perkArc * 0.4,
        8,
        dt
      );

      // Orbital ring rotation & cursor parallax
      if (!s.prefersReducedMotion) {
        const orbitSpeed =
          s.mood === 'overdrive'
            ? 4.8
            : s.radarActive || s.waveActive
              ? 2.6
              : s.isHovered || s.isDragging
                ? 1.5
                : s.mood === 'sleep'
                  ? 0.2
                  : sectionOrbitSpeed + absScrollVel * 3.8 + perkArc * 2.2;
        orbitalPivot.rotation.z += dt * orbitSpeed;
        orbitalPivot.rotation.x = THREE.MathUtils.damp(
          orbitalPivot.rotation.x,
          sectionOrbitTilt + Math.sin(elapsed * 0.9) * 0.08 + smoothPitch * 0.25,
          8,
          dt
        );
        orbitalPivot.rotation.y = THREE.MathUtils.damp(
          orbitalPivot.rotation.y,
          0.12 + smoothYaw * 0.35,
          8,
          dt
        );
      }

      // Thruster plasma plume when active or actively scrolling
      const thrusterActive =
        s.showThruster || s.mood === 'overdrive' || s.danceActive || absScrollVel > 0.14;
      thrusterPlume.visible = thrusterActive && !s.prefersReducedMotion;
      if (thrusterPlume.visible) {
        const thrustScale =
          s.showThruster || s.mood === 'overdrive' || s.danceActive
            ? 1
            : Math.min(1.1, 0.45 + absScrollVel * 0.85);
        const flicker = (0.85 + Math.sin(elapsed * 34) * 0.28) * thrustScale;
        thrusterPlume.scale.set(0.8 + thrustScale * 0.2, flicker, 0.8 + thrustScale * 0.2);
      }

      // Natural blinking for tracking mode
      if (!s.prefersReducedMotion && s.mood === 'tracking') {
        blinkTimer -= dt;
        if (blinkTimer <= 0) {
          blinkAmount = Math.sin(((0.16 + blinkTimer) / 0.16) * Math.PI);
          if (blinkTimer <= -0.16) {
            blinkAmount = 0;
            blinkTimer = 2.4 + Math.random() * 2.8;
          }
        } else {
          blinkAmount = 0;
        }
      } else {
        blinkAmount = 0;
      }

      // Redraw procedural CanvasTexture visor face cleanly (~30fps cap on animated faces or on look change)
      if (visorCtx && (elapsed - lastVisorDrawTime > 0.028 || lastVisorDrawTime < 0)) {
        lastVisorDrawTime = elapsed;
        drawVisorFace(
          visorCtx,
          visorCanvas.width,
          visorCanvas.height,
          s.mood,
          s.activeSection,
          lx,
          ly,
          Math.max(0, Math.min(1, blinkAmount)),
          elapsed,
          s.isFastPointer
        );
        visorTexture.needsUpdate = true;
      }
    };

    // Software WebGL GPU-fence pacing helper
    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    // Coalesced on-demand renderer (used when prefersReducedMotion is enabled)
    let renderBusy = false;
    let renderDirty = false;
    const requestOnDemandRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = window.requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        updateFrame(0.016, clock.getElapsedTime());
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (renderDirty) requestOnDemandRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };

    renderDirtyTriggerRef.current = () => {
      if (liveStateRef.current.prefersReducedMotion) {
        lastVisorDrawTime = -1;
        requestOnDemandRender();
      }
    };

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(0.05, clock.getDelta());
      const elapsed = clock.getElapsedTime();

      if (liveStateRef.current.prefersReducedMotion) {
        updateFrame(dt, elapsed);
        renderer.render(scene, camera);
        return;
      }

      updateFrame(dt, elapsed);
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    // Start loop or single draw
    if (liveStateRef.current.prefersReducedMotion) {
      requestOnDemandRender();
    } else {
      frameId = window.requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      renderDirtyTriggerRef.current = null;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      themeObserver.disconnect();
      resizeObserver?.disconnect();
      envTarget.dispose();
      for (const item of disposables) {
        item.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lookRef, scrollVelocityRef]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none w-[96px] h-[108px] -mb-1 select-none"
    />
  );
};
