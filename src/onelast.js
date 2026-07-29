import { useEffect, useRef } from "react";

/* ─── Audio ─────────────────────────────────────────────── */
let _audioCtx = null;
const getAudio = () => {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
};

const resumeAudio = () => {
  try {
    const ctx = getAudio();
    if (ctx.state === "suspended") ctx.resume();
  } catch (_) {}
};

/* Cockpit-style callout via speech synthesis */
const calloutQueue = [];
let calloutSpeaking = false;

let voicesReady = false;
if (typeof window !== "undefined" && window.speechSynthesis) {
  const loadVoices = () => {
    if (window.speechSynthesis.getVoices().length) voicesReady = true;
  };
  loadVoices();
  window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
}

const speakCallout = (text) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  calloutQueue.push(text);
  if (!calloutSpeaking) drainCalloutQueue();
};

const drainCalloutQueue = () => {
  if (!calloutQueue.length) {
    calloutSpeaking = false;
    return;
  }
  calloutSpeaking = true;
  const text = calloutQueue.shift();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.92;
  utt.pitch = 0.82;
  utt.volume = 0.55;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith("en") && (v.name.includes("Daniel") || v.name.includes("Samantha") || v.name.includes("Google"))
  );
  if (preferred) utt.voice = preferred;
  utt.onend = () => setTimeout(drainCalloutQueue, 120);
  utt.onerror = () => drainCalloutQueue();
  window.speechSynthesis.speak(utt);
};

const playTouchdown = () => {
  try {
    const ac = getAudio();
    const t0 = ac.currentTime;

    const noise = ac.createBufferSource();
    const buf = ac.createBuffer(1, ac.sampleRate * 0.08, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    noise.buffer = buf;

    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 180;
    bp.Q.value = 0.6;

    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.0001, t0);
    ng.gain.exponentialRampToValueAtTime(0.12, t0 + 0.004);
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(ac.destination);
    noise.start(t0);
    noise.stop(t0 + 0.15);

    const thump = ac.createOscillator();
    const tg = ac.createGain();
    thump.type = "sine";
    thump.frequency.setValueAtTime(62, t0);
    thump.frequency.exponentialRampToValueAtTime(28, t0 + 0.18);
    tg.gain.setValueAtTime(0.0001, t0);
    tg.gain.exponentialRampToValueAtTime(0.09, t0 + 0.006);
    tg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    thump.connect(tg);
    tg.connect(ac.destination);
    thump.start(t0);
    thump.stop(t0 + 0.25);
  } catch (_) {}
};

const useEngineDrone = (active, ref) => {
  useEffect(() => {
    if (!active) return;
    try {
      const ac = getAudio();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 120;
      osc.type = "sine";
      osc.frequency.value = 52;
      osc.connect(lp);
      lp.connect(gain);
      gain.connect(ac.destination);
      gain.gain.setValueAtTime(0, ac.currentTime);
      gain.gain.linearRampToValueAtTime(0.008, ac.currentTime + 2.5);
      osc.start();
      ref.current = { osc, gain };
    } catch (_) {}
    return () => {
      const n = ref.current;
      if (!n) return;
      try {
        const ac = getAudio();
        n.gain.gain.cancelScheduledValues(ac.currentTime);
        n.gain.gain.setValueAtTime(n.gain.gain.value, ac.currentTime);
        n.gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.2);
        n.osc.stop(ac.currentTime + 1.3);
      } catch (_) {}
      ref.current = null;
    };
  }, [active, ref]);
};

/* ─── Physics ────────────────────────────────────────────── */
class Spring {
  constructor(value, stiffness = 72, damping = 16) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.k = stiffness;
    this.d = damping;
  }
  set(v) {
    this.target = v;
  }
  snap(v) {
    this.value = v;
    this.target = v;
    this.velocity = 0;
  }
  update(dt) {
    const f = -this.k * (this.value - this.target) - this.d * this.velocity;
    this.velocity += f * dt;
    this.value += this.velocity * dt;
  }
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/* ─── Timeline constants (~90 s) ─────────────────────────── */
const T_LOC_CAPTURE = 11.5;
const T_GS_CAPTURE = 19.0;
const T_FLARE = 78.5; // RA ~30
const T_TOUCHDOWN = 82.0;
const T_ROLLOUT_END = 87.0;
const T_ENDING_START = 87.5;
const T_FLIGHT_COMPLETE = 88.0;
const T_THANK_YOU = 90.5;
const T_FADE_BLACK = 93.0;
const T_TOTAL = 96.0;

