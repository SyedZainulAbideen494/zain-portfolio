import { useEffect, useRef, useState, useCallback } from "react";

/* ─── Audio reuses the app's pattern ──────────────────── */
let _audioCtx = null;
const getAudio = () => {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
};
const playTone = (freq, type, duration, vol = 0.06, attack = 0.01) => {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start(); osc.stop(ctx.currentTime + duration + 0.05);
  } catch (_) {}
};

const playSynth = () => {
  try {
    const ac = getAudio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.8);
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ac.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.4);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 1.5);
  } catch (_) {}
};

const playBass = () => {
  try {
    const ac = getAudio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const comp = ac.createDynamicsCompressor();
    osc.connect(gain); gain.connect(comp); comp.connect(ac.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(55, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ac.currentTime + 2);
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.14, ac.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 3);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 3.5);
  } catch (_) {}
};

/* ─── Component ────────────────────────────────────────── */
export default function OneLastThing({ visible }) {
  const canvasRef  = useRef(null);
  const animRef    = useRef(null);
  const timersRef  = useRef([]);

  /* scene state */
  const [activeScene, setActiveScene] = useState(null);
  const [ty1, setTy1]                 = useState(false);
  const [ty2, setTy2]                 = useState(false);
  const [beforeWords, setBeforeWords] = useState([]);
  const [revealIn, setRevealIn]       = useState(false);
  const [footerIn, setFooterIn]       = useState(false);
  const [orbMain, setOrbMain]         = useState(false);
  const [orbReveal, setOrbReveal]     = useState(false);
  const [fadeOut, setFadeOut]         = useState(false);

  /* particle canvas — only runs while visible */
  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const N = 80;
    let stars = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.1 + 0.3,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      o: Math.random() * 0.05 + 0.03,
    }));
    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    let running = true;
    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      stars.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.o})`; ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [visible]);

  /* master timeline — restarts every time page becomes visible */
  useEffect(() => {
    /* clear any old timers when hidden or on re-entry */
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (!visible) {
      /* reset everything so it replays cleanly next visit */
      setActiveScene(null);
      setTy1(false); setTy2(false);
      setBeforeWords([]);
      setRevealIn(false); setFooterIn(false);
      setOrbMain(false); setOrbReveal(false);
      setFadeOut(false);
      return;
    }

    const t = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timersRef.current.push(id);
    };

    t(() => setOrbMain(true), 400);

    /* Scene 1 — Thank you */
    t(() => { setActiveScene(1); setTimeout(() => setTy1(true), 100); setTimeout(() => setTy2(true), 500); }, 1000);
    t(() => { setTy1(false); setTy2(false); setTimeout(() => setActiveScene(null), 800); }, 5000);

    /* Scene 2 — Before you leave */
    const line1 = ["Before", "you", "leave..."];
    const line2 = ["one", "last", "thing."];
    t(() => {
      setActiveScene(2);
      playSynth();
      [...line1, "__break__", ...line2].forEach((w, i) =>
        setTimeout(() => setBeforeWords(prev => [...prev, w]), i * 350)
      );
    }, 6500);
    t(() => { setBeforeWords([]); setActiveScene(null); }, 12500);

    /* Scene 3 — Fuck you */
    t(() => {
      setOrbReveal(true);
      setActiveScene(3);
      playBass();
      setTimeout(() => setRevealIn(true), 200);
    }, 14500);

    /* Footer */
    t(() => setFooterIn(true), 25000);

    /* Fade out */
    t(() => {
      setFooterIn(false); setRevealIn(false);
      setTimeout(() => { setOrbReveal(false); setOrbMain(false); setFadeOut(true); }, 600);
    }, 32000);

    return () => timersRef.current.forEach(clearTimeout);
  }, [visible]);

  /* easing shared across inline transitions */
  const ease = "cubic-bezier(0.16,1,0.3,1)";

  /* scene visibility helper */
  const sceneStyle = (s) => ({
    position: "absolute", inset: 0,
    display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
    zIndex: 10,
    opacity:        activeScene === s ? 1 : 0,
    pointerEvents:  activeScene === s ? "auto" : "none",
    transition:     `opacity 1.2s ${ease}`,
  });

  const wordIn = (condition) => ({
    display: "inline-block",
    opacity:   condition ? 1 : 0,
    filter:    condition ? "blur(0)" : "blur(4px)",
    transform: condition ? "translateY(0)" : "translateY(6px)",
    transition: `opacity 1s ${ease}, transform 1s ${ease}, filter 1s ${ease}`,
    margin: "0 0.2em",
  });

  return (
    <>
      <style>{`
        @keyframes oltRevealWord {
          from { opacity:0; filter:blur(12px); }
          to   { opacity:1; filter:blur(0);    }
        }
        @keyframes oltOrbDrift {
          0%   { transform: translate(-50%,-50%) scale(1);    }
          50%  { transform: translate(-50%,-52%) scale(1.04); }
          100% { transform: translate(-50%,-50%) scale(1);    }
        }
      `}</style>

      {/* wrapper — blends with the app's page transition */}
      <div style={{
        position: "absolute", inset: 0,
        opacity:   visible ? 1 : 0,
        filter:    visible ? "blur(0)" : "blur(12px)",
        transform: visible ? "scale(1)" : "scale(0.98)",
        transition: `opacity 1s ${ease}, filter 1s ${ease}, transform 1s ${ease}`,
        pointerEvents: visible ? "auto" : "none",
        overflow: "hidden",
      }}>

        {/* particle canvas (sits behind the constellation which the app already draws) */}
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }} />

        {/* ambient orb — main */}
        <div style={{
          position: "absolute", borderRadius: "50%", pointerEvents: "none", zIndex: 1,
          width: 600, height: 600,
          top: "50%", left: "50%",
          background: "radial-gradient(circle, rgba(255,77,148,0.07) 0%, transparent 70%)",
          filter: "blur(60px)",
          opacity:    orbMain ? 1 : 0,
          animation:  orbMain ? `oltOrbDrift 14s ease-in-out infinite` : "none",
          transition: `opacity 1.8s ${ease}`,
          marginTop: -300, marginLeft: -300,
        }} />

        {/* ambient orb — reveal (larger, only for scene 3) */}
        <div style={{
          position: "absolute", borderRadius: "50%", pointerEvents: "none", zIndex: 1,
          width: 900, height: 900,
          top: "50%", left: "50%",
          background: "radial-gradient(circle, rgba(255,77,148,0.11) 0%, transparent 65%)",
          filter: "blur(80px)",
          opacity:    orbReveal ? 1 : 0,
          transition: `opacity 3s ${ease}`,
          marginTop: -450, marginLeft: -450,
        }} />

        {/* ── Scene 1: Thank you ── */}
        <div style={sceneStyle(1)}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif",
              fontSize: "clamp(28px,4vw,52px)", fontWeight: 100,
              color: "rgba(255,255,255,0.9)", letterSpacing: "0.12em", lineHeight: 1.4,
              opacity:   ty1 ? 1 : 0,
              transform: ty1 ? "translateY(0)" : "translateY(8px)",
              transition: `opacity 1.6s ${ease}, transform 1.6s ${ease}`,
            }}>Thank you</div>
            <div style={{
              fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif",
              fontSize: "clamp(28px,4vw,52px)", fontWeight: 100,
              color: "rgba(255,255,255,0.9)", letterSpacing: "0.12em", lineHeight: 1.4,
              opacity:   ty2 ? 1 : 0,
              transform: ty2 ? "translateY(0)" : "translateY(8px)",
              transition: `opacity 1.6s 0.4s ${ease}, transform 1.6s 0.4s ${ease}`,
            }}>for visiting.</div>
          </div>
        </div>

        {/* ── Scene 2: Before you leave ── */}
        <div style={sceneStyle(2)}>
          <div style={{ textAlign: "center", fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif" }}>
            {/* line 1 */}
            {["Before","you","leave..."].map((word, i) => (
              <span key={`l1-${i}`} style={{
                ...wordIn(beforeWords.length > i),
                fontSize: "clamp(20px,2.8vw,38px)", fontWeight: 200,
                color: "rgba(255,255,255,0.85)", letterSpacing: "0.06em",
                transitionDelay: `${i * 0.05}s`,
              }}>{word}</span>
            ))}
            {/* line break */}
            <span style={{ display: "block", height: "clamp(12px,2vw,24px)" }} />
            {/* line 2 */}
            {["one","last","thing."].map((word, i) => (
              <span key={`l2-${i}`} style={{
                ...wordIn(beforeWords.length > 4 + i),
                fontSize: "clamp(26px,3.6vw,48px)", fontWeight: 100,
                color: "rgba(255,255,255,0.95)", letterSpacing: "0.10em",
                transitionDelay: `${i * 0.06}s`,
              }}>{word}</span>
            ))}
          </div>
        </div>

        {/* ── Scene 3: Fuck you ── */}
        <div style={sceneStyle(3)}>
          <div style={{
            fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif",
            fontSize: "clamp(70px,12vw,140px)", fontWeight: 100,
            letterSpacing: "-0.04em", color: "#fff", lineHeight: 1, userSelect: "none",
            opacity:    revealIn ? 1 : 0,
            filter:     revealIn ? "blur(0)" : "blur(12px)",
            transition: `opacity 2.4s ${ease}, filter 2.4s ${ease}`,
          }}>Fuck you.</div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          position: "absolute", bottom: "clamp(32px,5vw,56px)", left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'SF Mono','Fira Code',monospace",
          fontSize: "clamp(9px,1vw,11px)", fontWeight: 300, letterSpacing: "0.22em",
          color: "rgba(255,255,255,0.15)", textTransform: "uppercase",
          whiteSpace: "nowrap", zIndex: 20, pointerEvents: "none",
          opacity:    footerIn ? 1 : 0,
          transition: `opacity 2s ${ease}`,
        }}>You know who you are.</div>

        {/* ── Fade to black overlay ── */}
        <div style={{
          position: "absolute", inset: 0, background: "#000", zIndex: 50,
          pointerEvents: "none",
          opacity:    fadeOut ? 1 : 0,
          transition: `opacity 3s ${ease}`,
        }} />

      </div>
    </>
  );
}