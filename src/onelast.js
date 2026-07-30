import { useEffect, useRef, useState } from "react";

/* ============================================================
   AUDIO ENGINE
   Enhancements: shared reverb (impulse-response convolver),
   stereo width via panners, softer/rounder tone shaping,
   and a near-silent ambient bed that breathes under the scene.
   ============================================================ */
let _audioCtx = null;
let _reverb = null; // cached convolver so we only build the impulse once

const getAudio = () => {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
};

// Builds a short, soft-decaying impulse response so every sound gets a
// touch of "room" instead of feeling dry and synthetic.
const getReverb = (ac) => {
  if (_reverb) return _reverb;
  const len = ac.sampleRate * 1.6;
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      // exponential decay + noise = plate-reverb-ish tail
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    }
  }
  _reverb = ac.createConvolver();
  _reverb.buffer = buf;
  return _reverb;
};

// A small helper that wires: source -> dry/wet split -> pan -> destination
const routeThroughRoom = (ac, node, { dry = 0.85, wet = 0.15, pan = 0 } = {}) => {
  const dryGain = ac.createGain();
  const wetGain = ac.createGain();
  const panner = ac.createStereoPanner ? ac.createStereoPanner() : null;
  dryGain.gain.value = dry;
  wetGain.gain.value = wet;
  const out = panner || ac.destination;
  if (panner) { panner.pan.value = pan; panner.connect(ac.destination); }
  node.connect(dryGain); dryGain.connect(out);
  node.connect(wetGain); wetGain.connect(getReverb(ac)); getReverb(ac).connect(out);
};

const playSynth = () => {
  try {
    const ac = getAudio();
    const osc = ac.createOscillator();
    const osc2 = ac.createOscillator(); // gentle unison layer for a rounder, "premium" tone
    const gain = ac.createGain();
    osc.connect(gain); osc2.connect(gain);
    osc.type = "sine"; osc2.type = "triangle";
    osc.frequency.setValueAtTime(1200, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.4);
    osc2.frequency.setValueAtTime(1206, ac.currentTime); // slight detune = width/shimmer
    osc2.frequency.exponentialRampToValueAtTime(442, ac.currentTime + 0.4);
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.045, ac.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.7);
    routeThroughRoom(ac, gain, { dry: 0.8, wet: 0.22, pan: 0 });
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.8);
    osc2.start(ac.currentTime); osc2.stop(ac.currentTime + 0.8);
  } catch (_) {}
};

const playBass = () => {
  try {
    const ac = getAudio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const comp = ac.createDynamicsCompressor();
    osc.connect(gain); gain.connect(comp);
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ac.currentTime + 1.2);
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.16, ac.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.8);
    routeThroughRoom(ac, comp, { dry: 0.9, wet: 0.18, pan: 0 });
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 2);
  } catch (_) {}
};

const playClick = () => {
  try {
    const ac = getAudio();
    const buf = ac.createBuffer(1, ac.sampleRate * 0.035, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.6);
    const src = ac.createBufferSource();
    const gain = ac.createGain();
    const filt = ac.createBiquadFilter(); // soften harsh noise into a "premium tick"
    filt.type = "highpass"; filt.frequency.value = 1800;
    src.buffer = buf;
    src.connect(filt); filt.connect(gain);
    gain.gain.setValueAtTime(0.05, ac.currentTime);
    // tiny random pan per click widens the stereo image subtly
    routeThroughRoom(ac, gain, { dry: 0.9, wet: 0.06, pan: (Math.random() - 0.5) * 0.4 });
    src.start(ac.currentTime);
  } catch (_) {}
};

