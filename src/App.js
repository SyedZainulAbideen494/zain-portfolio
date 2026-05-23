import { useState, useEffect, useRef, useCallback } from "react";

/* ─── AUDIO ENGINE ──────────────────────────────────── */
let audioCtx = null;
const getAudio = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
};

const playTone = (freq, type, duration, vol = 0.08, attack = 0.01, decay = 0.1) => {
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

const soundHover = () => playTone(880, "sine", 0.12, 0.04);
const soundClick = () => {
  playTone(660, "sine", 0.18, 0.07);
  setTimeout(() => playTone(880, "sine", 0.14, 0.04), 60);
};
const soundSwitch = () => {
  playTone(440, "sine", 0.3, 0.06);
  setTimeout(() => playTone(660, "triangle", 0.25, 0.05), 80);
};
const soundGlitch = () => {
  playTone(120 + Math.random() * 80, "sawtooth", 0.08, 0.03);
};
const soundIntro = () => {
  [220, 330, 440, 660].forEach((f, i) =>
    setTimeout(() => playTone(f, "sine", 0.6, 0.05), i * 180)
  );
};

/* ─── HELPERS ────────────────────────────────────────── */
const mobile = () => typeof window !== "undefined" && window.innerWidth < 768;

const useMousePos = () => {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  useEffect(() => {
    const h = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return pos;
};

/* ─── CONSTELLATION ──────────────────────────────────── */
const Constellation = () => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const N = mobile() ? 40 : 80;
    let W, H, stars;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      stars = Array.from({ length: N }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.2 + 0.3,
        o: Math.random() * 0.5 + 0.1,
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const t = Date.now() * 0.001;
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      stars.forEach((s) => {
        s.pulse += 0.012;
        const pulseO = s.o + Math.sin(s.pulse) * 0.15;

        // mouse repel
        const dx = s.x - mx, dy = s.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120 * 0.3;
          s.vx += (dx / dist) * force;
          s.vy += (dy / dist) * force;
        }
        s.vx *= 0.99; s.vy *= 0.99;
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${pulseO})`;
        ctx.fill();
      });

      // connections
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 120) * 0.08})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };

    const onMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", resize);
    resize(); draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
};

/* ─── RIPPLE SYSTEM ──────────────────────────────────── */
const RippleLayer = ({ ripples }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 5, pointerEvents: "none" }}>
    {ripples.map((r) => (
      <div key={r.id} style={{
        position: "absolute",
        left: r.x, top: r.y,
        width: 0, height: 0,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.3)",
        transform: "translate(-50%,-50%)",
        animation: "rippleOut 0.8s cubic-bezier(0,0.5,0.5,1) forwards",
      }} />
    ))}
  </div>
);

/* ─── SCANLINES ──────────────────────────────────────── */
const Scanlines = () => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none",
    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
    animation: "scanMove 8s linear infinite",
  }} />
);

/* ─── NOISE ──────────────────────────────────────────── */
const Noise = () => (
  <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", opacity: 0.04, pointerEvents: "none", zIndex: 1 }}>
    <filter id="fn"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
    <rect width="100%" height="100%" filter="url(#fn)" />
  </svg>
);

/* ─── GLOW ORBS ──────────────────────────────────────── */
const GlowOrbs = () => (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
    {[
      { w: 700, h: 700, top: "5%", left: "15%", anim: "drift1 28s", blur: 50, o: 0.028 },
      { w: 500, h: 500, bottom: "10%", right: "10%", anim: "drift2 35s", blur: 60, o: 0.022 },
      { w: 350, h: 350, top: "45%", left: "55%", anim: "drift3 22s", blur: 35, o: 0.018 },
      { w: 250, h: 250, top: "20%", right: "30%", anim: "drift4 18s", blur: 25, o: 0.015 },
    ].map((orb, i) => (
      <div key={i} style={{
        position: "absolute",
        width: orb.w, height: orb.h,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(255,255,255,${orb.o}) 0%, transparent 70%)`,
        top: orb.top, left: orb.left, bottom: orb.bottom, right: orb.right,
        animation: `${orb.anim} ease-in-out infinite alternate`,
        filter: `blur(${orb.blur}px)`,
      }} />
    ))}
  </div>
);

