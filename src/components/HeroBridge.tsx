"use client";

import { useEffect, useRef } from "react";

/**
 * The hero visual: a suspension bridge drawn in line, spanning the frame.
 * The left half is blue, the right half violet, and the two meet at the
 * middle of the span. Light crosses the deck in both directions and
 * brightens where the two crossings pass each other.
 */
export default function HeroBridge() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const c = ctx;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const PERIOD = 11000; // one crossing, in milliseconds
    const OFFSET = 0.64; // sets where the two crossings pass each other

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;

    // Layout. On a narrow screen the copy fills the width, so the deck
    // drops and the towers shorten to stay clear of it.
    let DECK = 0.7;
    let TOWER = 0.3;
    let T1 = 0.48;
    let T2 = 0.88;
    // On a wide screen the copy sits left of the span, so the bridge fades
    // in out of the dark rather than running under the headline.
    let FADE_A = 0.28;
    let FADE_B = 0.5;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const narrow = w < 760;
      DECK = narrow ? 0.82 : 0.74;
      TOWER = narrow ? 0.15 : 0.3;
      T1 = narrow ? 0.24 : 0.6;
      T2 = narrow ? 0.78 : 0.94;
      FADE_A = narrow ? 0 : 0.28;
      FADE_B = narrow ? 0.05 : 0.5;
    }

    function span() {
      const deckY = h * DECK;
      const topY = deckY - h * TOWER;
      const x1 = w * T1;
      const x2 = w * T2;
      return {
        deckY,
        topY,
        x1,
        x2,
        mid: (x1 + x2) / 2,
        sagY: deckY - h * TOWER * 0.11,
        anchorY: deckY + h * 0.15,
      };
    }

    // Height of the main cable at any point across the frame.
    function cableY(x: number) {
      const s = span();
      if (x < s.x1) {
        const t = s.x1 > 0 ? (s.x1 - x) / s.x1 : 0;
        return s.topY + (s.anchorY - s.topY) * Math.pow(t, 1.35);
      }
      if (x > s.x2) {
        const t = w > s.x2 ? (x - s.x2) / (w - s.x2) : 0;
        return s.topY + (s.anchorY - s.topY) * Math.pow(t, 1.35);
      }
      const half = (s.x2 - s.x1) / 2;
      const t = half > 0 ? (x - s.mid) / half : 0;
      return s.sagY + (s.topY - s.sagY) * t * t;
    }

    function lineGrad(alpha: number) {
      const s = span();
      const g = c.createLinearGradient(0, 0, w, 0);
      const m = Math.max(0.02, Math.min(0.98, s.mid / w));
      g.addColorStop(0, `rgba(58,166,245,0)`);
      g.addColorStop(FADE_A, `rgba(58,166,245,0)`);
      g.addColorStop(FADE_B, `rgba(58,166,245,${alpha})`);
      g.addColorStop(m, `rgba(226,240,255,${Math.min(1, alpha * 1.35)})`);
      g.addColorStop(0.97, `rgba(139,124,248,${alpha})`);
      g.addColorStop(1, `rgba(139,124,248,0)`);
      return g;
    }

    function tower(x: number, s: ReturnType<typeof span>) {
      const legs = Math.max(3, w * 0.0035);
      const footY = s.deckY + h * 0.13;
      const capY = s.topY - h * 0.018;
      c.beginPath();
      c.moveTo(x - legs, capY);
      c.lineTo(x - legs, footY);
      c.moveTo(x + legs, capY);
      c.lineTo(x + legs, footY);
      c.stroke();
      // crossbeams
      c.beginPath();
      c.moveTo(x - legs, s.topY + h * 0.012);
      c.lineTo(x + legs, s.topY + h * 0.012);
      c.moveTo(x - legs, s.deckY - h * 0.03);
      c.lineTo(x + legs, s.deckY - h * 0.03);
      c.stroke();
    }

    // A crossing: a soft length of light travelling along the deck.
    function crossing(x: number, deckY: number, color: string, fade: number) {
      const len = Math.max(60, w * 0.075);
      const g = c.createLinearGradient(x - len, 0, x + len, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, color);
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.globalAlpha = fade;
      c.strokeStyle = g;
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(x - len, deckY);
      c.lineTo(x + len, deckY);
      c.stroke();
      c.globalAlpha = 1;
    }

    function draw(time: number) {
      const s = span();
      c.clearRect(0, 0, w, h);
      c.lineCap = "round";
      c.lineJoin = "round";

      // suspenders
      c.strokeStyle = lineGrad(0.34);
      c.lineWidth = 1;
      const step = (s.x2 - s.x1) / 30;
      c.beginPath();
      for (let x = step; x < w; x += step) {
        const y = cableY(x);
        if (y < s.deckY - 3) {
          c.moveTo(x, y);
          c.lineTo(x, s.deckY);
        }
      }
      c.stroke();

      // main cable
      c.strokeStyle = lineGrad(0.92);
      c.lineWidth = 2;
      c.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = cableY(x);
        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();

      // towers
      c.strokeStyle = lineGrad(0.8);
      c.lineWidth = 1.8;
      tower(s.x1, s);
      tower(s.x2, s);

      // deck
      c.strokeStyle = lineGrad(0.95);
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(0, s.deckY);
      c.lineTo(w, s.deckY);
      c.stroke();

      c.strokeStyle = lineGrad(0.22);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, s.deckY + 5);
      c.lineTo(w, s.deckY + 5);
      c.stroke();

      // the two crossings, and the light where they pass
      const frac = reduced ? (1 - OFFSET) / 2 : (time % PERIOD) / PERIOD;
      const a = frac * w;
      const b = (1 - ((frac + OFFSET) % 1)) * w;
      const edge = (x: number) => {
        const t = x / w;
        const inLeft = FADE_B > FADE_A ? (t - FADE_A) / (FADE_B - FADE_A) : 1;
        return Math.max(0, Math.min(1, Math.min(inLeft, (1 - t) / 0.06)));
      };
      const meet = Math.max(0, 1 - Math.abs(a - b) / (w * 0.2));

      c.globalCompositeOperation = "lighter";
      const gx = s.mid;
      const glow = c.createRadialGradient(gx, s.deckY, 0, gx, s.deckY, h * 0.42);
      glow.addColorStop(0, `rgba(180,205,255,${0.1 + meet * 0.26})`);
      glow.addColorStop(0.5, `rgba(130,160,255,${0.03 + meet * 0.07})`);
      glow.addColorStop(1, "rgba(120,170,255,0)");
      c.fillStyle = glow;
      c.fillRect(0, 0, w, h);

      crossing(a, s.deckY, "rgba(120,195,255,0.95)", edge(a));
      crossing(b, s.deckY, "rgba(168,150,255,0.95)", edge(b));
      c.globalCompositeOperation = "source-over";
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

  return <canvas ref={ref} className="hero-bridge" aria-hidden="true" />;
}
