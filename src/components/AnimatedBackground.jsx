import { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './AnimatedBackground.css';

/**
 * Ambient 3D particle field — sanctioned decorative exception (DESIGN.md §6).
 * Canvas 2D with manual perspective projection. Renders on all routes EXCEPT
 * /watch/* and /komik/* (video pages + comic reader need clean backgrounds).
 *
 * Reduced-motion: draws a single static frame, no animation loop.
 * Performance: DPR capped at 2; particle count scales with viewport area;
 * rAF paused when document.hidden or route-excluded.
 */

const EXCLUDED_PREFIXES = ['/watch', '/komik'];

// Accent-tint palette — all derived from DESIGN.md §2 accent family
const PALETTE = [
  [139, 92, 246],  // --accent #8B5CF6
  [168, 142, 235],  // lighter violet tint
  [212, 197, 248],  // --accent-text #D4C5F8
  [242, 242, 247],  // --text-primary (near-white)
];

function isExcluded(pathname) {
  return EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
}

function particleCount(w, h) {
  const area = w * h;
  if (area < 400_000) return 35;
  if (area < 800_000) return 55;
  return 85;
}

function initParticles(count, w, h, focal) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const rgb = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    particles.push({
      x: (Math.random() - 0.5) * w * 2,
      y: (Math.random() - 0.5) * h * 2,
      z: focal + Math.random() * focal * 2,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.08,
      vz: 0.3 + Math.random() * 0.45,
      size: 0.5 + Math.random() * 1,
      alpha: 0.45 + Math.random() * 0.45,
      rgb,
    });
  }
  return particles;
}

function draw(ctx, particles, focal, w, h) {
  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    // Advance toward viewer
    p.z -= p.vz;
    p.x += p.vx;
    p.y += p.vy;

    // Recycle when past the camera
    if (p.z <= 1) {
      p.z = focal + Math.random() * focal * 2;
      p.x = (Math.random() - 0.5) * w * 2;
      p.y = (Math.random() - 0.5) * h * 2;
    }

    // Perspective projection
    const scale = focal / p.z;
    const sx = p.x * scale + w * 0.5;
    const sy = p.y * scale + h * 0.5;

    // Cull offscreen
    if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;

    const r = Math.min(2.5, Math.max(0.3, p.size * scale));
    const depthFade = Math.min(1, focal / p.z);
    const a = depthFade * p.alpha;

    const [cr, cg, cb] = p.rgb;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`;
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
    if (reduced) {
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