/* ─── CUSTOM CURSOR ──────────────────────────────────── */
const Cursor = ({ pos, hover, click }) => {
  const [trail, setTrail] = useState([]);
  const trailRef = useRef([]);
  useEffect(() => {
    trailRef.current.push({ ...pos, id: Date.now() });
    if (trailRef.current.length > 6) trailRef.current.shift();
    setTrail([...trailRef.current]);
  }, [pos.x, pos.y]);

  if (mobile()) return null;
  return (
    <>
      {trail.map((t, i) => (
        <div key={t.id} style={{
          position: "fixed", left: t.x, top: t.y,
          width: 3 + i, height: 3 + i,
          borderRadius: "50%",
          background: `rgba(255,255,255,${0.04 * i})`,
          transform: "translate(-50%,-50%)",
          pointerEvents: "none", zIndex: 9990,
        }} />
      ))}
      <div style={{
        position: "fixed", left: pos.x, top: pos.y,
        width: hover ? 44 : 14, height: hover ? 44 : 14,
        borderRadius: "50%",
        border: `1px solid rgba(255,255,255,${hover ? 0.5 : 0.7})`,
        transform: "translate(-50%,-50%)",
        transition: "width 0.4s cubic-bezier(0.34,1.56,0.64,1), height 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        pointerEvents: "none", zIndex: 9998,
        boxShadow: hover ? "0 0 20px rgba(255,255,255,0.15), inset 0 0 10px rgba(255,255,255,0.05)" : "0 0 8px rgba(255,255,255,0.1)",
        opacity: click ? 0.3 : 1,
        backdropFilter: hover ? "blur(2px)" : "none",
      }} />
      <div style={{
        position: "fixed", left: pos.x, top: pos.y,
        width: 4, height: 4, borderRadius: "50%",
        background: "white", transform: "translate(-50%,-50%)",
        pointerEvents: "none", zIndex: 9999,
        boxShadow: "0 0 8px rgba(255,255,255,0.9)",
      }} />
    </>
  );
};

/* ─── GLITCH TEXT ────────────────────────────────────── */
const GlitchText = ({ text, style }) => {
  const [glitching, setGlitching] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        setGlitching(true);
        soundGlitch();
        setTimeout(() => setGlitching(false), 120 + Math.random() * 100);
      }
    }, 3000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: "relative", ...style }}>
      <span style={{ position: "relative", zIndex: 2 }}>{text}</span>
      {glitching && <>
        <span style={{
          position: "absolute", top: 0, left: 0, width: "100%",
          color: "rgba(255,255,255,0.7)",
          clipPath: "polygon(0 20%, 100% 20%, 100% 40%, 0 40%)",
          transform: `translateX(${(Math.random() - 0.5) * 12}px)`,
          zIndex: 3,
        }}>{text}</span>
        <span style={{
          position: "absolute", top: 0, left: 0, width: "100%",
          color: "rgba(255,255,255,0.5)",
          clipPath: "polygon(0 60%, 100% 60%, 100% 80%, 0 80%)",
          transform: `translateX(${(Math.random() - 0.5) * -8}px)`,
          zIndex: 3,
        }}>{text}</span>
      </>}
    </div>
  );
};

/* ─── TYPEWRITER ─────────────────────────────────────── */
const Typewriter = ({ phrases, style }) => {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const phrase = phrases[idx];
    if (!deleting && displayed.length < phrase.length) {
      const t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 80);
      return () => clearTimeout(t);
    } else if (!deleting && displayed.length === phrase.length) {
      const t = setTimeout(() => setDeleting(true), 2800);
      return () => clearTimeout(t);
    } else if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
      return () => clearTimeout(t);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx((i) => (i + 1) % phrases.length);
    }
  }, [displayed, deleting, idx, phrases]);

  return (
    <div style={style}>
      {displayed}
      <span style={{ animation: "blink 1s step-end infinite", opacity: 0.5 }}>_</span>
    </div>
  );
};