// Extremely quiet drifting pad + noise floor — never demands attention,
// just gives the silence some texture. Started once on `visible`, stopped on exit.
const startAmbience = () => {
  try {
    const ac = getAudio();
    const master = ac.createGain();
    master.gain.value = 0;
    master.connect(ac.destination);
    master.gain.linearRampToValueAtTime(0.018, ac.currentTime + 3);

    const o1 = ac.createOscillator(); o1.type = "sine"; o1.frequency.value = 55;
    const o2 = ac.createOscillator(); o2.type = "sine"; o2.frequency.value = 55 * 1.5;
    const lfo = ac.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.05; // slow breathing
    const lfoGain = ac.createGain(); lfoGain.gain.value = 0.008;
    lfo.connect(lfoGain); lfoGain.connect(master.gain);

    o1.connect(master); o2.connect(master);
    o1.start(); o2.start(); lfo.start();

    return () => {
      try {
        master.gain.linearRampToValueAtTime(0, ac.currentTime + 1.2);
        setTimeout(() => { o1.stop(); o2.stop(); lfo.stop(); }, 1400);
      } catch (_) {}
    };
  } catch (_) { return () => {}; }
};

/* ============================================================
   MOTION CONSTANTS
   Softer, more "designed" easings than the originals — a touch
   of overshoot for anticipation/settle instead of flat eases.
   ============================================================ */
const EASE        = "cubic-bezier(0.16,1,0.3,1)";     // signature Apple-ish deceleration
const EASE_SHARP   = "cubic-bezier(0.4,0,0.2,1)";
const EASE_OVERSHOOT = "cubic-bezier(0.34,1.56,0.64,1)"; // tiny bounce for emphasis moments
const REDUCED = typeof window !== "undefined" &&
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Pre-render a tiny noise tile once per session for the film-grain layer,
   far cheaper than generating grain on every frame. */
let _grainURL = null;
const getGrainDataURL = () => {
  if (_grainURL) return _grainURL;
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  _grainURL = c.toDataURL();
  return _grainURL;
};