const CALLOUTS = [
  { ra: 500, text: "Five Hundred" },
  { ra: 400, text: "Four Hundred" },
  { ra: 300, text: "Three Hundred" },
  { ra: 200, text: "Minimums" },
  { ra: 100, text: "One Hundred" },
  { ra: 50, text: "Fifty" },
  { ra: 40, text: "Forty" },
  { ra: 30, text: "Thirty" },
  { ra: 20, text: "Twenty" },
  { ra: 15, text: "Retard", key: "retard" },
  { ra: 10, text: "Ten" },
  { ra: 5, text: "Five" },
];

/* RA profile: piecewise descent after GS capture */
const radioAltAt = (t) => {
  if (t < T_GS_CAPTURE) return 2500;
  const dt = t - T_GS_CAPTURE;
  if (dt <= 0) return 2500;
  if (dt <= 14) return lerp(2500, 800, easeOut(dt / 14));
  if (dt <= 28) return lerp(800, 200, easeOut((dt - 14) / 14));
  if (dt <= 58) return lerp(200, 30, (dt - 28) / 30);
  if (dt <= 62.5) return lerp(30, 0, easeOut((dt - 58) / 4.5));
  return 0;
};

const verticalSpeedAt = (t, ra) => {
  if (t < T_GS_CAPTURE) return -200;
  if (ra > 1000) return -1100;
  if (ra > 500) return -850;
  if (ra > 100) return -780;
  if (ra > 30) return -650;
  if (ra > 5) return -320;
  return -80;
};

/* ─── Drawing helpers ────────────────────────────────────── */
const FONT = "'SF Pro Display','Helvetica Neue',sans-serif";
const MONO = "'SF Mono','Menlo','Fira Code',monospace";

const drawLine = (ctx, x1, y1, x2, y2, alpha = 1, width = 1) => {
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
};

const drawText = (ctx, text, x, y, size, alpha = 1, mono = false, align = "center") => {
  ctx.save();
  ctx.font = `${mono ? "300" : "200"} ${size}px ${mono ? MONO : FONT}`;
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
};

const drawRunway = (ctx, W, H, scale, centrelineScroll, alpha) => {
  if (alpha <= 0.01 || scale <= 0.001) return;
  const cx = W * 0.5;
  const horizonY = H * 0.46;
  const rw = 38 * scale;
  const len = 280 * scale;
  const nearY = horizonY + len;
  const a = alpha * 0.55;

  ctx.save();
  ctx.globalAlpha = a;

  const leftEdge = cx - rw;
  const rightEdge = cx + rw;
  drawLine(ctx, leftEdge, horizonY, leftEdge - rw * 0.08, nearY, 0.35, 0.8);
  drawLine(ctx, rightEdge, horizonY, rightEdge + rw * 0.08, nearY, 0.35, 0.8);

  for (let i = 0; i < 18; i++) {
    const p = (i / 18 + centrelineScroll * 0.015) % 1;
    const y = lerp(horizonY, nearY, p);
    const w = lerp(1, 4, p);
    drawLine(ctx, cx - w, y, cx + w, y, lerp(0.08, 0.22, p), 0.8);
  }

  for (let i = 0; i < 10; i++) {
    const p = (i / 10 + centrelineScroll * 0.012) % 1;
    const y = lerp(horizonY, nearY, p);
    const lightLx = lerp(cx - rw * 0.02, leftEdge, p);
    const lightRx = lerp(cx + rw * 0.02, rightEdge, p);
    const blink = 0.12 + Math.sin(i * 1.7 + centrelineScroll * 4) * 0.06;
    ctx.beginPath();
    ctx.arc(lightLx, y, lerp(0.4, 1.1, p), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${blink})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lightRx, y, lerp(0.4, 1.1, p), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${blink})`;
    ctx.fill();
  }

  const papiY = horizonY + len * 0.22;
  const papiX = cx + rw * 0.55;
  [0.55, 0.42, 0.28, 0.15].forEach((b, i) => {
    ctx.beginPath();
    ctx.arc(papiX, papiY - i * 5 * scale, 1.2 * scale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${b})`;
    ctx.fill();
  });

  ctx.restore();
};