/* ─── MOUSE GLOW ─────────────────────────────────────── */
const MouseGlow = ({ pos }) => (
  <div style={{
    position: "fixed", left: pos.x, top: pos.y,
    width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.045) 0%, transparent 65%)",
    transform: "translate(-50%,-50%)",
    pointerEvents: "none", zIndex: 0,
    filter: "blur(30px)",
    transition: "left 0.12s ease-out, top 0.12s ease-out",
  }} />
);

/* ─── CLOCK ──────────────────────────────────────────── */
const Clock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = (n) => String(n).padStart(2, "0");
  return (
    <div style={{
      position: "fixed", top: 24, right: 28, zIndex: 50,
      fontFamily: "'SF Mono', 'Fira Code', monospace",
      fontSize: "clamp(10px,1vw,11px)",
      letterSpacing: "0.18em",
      color: "rgba(255,255,255,0.2)",
      fontWeight: 300,
    }}>
      {fmt(time.getHours())}:{fmt(time.getMinutes())}:{fmt(time.getSeconds())}
    </div>
  );
};

/* ─── STATUS BAR ─────────────────────────────────────── */
const StatusBar = ({ page }) => {
  const labels = { home: "SYS·HOME", instagram: "SYS·SOCIAL", spotify: "SYS·AUDIO" };
  return (
    <div style={{
      position: "fixed", top: 24, left: 28, zIndex: 50,
      fontFamily: "'SF Mono', 'Fira Code', monospace",
      fontSize: "clamp(9px,0.9vw,10px)",
      letterSpacing: "0.22em",
      color: "rgba(255,255,255,0.18)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{
        width: 5, height: 5, borderRadius: "50%",
        background: "rgba(255,255,255,0.4)",
        animation: "blink 2s ease-in-out infinite",
        boxShadow: "0 0 6px rgba(255,255,255,0.4)",
      }} />
      {labels[page] || "SYS·ONLINE"}
    </div>
  );
};

