import { useState, useEffect, useRef, memo } from "react";

/* ─── AUDIO ──────────────────────────────────────────── */
let audioCtx = null;
const getAudio = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
};
const ping = (freq, duration = 0.5, vol = 0.05) => {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine"; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start(); osc.stop(ctx.currentTime + duration + 0.05);
  } catch (_) {}
};
const metallicTick = () => {
  try {
    const ctx = getAudio();
    [1900, 3100].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "triangle"; osc.frequency.value = f + Math.random() * 60;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.025 - i * 0.01, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    });
  } catch (_) {}
};
const useDrone = (active) => {
  const nodesRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    try {
      const ctx = getAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.value = 54;
      osc.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 1.4);
      osc.start();
      nodesRef.current = { osc, gain };
    } catch (_) {}
    return () => {
      const n = nodesRef.current;
      if (!n) return;
      try {
        const ctx = getAudio();
        n.gain.gain.cancelScheduledValues(ctx.currentTime);
        n.gain.gain.setValueAtTime(n.gain.gain.value, ctx.currentTime);
        n.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
        n.osc.stop(ctx.currentTime + 0.75);
      } catch (_) {}
    };
  }, [active]);
};

/* ─── GEOMETRY (400x400 viewBox, centered 200,200) ──── */
const UPRIGHT_TRI    = "M200,100 L286.6,250 L113.4,250 Z";
const INVERTED_TRI    = "M200,300 L113.4,150 L286.6,150 Z";
const PENTAGRAM       = "M200,50 L288.2,321.4 L57.3,153.6 L342.7,153.6 L111.8,321.4 Z";
const SPOKES = [
  "M200,200 L340,200",
  "M200,200 L270,321.2",
  "M200,200 L130,321.2",
  "M200,200 L60,200",
  "M200,200 L130,78.8",
  "M200,200 L270,78.8",
];
const CONSTELLATION_POINTS = [
  [200, 100], [286.6, 250], [113.4, 250],
  [200, 300], [113.4, 150], [286.6, 150],
  [200, 50], [288.2, 321.4], [57.3, 153.6], [342.7, 153.6], [111.8, 321.4],
];

/* ─── DRAWN PATH ─────────────────────────────────────── */
const DrawPath = memo(({ d, drawn, duration = 800, delay = 0, opacity = 0.85, width = 1 }) => (
  <path
    d={d}
    fill="none"
    stroke={`rgba(255,255,255,${opacity})`}
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
    pathLength={1}
    style={{
      strokeDasharray: 1,
      strokeDashoffset: drawn ? 0 : 1,
      transition: `stroke-dashoffset ${duration}ms cubic-bezier(0.65,0,0.35,1) ${delay}ms`,
      filter: "drop-shadow(0 0 6px rgba(255,255,255,0.25))",
    }}
  />
));

