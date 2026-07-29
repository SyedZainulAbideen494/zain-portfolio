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
// low engine drone while the aircraft is airborne
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

/* ─── FLIGHT TIMELINE ────────────────────────────────────
   Real teardrop entry (cross the fix, offset outbound leg,
   turn back onto the inbound course), two full holds, then
   a straight departure off the outbound leg — no course
   reversal at the end, it just flies off. */
const APPROACH_DURATION = 700;   // straight leg in from off-screen, arriving on the teardrop heading
const OUTLEG_DURATION   = 550;   // teardrop offset leg past the fix
const TURN_DURATION     = 1150;  // turn back toward the inbound course
const BLEND_DURATION    = 400;   // roll out cleanly onto the first outbound leg
const LAP_DURATION      = 2100;
const LAPS              = 2;
const HOLD_DURATION     = LAP_DURATION * LAPS;
const EXIT_DURATION     = 800;   // departs straight off the outbound leg, no more turning

const T_TURN  = APPROACH_DURATION + OUTLEG_DURATION;
const T_BLEND = T_TURN + TURN_DURATION;
const T_HOLD  = T_BLEND + BLEND_DURATION;
const T_EXIT  = T_HOLD + HOLD_DURATION;
const T_END   = T_EXIT + EXIT_DURATION;