/* ─── HOME PAGE ──────────────────────────────────────── */
const HomePage = ({ visible }) => {
  const [time, setTime] = useState("");

const phrases = [
  "connected",
  "signal stable",
  "standby mode",
  "ready",
];

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    updateClock();

    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* INLINE ANIMATIONS */}
      <style>
        {`
          @keyframes pulseGlow {
            0% {
              opacity: 0.08;
              transform: scale(0.96);
            }

            50% {
              opacity: 0.16;
              transform: scale(1.03);
            }

            100% {
              opacity: 0.08;
              transform: scale(0.96);
            }
          }

          @keyframes floatOrb {
            0% {
              transform: translate(0px,0px);
            }

            50% {
              transform: translate(12px,-10px);
            }

            100% {
              transform: translate(0px,0px);
            }
          }

          @keyframes fadeSlide {
            from {
              opacity: 0;
              transform: translateY(16px);
            }

            to {
              opacity: 1;
              transform: translateY(0px);
            }
          }

          @keyframes scan {
            0% {
              transform: translateX(-120%);
              opacity: 0;
            }

            40% {
              opacity: 0.08;
            }

            100% {
              transform: translateX(220%);
              opacity: 0;
            }
          }
        `}
      </style>

      <div
        style={{
          width: "100%",
          height: "100%",

          display: "flex",
          flexDirection: "column",

          alignItems: "center",
          justifyContent: "center",

          position: "relative",
          overflow: "hidden",

          padding: "clamp(20px,4vw,40px)",

          gap: "clamp(10px,1.8vw,18px)",

          opacity: visible ? 1 : 0,

          filter: visible ? "blur(0px)" : "blur(12px)",

          transform: visible
            ? "scale(1) translateY(0px)"
            : "scale(0.98) translateY(10px)",

          transition:
            "opacity 1s cubic-bezier(0.16,1,0.3,1), filter 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* SMALL AMBIENT GLOW */}
        <div
          style={{
            position: "absolute",

            width: "min(58vw, 520px)",
            height: "min(58vw, 520px)",

            borderRadius: "50%",

            background: "rgba(255,255,255,0.025)",

            filter: "blur(120px)",

            animation: "floatOrb 14s ease-in-out infinite",
          }}
        />

        {/* OUTER RING */}
        <div
          style={{
            position: "absolute",

            width: "clamp(180px,38vw,360px)",
            height: "clamp(180px,38vw,360px)",

            borderRadius: "50%",

            border: "1px solid rgba(255,255,255,0.04)",

            animation: "spinSlow 40s linear infinite",

            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",

              top: -2,
              left: "50%",

              width: 5,
              height: 5,

              borderRadius: "50%",

              background: "rgba(255,255,255,0.4)",

              transform: "translateX(-50%)",

              boxShadow: "0 0 8px rgba(255,255,255,0.35)",
            }}
          />
        </div>

        {/* SUBTLE SCAN LINE */}
        <div
          style={{
            position: "absolute",

            width: "28vw",
            height: 1,

            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)",

            animation: "scan 8s ease-in-out infinite",

            top: "50%",
          }}
        />

        {/* TOP STATUS */}
        <div
          style={{
            position: "absolute",

            top: "clamp(18px,3vw,28px)",

            display: "flex",
            alignItems: "center",

            gap: 10,

            opacity: 0.7,

            animation: "fadeSlide 1.2s 0.2s both",
          }}
        >
          <div
            style={{
              width: 4,
              height: 4,

              borderRadius: "50%",

              background: "rgba(255,255,255,0.6)",

              boxShadow: "0 0 8px rgba(255,255,255,0.25)",

              animation: "pulseGlow 3s ease-in-out infinite",
            }}
          />

          <div
            style={{
              fontFamily: "'SF Mono', monospace",

              fontSize: "9px",

              letterSpacing: "0.22em",

              color: "rgba(255,255,255,0.14)",

              textTransform: "uppercase",
            }}
          >
            online
          </div>
        </div>

        {/* TITLE */}
        <GlitchText
          text="zain"
          style={{
            fontFamily:
              "'SF Pro Display', 'Helvetica Neue', sans-serif",

            fontSize: "clamp(68px,16vw,170px)",

            fontWeight: 100,

            letterSpacing: "-0.06em",

            color: "rgba(255,255,255,0.96)",

            lineHeight: 0.9,

            textAlign: "center",

            userSelect: "none",

            zIndex: 2,

            animation: "breathe 7s ease-in-out infinite",

            textShadow: `
              0 0 60px rgba(255,255,255,0.08),
              0 0 120px rgba(255,255,255,0.03)
            `,
          }}
        />

        {/* TYPEWRITER */}
        <Typewriter
          phrases={phrases}
          style={{
            fontFamily: "'SF Mono', monospace",

            fontSize: "clamp(9px,1vw,11px)",

            fontWeight: 300,

            letterSpacing: "0.22em",

            color: "rgba(255,255,255,0.18)",

            textTransform: "lowercase",

            textAlign: "center",

            minHeight: "1.2em",

            zIndex: 2,

            animation: "fadeSlide 1.2s 0.4s both",
          }}
        />

        {/* MINIMAL TIME PILL */}
        <div
          style={{
            marginTop: "4px",

            display: "flex",
            alignItems: "center",

            gap: 8,

            padding: "7px 12px",

            borderRadius: 999,

            background: "rgba(255,255,255,0.025)",

            border: "1px solid rgba(255,255,255,0.05)",

            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",

            animation: "fadeSlide 1.2s 0.8s both",

            zIndex: 3,
          }}
        >
          <div
            style={{
              width: 4,
              height: 4,

              borderRadius: "50%",

              background: "rgba(255,255,255,0.4)",

              boxShadow: "0 0 6px rgba(255,255,255,0.25)",
            }}
          />

          <div
            style={{
              fontFamily: "'SF Mono', monospace",

              fontSize: "9px",

              letterSpacing: "0.18em",

              color: "rgba(255,255,255,0.24)",

              textTransform: "uppercase",
            }}
          >
            {time}
          </div>
        </div>
      </div>
    </>
  );
};

