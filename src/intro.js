import { useState, useEffect, useRef } from "react";

/* ─── AUDIO ──────────────────────────────────────────── */
let audioCtx = null;
const getAudio = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
};
const chime = (freq, duration = 0.5, vol = 0.05) => {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine"; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start(); osc.stop(ctx.currentTime + duration + 0.05);
  } catch (_) {}
};
// faint VOR morse-style identifier blip — quiet, two short tones
const morseBlip = () => {
  try {
    const ctx = getAudio();
    [0, 0.14].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = 1020;
      const t0 = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.012, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
      osc.start(t0); osc.stop(t0 + 0.1);
    });
  } catch (_) {}
};
// low engine drone while the aircraft holds
const useEngineDrone = (active) => {
  const nodesRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    try {
      const ctx = getAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.value = 48;
      osc.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.014, ctx.currentTime + 1.1);
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
        n.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        n.osc.stop(ctx.currentTime + 0.65);
      } catch (_) {}
    };
  }, [active]);
};

/* ─── HOLDING PATTERN GEOMETRY ──────────────────────────
   Standard right-hand racetrack: two straight legs joined
   by two 180° right turns, traced clockwise around the VOR. */
const holdPos = (t, cx, cy, R, legLen) => {
  t = ((t % 1) + 1) % 1;
  const turnLen = Math.PI * R;
  const total = legLen * 2 + turnLen * 2;
  const d = t * total;
  if (d < legLen) {
    const lt = d / legLen;
    return { x: cx + R, y: cy + legLen / 2 - lt * legLen };
  } else if (d < legLen + turnLen) {
    const lt = (d - legLen) / turnLen;
    const a = (0 - lt * 180) * (Math.PI / 180);
    return { x: cx + R * Math.cos(a), y: (cy - legLen / 2) + R * Math.sin(a) };
  } else if (d < legLen * 2 + turnLen) {
    const lt = (d - legLen - turnLen) / legLen;
    return { x: cx - R, y: (cy - legLen / 2) + lt * legLen };
  } else {
    const lt = (d - legLen * 2 - turnLen) / turnLen;
    const a = (180 - lt * 180) * (Math.PI / 180);
    return { x: cx + R * Math.cos(a), y: (cy + legLen / 2) + R * Math.sin(a) };
  }
};
const holdHeading = (t, cx, cy, R, legLen) => {
  const e = 0.002;
  const p0 = holdPos(t, cx, cy, R, legLen);
  const p1 = holdPos(t + e, cx, cy, R, legLen);
  return Math.atan2(p1.y - p0.y, p1.x - p0.x) * (180 / Math.PI);
};
const inTurn = (t, R, legLen) => {
  const turnLen = Math.PI * R, total = legLen * 2 + turnLen * 2;
  const d = (((t % 1) + 1) % 1) * total;
  return (d >= legLen && d < legLen + turnLen) || d >= legLen * 2 + turnLen;
};

