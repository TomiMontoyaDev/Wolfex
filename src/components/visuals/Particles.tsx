"use client";

import { useEffect, useRef } from "react";

interface ParticlesProps {
  /** Particle count on desktop; halved on small screens. Keep it low. */
  density?: number;
  className?: string;
}

/**
 * Lightweight canvas dust — slow upward drift, soft parallax to the cursor.
 * Pauses off-screen, respects reduced motion, caps DPR at 2.
 */
export function Particles({ density = 56, className }: ParticlesProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    type Dot = { x: number; y: number; z: number; r: number; vy: number; a: number; tw: number };
    let dots: Dot[] = [];

    const seed = () => {
      const count = Math.round(density * (w < 768 ? 0.5 : 1));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.3 + Math.random() * 0.7,
        r: 0.4 + Math.random() * 1.3,
        vy: 0.08 + Math.random() * 0.22,
        a: 0.15 + Math.random() * 0.55,
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      for (const d of dots) {
        if (!reduce) {
          d.y -= d.vy * d.z;
          d.tw += 0.02;
          if (d.y < -10) {
            d.y = h + 10;
            d.x = Math.random() * w;
          }
        }
        const px = d.x + mouse.x * 18 * d.z;
        const py = d.y + mouse.y * 12 * d.z;
        const alpha = d.a * (0.6 + Math.sin(d.tw) * 0.4);
        ctx.beginPath();
        ctx.fillStyle = d.z > 0.8 ? `rgba(0,168,255,${alpha})` : `rgba(245,247,250,${alpha * 0.7})`;
        ctx.arc(px, py, d.r * d.z, 0, Math.PI * 2);
        ctx.fill();
      }
      if (visible && !reduce) raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth - 0.5;
      mouse.ty = e.clientY / window.innerHeight - 0.5;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(draw);
    });

    resize();
    draw();
    io.observe(canvas);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [density]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