/* ─── Component ──────────────────────────────────────────── */
export default function OneLastThing({ visible }) {
  const canvasRef   = useRef(null);
  const animRef     = useRef(null);
  const timers      = useRef([]);
  const mouseRef    = useRef({ x: 0, y: 0 });        // normalized -1..1, updated on mousemove
  const orbPosRef   = useRef(null);                  // DOM node moved directly (no re-render) for magnetic feel
  const orbPos2Ref  = useRef(null);
  const stopAmbienceRef = useRef(null);
  const runningRef  = useRef(true);                  // used to pause rAF when tab hidden

  const [scene,        setScene]        = useState(null);
  const [ty1,          setTy1]          = useState(false);
  const [ty2,          setTy2]          = useState(false);
  const [wordCount,    setWordCount]    = useState(0);
  const [revealIn,     setRevealIn]     = useState(false);
  const [revealChars,  setRevealChars]  = useState(0);
  const [glitch,       setGlitch]       = useState(false);
  const [footerIn,     setFooterIn]     = useState(false);
  const [orbMain,      setOrbMain]      = useState(false);
  const [orbReveal,    setOrbReveal]    = useState(false);
  const [fadeOut,      setFadeOut]      = useState(false);
  const [scanline,     setScanline]     = useState(false);

  /* ── Mouse tracking (ref-only, no re-renders) for particle parallax
         and the orb's slow magnetic drift. ── */
  useEffect(() => {
    if (!visible || REDUCED) return;
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [visible]);

  /* ── Pause everything when the tab loses focus — saves battery/CPU
         and avoids a jarring catch-up burst of animation on return. ── */
  useEffect(() => {
    const onVis = () => { runningRef.current = document.visibilityState === "visible"; };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* ── Particle canvas: three depth layers (far/mid/near) with
         independent twinkle phases + occasional shooting stars +
         subtle mouse-driven parallax offset per layer. ── */
  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    // Layer config: speed = own drift, parallax = how much it reacts to cursor,
    // giving near stars more movement than distant ones (classic depth cue).
    const LAYERS = [
      { count: 55, rRange: [0.2, 0.6], oRange: [0.015, 0.035], speed: 0.05, parallax: 4,  twinkle: [0.3, 0.7] },
      { count: 45, rRange: [0.4, 0.9], oRange: [0.03,  0.06],  speed: 0.10, parallax: 10, twinkle: [0.5, 1.1] },
      { count: 26, rRange: [0.7, 1.5], oRange: [0.045, 0.10],  speed: 0.18, parallax: 20, twinkle: [0.8, 1.6] },
    ];
    let stars = [];
    LAYERS.forEach((layer, li) => {
      for (let i = 0; i < layer.count; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: layer.rRange[0] + Math.random() * (layer.rRange[1] - layer.rRange[0]),
          vx: (Math.random() - 0.5) * layer.speed,
          vy: (Math.random() - 0.5) * layer.speed,
          baseO: layer.oRange[0] + Math.random() * (layer.oRange[1] - layer.oRange[0]),
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: layer.twinkle[0] + Math.random() * (layer.twinkle[1] - layer.twinkle[0]),
          layer: li, parallax: layer.parallax,
        });
      }
    });

    let shootingStars = [];
    const maybeSpawnShootingStar = () => {
      if (REDUCED) return;
      if (Math.random() < 0.0016 && shootingStars.length < 2) {
        const fromLeft = Math.random() > 0.5;
        const y0 = Math.random() * H * 0.4;
        shootingStars.push({
          x: fromLeft ? -20 : W + 20, y: y0,
          vx: (fromLeft ? 1 : -1) * (3.2 + Math.random() * 1.6),
          vy: 1.4 + Math.random() * 0.8,
          life: 0, maxLife: 70 + Math.random() * 20,
        });
      }
    };

    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);

    let t = 0;
    const draw = () => {
      if (!runningRef.current) { animRef.current = requestAnimationFrame(draw); return; }
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current.x, my = mouseRef.current.y;

      stars.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5;
        if (p.y < -5) p.y = H + 5; if (p.y > H + 5) p.y = -5;

        const twinkle = 0.55 + 0.45 * Math.sin(t * p.twinkleSpeed + p.phase);
        const px = p.x + (REDUCED ? 0 : mx * p.parallax);
        const py = p.y + (REDUCED ? 0 : my * p.parallax);

        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.baseO * twinkle})`;
        ctx.fill();
      });

      maybeSpawnShootingStar();
      shootingStars.forEach(s => {
        s.x += s.vx; s.y += s.vy; s.life++;
        const fade = 1 - s.life / s.maxLife;
        if (fade <= 0) return;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 8, s.y - s.vy * 8);
        grad.addColorStop(0, `rgba(255,255,255,${0.35 * fade})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 8, s.y - s.vy * 8);
        ctx.stroke();
      });
      shootingStars = shootingStars.filter(s => s.life < s.maxLife);

      // Orb magnetic drift: nudge the positioner divs toward the cursor,
      // lerped for a slow, heavy, "gravity" feel rather than snapping.
      if (!REDUCED) {
        [orbPosRef.current, orbPos2Ref.current].forEach((el, i) => {
          if (!el) return;
          const strength = i === 0 ? 14 : 22; // reveal orb reacts a bit more
          const targetX = mx * strength, targetY = my * strength;
          const curX = parseFloat(el.dataset.x || "0");
          const curY = parseFloat(el.dataset.y || "0");
          const nx = curX + (targetX - curX) * 0.02;
          const ny = curY + (targetY - curY) * 0.02;
          el.dataset.x = nx; el.dataset.y = ny;
          el.style.transform = `translate(${nx}px, ${ny}px)`;
        });
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [visible]);

  /* ── Master timeline ── RETIMED to get to the hook much faster.
         The old cut held on "Thank you for visiting" for ~2.6s before
         anything else happened — long enough that people bounced before
         ever seeing "before you leave, one last thing." Everything below
         is compressed (roughly 2x tighter) while keeping every beat and
         every line of dialogue exactly the same. Word/char reveal speeds
         are also upped so the text itself reads faster, not just the gaps. ── */
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (!visible) {
      setScene(null); setTy1(false); setTy2(false); setWordCount(0);
      setRevealIn(false); setRevealChars(0); setGlitch(false);
      setFooterIn(false); setOrbMain(false); setOrbReveal(false);
      setFadeOut(false); setScanline(false);
      if (stopAmbienceRef.current) { stopAmbienceRef.current(); stopAmbienceRef.current = null; }
      return;
    }

    const t = (fn, ms) => { const id = setTimeout(fn, ms); timers.current.push(id); };

    // near-silent ambient bed starts with the whole experience
    stopAmbienceRef.current = startAmbience();

    /* orb in */
    t(() => setOrbMain(true), 150);

    /* ── Scene 1: Thank you — now much quicker on-screen (was 2.6s hold,
           now ~1.3s) so the hook line arrives before attention drifts ── */
    t(() => { setScene(1); setTimeout(() => setTy1(true), 40); }, 300);
    t(() => setTy2(true), 650);
    t(() => { setTy1(false); setTy2(false); setTimeout(() => setScene(null), 350); }, 1900);

    /* ── Scene 2: Before you leave — punchy word-by-word, faster cadence ── */
    const line1 = ["Before", "you", "leave..."];
    const line2 = ["one", "last", "thing."];
    const WORD_DELAY = 130; // was 180 — words land quicker, still readable
    t(() => {
      setScene(2);
      playSynth();
      let count = 0;
      [...line1, "__break__", ...line2].forEach((_, i) => {
        setTimeout(() => {
          count++;
          setWordCount(count);
          if (i < line1.length) playClick();
        }, i * WORD_DELAY);
      });
    }, 2300);
    t(() => { setWordCount(0); setScene(null); }, 4800);

    /* ── Scene 3: Big reveal — character-by-character, faster typing speed,
           still with a short beat of anticipation (orb bloom + hush)
           just before the text begins. ── */
    const REVEAL_TEXT = "Never mind, you can leave ☺️.";
    const CHAR_START_DELAY = 80;  // was 120
    const CHAR_DELAY = 40;        // was 55 — text types noticeably faster
    t(() => {
      setOrbReveal(true);   // bloom starts slightly before the text (anticipation)
      setScanline(true);
    }, 4800);
    t(() => {
      setScene(3);
      playBass();
      setTimeout(() => setRevealIn(true), 80);
      REVEAL_TEXT.split("").forEach((_, i) => {
        setTimeout(() => {
          setRevealChars(i + 1);
          if (i % 3 === 0) playClick();
        }, CHAR_START_DELAY + i * CHAR_DELAY);
      });
    }, 5100);

    /* glitch flash at the end of reveal */
    t(() => { setGlitch(true); setTimeout(() => setGlitch(false), 180); },
      5100 + CHAR_START_DELAY + REVEAL_TEXT.length * CHAR_DELAY + 200);

    /* ── Footer — arrives once the reveal has had a moment to breathe ── */
    t(() => setFooterIn(true), 8200);

    /* ── Fade out — total runtime now ~12.5s instead of ~22s ── */
    t(() => {
      setFooterIn(false); setRevealIn(false); setScanline(false);
      setTimeout(() => {
        setOrbReveal(false); setOrbMain(false); setFadeOut(true);
      }, 400);
    }, 11700);

    return () => {
      timers.current.forEach(clearTimeout);
      if (stopAmbienceRef.current) { stopAmbienceRef.current(); stopAmbienceRef.current = null; }
    };
  }, [visible]);

  // Shared safe-area padding keeps text off the edges on phones and
  // ultra-narrow viewports; boxSizing so the padding never pushes content
  // wider than the viewport itself.
  const sceneStyle = (s) => ({
    position: "absolute", inset: 0,
    display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
    zIndex: 10, boxSizing: "border-box", padding: "0 6vw",
    opacity:       scene === s ? 1 : 0,
    pointerEvents: scene === s ? "auto" : "none",
    transition:    `opacity 0.4s ${EASE_SHARP}`,
  });

  const REVEAL_TEXT = "Never mind, you can leave ☺️.";

  return (
    <>
      <style>{`
        @keyframes oltOrbDrift {
          0%   { transform: scale(1);    }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1);    }
        }
        /* softer, slightly irregular "breathing" for the reveal orb — feels alive, not mechanical */
        @keyframes oltOrbBreathe {
          0%   { transform: scale(1);     filter: blur(70px) brightness(1);    }
          45%  { transform: scale(1.045); filter: blur(74px) brightness(1.08); }
          100% { transform: scale(1);     filter: blur(70px) brightness(1);    }
        }
        @keyframes oltScanline {
          0%   { background-position: 0 0; }
          100% { background-position: 0 100px; }
        }
        @keyframes oltGlitch {
          0%   { clip-path: inset(20% 0 60% 0); transform: translateX(-4px); }
          25%  { clip-path: inset(60% 0 10% 0); transform: translateX(4px); }
          50%  { clip-path: inset(40% 0 40% 0); transform: translateX(-2px); }
          75%  { clip-path: inset(10% 0 80% 0); transform: translateX(3px); }
          100% { clip-path: inset(0% 0 0% 0);   transform: translateX(0); }
        }
        @keyframes oltCursor {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        /* text now arrives with a soft overshoot instead of a flat fade — reads as "settling into place" */
        @keyframes oltWordIn {
          0%   { opacity:0; transform: translateY(14px) scale(0.94) skewY(1.5deg); filter: blur(4px); }
          70%  { opacity:1; transform: translateY(-2px) scale(1.01) skewY(0);      filter: blur(0);   }
          100% { opacity:1; transform: translateY(0)     scale(1)    skewY(0);      filter: blur(0);   }
        }
        @keyframes oltCharIn {
          from { opacity:0; transform: translateY(-8px); filter: blur(4px); }
          to   { opacity:1; transform: translateY(0);    filter: blur(0);   }
        }
        /* micro settle applied briefly after the whole word/line has revealed */
        @keyframes oltMicroSettle {
          0%   { letter-spacing: 0.14em; }
          100% { letter-spacing: 0.10em; }
        }
        /* slow, ambient background gradient drift — barely perceptible */
        @keyframes oltBgDrift {
          0%   { transform: translate(-2%, -1%) rotate(0deg); }
          50%  { transform: translate(2%, 1%) rotate(2deg); }
          100% { transform: translate(-2%, -1%) rotate(0deg); }
        }
        /* fog layers drifting at different speeds for parallax depth */
        @keyframes oltFogDriftA { 0% { transform: translate(-8%, -4%); } 100% { transform: translate(8%, 4%); } }
        @keyframes oltFogDriftB { 0% { transform: translate(6%, 3%); } 100% { transform: translate(-6%, -3%); } }
        /* whole scene drifts a few px — an implied slow camera move */
        @keyframes oltCameraDrift {
          0%   { transform: translate(0px, 0px) scale(1.01); }
          50%  { transform: translate(-6px, 4px) scale(1.015); }
          100% { transform: translate(0px, 0px) scale(1.01); }
        }
        @keyframes oltGrainShift {
          0%   { background-position: 0 0; }
          100% { background-position: 128px 128px; }
        }
      `}</style>

      <div style={{
        position: "absolute", inset: 0,
        opacity:    visible ? 1 : 0,
        filter:     visible ? "blur(0)" : "blur(8px)",
        transform:  visible ? "scale(1)" : "scale(0.99)",
        transition: `opacity 0.6s ${EASE}, filter 0.6s ${EASE}, transform 0.6s ${EASE}`,
        pointerEvents: visible ? "auto" : "none",
        overflow: "hidden",
        background: "#000",
      }}>

        {/* ── Subtle animated background gradient — the "atmosphere" beneath everything ── */}
        <div style={{
          position: "absolute", inset: "-20%", zIndex: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 30% 20%, rgba(255,77,148,0.035) 0%, transparent 55%), " +
                      "radial-gradient(ellipse at 70% 80%, rgba(80,120,255,0.03) 0%, transparent 55%)",
          animation: REDUCED ? "none" : "oltBgDrift 40s ease-in-out infinite",
        }} />

        {/* ── Outer wrapper gets a barely-there camera drift so the whole frame feels handheld/alive ── */}
        <div style={{
          position: "absolute", inset: 0,
          animation: REDUCED || !visible ? "none" : "oltCameraDrift 26s ease-in-out infinite",
        }}>

          <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }} />

          {/* ── Drifting atmospheric fog — two soft blurred layers moving opposite directions ── */}
          <div style={{
            position: "absolute", inset: "-10%", zIndex: 1, pointerEvents: "none",
            background: "radial-gradient(ellipse 60% 40% at 20% 30%, rgba(255,255,255,0.02) 0%, transparent 70%)",
            filter: "blur(40px)",
            animation: REDUCED ? "none" : "oltFogDriftA 55s ease-in-out infinite alternate",
          }} />
          <div style={{
            position: "absolute", inset: "-10%", zIndex: 1, pointerEvents: "none",
            background: "radial-gradient(ellipse 50% 35% at 75% 70%, rgba(255,255,255,0.018) 0%, transparent 70%)",
            filter: "blur(48px)",
            animation: REDUCED ? "none" : "oltFogDriftB 65s ease-in-out infinite alternate",
          }} />

          {/* scanline overlay — only during scene 3 */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
            opacity: scanline ? 0.04 : 0,
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)",
            animation: scanline ? "oltScanline 2s linear infinite" : "none",
            transition: `opacity 0.8s ${EASE}`,
          }} />

          {/* ── Orb main: positioner div (JS-driven magnetic offset) wrapping the
                 visual div (CSS-driven breathing/bloom). Two layered gradients
                 give it a soft core + wider bloom instead of one flat radial. ── */}
          <div ref={orbPosRef} style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
            <div style={{
              position: "absolute", borderRadius: "50%", pointerEvents: "none",
              width: 560, height: 560,
              top: "50%", left: "50%", marginTop: -280, marginLeft: -280,
              background: "radial-gradient(circle, rgba(255,120,170,0.10) 0%, rgba(255,77,148,0.05) 40%, transparent 72%)",
              filter: "blur(55px)",
              opacity:   orbMain ? 1 : 0,
              animation: orbMain && !REDUCED ? "oltOrbDrift 12s ease-in-out infinite" : "none",
              transition: `opacity 1.4s ${EASE}`,
            }} />
            {/* tighter, brighter core for a soft lens-bloom highlight */}
            <div style={{
              position: "absolute", borderRadius: "50%", pointerEvents: "none",
              width: 160, height: 160,
              top: "50%", left: "50%", marginTop: -80, marginLeft: -80,
              background: "radial-gradient(circle, rgba(255,200,215,0.10) 0%, transparent 75%)",
              filter: "blur(20px)",
              opacity: orbMain ? 1 : 0,
              transition: `opacity 1.4s ${EASE}`,
            }} />
          </div>

          {/* ── Orb reveal: same positioner/visual split, larger + brighter,
                 with volumetric-feeling outer glow rings. ── */}
          <div ref={orbPos2Ref} style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
            <div style={{
              position: "absolute", borderRadius: "50%", pointerEvents: "none",
              width: 900, height: 900,
              top: "50%", left: "50%", marginTop: -450, marginLeft: -450,
              background: "radial-gradient(circle, rgba(255,77,148,0.10) 0%, rgba(255,77,148,0.05) 45%, transparent 68%)",
              filter: "blur(80px)",
              opacity:   orbReveal ? 1 : 0,
              animation: orbReveal && !REDUCED ? "oltOrbBreathe 7s ease-in-out infinite" : "none",
              transition: `opacity 1.8s ${EASE}`,
            }} />
            {/* faint volumetric ring — like light catching dust in the air */}
            <div style={{
              position: "absolute", borderRadius: "50%", pointerEvents: "none",
              width: 640, height: 640,
              top: "50%", left: "50%", marginTop: -320, marginLeft: -320,
              boxShadow: "0 0 140px 40px rgba(255,120,170,0.05)",
              opacity: orbReveal ? 1 : 0,
              transition: `opacity 2s ${EASE}`,
            }} />
          </div>

          {/* ── Scene 1: Thank you ── */}
          <div style={sceneStyle(1)}>
            <div style={{ textAlign: "center" }}>
              {[["Thank you", ty1, 0], ["for visiting.", ty2, 0.08]].map(([text, show, delay]) => (
                <div key={text} style={{
                  fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif",
                  fontSize: "clamp(26px,7vw,52px)", fontWeight: 200,
                  color: "rgba(255,255,255,0.92)", letterSpacing: "0.1em", lineHeight: 1.5,
                  textShadow: show ? "0 0 24px rgba(255,255,255,0.12)" : "none", // gentle glow, Apple-keynote style
                  opacity:    show ? 1 : 0,
                  transform:  show ? "translateY(0)" : "translateY(8px) scale(0.985)",
                  filter:     show ? "blur(0)" : "blur(5px)",
                  transition: `opacity 0.6s ${delay}s ${EASE}, transform 0.6s ${delay}s ${EASE}, filter 0.6s ${delay}s ${EASE}, text-shadow 1s ${delay}s ${EASE}`,
                }}>{text}</div>
              ))}
            </div>
          </div>

          {/* ── Scene 2: Before you leave ── */}
          <div style={sceneStyle(2)}>
            <div style={{ textAlign: "center", fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif" }}>
              {/* line 1 */}
              <div style={{ marginBottom: "clamp(8px,1.5vw,18px)" }}>
                {["Before","you","leave..."].map((word, i) => (
                  <span key={i} style={{
                    display: "inline-block",
                    margin: "0 0.25em",
                    fontSize: "clamp(17px,4.8vw,34px)", fontWeight: 200,
                    color: "rgba(255,255,255,0.82)", letterSpacing: "0.05em",
                    opacity: wordCount > i ? 1 : 0,
                    animation: wordCount > i ? `oltWordIn 0.45s ${EASE_OVERSHOOT} both` : "none",
                  }}>{word}</span>
                ))}
              </div>
              {/* line 2 */}
              <div>
                {["one","last","thing."].map((word, i) => (
                  <span key={i} style={{
                    display: "inline-block",
                    margin: "0 0.25em",
                    fontSize: "clamp(22px,6.5vw,46px)", fontWeight: 200,
                    color: "#fff", letterSpacing: "0.08em",
                    textShadow: wordCount > 4 + i ? "0 0 30px rgba(255,255,255,0.15)" : "none",
                    opacity: wordCount > 4 + i ? 1 : 0,
                    animation: wordCount > 4 + i
                      ? `oltWordIn 0.4s ${EASE_OVERSHOOT} both, oltMicroSettle 0.6s 0.4s ${EASE} both`
                      : "none",
                  }}>{word}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Scene 3: Reveal ── */}
          <div style={sceneStyle(3)}>
            {/* maxWidth + centered text lets this wrap gracefully on phones
                instead of the old fixed nowrap line, which overflowed off
                the edge of any screen narrower than ~1000px. */}
            <div style={{ position: "relative", maxWidth: "min(94vw, 1100px)", textAlign: "center" }}>
              {/* main text — character by character, with an extremely subtle
                  constant chromatic-aberration fringe via dual text-shadow.
                  fontSize floor lowered + wrap enabled so long sentences never
                  clip on small screens; weight bumped from 100->200 and
                  contrast/glow increased for legibility against the grain/vignette. */}
              <div style={{
                fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif",
                fontSize: "clamp(30px,7.5vw,120px)", fontWeight: 200,
                letterSpacing: "-0.02em", color: "#fff", lineHeight: 1.15,
                userSelect: "none", whiteSpace: "normal", wordBreak: "keep-all",
                opacity: revealIn ? 1 : 0,
                textShadow: revealIn
                  ? "-0.6px 0 rgba(255,60,90,0.35), 0.6px 0 rgba(70,220,255,0.3), 0 0 46px rgba(255,255,255,0.12)"
                  : "none",
                transition: `opacity 0.4s ${EASE}, text-shadow 0.6s ${EASE}`,
              }}>
                {REVEAL_TEXT.split("").map((char, i) => (
                  <span key={i} style={{
                    display: "inline-block",
                    opacity:    revealChars > i ? 1 : 0,
                    transform:  revealChars > i ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.9)",
                    filter:     revealChars > i ? "blur(0)" : "blur(3px)",
                    transition: `opacity 0.22s ${EASE_OVERSHOOT}, transform 0.22s ${EASE_OVERSHOOT}, filter 0.22s ${EASE}`,
                    whiteSpace: char === " " ? "pre" : "normal",
                  }}>{char}</span>
                ))}
                {/* blinking cursor */}
                <span style={{
                  display: "inline-block",
                  width: "2px", height: "0.85em",
                  background: "rgba(255,255,255,0.7)",
                  marginLeft: "4px",
                  verticalAlign: "middle",
                  animation: "oltCursor 0.8s step-end infinite",
                  opacity: revealChars < REVEAL_TEXT.length ? 1 : (footerIn ? 0 : 1),
                  transition: "opacity 0.4s",
                }} />
              </div>

              {/* glitch overlay — matches the main text's wrap/size so it
                  lines up instead of spilling wider than its parent */}
              {glitch && (
                <div style={{
                  position: "absolute", inset: 0,
                  fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif",
                  fontSize: "clamp(30px,7.5vw,120px)", fontWeight: 200,
                  letterSpacing: "-0.02em", color: "rgba(255,77,148,0.8)", lineHeight: 1.15,
                  whiteSpace: "normal", wordBreak: "keep-all",
                  animation: `oltGlitch 0.18s steps(3) both`,
                  pointerEvents: "none",
                }}>{REVEAL_TEXT}</div>
              )}
            </div>
          </div>

          {/* ── Footer — letter-spacing now scales down on narrow viewports
                 (clamp with a vw component) and wrapping is allowed with a
                 safe max-width, so it can never run off a phone screen. ── */}
          <div style={{
            position: "absolute", bottom: "clamp(24px,4vw,48px)", left: "50%",
            transform: "translateX(-50%)",
            maxWidth: "90vw", textAlign: "center",
            fontFamily: "'SF Mono','Fira Code',monospace",
            fontSize: "clamp(9px,2.4vw,11px)", fontWeight: 300,
            letterSpacing: "clamp(0.10em,1.6vw,0.24em)",
            color: "rgba(255,255,255,0.18)", textTransform: "uppercase",
            whiteSpace: "normal", zIndex: 20, pointerEvents: "none",
            opacity: footerIn ? 1 : 0,
            transform: footerIn ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(4px)",
            transition: `opacity 1.2s ${EASE}, transform 1.2s ${EASE}`,
          }}>You know who you are.</div>

        </div>{/* end camera-drift wrapper */}

        {/* ── Vignette — darkens edges for cinematic focus toward center.
               Pulled in slightly (45%/0.48 vs 40%/0.55) so it frames the
               shot without ever dimming the text itself, which sits centered. ── */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 30, pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.48) 100%)",
        }} />

        {/* ── Film grain — tiled noise texture, gently animated, kept very
               faint (0.028) so it reads as texture, not noise fighting the
               text on top of it ── */}
        <div style={{
          position: "absolute", inset: "-10%", zIndex: 31, pointerEvents: "none",
          backgroundImage: `url(${typeof document !== "undefined" ? getGrainDataURL() : ""})`,
          backgroundSize: "128px 128px",
          opacity: 0.028,
          mixBlendMode: "overlay",
          animation: REDUCED ? "none" : "oltGrainShift 0.6s steps(2) infinite",
        }} />

        {/* ── Fade to black ── */}
        <div style={{
          position: "absolute", inset: 0, background: "#000", zIndex: 50,
          pointerEvents: "none",
          opacity:    fadeOut ? 1 : 0,
          transition: `opacity 2.2s ${EASE}`,
        }} />

      </div>
    </>
  );
}