/* ─── INSTAGRAM PAGE ─────────────────────────────────── */
const InstagramPage = ({ visible }) => {
  const [hov, setHov] = useState(false);
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "100%", gap: 32,
      opacity: visible ? 1 : 0,
      filter: visible ? "blur(0)" : "blur(14px)",
      transform: visible ? "scale(1)" : "scale(0.96)",
      transition: "opacity 0.9s cubic-bezier(0.16,1,0.3,1), filter 0.9s, transform 0.9s",
    }}>
      {/* Rotating border ring around icon */}
      <div style={{ position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          position: "absolute", inset: -12,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.1)",
          animation: "spinSlow 12s linear infinite",
        }}>
          <div style={{
            position: "absolute", top: -2, left: "50%",
            width: 4, height: 4, borderRadius: "50%",
            background: "rgba(255,255,255,0.5)",
            transform: "translateX(-50%)",
            boxShadow: "0 0 8px rgba(255,255,255,0.6)",
          }} />
        </div>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.8, animation: "breathe 5s ease-in-out infinite" }}>
          <rect x="2" y="2" width="20" height="20" rx="6" stroke="white" strokeWidth="1.1" />
          <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.1" />
          <circle cx="17.2" cy="6.8" r="0.9" fill="white" />
        </svg>
      </div>

      <div style={{
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        fontSize: "clamp(9px,1vw,10px)",
        letterSpacing: "0.3em", color: "rgba(255,255,255,0.2)",
        textTransform: "uppercase",
      }}>instagram</div>

      <div style={{
        fontFamily: "'SF Pro Display', 'Helvetica Neue', Helvetica, sans-serif",
        fontSize: "clamp(13px,1.8vw,16px)",
        color: "rgba(255,255,255,0.08)",
        letterSpacing: "0.08em", fontWeight: 200,
        animation: "blink 3s ease-in-out infinite",
      }}>@_zainn.27</div>

      <button
        onMouseEnter={() => { setHov(true); soundHover(); }}
        onMouseLeave={() => setHov(false)}
        onClick={() => { soundClick(); window.open("https://instagram.com/_zainn.27", "_blank"); }}
        style={{
          background: hov ? "rgba(255,255,255,0.07)" : "transparent",
          border: `1px solid rgba(255,255,255,${hov ? 0.3 : 0.15})`,
          borderRadius: 2,
          padding: "12px 40px",
          color: `rgba(255,255,255,${hov ? 0.9 : 0.5})`,
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          fontSize: "clamp(9px,1vw,10px)",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          fontWeight: 400,
          cursor: "pointer",
          transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
          transform: hov ? "scale(1.04) translateY(-2px)" : "scale(1)",
          boxShadow: hov ? "0 8px 30px rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.06)" : "none",
        }}>
        open profile ↗
      </button>
    </div>
  );
};

