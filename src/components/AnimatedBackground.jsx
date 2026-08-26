import { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './AnimatedBackground.css';

/**
 * Ambient 3D particle system — sanctioned decorative exception (DESIGN.md §6).
 * Canvas 2D with manual perspective projection featuring:
 * - Multiple orbital ring layers with independent rotation
 * - Fixed hue color (#8B5CF6) per DESIGN.md palette restrictions
 * - Direct orbital motion without double animation or easing
 * - ClearRect for crisp particles and subtle effect
 * - Parallax depth simulation with 3 independent layers
 *
 * Reduced-motion: draws a single static frame, no animation loop.
 * Performance: DPR capped at 2; particle count scales with viewport area;
 * rAF paused when document.hidden or route-excluded; <60fps target on mobile.
 */

const EXCLUDED_PREFIXES = ['/watch', '/komik'];

// Config: layer count, speeds, visual properties
const LAYER_CONFIG = [
  { depth: 1, speed: 0.8, radius: 0.6, particleCount: 0.8 },  // Near layer - fast, large
  { depth: 2, speed: 1.0, radius: 1.0, particleCount: 1.0 },  // Mid layer - normal
  { depth: 3, speed: 1.3, radius: 1.5, particleCount: 1.2 },  // Far layer - slow, dense
];

// Color palette: muted tints of --accent (#8B5CF6 = 256°) only per DESIGN.md §6
const DEPTH_COLOR_RANGE = {
  startHue: 256,   // Violet (#8B5CF6)
  // endHue removed — no purple/blue drift allowed
};

function isExcluded(pathname) {
  return EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
}

function particleCount(w, h) {
  const area = w * h;
  // DESIGN.md §6: "≈35 on small mobile, ≈55 tablet, ≈85 desktop, hard cap 90"
  // Total particles across all layers must respect this budget
  if (area < 400_000) return Math.round(35 / 3);        // ~12 per layer on mobile
  if (area < 800_000) return Math.round(55 / 3);        // ~18 per layer on tablet
  return Math.round(85 / 3);                            // ~28 per layer on desktop+
}

// Easing function removed — direct orbital math is sufficient and avoids jitter
// See DESIGN.md §6: ambient background must be subtle, low-visibility

// ponytail: hslaToRgb() deleted — using native ctx.fillStyle 'hsla(...)' string
//          reduces ~15 lines of dead conversion code

function initParticles(count, w, h, focal) {
  const particles = [];
  
  LAYER_CONFIG.forEach(layer => {
    const layerCount = Math.round(count * layer.particleCount);

    for (let i = 0; i < layerCount; i++) {
      // Orbital ring position
      const angle = (Math.PI * 2 / layerCount) * i + Math.random() * 0.1;
      const radius = (Math.random() * 0.5 + 0.5) * layer.radius;
      const z = focal * layer.depth;

      // Hue fixed to --accent (#8B5CF6 = 256°) per DESIGN.md §6
      // Ambient particles use muted tints of --accent only
      const hue = DEPTH_COLOR_RANGE.startHue;

      // Lightness increases as particle approaches viewer
      const lightnessRatio = 1 - layer.depth / 3;
      const lightness = 40 + (60 - 40) * lightnessRatio;
      
      particles.push({
        // Orbital position
        angle: angle,
        orbitRadius: radius,
        
        // Depth and movement
        z: z,
        vz: 0.8 + Math.random() * 0.4 * layer.speed,  // speed multiplier per layer
        
        // Rotation velocity
        angularSpeed: (0.002 + Math.random() * 0.003) * layer.speed * (Math.random() > 0.5 ? 1 : -1),
        
        // Color in HSLA
        hue: hue,
        saturation: 75 + Math.random() * 20,  // 75-95%
        lightness: lightness,
        alpha: 0.3 + Math.random() * 0.4,     // 0.3-0.7 transparency
        
        // Visual properties
        sizeBase: 0.8 + Math.random() * 1.2,  // base radius
      });
    }
  });
  
  return particles;
}

function draw(ctx, particles, focal, w, h) {
    // Clear canvas for crisp particles (subtle depth per DESIGN.md §6)
    ctx.clearRect(0, 0, w, h);

  const centerX = w * 0.5;
  const centerY = h * 0.5;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    // Orbital rotation
    p.angle += p.angularSpeed;
    
    // Direct orbital position (no double animation)
    const easedX = Math.cos(p.angle) * p.orbitRadius * w;
    const easedY = Math.sin(p.angle) * p.orbitRadius * h;

    // Move toward viewer with eased depth progression
    const originalZ = focal * 3; // base Z at farthest layer
    p.z -= p.vz;

    // Recycle when past the camera
    if (p.z <= focal * 0.5) {
      p.z = originalZ;
      p.angle = Math.random() * Math.PI * 2;
    }

    // Perspective projection
    const scale = focal / p.z;
    const sx = easedX * scale + centerX;
    const sy = easedY * scale + centerY;

    // Cull offscreen
    if (sx < -30 || sx > w + 30 || sy < -30 || sy > h + 30) continue;

    // Dynamic size based on depth (motion blur factor removed for simplicity)
    const r = Math.min(4.0, Math.max(0.8, p.sizeBase * scale));
    
    // Depth-based alpha only (no color shift per DESIGN.md)
    const depthRatio = 1 - ((p.z - focal * 0.5) / (originalZ - focal * 0.5));
    const a = Math.min(1, depthRatio * p.alpha * 1.5);

    // Use fixed hue from --accent (#8B5CF6 = 256°) only
    const currentHue = DEPTH_COLOR_RANGE.startHue;
    const currentLightness = 40 + (70 - 40) * depthRatio;

    // Use native HSLA string instead of conversion function
    ctx.fillStyle = `hsla(${currentHue}, ${p.saturation}%, ${currentLightness}%, ${a})`;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef(null);
  const focalRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const location = useLocation();
  const excluded = isExcluded(location.pathname);

  useEffect(() => {
    if (excluded) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let running = true;
    let lastW = 0;
    let lastH = 0;

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const focal = Math.min(w, h) * 0.8;
      focalRef.current = focal;
      sizeRef.current = { w, h };

      // Mobile browsers fire resize when the URL bar collapses/expands
      // (height-only deltas). Respawning all particles there causes a
      // visible field-wide jump — only reseed on real size changes.
      const heightOnlyDelta = w === lastW ? Math.abs(h - lastH) : 0;
      if (!lastW || w !== lastW || heightOnlyDelta > 150) {
        const count = particleCount(w, h);
        particlesRef.current = initParticles(count, w, h, focal);
      }
      lastW = w;
      lastH = h;
    }

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);

    // Reduced motion: draw one static frame, no loop
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced && particlesRef.current) {
      const { w, h } = sizeRef.current;
      draw(ctx, particlesRef.current, focalRef.current, w, h);
      return () => { ro.disconnect(); };
    }

    // Animation loop — pauses when hidden
    function tick() {
      if (!running) return;
      if (!document.hidden) {
        const { w, h } = sizeRef.current;
        draw(ctx, particlesRef.current, focalRef.current, w, h);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    function onVisibility() {
      if (!running) return;
      if (document.hidden) {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      } else if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      document.removeEventListener('visibilitychange', onVisibility);
      ro.disconnect();
    };
  }, [excluded]);

  if (excluded) return null;

  return (
    <div className="animated-background" aria-hidden="true">
      <canvas ref={canvasRef} className="animated-background__canvas" />
    </div>
  );
}