/* ─── MAIN SEQUENCE ──────────────────────────────────── */
export default function IntroSequence({ onComplete }) {
  const [phase, setPhase] = useState(0); // 0 black · 1 VOR on · 2 flying · 3 exit/morph · 4 logo hold · 5 fade
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEngineDrone(phase >= 2 && phase < 3);

  useEffect(() => {
    const steps = [
      [300, 1, () => chime(720, 0.5, 0.03)],   // VOR powers on
      [900, 2, null],                           // aircraft enters + begins hold
      [5100, 3, () => chime(980, 0.7, 0.045)],  // exits hold, nav chime
      [5750, 4, null],                          // logo settles
      [6350, 5, () => chime(160, 1.2, 0.028)],  // fade tone
    ];
    const timers = steps.map(([t, p, fn]) =>
      setTimeout(() => { setPhase(p); fn && fn(); }, t)
    );
    const done = setTimeout(() => onComplete && onComplete(), 7000);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // quiet VOR identifier, occasional
  useEffect(() => {
    if (phase < 1 || phase >= 3) return;
    const id = setInterval(() => { if (Math.random() > 0.45) morseBlip(); }, 2600);
    return () => clearInterval(id);
  }, [phase]);

  // flight animation — canvas trail + aircraft, drawn imperatively for smoothness
  useEffect(() => {
    if (phase !== 2) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = (canvas.width = window.innerWidth);
    const H = (canvas.height = window.innerHeight);
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.085;
    const legLen = Math.min(W, H) * 0.2;

    const fix = holdPos(0, cx, cy, R, legLen);
    const edgeAngle = Math.random() * Math.PI * 2;
    const entryDist = Math.max(W, H) * 0.75;
    const entryStart = { x: cx + Math.cos(edgeAngle) * entryDist, y: cy + Math.sin(edgeAngle) * entryDist };

    const ENTRY_DURATION = 1000;
    const LAP_DURATION = 2600;
    const LAPS = 1.5;
    const FLIGHT_DURATION = LAP_DURATION * LAPS;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const trail = [];
    let start = null;

    const draw = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      let pos, heading, turning = false;

      if (elapsed < ENTRY_DURATION) {
        const lt = easeOutCubic(elapsed / ENTRY_DURATION);
        pos = { x: entryStart.x + (fix.x - entryStart.x) * lt, y: entryStart.y + (fix.y - entryStart.y) * lt };
        const pt = Math.max(0, lt - 0.02);
        const prev = { x: entryStart.x + (fix.x - entryStart.x) * pt, y: entryStart.y + (fix.y - entryStart.y) * pt };
        heading = Math.atan2(pos.y - prev.y, pos.x - prev.x) * (180 / Math.PI);
      } else {
        const flightElapsed = elapsed - ENTRY_DURATION;
        const lapT = (flightElapsed % LAP_DURATION) / LAP_DURATION;
        pos = holdPos(lapT, cx, cy, R, legLen);
        heading = holdHeading(lapT, cx, cy, R, legLen);
        turning = inTurn(lapT, R, legLen);
      }

      trail.push({ x: pos.x, y: pos.y, age: 0 });
      if (trail.length > 260) trail.shift();

      ctx.clearRect(0, 0, W, H);
      for (let i = 1; i < trail.length; i++) {
        trail[i - 1].age++;
        const a = Math.max(0, 1 - trail[i - 1].age / 140) * 0.55;
        if (a <= 0) continue;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.strokeStyle = `rgba(255,255,255,${a})`;
        ctx.lineWidth = 1.3;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // aircraft, banked ~20-25° through turns via horizontal foreshortening
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate((heading + 90) * (Math.PI / 180));
      ctx.scale(turning ? 0.6 : 1, 1);
      ctx.beginPath();
      ctx.moveTo(0, -6.5); ctx.lineTo(4.2, 5); ctx.lineTo(0, 2.5); ctx.lineTo(-4.2, 5);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.shadowColor = "rgba(255,255,255,0.75)";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();

      if (elapsed < ENTRY_DURATION + FLIGHT_DURATION) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  const exiting = phase >= 3;
  const logoSettled = phase >= 4;
  const dissolving = phase >= 5;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: dissolving ? 0 : 1,
      transform: exiting ? "scale(1.06)" : "scale(1)",
      transition: "opacity 900ms cubic-bezier(0.16,1,0.3,1) 300ms, transform 1400ms cubic-bezier(0.16,1,0.3,1)",
      pointerEvents: dissolving ? "none" : "auto",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes introGrain { 0%{transform:translate(0,0)} 100%{transform:translate(-4%,-3%)} }
        @keyframes vorBreathe { 0%,100%{opacity:.55; transform:translate(-50%,-50%) scale(1)} 50%{opacity:1; transform:translate(-50%,-50%) scale(1.15)} }
        @keyframes radarPulse { 0%{transform:translate(-50%,-50%) scale(0.15); opacity:.5} 100%{transform:translate(-50%,-50%) scale(1); opacity:0} }
      `}</style>

      {/* film grain */}
      <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", opacity: 0.035, pointerEvents: "none" }}>
        <filter id="introGrainFilter"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#introGrainFilter)" style={{ animation: "introGrain 0.4s steps(2) infinite alternate" }} />
      </svg>

      {/* scanlines */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)" }} />

      {/* flight trail + aircraft */}
      <canvas ref={canvasRef} style={{
        position: "fixed", inset: 0, opacity: exiting ? 0 : 1,
        transition: "opacity 700ms ease",
      }} />

      {/* VOR station: breathing beacon + radar rings */}
      <div style={{ position: "fixed", left: "50%", top: "50%", width: 0, height: 0 }}>
        {phase >= 1 && phase < 3 && [0, 1.3, 2.6].map((delay) => (
          <div key={delay} style={{
            position: "absolute", left: "50%", top: "50%", width: 90, height: 90,
            marginLeft: -45, marginTop: -45, borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.35)",
            animation: `radarPulse 3.9s ease-out ${delay}s infinite`,
          }} />
        ))}
        <div style={{
          position: "absolute", left: "50%", top: "50%", width: 5, height: 5,
          borderRadius: "50%", background: "rgba(255,255,255,0.95)",
          boxShadow: "0 0 10px rgba(255,255,255,0.6)",
          opacity: phase >= 1 && phase < 3 ? 1 : 0,
          animation: phase >= 1 && phase < 3 ? "vorBreathe 2.6s ease-in-out infinite" : "none",
          transition: "opacity 600ms ease",
        }} />
      </div>

      {/* logo mark — trail converges here as the aircraft exits the hold */}
      <div style={{
        position: "relative",
        opacity: exiting ? 1 : 0,
        transform: `scale(${logoSettled ? 1.05 : exiting ? 0.85 : 0.7})`,
        transition: "opacity 800ms cubic-bezier(0.16,1,0.3,1), transform 900ms cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <svg width="86" height="86" viewBox="0 0 86 86">
          <circle cx="43" cy="43" r="30" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2"
            style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))" }} />
          <path d="M43,20 L50,50 L43,44 L36,50 Z" fill="rgba(255,255,255,0.95)"
            style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.5))" }} />
          <circle cx="43" cy="43" r="2.4" fill="rgba(255,255,255,0.95)" />
        </svg>
      </div>
    </div>
  );
}