const deg = (r) => r * (Math.PI / 180);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ─── MAIN SEQUENCE ──────────────────────────────────── */
export default function IntroSequence({ onComplete }) {
  const [phase, setPhase] = useState(0); // 0 black · 1 VOR on · 2 flying · 3 fade to home
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEngineDrone(phase === 2);

  useEffect(() => {
    const steps = [
      [300, 1, () => chime(720, 0.5, 0.03)],                 // VOR powers on
      [900, 2, null],                                         // aircraft enters and begins the entry
      [900 + T_END, 3, () => chime(160, 1.2, 0.028)],         // clear of the hold, fade to home
    ];
    const timers = steps.map(([t, p, fn]) =>
      setTimeout(() => { setPhase(p); fn && fn(); }, t)
    );
    const done = setTimeout(() => onComplete && onComplete(), 900 + T_END + 900);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // quiet VOR identifier, occasional, only while it's the active nav aid
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
    const rSmall = R * 0.8;

    const fix = holdPos(0, cx, cy, R, legLen);
    const outboundHeading = -90;              // heading of the first outbound leg (north)
    const teardropHeading = outboundHeading + 30; // -60°, offset outbound heading for the teardrop
    const dir = (hDeg) => ({ x: Math.cos(deg(hDeg)), y: Math.sin(deg(hDeg)) });

    const entryDist = Math.max(W, H) * 0.65;
    const td = dir(teardropHeading);
    const entryStart = { x: fix.x - td.x * entryDist, y: fix.y - td.y * entryDist };
    const dOut = legLen * 0.5;
    const outLegEnd = { x: fix.x + td.x * dOut, y: fix.y + td.y * dOut };

    // teardrop turn geometry (same right-turn convention as the hold: heading decreases by the sweep)
    const turnSweep = 200;
    const h0 = teardropHeading;
    const center = { x: outLegEnd.x + rSmall * Math.sin(deg(h0)), y: outLegEnd.y - rSmall * Math.cos(deg(h0)) };
    const a0 = h0 + 90;

    const exitDist = Math.max(W, H) * 0.9;
    const exitDir = dir(outboundHeading);

    const trail = [];
    let start = null;

    const draw = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      let pos, heading, turning = false;

      if (elapsed < APPROACH_DURATION) {
        const lt = easeOutCubic(elapsed / APPROACH_DURATION);
        pos = { x: lerp(entryStart.x, fix.x, lt), y: lerp(entryStart.y, fix.y, lt) };
        heading = teardropHeading;
      } else if (elapsed < T_TURN) {
        const lt = (elapsed - APPROACH_DURATION) / OUTLEG_DURATION;
        pos = { x: lerp(fix.x, outLegEnd.x, lt), y: lerp(fix.y, outLegEnd.y, lt) };
        heading = teardropHeading;
      } else if (elapsed < T_BLEND) {
        const lt = (elapsed - T_TURN) / TURN_DURATION;
        const a = a0 - lt * turnSweep;
        pos = { x: center.x + rSmall * Math.cos(deg(a)), y: center.y + rSmall * Math.sin(deg(a)) };
        heading = h0 - lt * turnSweep;
        turning = true;
      } else if (elapsed < T_HOLD) {
        const lt = easeInOutCubic((elapsed - T_BLEND) / BLEND_DURATION);
        const turnEndA = a0 - turnSweep, turnEndHeading = h0 - turnSweep;
        const turnEndPos = { x: center.x + rSmall * Math.cos(deg(turnEndA)), y: center.y + rSmall * Math.sin(deg(turnEndA)) };
        pos = { x: lerp(turnEndPos.x, fix.x, lt), y: lerp(turnEndPos.y, fix.y, lt) };
        // shortest angular path from turnEndHeading to outboundHeading(-90)
        let diff = ((outboundHeading - turnEndHeading + 540) % 360) - 180;
        heading = turnEndHeading + diff * lt;
        turning = true;
      } else if (elapsed < T_EXIT) {
        const lapT = ((elapsed - T_HOLD) % LAP_DURATION) / LAP_DURATION;
        pos = holdPos(lapT, cx, cy, R, legLen);
        heading = holdHeading(lapT, cx, cy, R, legLen);
        turning = inTurn(lapT, R, legLen);
      } else {
        const lt = (elapsed - T_EXIT) / EXIT_DURATION;
        pos = { x: fix.x + exitDir.x * exitDist * lt, y: fix.y + exitDir.y * exitDist * lt };
        heading = outboundHeading;
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

      // aircraft — top-down Boeing 777-style silhouette, banked ~20-25° through turns via horizontal foreshortening
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate((heading + 90) * (Math.PI / 180));
      ctx.scale(turning ? 0.6 : 1, 1);
      ctx.fillStyle = "rgba(255,255,255,0.95)";

      // long, slender fuselage with a pointed nose and tapered tail cone
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.quadraticCurveTo(0.65, -6.2, 0.7, -4.5);
      ctx.lineTo(0.75, -0.5);
      ctx.lineTo(0.55, 2.5);
      ctx.quadraticCurveTo(0.4, 5.5, 0, 7);
      ctx.quadraticCurveTo(-0.4, 5.5, -0.55, 2.5);
      ctx.lineTo(-0.75, -0.5);
      ctx.quadraticCurveTo(-0.7, -4.5, -0.65, -6.2);
      ctx.closePath();
      ctx.fill();

      // broad, swept-back main wing with a curved trailing edge and a raked tip — drawn once, mirrored for symmetry
      const drawMainWing = () => {
        ctx.beginPath();
        ctx.moveTo(0.7, -0.7);
        ctx.lineTo(6.8, 2.6);
        ctx.lineTo(6.3, 3.3);
        ctx.quadraticCurveTo(3.0, 2.6, 0.9, 1.8);
        ctx.closePath();
        ctx.fill();
      };
      drawMainWing();
      ctx.save(); ctx.scale(-1, 1); drawMainWing(); ctx.restore();

      // horizontal stabilizers at the tail
      const drawStabilizer = () => {
        ctx.beginPath();
        ctx.moveTo(0.4, 4.8);
        ctx.lineTo(3.0, 6.3);
        ctx.lineTo(2.7, 6.8);
        ctx.quadraticCurveTo(1.2, 6.2, 0.5, 5.6);
        ctx.closePath();
        ctx.fill();
      };
      drawStabilizer();
      ctx.save(); ctx.scale(-1, 1); drawStabilizer(); ctx.restore();

      // vertical tail fin, seen edge-on from directly above as a slender diamond on the centerline
      ctx.beginPath();
      ctx.moveTo(0, 4.3);
      ctx.lineTo(0.35, 6.5);
      ctx.lineTo(0, 7.2);
      ctx.lineTo(-0.35, 6.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      if (elapsed < T_END) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  const dissolving = phase >= 3;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: dissolving ? 0 : 1,
      transition: "opacity 900ms cubic-bezier(0.16,1,0.3,1) 200ms",
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
        position: "fixed", inset: 0, opacity: phase >= 3 ? 0 : 1,
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
    </div>
  );
}