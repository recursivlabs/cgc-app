"use client";

import { useEffect, useRef } from "react";

/**
 * The hero visual: a room. Two people talk on a lit stage and an audience
 * watches from the dark. Everyone is a solid silhouette, lit from behind,
 * so the light rims their heads and shoulders. The light is blue on one
 * side of the room and violet on the other. A few hands go up.
 */
export default function HeroCrowd() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const c = ctx;
    const PI = Math.PI;
    const BODY = "#07070a";

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Fixed layout, so the room looks the same on every load.
    function rng(seed: number) {
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    type Person = {
      x: number;
      base: number;
      s: number;
      lean: number;
      rim: number;
      sway: number;
      hand: number;
      side: number;
    };

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let crowd: Person[] = [];
    let stage = { y: 0, a: 0, b: 0, s: 0, mid: 0 };
    let FADE_A = 0.3;
    let FADE_B = 0.52;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      const narrow = w < 760;
      // On a wide screen the copy sits left, so the room fades in from the
      // dark. On a narrow one the copy sits above it and nothing fades.
      FADE_A = narrow ? 0 : 0.26;
      FADE_B = narrow ? 0.04 : 0.5;

      const ss = narrow ? h * 0.11 : h * 0.15;
      const centre = narrow ? 0.5 : 0.72;
      stage = {
        y: h * (narrow ? 0.78 : 0.7),
        s: ss,
        a: w * centre - ss * 0.66,
        b: w * centre + ss * 0.66,
        mid: w * centre,
      };

      // Three rows, each nearer, larger and more strongly rimmed.
      const rows = narrow
        ? [
            { base: 0.92, s: 0.082, gap: 0.72, rim: 0.5 },
            { base: 0.99, s: 0.1, gap: 0.76, rim: 0.75 },
            { base: 1.07, s: 0.125, gap: 0.82, rim: 1 },
          ]
        : [
            { base: 0.86, s: 0.095, gap: 0.62, rim: 0.5 },
            { base: 0.945, s: 0.125, gap: 0.66, rim: 0.75 },
            { base: 1.03, s: 0.16, gap: 0.72, rim: 1 },
          ];

      crowd = [];
      const r = rng(20260825);
      rows.forEach((row) => {
        const s0 = h * row.s;
        const step = s0 * row.gap;
        for (let x = -step; x < w + step; x += step) {
          const lean = r() < 0.16 ? (r() < 0.5 ? -1 : 1) : 0;
          crowd.push({
            x: x + (r() - 0.5) * step * 0.5,
            base: h * row.base + (r() - 0.5) * s0 * 0.09,
            s: s0 * (0.8 + r() * 0.42),
            lean,
            rim: row.rim,
            sway: r() < 0.4 ? 2800 + r() * 3800 : 0,
            hand: r() < 0.16 ? r() * 11000 : 0,
            side: r() < 0.5 ? -1 : 1,
          });
        }
      });
    }

    // Light across the room: blue from the left, violet from the right.
    function beam(alpha: number) {
      const g = c.createLinearGradient(0, 0, w, 0);
      const m = Math.max(0.03, Math.min(0.97, stage.mid / w));
      g.addColorStop(0, "rgba(58,166,245,0)");
      g.addColorStop(FADE_A, "rgba(58,166,245,0)");
      g.addColorStop(FADE_B, `rgba(58,166,245,${alpha})`);
      g.addColorStop(m, `rgba(232,242,255,${Math.min(1, alpha * 1.5)})`);
      g.addColorStop(0.97, `rgba(139,124,248,${alpha})`);
      g.addColorStop(1, "rgba(139,124,248,0)");
      return g;
    }

    function figure(cx: number, baseY: number, s: number, lean: number) {
      const headR = s * 0.185;
      const headX = cx + lean * headR * 0.55;
      const headY = baseY - s * 0.6;
      const shY = baseY - s * 0.28;
      const halfW = s * 0.4;
      c.beginPath();
      c.moveTo(cx - halfW, baseY);
      c.quadraticCurveTo(cx - halfW, shY + s * 0.02, headX - headR * 1.45, shY - s * 0.02);
      c.quadraticCurveTo(headX - headR * 0.95, shY - s * 0.09, headX + Math.cos(0.75 * PI) * headR, headY + Math.sin(0.75 * PI) * headR);
      c.arc(headX, headY, headR, 0.75 * PI, 2.25 * PI, false);
      c.quadraticCurveTo(headX + headR * 0.95, shY - s * 0.09, headX + headR * 1.45, shY - s * 0.02);
      c.quadraticCurveTo(cx + halfW, shY + s * 0.02, cx + halfW, baseY);
      c.closePath();
    }

    function armPath(cx: number, baseY: number, s: number, side: number, lift: number) {
      const sx = cx + side * s * 0.28;
      const sy = baseY - s * 0.24;
      c.beginPath();
      c.moveTo(sx, sy);
      c.quadraticCurveTo(
        sx + side * s * 0.2,
        sy - s * 0.34,
        sx + side * s * (0.08 + lift * 0.07),
        sy - s * (0.28 + lift * 0.66)
      );
    }

    // Everyone is drawn twice: once shifted up in the light of the room,
    // then again in black on top. The sliver that shows is the rim light.
    function lit(
      path: () => void,
      rimAlpha: number,
      rimPx: number,
      stroke?: number
    ) {
      c.save();
      c.translate(0, -rimPx);
      path();
      if (stroke) {
        c.lineWidth = stroke;
        c.lineCap = "round";
        c.strokeStyle = beam(rimAlpha);
        c.stroke();
      } else {
        c.fillStyle = beam(rimAlpha);
        c.fill();
      }
      c.restore();
      path();
      if (stroke) {
        c.lineWidth = stroke;
        c.lineCap = "round";
        c.strokeStyle = BODY;
        c.stroke();
      } else {
        c.fillStyle = BODY;
        c.fill();
      }
    }

    function draw(time: number) {
      c.clearRect(0, 0, w, h);
      const t = reduced ? 6000 : time;
      const breathe = 0.5 + 0.5 * Math.sin(t / 3600);

      // the light in the room
      c.globalCompositeOperation = "lighter";
      const gy = stage.y - stage.s * 0.4;
      const pool = c.createRadialGradient(stage.mid, gy, 0, stage.mid, gy, h * 0.62);
      pool.addColorStop(0, `rgba(186,209,255,${0.19 + breathe * 0.06})`);
      pool.addColorStop(0.4, `rgba(124,152,250,${0.07 + breathe * 0.02})`);
      pool.addColorStop(1, "rgba(110,160,255,0)");
      c.fillStyle = pool;
      c.fillRect(0, 0, w, h);

      // a low wash behind the audience, so the rows read against something
      const wash = c.createLinearGradient(0, stage.y - h * 0.02, 0, h);
      wash.addColorStop(0, "rgba(120,150,235,0.11)");
      wash.addColorStop(1, "rgba(90,120,220,0)");
      c.fillStyle = wash;
      c.fillRect(0, stage.y - h * 0.02, w, h);
      c.globalCompositeOperation = "source-over";

      // the lit edge of the stage, only under the two speakers
      const half = stage.s * 3.4;
      const edge = c.createLinearGradient(stage.mid - half, 0, stage.mid + half, 0);
      edge.addColorStop(0, "rgba(58,166,245,0)");
      edge.addColorStop(0.5, "rgba(226,240,255,0.9)");
      edge.addColorStop(1, "rgba(139,124,248,0)");
      c.strokeStyle = edge;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(stage.mid - half, stage.y);
      c.lineTo(stage.mid + half, stage.y);
      c.stroke();

      // the two people talking, leaning towards each other
      [
        { x: stage.a, lean: 1 },
        { x: stage.b, lean: -1 },
      ].forEach((p) => {
        lit(() => figure(p.x, stage.y, stage.s, p.lean), 1, Math.max(2, stage.s * 0.032));
      });

      // the audience, back rows first
      for (let i = 0; i < crowd.length; i++) {
        const p = crowd[i];
        const sway = p.sway ? Math.sin(t / p.sway + i) * (p.s * 0.012) : 0;
        const x = p.x + sway;
        const rimPx = Math.max(1.8, p.s * 0.036);

        if (p.hand && p.rim > 0.5 && x > w * (FADE_B - 0.06)) {
          const cyc = ((t + p.hand) % 11000) / 11000;
          const lift =
            cyc < 0.1 ? cyc / 0.1 : cyc < 0.46 ? 1 : cyc < 0.56 ? 1 - (cyc - 0.46) / 0.1 : 0;
          if (lift > 0.02) {
            lit(
              () => armPath(x, p.base, p.s, p.side, lift),
              p.rim * 0.45,
              rimPx * 0.55,
              p.s * 0.095
            );
          }
        }

        lit(() => figure(x, p.base, p.s, p.lean), p.rim, rimPx);
      }
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

  return <canvas ref={ref} className="hero-crowd" aria-hidden="true" />;
}