const drawPFD = (ctx, W, H, s, instAlpha) => {
  const cx = W * 0.5;
  const cy = H * 0.5;
  const r = Math.min(W, H) * 0.19;
  const a = instAlpha;

  if (a.fma > 0.01) {
    const fmaText = s.gsCaptured ? "LOC   GS" : "LOC*  GS*";
    drawText(ctx, fmaText, cx, cy - r - 42, 11, 0.55 * a.fma, true);
    if (s.spoilersFlash > 0) {
      drawText(ctx, "SPEEDBRAKE ARM", cx, cy - r - 58, 9, s.spoilersFlash * 0.7 * a.fma, true);
    }
  }

  if (a.horizon > 0.01) {
    ctx.save();
    ctx.globalAlpha = a.horizon;
    ctx.translate(cx, cy);
    ctx.rotate((s.roll * Math.PI) / 180);

    const pxPerDeg = 5.8;
    const pitchOff = s.pitch * pxPerDeg;

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(-r, pitchOff, r * 2, r);
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(-r, pitchOff - r * 2, r * 2, r * 2);

    for (let p = -20; p <= 20; p += 5) {
      if (p === 0) continue;
      const y = pitchOff - p * pxPerDeg;
      const w = p % 10 === 0 ? 28 : 16;
      const al = p % 10 === 0 ? 0.28 : 0.14;
      drawLine(ctx, -w, y, w, y, al, 0.8);
      if (p % 10 === 0 && p !== 0) {
        drawText(ctx, String(Math.abs(p)), w + 10, y, 8, 0.22, true, "left");
      }
    }

    drawLine(ctx, -r, pitchOff, r, pitchOff, 0.45, 1);

    ctx.restore();

    drawLine(ctx, -r, 0, r, 0, 0.12, 0.6);
    drawLine(ctx, 0, -r, 0, r, 0.12, 0.6);

    const fdA = s.phase === "touchdown" || s.phase === "rollout" ? 0.15 : 0.42;
    const fdLen = 22;
    ctx.save();
    ctx.translate(0, -s.fdPitch * pxPerDeg);
    ctx.rotate((s.fdRoll * Math.PI) / 180);
    drawLine(ctx, -fdLen, 0, fdLen, 0, fdA, 1.2);
    drawLine(ctx, 0, -fdLen * 0.55, 0, fdLen * 0.55, fdA, 1.2);
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-7, 2);
    ctx.lineTo(7, 2);
    ctx.closePath();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(-5, 0);
    ctx.moveTo(5, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const triY = -r - 8;
    ctx.beginPath();
    ctx.moveTo(0, triY);
    ctx.lineTo(-5, triY - 7);
    ctx.lineTo(5, triY - 7);
    ctx.closePath();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.stroke();

    ctx.restore();
  }

  if (a.compass > 0.01) {
    const stripY = cy - r - 18;
    const stripW = r * 1.6;
    drawLine(ctx, cx - stripW, stripY, cx + stripW, stripY, 0.14 * a.compass, 0.6);
    const hdg = Math.round(s.heading) % 360;
    drawText(ctx, String(hdg).padStart(3, "0"), cx, stripY - 12, 13, 0.65 * a.compass, true);
    for (let d = -2; d <= 2; d++) {
      const deg = (hdg + d * 10 + 360) % 360;
      const x = cx + d * 22;
      drawText(ctx, String(deg).padStart(3, "0"), x, stripY + 10, 7, 0.18 * a.compass, true);
    }
  }

  const drawDevScale = (x, y, h, dev, label, alphaScale) => {
    if (alphaScale <= 0.01) return;
    const al = alphaScale;
    drawLine(ctx, x, y - h, x, y + h, 0.18 * al, 0.6);
    [-2, -1, 0, 1, 2].forEach((dot) => {
      const dy = dot * (h / 2.5);
      drawLine(ctx, x - 4, y + dy, x + 4, y + dy, dot === 0 ? 0.35 * al : 0.12 * al, 0.8);
    });
    const markerY = y + clamp(dev, -1, 1) * (h / 2.5);
    ctx.save();
    ctx.translate(x, markerY);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = `rgba(255,255,255,${0.55 * al})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(-4, -4, 8, 8);
    ctx.restore();
    drawText(ctx, label, x, y + h + 14, 8, 0.22 * al, true);
  };

  drawDevScale(cx - r - 36, cy, r * 0.85, s.locDev, "LOC", a.locgs);
  drawDevScale(cx + r + 36, cy, r * 0.85, s.gsDev, "G/S", a.locgs);

  if (a.data > 0.01) {
    const dx = cx + r + 72;
    const dy = cy - 20;
    const ra = Math.max(0, Math.round(s.radioAlt));
    drawText(ctx, "RA", dx, dy - 28, 8, 0.2 * a.data, true, "left");
    drawText(ctx, ra < 5 && s.phase !== "intercept" ? "▮▮" : String(ra), dx, dy, 18, 0.62 * a.data, true, "left");

    drawText(ctx, "GS", dx, dy + 28, 8, 0.2 * a.data, true, "left");
    drawText(ctx, String(Math.round(s.groundSpeed)), dx, dy + 46, 14, 0.45 * a.data, true, "left");

    drawText(ctx, "VS", dx, dy + 72, 8, 0.2 * a.data, true, "left");
    const vs = Math.round(s.verticalSpeed);
    drawText(ctx, (vs <= 0 ? "▼ " : "▲ ") + Math.abs(vs), dx, dy + 90, 12, 0.38 * a.data, true, "left");
  }
};

/* ─── Simulation init ────────────────────────────────────── */
const createSim = () => ({
  elapsed: 0,
  phase: "intercept",
  locDev: new Spring(1.0, 64, 15),
  gsDev: new Spring(1.0, 58, 14),
  pitch: new Spring(2.5, 50, 13),
  roll: new Spring(0, 68, 16),
  heading: new Spring(92, 40, 12),
  fdPitch: new Spring(0, 55, 14),
  fdRoll: new Spring(-8, 60, 15),
  radioAlt: 2500,
  groundSpeed: 135,
  verticalSpeed: -200,
  locCaptured: false,
  gsCaptured: false,
  runwayAlpha: 0,
  runwayScale: 0,
  centrelineScroll: 0,
  shakeX: 0,
  shakeY: 0,
  shakeDecay: 0,
  spoilersFlash: 0,
  touchdownPlayed: false,
  calloutsDone: new Set(),
  instAlpha: { fma: 0, horizon: 0, compass: 0, locgs: 0, data: 0 },
  endingLineAlpha: 0,
  endingSubAlpha: 0,
  blackFade: 0,
  fadeIn: 0,
});

const updateSim = (sim, dt, t) => {
  sim.elapsed = t;

  if (t < 2) {
    sim.fadeIn = easeOut(t / 2);
    const fade = sim.fadeIn;
    sim.instAlpha = { fma: fade, horizon: fade, compass: fade, locgs: fade, data: fade };
  }

  if (t < T_LOC_CAPTURE) {
    sim.phase = "intercept";
    sim.fdRoll.set(-9);
    sim.roll.set(-10);
    sim.locDev.set(lerp(1.0, 0.05, easeOut(t / T_LOC_CAPTURE)));
    sim.gsDev.set(1.0);
    sim.pitch.set(2.0);
    sim.fdPitch.set(1.5);
    sim.heading.set(lerp(92, 88, t / T_LOC_CAPTURE));
  } else if (t < T_GS_CAPTURE) {
    sim.phase = "intercept";
    if (!sim.locCaptured) sim.locCaptured = true;
    sim.locDev.set(0);
    sim.fdRoll.set(lerp(-9, 0, easeOut((t - T_LOC_CAPTURE) / (T_GS_CAPTURE - T_LOC_CAPTURE))));
    sim.roll.set(lerp(-10, 0, easeOut((t - T_LOC_CAPTURE) / 5)));
    sim.gsDev.set(lerp(1.0, 0.04, easeOut((t - T_LOC_CAPTURE) / (T_GS_CAPTURE - T_LOC_CAPTURE))));
    sim.pitch.set(lerp(2.0, 4.5, easeOut((t - T_LOC_CAPTURE) / (T_GS_CAPTURE - T_LOC_CAPTURE))));
    sim.fdPitch.set(lerp(1.5, 3.5, easeOut((t - T_LOC_CAPTURE) / (T_GS_CAPTURE - T_LOC_CAPTURE))));
    sim.heading.set(88);
  } else if (t < T_FLARE) {
    sim.phase = "approach";
    if (!sim.gsCaptured) sim.gsCaptured = true;
    sim.locDev.set(0);
    sim.gsDev.set(0);
    sim.roll.set(0);
    sim.fdRoll.set(0);

    sim.radioAlt = radioAltAt(t);
    sim.verticalSpeed = verticalSpeedAt(t, sim.radioAlt);

    const alt = sim.radioAlt;
    sim.pitch.set(lerp(4.5, 2.0, clamp((2500 - alt) / 2400, 0, 1)));
    sim.fdPitch.set(lerp(3.5, 1.5, clamp((2500 - alt) / 2400, 0, 1)));

    sim.runwayAlpha = clamp((2500 - alt) / 1800, 0, 1);
    sim.runwayScale = clamp(Math.pow(1 - alt / 2600, 0.55) * 1.4, 0, 1.2);

    CALLOUTS.forEach((c) => {
      const key = c.key || c.text;
      if (!sim.calloutsDone.has(key) && alt <= c.ra + 2) {
        sim.calloutsDone.add(key);
        speakCallout(c.text);
      }
    });
  } else if (t < T_TOUCHDOWN) {
    sim.phase = "flare";
    sim.radioAlt = radioAltAt(t);
    sim.verticalSpeed = verticalSpeedAt(t, sim.radioAlt);
    sim.pitch.set(lerp(2.0, 5.2, easeOut((t - T_FLARE) / (T_TOUCHDOWN - T_FLARE))));
    sim.fdPitch.set(lerp(1.5, 4.0, easeOut((t - T_FLARE) / (T_TOUCHDOWN - T_FLARE))));
    sim.runwayAlpha = 1;
    sim.runwayScale = lerp(sim.runwayScale, 1.35, dt * 0.8);
  } else if (t < T_ROLLOUT_END) {
    sim.phase = "rollout";
    sim.radioAlt = 0;
    sim.verticalSpeed = lerp(sim.verticalSpeed, -40, dt * 2);
    sim.pitch.set(lerp(5.2, 4.0, easeOut((t - T_TOUCHDOWN) / 2)));
    sim.groundSpeed = lerp(135, 95, (t - T_TOUCHDOWN) / (T_ROLLOUT_END - T_TOUCHDOWN));
    sim.centrelineScroll += dt * sim.groundSpeed * 0.012;
    sim.runwayScale = lerp(sim.runwayScale, 1.55, dt * 0.5);

    if (!sim.touchdownPlayed) {
      sim.touchdownPlayed = true;
      playTouchdown();
      sim.shakeDecay = 1;
      sim.spoilersFlash = 1;
    }
    sim.shakeDecay = Math.max(0, sim.shakeDecay - dt * 1.8);
    sim.spoilersFlash = Math.max(0, sim.spoilersFlash - dt * 0.9);
    if (sim.shakeDecay > 0) {
      sim.shakeX = (Math.random() - 0.5) * 2.2 * sim.shakeDecay;
      sim.shakeY = (Math.random() - 0.5) * 1.4 * sim.shakeDecay;
    } else {
      sim.shakeX = 0;
      sim.shakeY = 0;
    }
  } else if (t < T_FADE_BLACK) {
    sim.phase = "ending";
    sim.centrelineScroll += dt * 40;
    sim.runwayAlpha = lerp(sim.runwayAlpha, 0.25, dt * 0.4);

    const ep = (t - T_ENDING_START) / (T_FADE_BLACK - T_ENDING_START);
    sim.instAlpha.fma = clamp(1 - ep * 1.8, 0, 1);
    sim.instAlpha.compass = clamp(1 - (ep - 0.08) * 1.8, 0, 1);
    sim.instAlpha.data = clamp(1 - (ep - 0.16) * 1.8, 0, 1);
    sim.instAlpha.locgs = clamp(1 - (ep - 0.24) * 1.8, 0, 1);
    sim.instAlpha.horizon = clamp(1 - (ep - 0.32) * 1.8, 0, 1);

    if (t >= T_FLIGHT_COMPLETE) {
      sim.endingLineAlpha = clamp((t - T_FLIGHT_COMPLETE) / 1.2, 0, 1);
    }
    if (t >= T_THANK_YOU) {
      sim.endingSubAlpha = clamp((t - T_THANK_YOU) / 1.5, 0, 1);
    }
  } else {
    sim.phase = "finish";
    sim.blackFade = clamp((t - T_FADE_BLACK) / 2.5, 0, 1);
    sim.runwayAlpha = lerp(sim.runwayAlpha, 0, dt * 2);
    sim.endingLineAlpha = lerp(sim.endingLineAlpha, 0, dt * 1.5);
    sim.endingSubAlpha = lerp(sim.endingSubAlpha, 0, dt * 1.2);
  }

  [sim.locDev, sim.gsDev, sim.pitch, sim.roll, sim.heading, sim.fdPitch, sim.fdRoll].forEach((sp) =>
    sp.update(dt)
  );
};

/* ─── Component ──────────────────────────────────────────── */
export default function OneLastThing({ visible }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const simRef = useRef(null);
  const startRef = useRef(null);
  const engineRef = useRef(null);

  useEngineDrone(visible, engineRef);

  useEffect(() => {
    if (!visible) {
      simRef.current = null;
      startRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      calloutQueue.length = 0;
      calloutSpeaking = false;
      return;
    }

    resumeAudio();
    simRef.current = createSim();
    startRef.current = null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onPointer = () => resumeAudio();
    window.addEventListener("pointerdown", onPointer, { once: true });

    let last = performance.now();

    const frame = (now) => {
      const sim = simRef.current;
      if (!sim || !visible) return;

      if (startRef.current === null) startRef.current = now;
      const t = (now - startRef.current) / 1000;
      const dt = clamp((now - last) / 1000, 0.001, 0.032);
      last = now;

      updateSim(sim, dt, t);

      const W = window.innerWidth;
      const H = window.innerHeight;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(sim.shakeX, sim.shakeY);

      drawRunway(ctx, W, H, sim.runwayScale, sim.centrelineScroll, sim.runwayAlpha * sim.fadeIn);

      drawPFD(ctx, W, H, {
        phase: sim.phase,
        roll: sim.roll.value,
        pitch: sim.pitch.value,
        heading: sim.heading.value,
        locDev: sim.locDev.value,
        gsDev: sim.gsDev.value,
        fdPitch: sim.fdPitch.value,
        fdRoll: sim.fdRoll.value,
        radioAlt: sim.radioAlt,
        groundSpeed: sim.groundSpeed,
        verticalSpeed: sim.verticalSpeed,
        locCaptured: sim.locCaptured,
        gsCaptured: sim.gsCaptured,
        spoilersFlash: sim.spoilersFlash,
      }, sim.instAlpha);

      if (sim.endingLineAlpha > 0.01) {
        drawLine(ctx, W * 0.5 - 60, H * 0.5, W * 0.5 + 60, H * 0.5, 0.08 * sim.endingLineAlpha, 0.5);
        drawText(ctx, "Flight Complete.", W * 0.5, H * 0.5, 22, sim.endingLineAlpha * 0.75);
      }
      if (sim.endingSubAlpha > 0.01) {
        drawText(ctx, "Thank you for flying.", W * 0.5, H * 0.5 + 36, 14, sim.endingSubAlpha * 0.45);
      }

      ctx.restore();

      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      if (sim.blackFade > 0) {
        ctx.fillStyle = `rgba(0,0,0,${sim.blackFade})`;
        ctx.fillRect(0, 0, W, H);
      }

      if (t < T_TOTAL) {
        rafRef.current = requestAnimationFrame(frame);
      }
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onPointer);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [visible]);

  return (
    <>
      <style>{`
        @keyframes ilsFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#000",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1)",
          pointerEvents: visible ? "auto" : "none",
          overflow: "hidden",
        }}
        onPointerDown={resumeAudio}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            display: "block",
          }}
        />
      </div>
    </>
  );
}