/* ─── PARTICLE BURST (dissolve into constellation) ──── */
const ParticleBurst = memo(({ active }) => {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const cx = W / 2, cy = H / 2;
    const N = 140;
    const particles = Array.from({ length: N }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 3.2;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        r: Math.random() * 1.3 + 0.3,
        life: 0, maxLife: 60 + Math.random() * 40,
      };
    });
    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.985; p.vy *= 0.985;
        p.life++;
        const o = Math.max(0, 1 - p.life / p.maxLife);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${o * 0.8})`; ctx.fill();
      });
      if (frame < 90) animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 2 }} />;
});

/* ─── MAIN SEQUENCE ──────────────────────────────────── */
export default function IntroSequence({ onComplete }) {
  const [phase, setPhase] = useState(0);
  useDrone(phase >= 1 && phase < 10);

  useEffect(() => {
    const steps = [
      [400,  1, () => ping(660, 0.4, 0.04)],                     // center dot
      [700,  2, metallicTick],                                    // upright triangle
      [1400, 3, metallicTick],                                    // inverted triangle
      [2100, 4, () => ping(220, 1.1, 0.03)],                       // circle
      [2800, 5, metallicTick],                                    // pentagram
      [3600, 6, metallicTick],                                    // spokes
      [4150, 7, () => ping(1400, 0.5, 0.025)],                     // constellation dots
      [4500, 8, null],                                             // rotate
      [5100, 9, () => ping(880, 0.6, 0.05)],                       // pulse
      [5600, 10, () => ping(140, 1.4, 0.04)],                      // dissolve / fade home
    ];
    const timers = steps.map(([t, p, fn]) =>
      setTimeout(() => { setPhase(p); fn && fn(); }, t)
    );
    const done = setTimeout(() => {
      onComplete && onComplete();
    }, 6500);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rotated = phase >= 8;
  const pulsing = phase >= 9;
  const dissolving = phase >= 10;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: dissolving ? 0 : 1,
      transition: "opacity 900ms cubic-bezier(0.16,1,0.3,1) 300ms",
      pointerEvents: dissolving ? "none" : "auto",
    }}>
      <style>{`
        @keyframes introGrain { 0%{transform:translate(0,0)} 100%{transform:translate(-4%,-3%)} }
        @keyframes introFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes introBlink { 0%,100%{opacity:.25} 50%{opacity:.8} }
      `}</style>

      {/* film grain */}
      <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", opacity: 0.035, pointerEvents: "none" }}>
        <filter id="introGrainFilter"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#introGrainFilter)" style={{ animation: "introGrain 0.4s steps(2) infinite alternate" }} />
      </svg>

      {/* scanlines */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)" }} />

      {/* floating particles */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${10 + (i * 6.3) % 80}%`,
          top: `${15 + (i * 11.7) % 70}%`,
          width: 2, height: 2, borderRadius: "50%",
          background: "rgba(255,255,255,0.3)",
          animation: `introFloat ${4 + (i % 5)}s ease-in-out infinite`,
          animationDelay: `${i * 0.3}s`,
          opacity: phase >= 1 ? 0.5 : 0,
          transition: "opacity 1s ease",
        }} />
      ))}

      {/* bloom */}
      <div style={{
        position: "absolute", width: 520, height: 520, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)",
        filter: "blur(50px)",
        opacity: phase >= 1 ? (pulsing ? 0.9 : 0.5) : 0,
        transform: pulsing ? "scale(1.3)" : "scale(1)",
        transition: "opacity 0.8s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
      }} />

      {/* symbol */}
      <div style={{
        position: "relative", width: "min(78vmin, 480px)", height: "min(78vmin, 480px)",
        transform: `rotate(${rotated ? 9 : 0}deg) scale(${pulsing ? 1.05 : 1})`,
        transition: "transform 650ms cubic-bezier(0.16,1,0.3,1)",
      }}>
        <svg viewBox="0 0 400 400" style={{ width: "100%", height: "100%", overflow: "visible" }}>
          {/* center dot */}
          <circle cx="200" cy="200" r={phase >= 1 ? 2.5 : 0} fill="rgba(255,255,255,0.9)"
            style={{ transition: "r 400ms cubic-bezier(0.34,1.56,0.64,1)", filter: "drop-shadow(0 0 8px rgba(255,255,255,0.7))" }} />

          <DrawPath d={UPRIGHT_TRI}   drawn={phase >= 2} duration={650} opacity={0.75} />
          <DrawPath d={INVERTED_TRI}  drawn={phase >= 3} duration={650} opacity={0.75} />
          <circle cx="200" cy="200" r="140" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1"
            pathLength={1}
            style={{ strokeDasharray: 1, strokeDashoffset: phase >= 4 ? 0 : 1, transition: "stroke-dashoffset 700ms cubic-bezier(0.65,0,0.35,1)", filter: "drop-shadow(0 0 6px rgba(255,255,255,0.25))" }} />
          <DrawPath d={PENTAGRAM}     drawn={phase >= 5} duration={800} opacity={0.9} width={1.1} />

          {SPOKES.map((d, i) => (
            <DrawPath key={i} d={d} drawn={phase >= 6} duration={350} delay={i * 60} opacity={0.3} />
          ))}

          {CONSTELLATION_POINTS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={phase >= 7 ? 2 : 0} fill="rgba(255,255,255,0.95)"
              style={{
                transition: `r 300ms cubic-bezier(0.34,1.56,0.64,1) ${i * 40}ms`,
                animation: phase >= 7 ? "introBlink 2.4s ease-in-out infinite" : "none",
                animationDelay: `${i * 0.15}s`,
                filter: "drop-shadow(0 0 6px rgba(255,255,255,0.6))",
              }} />
          ))}
        </svg>
      </div>

      <ParticleBurst active={dissolving} />
    </div>
  );
}