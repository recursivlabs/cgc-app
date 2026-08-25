"use client";

import { useEffect, useRef } from "react";

/**
 * The hero visual: many separate strands enter from the left and right,
 * each on its own path, and converge into a single bright line at the
 * centre before opening out again. Divergence at the edges, common
 * ground in the middle. Blue and violet meet and blend at the seam,
 * echoing the interlocking links in the Common Ground Campus mark.
 */
export default function HeroWeave() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const STRANDS = 40;
    const CX = 0.66; // where the strands agree, kept clear of the headline
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // How far a strand may stray from the centre line at a given x.
    // Zero at the middle, full at the edges.
    function spread(t: number) {
      const d = t - CX;
      return 1 - Math.exp(-(d * d) / (2 * 0.13 * 0.13));
    }

    function draw(time: number) {
      const cy = h / 2;
      const phase = reduced ? 0 : time / 5200;

      ctx!.clearRect(0, 0, w, h);
      ctx!.globalCompositeOperation = "lighter";

      for (let i = 0; i < STRANDS; i++) {
        const k = i / (STRANDS - 1); // 0..1 across the bundle
        const lane = (k - 0.5) * 2; // -1..1
        const reach = lane * h * 0.78; // how far out this strand sits
        const wobble = 0.6 + ((i * 37) % 11) / 11; // per-strand character
        const speed = 0.55 + ((i * 53) % 13) / 26;

        const grad = ctx!.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, "rgba(58,166,245,0)");
        grad.addColorStop(0.2, "rgba(58,166,245,0.95)");
        grad.addColorStop(CX, "rgba(214,232,255,1)");
        grad.addColorStop(0.92, "rgba(139,124,248,0.9)");
        grad.addColorStop(1, "rgba(139,124,248,0)");

        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 0.9 + (i % 4) * 0.5;
        ctx!.globalAlpha = 0.4 + (1 - Math.abs(lane)) * 0.4;

        ctx!.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const t = x / w;
          const s = spread(t);
          const drift =
            Math.sin(t * Math.PI * 2.1 * wobble + phase * speed * Math.PI * 2 + i) *
            h *
            0.075 *
            wobble;
          const y = cy + reach * s + drift * s;
          if (x === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      }

      // the seam: where every strand agrees
      ctx!.globalAlpha = 1;
      const seam = ctx!.createLinearGradient(w * (CX - 0.42), 0, w * (CX + 0.34), 0);
      seam.addColorStop(0, "rgba(58,166,245,0)");
      seam.addColorStop(0.55, "rgba(226,240,255,1)");
      seam.addColorStop(1, "rgba(139,124,248,0)");
      ctx!.strokeStyle = seam;
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.moveTo(w * (CX - 0.42), cy);
      ctx!.lineTo(w * (CX + 0.34), cy);
      ctx!.stroke();

      const gx = w * CX;
      const glow = ctx!.createRadialGradient(gx, cy, 0, gx, cy, h * 0.55);
      glow.addColorStop(0, "rgba(150,190,255,0.34)");
      glow.addColorStop(0.45, "rgba(120,150,255,0.10)");
      glow.addColorStop(1, "rgba(120,170,255,0)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, w, h);

      ctx!.globalCompositeOperation = "source-over";
    }

    function frame(time: number) {
      if (!running) return;
      draw(time);
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    resize();
    frame(0);

    const onResize = () => {
      resize();
      if (reduced) draw(0);
    };
    window.addEventListener("resize", onResize);

    // stop painting when the hero is scrolled away
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          if (!reduced) raf = requestAnimationFrame(frame);
        } else if (!entry.isIntersecting) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="hero-weave" aria-hidden="true" />;
}
