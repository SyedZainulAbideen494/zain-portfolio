import { useEffect, useRef, useState } from "react";

/* ─── Audio ─────────────────────────────────────────────── */
let _audioCtx = null;
const getAudio = () => {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
};

const playSynth = () => {
  try {
    const ac = getAudio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.4);
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.7);
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
    osc.frequency.setValueAtTime(80, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ac.currentTime + 1.2);
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.8);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 2);
  } catch (_) {}
};

const playClick = () => {
  try {
    const ac = getAudio();
    const buf = ac.createBuffer(1, ac.sampleRate * 0.04, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ac.createBufferSource();
    const gain = ac.createGain();
    src.buffer = buf;
    src.connect(gain); gain.connect(ac.destination);
    gain.gain.setValueAtTime(0.06, ac.currentTime);
    src.start(ac.currentTime);
  } catch (_) {}
};

/* ─── Helpers ────────────────────────────────────────────── */
const EASE = "cubic-bezier(0.16,1,0.3,1)";
const EASE_SHARP = "cubic-bezier(0.4,0,0.2,1)";

/* ─── Component ──────────────────────────────────────────── */
export default function OneLastThing({ visible }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const timers    = useRef([]);

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

  /* ── Particle canvas ── */
  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const N = 100;
    let stars = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.2 + 0.2,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      o: Math.random() * 0.07 + 0.02,
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

  /* ── Master timeline ── */
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (!visible) {
      setScene(null); setTy1(false); setTy2(false); setWordCount(0);
      setRevealIn(false); setRevealChars(0); setGlitch(false);
      setFooterIn(false); setOrbMain(false); setOrbReveal(false);
      setFadeOut(false); setScanline(false);
      return;
    }

    const t = (fn, ms) => { const id = setTimeout(fn, ms); timers.current.push(id); };

    /* orb in */
    t(() => setOrbMain(true), 200);

    /* ── Scene 1: Thank you — fast */
    t(() => { setScene(1); setTimeout(() => setTy1(true), 60); }, 600);
    t(() => setTy2(true), 1000);
    t(() => { setTy1(false); setTy2(false); setTimeout(() => setScene(null), 500); }, 3200);

    /* ── Scene 2: Before you leave — punchy word-by-word */
    const line1 = ["Before", "you", "leave..."];
    const line2 = ["one", "last", "thing."];
    t(() => {
      setScene(2);
      playSynth();
      let count = 0;
      const DELAY = 180; // ms between each word
      [...line1, "__break__", ...line2].forEach((_, i) => {
        setTimeout(() => {
          count++;
          setWordCount(count);
          if (i < line1.length) playClick();
        }, i * DELAY);
      });
    }, 4200);
    t(() => { setWordCount(0); setScene(null); }, 8000);

    /* ── Scene 3: Big reveal — character-by-character */
    const REVEAL_TEXT = "I can fly planes ☺️.";
    t(() => {
      setOrbReveal(true);
      setScanline(true);
      setScene(3);
      playBass();
      setTimeout(() => setRevealIn(true), 100);
      // stagger each character
      REVEAL_TEXT.split("").forEach((_, i) => {
        setTimeout(() => {
          setRevealChars(i + 1);
          if (i % 3 === 0) playClick();
        }, 120 + i * 55);
      });
    }, 9500);

    /* glitch flash at the end of reveal */
    t(() => { setGlitch(true); setTimeout(() => setGlitch(false), 180); }, 9500 + 120 + REVEAL_TEXT.length * 55 + 200);

    /* ── Footer */
    t(() => setFooterIn(true), 14500);

    /* ── Fade out */
    t(() => {
      setFooterIn(false); setRevealIn(false); setScanline(false);
      setTimeout(() => {
        setOrbReveal(false); setOrbMain(false); setFadeOut(true);
      }, 400);
    }, 20000);

    return () => timers.current.forEach(clearTimeout);
  }, [visible]);

  const sceneStyle = (s) => ({
    position: "absolute", inset: 0,
    display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
    zIndex: 10,
    opacity:       scene === s ? 1 : 0,
    pointerEvents: scene === s ? "auto" : "none",
    transition:    `opacity 0.4s ${EASE_SHARP}`,
  });

  const REVEAL_TEXT = "I can fly planes ☺️.";

  return (
    <>
      <style>{`
        @keyframes oltOrbDrift {
          0%   { transform: translate(-50%,-50%) scale(1);    }
          50%  { transform: translate(-50%,-52%) scale(1.05); }
          100% { transform: translate(-50%,-50%) scale(1);    }
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
        @keyframes oltWordIn {
          from { opacity:0; transform: translateY(10px) skewY(1deg); filter: blur(3px); }
          to   { opacity:1; transform: translateY(0)    skewY(0);    filter: blur(0);   }
        }
        @keyframes oltCharIn {
          from { opacity:0; transform: translateY(-8px); filter: blur(4px); }
          to   { opacity:1; transform: translateY(0);    filter: blur(0);   }
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
      }}>

        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }} />

        {/* scanline overlay — only during scene 3 */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
          opacity: scanline ? 0.04 : 0,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)",
          animation: scanline ? "oltScanline 2s linear infinite" : "none",
          transition: `opacity 0.8s ${EASE}`,
        }} />

        {/* orb main */}
        <div style={{
          position: "absolute", borderRadius: "50%", pointerEvents: "none", zIndex: 1,
          width: 500, height: 500,
          top: "50%", left: "50%", marginTop: -250, marginLeft: -250,
          background: "radial-gradient(circle, rgba(255,77,148,0.09) 0%, transparent 70%)",
          filter: "blur(50px)",
          opacity:   orbMain ? 1 : 0,
          animation: orbMain ? "oltOrbDrift 12s ease-in-out infinite" : "none",
          transition: `opacity 1.2s ${EASE}`,
        }} />

        {/* orb reveal */}
        <div style={{
          position: "absolute", borderRadius: "50%", pointerEvents: "none", zIndex: 1,
          width: 800, height: 800,
          top: "50%", left: "50%", marginTop: -400, marginLeft: -400,
          background: "radial-gradient(circle, rgba(255,77,148,0.14) 0%, transparent 65%)",
          filter: "blur(70px)",
          opacity:   orbReveal ? 1 : 0,
          transition: `opacity 1.5s ${EASE}`,
        }} />

        {/* ── Scene 1: Thank you ── */}
        <div style={sceneStyle(1)}>
          <div style={{ textAlign: "center" }}>
            {[["Thank you", ty1, 0], ["for visiting.", ty2, 0.08]].map(([text, show, delay]) => (
              <div key={text} style={{
                fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif",
                fontSize: "clamp(28px,4vw,52px)", fontWeight: 100,
                color: "rgba(255,255,255,0.9)", letterSpacing: "0.12em", lineHeight: 1.5,
                opacity:    show ? 1 : 0,
                transform:  show ? "translateY(0)" : "translateY(6px)",
                filter:     show ? "blur(0)" : "blur(4px)",
                transition: `opacity 0.5s ${delay}s ${EASE}, transform 0.5s ${delay}s ${EASE}, filter 0.5s ${delay}s ${EASE}`,
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
                  fontSize: "clamp(18px,2.6vw,34px)", fontWeight: 200,
                  color: "rgba(255,255,255,0.8)", letterSpacing: "0.06em",
                  opacity: wordCount > i ? 1 : 0,
                  animation: wordCount > i ? `oltWordIn 0.35s ${EASE} both` : "none",
                }}>{word}</span>
              ))}
            </div>
            {/* line 2 */}
            <div>
              {["one","last","thing."].map((word, i) => (
                <span key={i} style={{
                  display: "inline-block",
                  margin: "0 0.25em",
                  fontSize: "clamp(24px,3.4vw,46px)", fontWeight: 100,
                  color: "#fff", letterSpacing: "0.10em",
                  opacity: wordCount > 4 + i ? 1 : 0,
                  animation: wordCount > 4 + i ? `oltWordIn 0.3s ${EASE} both` : "none",
                }}>{word}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Scene 3: Reveal ── */}
        <div style={sceneStyle(3)}>
          <div style={{ position: "relative" }}>
            {/* main text — character by character */}
            <div style={{
              fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif",
              fontSize: "clamp(52px,9vw,120px)", fontWeight: 100,
              letterSpacing: "-0.03em", color: "#fff", lineHeight: 1,
              userSelect: "none", whiteSpace: "nowrap",
              opacity: revealIn ? 1 : 0,
              transition: `opacity 0.3s ${EASE}`,
            }}>
              {REVEAL_TEXT.split("").map((char, i) => (
                <span key={i} style={{
                  display: "inline-block",
                  opacity:    revealChars > i ? 1 : 0,
                  transform:  revealChars > i ? "translateY(0)" : "translateY(-10px)",
                  filter:     revealChars > i ? "blur(0)" : "blur(3px)",
                  transition: `opacity 0.18s ${EASE}, transform 0.18s ${EASE}, filter 0.18s ${EASE}`,
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

            {/* glitch overlay */}
            {glitch && (
              <div style={{
                position: "absolute", inset: 0,
                fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif",
                fontSize: "clamp(52px,9vw,120px)", fontWeight: 100,
                letterSpacing: "-0.03em", color: "rgba(255,77,148,0.8)", lineHeight: 1,
                whiteSpace: "nowrap",
                animation: `oltGlitch 0.18s steps(3) both`,
                pointerEvents: "none",
              }}>{REVEAL_TEXT}</div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          position: "absolute", bottom: "clamp(28px,4vw,48px)", left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'SF Mono','Fira Code',monospace",
          fontSize: "clamp(9px,0.9vw,11px)", fontWeight: 300, letterSpacing: "0.24em",
          color: "rgba(255,255,255,0.15)", textTransform: "uppercase",
          whiteSpace: "nowrap", zIndex: 20, pointerEvents: "none",
          opacity: footerIn ? 1 : 0,
          transition: `opacity 1s ${EASE}`,
        }}>You know who you are.</div>

        {/* ── Fade to black ── */}
        <div style={{
          position: "absolute", inset: 0, background: "#000", zIndex: 50,
          pointerEvents: "none",
          opacity:    fadeOut ? 1 : 0,
          transition: `opacity 2s ${EASE}`,
        }} />

      </div>
    </>
  );
}