/* ─── SPOTIFY PAGE ───────────────────────────────────── */
const SpotifyPage = ({ visible }) => {
  const [hov, setHov] = useState(false);

  const bars = Array.from({ length: 84 }, (_, i) => {
    const center = 42;
    const distance = Math.abs(i - center);

    return {
      id: i,
      height:
        14 +
        Math.sin(i * 0.25) * 24 +
        Math.cos(i * 0.14) * 14 +
        Math.random() * 10 -
        distance * 0.24,

      delay: i * 0.025,
      duration: 1.4 + (i % 6) * 0.18,
      opacity: 0.04 + (1 - distance / center) * 0.12,
    };
  });

  return (
    <>
      {/* INLINE ANIMATIONS */}
      <style>
        {`
          @keyframes musicWave {
            0% {
              transform: scaleY(0.35);
              opacity: 0.04;
            }

            50% {
              transform: scaleY(1);
              opacity: 0.18;
            }

            100% {
              transform: scaleY(0.45);
              opacity: 0.06;
            }
          }

          @keyframes pulseRing {
            0% {
              transform: scale(0.96);
              opacity: 0.1;
            }

            50% {
              transform: scale(1.04);
              opacity: 0.22;
            }

            100% {
              transform: scale(0.96);
              opacity: 0.1;
            }
          }

          @keyframes fadePulse {
            0% {
              opacity: 0.04;
              transform: translateY(0px);
            }

            50% {
              opacity: 0.12;
              transform: translateY(-2px);
            }

            100% {
              opacity: 0.04;
              transform: translateY(0px);
            }
          }

          @keyframes floatSlow {
            0% {
              transform: translate(0px, 0px);
            }

            50% {
              transform: translate(20px, -14px);
            }

            100% {
              transform: translate(0px, 0px);
            }
          }
        `}
      </style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",

          height: "100%",
          width: "100%",

          position: "relative",
          overflow: "hidden",

          gap: 34,

          opacity: visible ? 1 : 0,
          filter: visible ? "blur(0px)" : "blur(16px)",
          transform: visible ? "scale(1)" : "scale(0.97)",

          transition:
            "opacity 1s cubic-bezier(0.16,1,0.3,1), filter 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* AMBIENT BACK LIGHT */}
        <div
          style={{
            position: "absolute",

            width: "42vw",
            height: "42vw",

            borderRadius: "50%",

            background: "rgba(255,255,255,0.03)",

            filter: "blur(120px)",

            animation: "floatSlow 14s ease-in-out infinite",
          }}
        />

        {/* MUSIC RHYTHM */}
        <div
          style={{
            position: "absolute",
            inset: 0,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: "min(78vw, 760px)",
              height: "240px",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              gap: "clamp(2px,0.4vw,4px)",

              transform: "translateY(-8px)",

              maskImage:
                "radial-gradient(circle at center, black 10%, transparent 78%)",

              WebkitMaskImage:
                "radial-gradient(circle at center, black 10%, transparent 78%)",
            }}
          >
            {bars.map((bar) => (
              <div
                key={bar.id}
                style={{
                  width: "clamp(2px,0.3vw,4px)",

                  height: `${Math.max(bar.height, 6)}px`,

                  background:
                    "linear-gradient(to top, rgba(255,255,255,0.02), rgba(255,255,255,0.16), rgba(255,255,255,0.02))",

                  borderRadius: "999px",

                  opacity: bar.opacity,

                  animation: `musicWave ${bar.duration}s ${bar.delay}s ease-in-out infinite alternate`,

                  transformOrigin: "center bottom",

                  boxShadow: `
                    0 0 12px rgba(255,255,255,0.05),
                    0 0 28px rgba(255,255,255,0.02)
                  `,
                }}
              />
            ))}
          </div>
        </div>

        {/* LOGO */}
        <div
          style={{
            position: "relative",

            width: 150,
            height: 150,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* ROTATING OUTER RING */}
          <div
            style={{
              position: "absolute",
              inset: 0,

              borderRadius: "50%",

              border: "1px solid rgba(255,255,255,0.08)",

              background: `
                radial-gradient(circle at top,
                rgba(255,255,255,0.04),
                transparent 65%)
              `,

              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",

              animation: "spinSlow 22s linear infinite",
            }}
          />

          {/* PULSE RING */}
          <div
            style={{
              position: "absolute",
              inset: -12,

              borderRadius: "50%",

              border: "1px solid rgba(255,255,255,0.04)",

              animation: "pulseRing 4s ease-in-out infinite",
            }}
          />

          {/* INNER GLOW */}
          <div
            style={{
              position: "absolute",

              width: "74%",
              height: "74%",

              borderRadius: "50%",

              background: `
                radial-gradient(circle,
                rgba(255,255,255,0.08),
                rgba(255,255,255,0.01))
              `,

              filter: "blur(18px)",
            }}
          />

          {/* SPOTIFY ICON */}
          <svg
            width="78"
            height="78"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              opacity: 0.92,

              zIndex: 5,

              animation: "breathe 5s ease-in-out infinite",

              filter: "drop-shadow(0 0 18px rgba(255,255,255,0.12))",
            }}
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="white"
              strokeWidth="1"
            />

            <path
              d="M7 9.5c3-1.2 6.5-1 9 0.8"
              stroke="white"
              strokeWidth="1.15"
              strokeLinecap="round"
            />

            <path
              d="M7.5 12.5c2.5-1 5.5-0.8 7.5 0.7"
              stroke="white"
              strokeWidth="1.15"
              strokeLinecap="round"
            />

            <path
              d="M8 15.5c2-0.8 4.5-0.6 6 0.5"
              stroke="white"
              strokeWidth="1.15"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* TEXT */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",

            alignItems: "center",

            gap: 12,

            zIndex: 5,
          }}
        >
          <div
            style={{
              fontFamily: "'SF Mono', monospace",

              fontSize: "clamp(9px,1vw,10px)",

              letterSpacing: "0.34em",

              color: "rgba(255,255,255,0.22)",

              textTransform: "uppercase",
            }}
          >
            spotify
          </div>

          <div
            style={{
              fontFamily:
                "'SF Pro Display', 'Helvetica Neue', sans-serif",

              fontSize: "clamp(12px,1.6vw,15px)",

              color: "rgba(255,255,255,0.08)",

              letterSpacing: "0.12em",

              fontWeight: 200,

              animation: "fadePulse 5s ease-in-out infinite",
            }}
          >
            frequencies in silence
          </div>
        </div>

        {/* BUTTON */}
        <button
          onMouseEnter={() => {
            setHov(true);
            soundHover?.();
          }}

          onMouseLeave={() => setHov(false)}

          onClick={() => {
            soundClick?.();
            window.open("https://open.spotify.com/user/zain54678?si=382e2cc307704563", "_blank");
          }}

          style={{
            zIndex: 10,

            background: hov
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.02)",

            border: `1px solid rgba(255,255,255,${
              hov ? 0.22 : 0.1
            })`,

            borderRadius: 999,

            padding: "14px 40px",

            color: `rgba(255,255,255,${
              hov ? 0.92 : 0.52
            })`,

            fontFamily: "'SF Mono', monospace",

            fontSize: "clamp(9px,1vw,10px)",

            letterSpacing: "0.24em",

            textTransform: "uppercase",

            cursor: "pointer",

            transition:
              "all 0.5s cubic-bezier(0.16,1,0.3,1)",

            transform: hov
              ? "translateY(-3px) scale(1.04)"
              : "translateY(0px) scale(1)",

            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",

            boxShadow: hov
              ? `
                0 10px 40px rgba(255,255,255,0.06),
                inset 0 1px 0 rgba(255,255,255,0.08)
              `
              : "none",
          }}
        >
          listen now ↗
        </button>
      </div>
    </>
  );
};
/* ─── DOCK ───────────────────────────────────────────── */
const DockBtn = ({ label, active, onClick, children }) => {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <button
      onMouseEnter={() => { setHov(true); soundHover(); }}
      onMouseLeave={() => { setHov(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      onTouchStart={() => { setPress(true); }}
      onTouchEnd={() => { setPress(false); onClick(); }}
      onClick={onClick}
      title={label}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div style={{
        width: "clamp(46px,8vw,54px)", height: "clamp(46px,8vw,54px)",
        borderRadius: "clamp(13px,2.5vw,17px)",
        background: active ? "rgba(255,255,255,0.14)" : hov ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)",
        border: `1px solid rgba(255,255,255,${active ? 0.28 : hov ? 0.18 : 0.09})`,
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: press ? "scale(0.86)" : hov ? "scale(1.18) translateY(-8px)" : "scale(1)",
        transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: hov
          ? "0 10px 40px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)"
          : active
            ? "0 4px 20px rgba(255,255,255,0.06)"
            : "0 2px 10px rgba(0,0,0,0.4)",
      }}>
        {children}
      </div>
      <div style={{
        width: active ? 4 : hov ? 2 : 0,
        height: active ? 4 : hov ? 2 : 0,
        borderRadius: "50%",
        background: `rgba(255,255,255,${active ? 0.7 : 0.4})`,
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: active ? "0 0 6px rgba(255,255,255,0.5)" : "none",
      }} />
    </button>
  );
};

const Dock = ({ active, setActive }) => (
  <div style={{
    position: "fixed", bottom: "clamp(18px,4vh,34px)",
    left: "50%", transform: "translateX(-50%)", zIndex: 100,
  }}>
    <div style={{
      display: "flex", alignItems: "flex-end",
      gap: "clamp(8px,2vw,14px)",
      padding: "clamp(10px,2vw,14px) clamp(16px,3vw,22px)",
      borderRadius: "clamp(22px,4vw,30px)",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.09)",
      backdropFilter: "blur(50px)", WebkitBackdropFilter: "blur(50px)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.2)",
    }}>
     
      <DockBtn label="Instagram" active={active === "instagram"} onClick={() => { soundSwitch(); setActive("instagram"); }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="6" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="4.5" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
          <circle cx="17.2" cy="6.8" r="0.85" fill="rgba(255,255,255,0.75)" />
        </svg>
      </DockBtn>
       <DockBtn label="Home" active={active === "home"} onClick={() => { soundSwitch(); setActive("home"); }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 10.5L12 3l9 7.5V21H15v-5h-6v5H3z" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </DockBtn>
      <DockBtn label="Spotify" active={active === "spotify"} onClick={() => { soundSwitch(); setActive("spotify"); }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
          <path d="M7 9.5c3-1.2 6.5-1 9 0.8" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M7.5 12.5c2.5-1 5.5-0.8 7.5 0.7" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M8 15.5c2-0.8 4.5-0.6 6 0.5" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </DockBtn>
    </div>
  </div>
);

/* ─── APP ────────────────────────────────────────────── */
export default function App() {
  const [active, setActive] = useState("home");
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState(false);
  const [click, setClick] = useState(false);
  const [ripples, setRipples] = useState([]);
  const mousePos = useMousePos();

  useEffect(() => {
    const t = setTimeout(() => {
      setReady(true);
      soundIntro();
    }, 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (mobile()) return;
    const down = (e) => {
      setClick(true);
      const id = Date.now();
      setRipples((r) => [...r.slice(-5), { x: e.clientX, y: e.clientY, id }]);
      setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 900);
    };
    const up = () => setClick(false);
    const over = (e) => {
      const el = e.target;
      setHover(!!(el.tagName === "BUTTON" || el.tagName === "A" || el.closest("button") || el.closest("a")));
    };
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    window.addEventListener("mouseover", over);
    return () => {
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("mouseover", over);
    };
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #000; cursor: none; }
        @media (max-width: 768px) { html, body { cursor: auto; } }

        @keyframes floatUp {
          0% { transform: translateY(100vh); opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 0.8; }
          100% { transform: translateY(-40px); opacity: 0; }
        }
        @keyframes breathe {
          0%,100% { text-shadow: 0 0 80px rgba(255,255,255,0.08), 0 0 180px rgba(255,255,255,0.03); opacity: 0.93; }
          50% { text-shadow: 0 0 140px rgba(255,255,255,0.16), 0 0 280px rgba(255,255,255,0.07); opacity: 1; }
        }
        @keyframes drift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(90px,70px) scale(1.12); } }
        @keyframes drift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-70px,55px) scale(0.88); } }
        @keyframes drift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(50px,-50px) scale(1.06); } }
        @keyframes drift4 { from { transform: translate(0,0) scale(1); } to { transform: translate(-40px,40px) scale(0.92); } }
        @keyframes wave {
          from { transform: scaleY(0.4); opacity: 0.04; }
          to { transform: scaleY(1); opacity: 0.1; }
        }
        @keyframes blink {
          0%,100% { opacity: 1; } 50% { opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rippleOut {
          from { width: 0; height: 0; opacity: 0.5; }
          to { width: 200px; height: 200px; opacity: 0; }
        }
        @keyframes scanMove {
          from { background-position: 0 0; }
          to { background-position: 0 100%; }
        }
      `}</style>

      <Cursor pos={mousePos} hover={hover} click={click} />
      <RippleLayer ripples={ripples} />

      {/* bg */}
      <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 80% 60% at 40% 30%, rgba(18,18,18,1) 0%, #000 100%)", zIndex: 0 }} />

      <GlowOrbs />
      <Constellation />
      <Noise />
      <Scanlines />
      <MouseGlow pos={mousePos} />
      <Clock />
      <StatusBar page={active} />

      {/* pages */}
      <div style={{ position: "fixed", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: active === "home" ? "auto" : "none" }}>
            <HomePage visible={ready && active === "home"} />
          </div>
          <div style={{ position: "absolute", inset: 0, pointerEvents: active === "instagram" ? "auto" : "none" }}>
            <InstagramPage visible={active === "instagram"} />
          </div>
          <div style={{ position: "absolute", inset: 0, pointerEvents: active === "spotify" ? "auto" : "none" }}>
            <SpotifyPage visible={active === "spotify"} />
          </div>
        </div>
      </div>

      <Dock active={active} setActive={setActive} />
    </>
  );
}