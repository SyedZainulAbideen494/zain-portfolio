import { useState, useEffect, useRef, useCallback } from "react";
import img1 from "./gallery/1000067112.JPG";
import img2 from "./gallery/1000106524.JPG";
import img3 from "./gallery/1000111846.JPG";
import img4 from "./gallery/1000111857.JPG";
import img5 from "./gallery/cpm35 2026-03-22 143346C2467C7BE316.JPG";
import img6 from "./gallery/cpm35 2026-03-24 100412B20505A15C86.JPG";
import img7 from "./gallery/IMG_2184.JPG";
import img8 from "./gallery/IMG_2762.JPG";
import img9 from "./gallery/IMG_4190.jpg";
/* ─── AUDIO ENGINE ──────────────────────────────────── */
let audioCtx = null;
const getAudio = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
};
const playTone = (freq, type, duration, vol = 0.08, attack = 0.01) => {
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
const soundClick = () => { playTone(660, "sine", 0.18, 0.07); setTimeout(() => playTone(880, "sine", 0.14, 0.04), 60); };
const soundSwitch = () => { playTone(440, "sine", 0.3, 0.06); setTimeout(() => playTone(660, "triangle", 0.25, 0.05), 80); };
const soundGlitch = () => { playTone(120 + Math.random() * 80, "sawtooth", 0.08, 0.03); };
const soundIntro = () => { [220, 330, 440, 660].forEach((f, i) => setTimeout(() => playTone(f, "sine", 0.6, 0.05), i * 180)); };
const soundGalleryOpen = () => { [330, 440, 550, 660, 880].forEach((f, i) => setTimeout(() => playTone(f, "sine", 0.8, 0.04), i * 120)); };
const soundImageOpen = () => { playTone(550, "sine", 0.5, 0.06); setTimeout(() => playTone(770, "sine", 0.4, 0.04), 100); };
const soundMemoryMode = () => { [220, 277, 330, 415, 554].forEach((f, i) => setTimeout(() => playTone(f, "sine", 1.2, 0.03), i * 300)); };
const soundNowPlaying = () => { [440, 554, 659].forEach((f, i) => setTimeout(() => playTone(f, "sine", 0.9, 0.04), i * 150)); };

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
const Constellation = ({ intensity = 1 }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const intensityRef = useRef(intensity);
  useEffect(() => { intensityRef.current = intensity; }, [intensity]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const N = mobile() ? 40 : 80;
    let W, H, stars;
    const resize = () => {
      W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight;
      stars = Array.from({ length: N }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18, r: Math.random() * 1.2 + 0.3, o: Math.random() * 0.5 + 0.1, pulse: Math.random() * Math.PI * 2 }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      const int = intensityRef.current;
      stars.forEach((s) => {
        s.pulse += 0.012;
        const pulseO = (s.o + Math.sin(s.pulse) * 0.15) * int;
        const dx = s.x - mx, dy = s.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) { const force = (120 - dist) / 120 * 0.3; s.vx += (dx / dist) * force; s.vy += (dy / dist) * force; }
        s.vx *= 0.99; s.vy *= 0.99;
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${pulseO})`; ctx.fill();
      });
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x, dy = stars[i].y - stars[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) { ctx.beginPath(); ctx.moveTo(stars[i].x, stars[i].y); ctx.lineTo(stars[j].x, stars[j].y); ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 120) * 0.08 * int})`; ctx.lineWidth = 0.5; ctx.stroke(); }
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };
    const onMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove); window.addEventListener("resize", resize);
    resize(); draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("mousemove", onMove); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
};

/* ─── SHARED UI ──────────────────────────────────────── */
const RippleLayer = ({ ripples }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 5, pointerEvents: "none" }}>
    {ripples.map((r) => (<div key={r.id} style={{ position: "absolute", left: r.x, top: r.y, width: 0, height: 0, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.3)", transform: "translate(-50%,-50%)", animation: "rippleOut 0.8s cubic-bezier(0,0.5,0.5,1) forwards" }} />))}
  </div>
);
const Scanlines = () => (<div style={{ position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none", background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)", animation: "scanMove 8s linear infinite" }} />);
const Noise = () => (<svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", opacity: 0.04, pointerEvents: "none", zIndex: 1 }}><filter id="fn"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter="url(#fn)" /></svg>);
const GlowOrbs = () => (<div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>{[{ w: 700, h: 700, top: "5%", left: "15%", anim: "drift1 28s", blur: 50, o: 0.028 }, { w: 500, h: 500, bottom: "10%", right: "10%", anim: "drift2 35s", blur: 60, o: 0.022 }, { w: 350, h: 350, top: "45%", left: "55%", anim: "drift3 22s", blur: 35, o: 0.018 }, { w: 250, h: 250, top: "20%", right: "30%", anim: "drift4 18s", blur: 25, o: 0.015 }].map((orb, i) => (<div key={i} style={{ position: "absolute", width: orb.w, height: orb.h, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,255,255,${orb.o}) 0%, transparent 70%)`, top: orb.top, left: orb.left, bottom: orb.bottom, right: orb.right, animation: `${orb.anim} ease-in-out infinite alternate`, filter: `blur(${orb.blur}px)` }} />))}</div>);

const Cursor = ({ pos, hover, click }) => {
  const [trail, setTrail] = useState([]);
  const trailRef = useRef([]);
  useEffect(() => {
    trailRef.current.push({ x: pos.x, y: pos.y, id: Date.now() });
    if (trailRef.current.length > 6) trailRef.current.shift();
    setTrail([...trailRef.current]);
  }, [pos]);
  if (mobile()) return null;
  return (<>
    {trail.map((t, i) => (<div key={t.id} style={{ position: "fixed", left: t.x, top: t.y, width: 3 + i, height: 3 + i, borderRadius: "50%", background: `rgba(255,255,255,${0.04 * i})`, transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 9990 }} />))}
    <div style={{ position: "fixed", left: pos.x, top: pos.y, width: hover ? 44 : 14, height: hover ? 44 : 14, borderRadius: "50%", border: `1px solid rgba(255,255,255,${hover ? 0.5 : 0.7})`, transform: "translate(-50%,-50%)", transition: "width 0.4s cubic-bezier(0.34,1.56,0.64,1), height 0.4s cubic-bezier(0.34,1.56,0.64,1)", pointerEvents: "none", zIndex: 9998, boxShadow: hover ? "0 0 20px rgba(255,255,255,0.15), inset 0 0 10px rgba(255,255,255,0.05)" : "0 0 8px rgba(255,255,255,0.1)", opacity: click ? 0.3 : 1, backdropFilter: hover ? "blur(2px)" : "none" }} />
    <div style={{ position: "fixed", left: pos.x, top: pos.y, width: 4, height: 4, borderRadius: "50%", background: "white", transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 9999, boxShadow: "0 0 8px rgba(255,255,255,0.9)" }} />
  </>);
};

const GlitchText = ({ text, style }) => {
  const [glitching, setGlitching] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => { if (Math.random() < 0.15) { setGlitching(true); soundGlitch(); setTimeout(() => setGlitching(false), 120 + Math.random() * 100); } }, 3000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, []);
  return (<div style={{ position: "relative", ...style }}>
    <span style={{ position: "relative", zIndex: 2 }}>{text}</span>
    {glitching && <><span style={{ position: "absolute", top: 0, left: 0, width: "100%", color: "rgba(255,255,255,0.7)", clipPath: "polygon(0 20%, 100% 20%, 100% 40%, 0 40%)", transform: `translateX(${(Math.random() - 0.5) * 12}px)`, zIndex: 3 }}>{text}</span><span style={{ position: "absolute", top: 0, left: 0, width: "100%", color: "rgba(255,255,255,0.5)", clipPath: "polygon(0 60%, 100% 60%, 100% 80%, 0 80%)", transform: `translateX(${(Math.random() - 0.5) * -8}px)`, zIndex: 3 }}>{text}</span></>}
  </div>);
};

const Typewriter = ({ phrases, style }) => {
  const [idx, setIdx] = useState(0); const [displayed, setDisplayed] = useState(""); const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const phrase = phrases[idx];
    if (!deleting && displayed.length < phrase.length) { const t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 80); return () => clearTimeout(t); }
    else if (!deleting && displayed.length === phrase.length) { const t = setTimeout(() => setDeleting(true), 2800); return () => clearTimeout(t); }
    else if (deleting && displayed.length > 0) { const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40); return () => clearTimeout(t); }
    else if (deleting && displayed.length === 0) { setDeleting(false); setIdx((i) => (i + 1) % phrases.length); }
  }, [displayed, deleting, idx, phrases]);
  return (<div style={style}>{displayed}<span style={{ animation: "blink 1s step-end infinite", opacity: 0.5 }}>_</span></div>);
};

const MouseGlow = ({ pos }) => (<div style={{ position: "fixed", left: pos.x, top: pos.y, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.045) 0%, transparent 65%)", transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 0, filter: "blur(30px)", transition: "left 0.12s ease-out, top 0.12s ease-out" }} />);
const Clock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const fmt = (n) => String(n).padStart(2, "0");
  return (<div style={{ position: "fixed", top: 24, right: 28, zIndex: 50, fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: "clamp(10px,1vw,11px)", letterSpacing: "0.18em", color: "rgba(255,255,255,0.2)", fontWeight: 300 }}>{fmt(time.getHours())}:{fmt(time.getMinutes())}:{fmt(time.getSeconds())}</div>);
};
const StatusBar = ({ page }) => {
  const labels = { home: "SYS·HOME", instagram: "SYS·SOCIAL", spotify: "SYS·AUDIO", gallery: "SYS·GALLERY", nowplaying: "SYS·AUDIO" };
  return (<div style={{ position: "fixed", top: 24, left: 28, zIndex: 50, fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: "clamp(9px,0.9vw,10px)", letterSpacing: "0.22em", color: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.4)", animation: "blink 2s ease-in-out infinite", boxShadow: "0 0 6px rgba(255,255,255,0.4)" }} />
    {labels[page] || "SYS·ONLINE"}
  </div>);
};

/* ─── HOME PAGE ──────────────────────────────────────── */
const HomePage = ({ visible }) => {
  const [time, setTime] = useState("");
  const phrases = ["connected", "signal stable", "standby mode", "ready"];
  useEffect(() => {
    const updateClock = () => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    updateClock(); const interval = setInterval(updateClock, 1000); return () => clearInterval(interval);
  }, []);
  return (<>
    <style>{`@keyframes pulseGlow{0%{opacity:.08;transform:scale(.96)}50%{opacity:.16;transform:scale(1.03)}100%{opacity:.08;transform:scale(.96)}}@keyframes floatOrb{0%{transform:translate(0,0)}50%{transform:translate(12px,-10px)}100%{transform:translate(0,0)}}@keyframes fadeSlide{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes scan{0%{transform:translateX(-120%);opacity:0}40%{opacity:.08}100%{transform:translateX(220%);opacity:0}}`}</style>
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "clamp(20px,4vw,40px)", gap: "clamp(10px,1.8vw,18px)", opacity: visible ? 1 : 0, filter: visible ? "blur(0px)" : "blur(12px)", transform: visible ? "scale(1) translateY(0px)" : "scale(0.98) translateY(10px)", transition: "opacity 1s cubic-bezier(0.16,1,0.3,1), filter 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)" }}>
      <div style={{ position: "absolute", width: "min(58vw, 520px)", height: "min(58vw, 520px)", borderRadius: "50%", background: "rgba(255,255,255,0.025)", filter: "blur(120px)", animation: "floatOrb 14s ease-in-out infinite" }} />
      <div style={{ position: "absolute", width: "clamp(180px,38vw,360px)", height: "clamp(180px,38vw,360px)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.04)", animation: "spinSlow 40s linear infinite", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -2, left: "50%", width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.4)", transform: "translateX(-50%)", boxShadow: "0 0 8px rgba(255,255,255,0.35)" }} />
      </div>
      <div style={{ position: "absolute", width: "28vw", height: 1, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)", animation: "scan 8s ease-in-out infinite", top: "50%" }} />
      <div style={{ position: "absolute", top: "clamp(18px,3vw,28px)", display: "flex", alignItems: "center", gap: 10, opacity: 0.7, animation: "fadeSlide 1.2s 0.2s both" }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.6)", boxShadow: "0 0 8px rgba(255,255,255,0.25)", animation: "pulseGlow 3s ease-in-out infinite" }} />
        <div style={{ fontFamily: "'SF Mono', monospace", fontSize: "9px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.14)", textTransform: "uppercase" }}>online</div>
      </div>
      <GlitchText text="zain" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif", fontSize: "clamp(68px,16vw,170px)", fontWeight: 100, letterSpacing: "-0.06em", color: "rgba(255,255,255,0.96)", lineHeight: 0.9, textAlign: "center", userSelect: "none", zIndex: 2, animation: "breathe 7s ease-in-out infinite", textShadow: "0 0 60px rgba(255,255,255,0.08), 0 0 120px rgba(255,255,255,0.03)" }} />
      <Typewriter phrases={phrases} style={{ fontFamily: "'SF Mono', monospace", fontSize: "clamp(9px,1vw,11px)", fontWeight: 300, letterSpacing: "0.22em", color: "rgba(255,255,255,0.18)", textTransform: "lowercase", textAlign: "center", minHeight: "1.2em", zIndex: 2, animation: "fadeSlide 1.2s 0.4s both" }} />
      <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 999, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", animation: "fadeSlide 1.2s 0.8s both", zIndex: 3 }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.4)", boxShadow: "0 0 6px rgba(255,255,255,0.25)" }} />
        <div style={{ fontFamily: "'SF Mono', monospace", fontSize: "9px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.24)", textTransform: "uppercase" }}>{time}</div>
      </div>
    </div>
  </>);
};

/* ─── INSTAGRAM PAGE ─────────────────────────────────── */
const InstagramPage = ({ visible }) => {
  const [hov, setHov] = useState(false);
  return (<div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 32, opacity: visible ? 1 : 0, filter: visible ? "blur(0)" : "blur(14px)", transform: visible ? "scale(1)" : "scale(0.96)", transition: "opacity 0.9s cubic-bezier(0.16,1,0.3,1), filter 0.9s, transform 0.9s" }}>
    <div style={{ position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: -12, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", animation: "spinSlow 12s linear infinite" }}>
        <div style={{ position: "absolute", top: -2, left: "50%", width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.5)", transform: "translateX(-50%)", boxShadow: "0 0 8px rgba(255,255,255,0.6)" }} />
      </div>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.8, animation: "breathe 5s ease-in-out infinite" }}>
        <rect x="2" y="2" width="20" height="20" rx="6" stroke="white" strokeWidth="1.1" />
        <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.1" />
        <circle cx="17.2" cy="6.8" r="0.9" fill="white" />
      </svg>
    </div>
    <div style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: "clamp(9px,1vw,10px)", letterSpacing: "0.3em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>instagram</div>
    <div style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Helvetica, sans-serif", fontSize: "clamp(13px,1.8vw,16px)", color: "rgba(255,255,255,0.08)", letterSpacing: "0.08em", fontWeight: 200, animation: "blink 3s ease-in-out infinite" }}>@_zainn.27</div>
    <button onMouseEnter={() => { setHov(true); soundHover(); }} onMouseLeave={() => setHov(false)} onClick={() => { soundClick(); window.open("https://instagram.com/_zainn.27", "_blank"); }} style={{ background: hov ? "rgba(255,255,255,0.07)" : "transparent", border: `1px solid rgba(255,255,255,${hov ? 0.3 : 0.15})`, borderRadius: 2, padding: "12px 40px", color: `rgba(255,255,255,${hov ? 0.9 : 0.5})`, fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: "clamp(9px,1vw,10px)", letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 400, cursor: "pointer", transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)", transform: hov ? "scale(1.04) translateY(-2px)" : "scale(1)", boxShadow: hov ? "0 8px 30px rgba(255,255,255,0.06)" : "none" }}>open profile ↗</button>
  </div>);
};

/* ─── SPOTIFY PAGE ───────────────────────────────────── */
const SpotifyPage = ({ visible }) => {
  const [hov, setHov] = useState(false);
  const bars = Array.from({ length: 84 }, (_, i) => { const center = 42; const distance = Math.abs(i - center); return { id: i, height: 14 + Math.sin(i * 0.25) * 24 + Math.cos(i * 0.14) * 14 + Math.random() * 10 - distance * 0.24, delay: i * 0.025, duration: 1.4 + (i % 6) * 0.18, opacity: 0.04 + (1 - distance / center) * 0.12 }; });
  return (<><style>{`@keyframes musicWave{0%{transform:scaleY(.35);opacity:.04}50%{transform:scaleY(1);opacity:.18}100%{transform:scaleY(.45);opacity:.06}}@keyframes pulseRing{0%{transform:scale(.96);opacity:.1}50%{transform:scale(1.04);opacity:.22}100%{transform:scale(.96);opacity:.1}}@keyframes fadePulse{0%{opacity:.04;transform:translateY(0)}50%{opacity:.12;transform:translateY(-2px)}100%{opacity:.04;transform:translateY(0)}}@keyframes floatSlow{0%{transform:translate(0,0)}50%{transform:translate(20px,-14px)}100%{transform:translate(0,0)}}`}</style>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", position: "relative", overflow: "hidden", gap: 34, opacity: visible ? 1 : 0, filter: visible ? "blur(0px)" : "blur(16px)", transform: visible ? "scale(1)" : "scale(0.97)", transition: "opacity 1s cubic-bezier(0.16,1,0.3,1), filter 1s, transform 1s" }}>
      <div style={{ position: "absolute", width: "42vw", height: "42vw", borderRadius: "50%", background: "rgba(255,255,255,0.03)", filter: "blur(120px)", animation: "floatSlow 14s ease-in-out infinite" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ width: "min(78vw,760px)", height: "240px", display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(2px,0.4vw,4px)", transform: "translateY(-8px)", maskImage: "radial-gradient(circle at center, black 10%, transparent 78%)", WebkitMaskImage: "radial-gradient(circle at center, black 10%, transparent 78%)" }}>
          {bars.map((bar) => (<div key={bar.id} style={{ width: "clamp(2px,0.3vw,4px)", height: `${Math.max(bar.height, 6)}px`, background: "linear-gradient(to top, rgba(255,255,255,0.02), rgba(255,255,255,0.16), rgba(255,255,255,0.02))", borderRadius: "999px", opacity: bar.opacity, animation: `musicWave ${bar.duration}s ${bar.delay}s ease-in-out infinite alternate`, transformOrigin: "center bottom" }} />))}
        </div>
      </div>
      <div style={{ position: "relative", width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)", background: "radial-gradient(circle at top, rgba(255,255,255,0.04), transparent 65%)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", animation: "spinSlow 22s linear infinite" }} />
        <div style={{ position: "absolute", inset: -12, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.04)", animation: "pulseRing 4s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: "74%", height: "74%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.08), rgba(255,255,255,0.01))", filter: "blur(18px)" }} />
        <svg width="78" height="78" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.92, zIndex: 5, animation: "breathe 5s ease-in-out infinite", filter: "drop-shadow(0 0 18px rgba(255,255,255,0.12))" }}>
          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1" />
          <path d="M7 9.5c3-1.2 6.5-1 9 0.8" stroke="white" strokeWidth="1.15" strokeLinecap="round" />
          <path d="M7.5 12.5c2.5-1 5.5-0.8 7.5 0.7" stroke="white" strokeWidth="1.15" strokeLinecap="round" />
          <path d="M8 15.5c2-0.8 4.5-0.6 6 0.5" stroke="white" strokeWidth="1.15" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, zIndex: 5 }}>
        <div style={{ fontFamily: "'SF Mono', monospace", fontSize: "clamp(9px,1vw,10px)", letterSpacing: "0.34em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>spotify</div>
        <div style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif", fontSize: "clamp(12px,1.6vw,15px)", color: "rgba(255,255,255,0.08)", letterSpacing: "0.12em", fontWeight: 200, animation: "fadePulse 5s ease-in-out infinite" }}>frequencies in silence</div>
      </div>
      <button onMouseEnter={() => { setHov(true); soundHover(); }} onMouseLeave={() => setHov(false)} onClick={() => { soundClick(); window.open("https://open.spotify.com/user/zain54678?si=382e2cc307704563", "_blank"); }} style={{ zIndex: 10, background: hov ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,${hov ? 0.22 : 0.1})`, borderRadius: 999, padding: "14px 40px", color: `rgba(255,255,255,${hov ? 0.92 : 0.52})`, fontFamily: "'SF Mono', monospace", fontSize: "clamp(9px,1vw,10px)", letterSpacing: "0.24em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)", transform: hov ? "translateY(-3px) scale(1.04)" : "translateY(0) scale(1)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", boxShadow: hov ? "0 10px 40px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)" : "none" }}>listen now ↗</button>
    </div>
  </>);
};

/* ─── GALLERY PAGE ───────────────────────────────────── */
const GALLERY_IMAGES = [
  { id: 1, src: img1, filename: "1000067112.JPG", date: "2026.06.25", aspect: 1.48 },
  { id: 2, src: img2, filename: "1000106524.JPG", date: "2026.06.25", aspect: 1.32 },
  { id: 4, src: img4, filename: "1000111857.JPG", date: "2026.06.25", aspect: 1.55 },
  { id: 5, src: img5, filename: "cpm35 A", date: "2026.06.25", aspect: 0.68 },
  { id: 6, src: img6, filename: "cpm35 B", date: "2026.06.25", aspect: 0.75 },
  { id: 7, src: img7, filename: "IMG_2184.JPG", date: "2026.06.25", aspect: 1.25 },
  { id: 8, src: img8, filename: "IMG_2762.JPG", date: "2026.06.25", aspect: 1.4 },
  { id: 9, src: img9, filename: "IMG_4190.jpg", date: "2026.06.25", aspect: 1.6 },
];

const GalleryCard = ({ image, index, onOpen, memoryMode, appeared }) => {
  const [hov, setHov] = useState(false);
  const height = Math.round(220 * image.aspect);

  return (
    <div
      onMouseEnter={() => { setHov(true); soundHover(); }}
      onMouseLeave={() => setHov(false)}
      onClick={() => { onOpen(image); soundImageOpen(); }}
      style={{
        breakInside: "avoid",
        marginBottom: 14,
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        opacity: appeared ? 1 : 0,
        transform: appeared ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${index * 0.06}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${index * 0.06}s`,
        filter: memoryMode ? "grayscale(1)" : "none",
        boxShadow: hov
          ? "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.12)"
          : "0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
        background: "rgba(15,15,15,0.8)",
      }}>

      {/* Image */}
      <img
        src={image.src}
        alt={image.filename}
        loading="lazy"
        style={{
          width: "100%",
          height,
          objectFit: "cover",
          display: "block",
          transform: hov ? "scale(1.04)" : "scale(1)",
          transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1)",
        }}
      />

      {/* Bottom fade with meta */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)",
        padding: "32px 14px 12px",
        opacity: hov ? 1 : 0,
        transform: hov ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}>
        <div style={{ fontFamily: "'SF Mono', monospace", fontSize: 9, letterSpacing: "0.18em", color: "rgba(255,255,255,0.55)" }}>{image.filename}</div>
        <div style={{ fontFamily: "'SF Mono', monospace", fontSize: 8, letterSpacing: "0.14em", color: "rgba(255,255,255,0.28)", marginTop: 3 }}>{image.date}</div>
      </div>

      {/* Hover shine */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 55%)",
        opacity: hov ? 1 : 0,
        transition: "opacity 0.3s ease",
        pointerEvents: "none",
      }} />
    </div>
  );
};

const GalleryViewer = ({ image, images, onClose, onNext, onPrev, memoryMode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNext, onPrev]);

  const idx = images.findIndex(img => img.id === image.id);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.94)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }} />

      {/* Prev / Next */}
      {["←", "→"].map((arrow, i) => (
        <button key={arrow} onClick={i === 0 ? onPrev : onNext} style={{
          position: "fixed", top: "50%", [i === 0 ? "left" : "right"]: 28,
          transform: "translateY(-50%)",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "50%", width: 44, height: 44, color: "rgba(255,255,255,0.5)",
          fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 202, backdropFilter: "blur(12px)", transition: "all 0.2s ease",
          opacity: mounted ? 1 : 0,
        }}>{arrow}</button>
      ))}

      {/* Image */}
      <div style={{
        position: "relative", zIndex: 201,
        maxWidth: "88vw", maxHeight: "82vh",
        opacity: mounted ? 1 : 0,
        filter: `grayscale(${memoryMode ? 1 : 0})`,
        transform: mounted ? "scale(1) translateY(0)" : "scale(0.92) translateY(30px)",
        transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.34,1.56,0.64,1), filter 0.5s ease",
        borderRadius: 20, overflow: "hidden",
        boxShadow: "0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08)",
      }}>
        <img src={image.src} alt={image.filename} style={{ display: "block", maxWidth: "88vw", maxHeight: "82vh", objectFit: "contain" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 40%)", pointerEvents: "none" }} />
      </div>

      {/* Meta bottom left */}
      <div style={{ position: "fixed", bottom: 40, left: 40, zIndex: 202, fontFamily: "'SF Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.28)", opacity: mounted ? 1 : 0, transition: "opacity 0.8s 0.3s ease" }}>
        {memoryMode ? "some moments deserve silence." : image.filename}
      </div>

      {/* Date bottom right */}
      <div style={{ position: "fixed", bottom: 40, right: 40, zIndex: 202, fontFamily: "'SF Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.28)", opacity: mounted ? 1 : 0, transition: "opacity 0.8s 0.3s ease" }}>{image.date}</div>

      {/* Dot progress */}
      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 202, display: "flex", gap: 6 }}>
        {images.map((img, i) => (
          <div key={img.id} style={{ width: i === idx ? 22 : 5, height: 2, borderRadius: 1, background: i === idx ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.18)", transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)" }} />
        ))}
      </div>

      {/* ESC */}
      <div onClick={onClose} style={{ position: "fixed", top: 26, right: 32, zIndex: 202, fontFamily: "'SF Mono', monospace", fontSize: 9, letterSpacing: "0.26em", color: "rgba(255,255,255,0.2)", cursor: "pointer", opacity: mounted ? 1 : 0, transition: "opacity 0.8s 0.5s ease" }}>ESC</div>
    </div>
  );
};

const GalleryPage = ({ visible }) => {
  const [appeared, setAppeared] = useState([]);
  const [openImage, setOpenImage] = useState(null);
  const [memoryMode, setMemoryMode] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showHeader, setShowHeader] = useState(false);
  const clickTimerRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    setAppeared([]);
    setShowHeader(false);
    soundGalleryOpen();
    setTimeout(() => setShowHeader(true), 400);
    GALLERY_IMAGES.forEach((img, i) =>
      setTimeout(() => setAppeared(prev => [...prev, img.id]), 500 + i * 90)
    );
  }, [visible]);

  const handleImageOpen = (image) => {
    setOpenImage(image);
    soundImageOpen();
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) { setMemoryMode(true); soundMemoryMode(); setClickCount(0); }
    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => setClickCount(0), 3000);
  };

  const handleClose = () => setOpenImage(null);
  const handleNext = () => { const idx = GALLERY_IMAGES.findIndex(i => i.id === openImage.id); setOpenImage(GALLERY_IMAGES[(idx + 1) % GALLERY_IMAGES.length]); };
  const handlePrev = () => { const idx = GALLERY_IMAGES.findIndex(i => i.id === openImage.id); setOpenImage(GALLERY_IMAGES[(idx - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length]); };

  // Split into 3 masonry columns
  const cols = [[], [], []];
  GALLERY_IMAGES.forEach((img, i) => cols[i % 3].push(img));

  return (
    <>
      <style>{`
        @keyframes galleryFadeDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .gallery-scroll::-webkit-scrollbar { width: 0; }
        .gallery-scroll { scrollbar-width: none; }
      `}</style>

      <div style={{
        position: "absolute", inset: 0,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
        pointerEvents: visible ? "auto" : "none",
        display: "flex",
        flexDirection: "column",
      }}>

        {/* ── Header ── */}
        <div style={{
          flexShrink: 0,
          padding: "28px 32px 18px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          opacity: showHeader ? 1 : 0,
          transform: showHeader ? "translateY(0)" : "translateY(-8px)",
          transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {memoryMode
              ? <span style={{ fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif", fontSize: 13, fontWeight: 200, letterSpacing: "0.28em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>memory mode</span>
              : <span style={{ fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif", fontSize: 13, fontWeight: 200, letterSpacing: "0.38em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>gallery</span>
            }
            <span style={{ fontFamily: "'SF Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.12)", letterSpacing: "0.14em" }}>{GALLERY_IMAGES.length} photos</span>
          </div>
          <span style={{ fontFamily: "'SF Mono',monospace", fontSize: 8, letterSpacing: "0.22em", color: "rgba(255,255,255,0.1)", textTransform: "uppercase" }}>scroll to explore</span>
        </div>

        {/* ── Masonry Grid (scrollable) ── */}
        <div
          ref={scrollRef}
          className="gallery-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px 40px",
          }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
            alignItems: "start",
          }}>
            {cols.map((col, ci) => (
              <div key={ci} style={{ display: "flex", flexDirection: "column" }}>
                {col.map((image) => {
                  const globalIdx = GALLERY_IMAGES.findIndex(g => g.id === image.id);
                  return (
                    <GalleryCard
                      key={image.id}
                      image={image}
                      index={globalIdx}
                      onOpen={handleImageOpen}
                      memoryMode={memoryMode}
                      appeared={appeared.includes(image.id)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Subtle footer hint */}
          <div style={{
            textAlign: "center",
            marginTop: 24,
            fontFamily: "'SF Mono',monospace",
            fontSize: 8,
            letterSpacing: "0.22em",
            color: "rgba(255,255,255,0.07)",
            textTransform: "uppercase",
          }}>
            click any photo · esc to close · ← → to navigate
          </div>
        </div>
      </div>

      {openImage && (
        <GalleryViewer
          image={openImage}
          images={GALLERY_IMAGES}
          onClose={handleClose}
          onNext={handleNext}
          onPrev={handlePrev}
          memoryMode={memoryMode}
        />
      )}
    </>
  );
};
/* ─── NOW PLAYING PAGE ───────────────────────────────── */
const ALBUMS = [

{
  id: 5,
  title: "Hanging by a Thread",
  artist: "Beckett",
  year: "2005",
  duration: "3:42",
  genre: "Alternative Rock",
  color: "#121212",
  src: "https://i.scdn.co/image/ab67616d0000b2731298994ccf90493fa88ab8dc",
  track: "Hanging by a Thread",
  elapsed: "1:28",
  total: "3:42"
},
{
  id: 6,
  title: "Still Loving You",
  artist: "Scorpions",
  year: "1984",
  duration: "6:28",
  genre: "Hard Rock",
  color: "#181818",
  src: "https://upload.wikimedia.org/wikipedia/en/8/83/Scorpions-stilllovingyou1.jpg",
  track: "Still Loving You",
  elapsed: "3:11",
  total: "6:28"
},
{
  id: 7,
  title: "To the Hellfire",
  artist: "Lorna Shore",
  year: "2021",
  duration: "6:10",
  genre: "Deathcore",
  color: "#0b0b0b",
  src: "https://t2.genius.com/unsafe/516x516/https%3A%2F%2Fimages.genius.com%2F0263ea8b3c1706b9a946edc8ec63f7ad.1000x1000x1.png",
  track: "To the Hellfire",
  elapsed: "2:46",
  total: "6:10"
},
{
  id: 8,
  title: "Comfortable Liar",
  artist: "Chevelle",
  year: "2004",
  duration: "4:15",
  genre: "Alternative Metal",
  color: "#141414",
  src: "https://t2.genius.com/unsafe/516x516/https%3A%2F%2Fimages.genius.com%2Fecdc4ba4c3d5d4f864a2aa993ee503f8.1000x1000x1.png",
  track: "Comfortable Liar",
  elapsed: "1:59",
  total: "4:15"
},
{
  id: 9,
  title: "You Give Love a Bad Name",
  artist: "Bon Jovi",
  year: "1986",
  duration: "3:43",
  genre: "Hard Rock",
  color: "#1a1a1a",
  src: "https://upload.wikimedia.org/wikipedia/en/b/b4/YouGiveLoveABadName.jpg",
  track: "You Give Love a Bad Name",
  elapsed: "2:01",
  total: "3:43"
},
{
  id: 10,
  title: "People = Shit",
  artist: "Slipknot",
  year: "2001",
  duration: "3:35",
  genre: "Nu Metal",
  color: "#080808",
  src: "https://cdn-images.dzcdn.net/images/cover/bd6de90f61e585e94dca0b70a17580c8/500x500-000000-80-0-0.jpg",
  track: "People = Shit",
  elapsed: "1:40",
  total: "3:35"
},
{
  id: 11,
  title: "This Is the New Shit",
  artist: "Marilyn Manson",
  year: "2003",
  duration: "4:20",
  genre: "Industrial Metal",
  color: "#111111",
  src: "https://i1.sndcdn.com/artworks-9prtR7JiOzzfIcCl-5m6O7g-t500x500.jpg",
  track: "This Is the New Shit",
  elapsed: "2:10",
  total: "4:20"
},
{
  id: 12,
  title: "Antichrist Superstar",
  artist: "Marilyn Manson",
  year: "1996",
  duration: "5:14",
  genre: "Industrial Metal",
  color: "#090909",
  src: "https://upload.wikimedia.org/wikipedia/en/d/d5/Marilyn_Manson_-_Antichrist_Superstar.png",
  track: "Antichrist Superstar",
  elapsed: "2:38",
  total: "5:14"
},
{
  id: 13,
  title: "Slither",
  artist: "Velvet Revolver",
  year: "2004",
  duration: "4:08",
  genre: "Hard Rock",
  color: "#151515",
  src: "https://cdn-images.dzcdn.net/images/cover/a081cba5029f4972a4d1fd603f5971f0/500x500-000000-80-0-0.jpg",
  track: "Slither",
  elapsed: "1:55",
  total: "4:08"
},
{
  id: 14,
  title: "...And Then She Bled",
  artist: "Suicide Silence",
  year: "2007",
  duration: "3:14",
  genre: "Deathcore",
  color: "#050505",
  src: "https://i.scdn.co/image/ab67616d00001e026d65fd501f4cec18723f3c4b",
  track: "...And Then She Bled",
  elapsed: "1:29",
  total: "3:14"
},

];

const WaveformRing = ({ size = 280, playing = true }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const tRef = useRef(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = size / 2, cy = size / 2, r = size * 0.42;
    const bars = 120;
    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      tRef.current += playing ? 0.04 : 0.008;
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const wave = Math.sin(i * 0.18 + tRef.current * 2.5) * 0.5 + Math.sin(i * 0.07 + tRef.current) * 0.5;
        const h = playing ? (8 + wave * 18) : (3 + wave * 5);
        const x1 = cx + Math.cos(angle) * r;
        const y1 = cy + Math.sin(angle) * r;
        const x2 = cx + Math.cos(angle) * (r + h);
        const y2 = cy + Math.sin(angle) * (r + h);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(255,255,255,${0.08 + wave * 0.12})`;
        ctx.lineWidth = 1.5; ctx.lineCap = "round"; ctx.stroke();
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [size, playing]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ position: "absolute", inset: `calc(50% - ${size / 2}px)`, pointerEvents: "none" }} />;
};

const AlbumCard = ({ album, isCurrent, onSelect, size = 90 }) => {
  const [hov, setHov] = useState(false);
  return (<div onMouseEnter={() => { setHov(true); soundHover(); }} onMouseLeave={() => setHov(false)} onClick={() => { onSelect(album); soundClick(); }} style={{ flexShrink: 0, width: hov ? size * 1.15 : size, height: hov ? size * 1.15 : size, borderRadius: 12, overflow: "hidden", cursor: "pointer", position: "relative", border: isCurrent ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)", boxShadow: hov ? "0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.05)" : "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
    <img src={album.src} alt={album.title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: isCurrent ? "none" : "brightness(0.5) grayscale(0.3)" }} />
    {hov && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(4px)" }} />}
  </div>);
};

const NowPlayingPage = ({ visible }) => {
  const [currentAlbum, setCurrentAlbum] = useState(ALBUMS[0]);
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0.35);
  const [mounted, setMounted] = useState(false);
  const [breathe, setBreathe] = useState(0);
  const mousePos = useMousePos();
  const containerRef = useRef(null);

  useEffect(() => {
    if (visible) { soundNowPlaying(); setTimeout(() => setMounted(true), 200); }
    else setMounted(false);
  }, [visible]);

  useEffect(() => {
    const interval = setInterval(() => setBreathe(b => b + 0.02), 50);
    return () => clearInterval(interval);
  }, []);

  const handleAlbumMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -15, y: dx * 15 });
  };

  const breatheScale = 1 + Math.sin(breathe) * 0.012;
  const albumSize = 220;

  return (<>
    <style>{`
      @keyframes nowPlayingBreath{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
      @keyframes liquidWave{0%{transform:translateX(-50%) scaleY(1)}50%{transform:translateX(-40%) scaleY(1.3)}100%{transform:translateX(-50%) scaleY(1)}}
      @keyframes albumReveal{from{filter:blur(30px);opacity:0;transform:scale(0.85)}to{filter:blur(0);opacity:1;transform:scale(1)}}
      @keyframes albumFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes particlesBeat{0%{transform:translateY(0) scale(1)}50%{transform:translateY(-20px) scale(1.1)}100%{transform:translateY(-40px) scale(0.8);opacity:0}}
      .album-flip-inner{transition:transform 0.8s cubic-bezier(0.34,1.56,0.64,1);transform-style:preserve-3d;}
      .album-flip-inner.flipped{transform:rotateY(180deg);}
      .album-face,.album-back{position:absolute;inset:0;backface-visibility:hidden;border-radius:20px;overflow:hidden;}
      .album-back{transform:rotateY(180deg);display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(12,12,12,0.95);border:1px solid rgba(255,255,255,0.1);}
    `}</style>

    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", opacity: visible ? 1 : 0, filter: visible ? "blur(0)" : "blur(20px)", transform: visible ? "scale(1)" : "scale(0.95)", transition: "opacity 1s cubic-bezier(0.16,1,0.3,1), filter 1s, transform 1s" }}>

      {/* Background ambient glow behind album */}
      <div style={{ position: "absolute", width: albumSize * 2.5, height: albumSize * 2.5, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 65%)", filter: "blur(60px)", transform: `scale(${breatheScale})`, transition: "transform 0.5s ease", top: "50%", left: "50%", marginTop: -albumSize * 1.25, marginLeft: -albumSize * 1.25 }} />

      {/* Header label */}
      <div style={{ position: "absolute", top: "5%", fontFamily: "'SF Mono',monospace", fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.15)", textTransform: "uppercase", opacity: mounted ? 1 : 0, transition: "opacity 0.8s 0.4s ease" }}>now playing</div>

      {/* Main album + waveform */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
        <WaveformRing size={albumSize + 100} playing={true} />

        {/* Album art with flip */}
        <div
          style={{ width: albumSize, height: albumSize, position: "relative", perspective: "1000px", cursor: "pointer", opacity: mounted ? 1 : 0, animation: mounted ? "albumReveal 1s cubic-bezier(0.16,1,0.3,1) forwards, albumFloat 6s ease-in-out infinite" : "none", zIndex: 10 }}
          onMouseMove={handleAlbumMouseMove}
          onMouseLeave={() => setTilt({ x: 0, y: 0 })}
          onClick={() => { setFlipped(f => !f); soundClick(); }}>
          <div className={`album-flip-inner${flipped ? " flipped" : ""}`} style={{ width: "100%", height: "100%", transform: flipped ? "rotateY(180deg)" : `rotateY(${tilt.y}deg) rotateX(${tilt.x}deg)` }}>
            <div className="album-face">
              <img src={currentAlbum.src} alt={currentAlbum.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {/* Reflection */}
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)`, pointerEvents: "none", transition: "background 0.2s" }} />
            </div>
            <div className="album-back">
              <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", padding: 24 }}>
                {[["Album", currentAlbum.title], ["Release", currentAlbum.year], ["Duration", currentAlbum.duration], ["Genre", currentAlbum.genre]].map(([label, val]) => (<div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'SF Mono',monospace", fontSize: 8, letterSpacing: "0.3em", color: "rgba(255,255,255,0.25)", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif", fontSize: 14, fontWeight: 200, color: "rgba(255,255,255,0.75)", letterSpacing: "0.05em" }}>{val}</div>
                </div>))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Track info */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: mounted ? 1 : 0, transition: "opacity 0.8s 0.6s ease" }}>
        <div style={{ fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif", fontSize: "clamp(16px,2vw,20px)", fontWeight: 200, color: "rgba(255,255,255,0.9)", letterSpacing: "0.02em" }}>{currentAlbum.track}</div>
        <div style={{ fontFamily: "'SF Mono',monospace", fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)" }}>{currentAlbum.artist} — {currentAlbum.title}</div>
      </div>

      {/* Progress bar with liquid effect */}
      <div style={{ width: "min(340px,70vw)", marginTop: 24, opacity: mounted ? 1 : 0, transition: "opacity 0.8s 0.7s ease" }}>
        <div style={{ position: "relative", height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)", cursor: "pointer", overflow: "hidden" }} onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setProgress((e.clientX - rect.left) / rect.width); }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${progress * 100}%`, background: "rgba(255,255,255,0.5)", borderRadius: 2, transition: "width 0.2s ease", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: "200%", height: "200%", background: "radial-gradient(circle, rgba(255,255,255,0.6), transparent)", animation: "liquidWave 2s ease-in-out infinite", opacity: 0.4 }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontFamily: "'SF Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>{currentAlbum.elapsed}</span>
          <span style={{ fontFamily: "'SF Mono',monospace", fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>{currentAlbum.total}</span>
        </div>
      </div>

      {/* Recently played */}
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, opacity: mounted ? 1 : 0, transition: "opacity 0.8s 0.9s ease" }}>
        <div style={{ fontFamily: "'SF Mono',monospace", fontSize: 8, letterSpacing: "0.28em", color: "rgba(255,255,255,0.12)", textTransform: "uppercase" }}>recently played</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {ALBUMS.map(album => (<AlbumCard key={album.id} album={album} isCurrent={album.id === currentAlbum.id} onSelect={(a) => { setCurrentAlbum(a); setFlipped(false); setProgress(0.1); }} />))}
        </div>
      </div>

      {/* Flip hint */}
      <div style={{ position: "absolute", bottom: "11%", fontFamily: "'SF Mono',monospace", fontSize: 8, letterSpacing: "0.2em", color: "rgba(255,255,255,0.07)", opacity: mounted && !flipped ? 1 : 0, transition: "opacity 0.5s ease" }}>click album to flip</div>
    </div>
  </>);
};

/* ─── DOCK ───────────────────────────────────────────── */
const DockBtn = ({ label, active, onClick, children }) => {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (<button onMouseEnter={() => { setHov(true); soundHover(); }} onMouseLeave={() => { setHov(false); setPress(false); }} onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)} onTouchStart={() => setPress(true)} onTouchEnd={() => { setPress(false); onClick(); }} onClick={onClick} title={label} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
    <div style={{ width: "clamp(46px,8vw,54px)", height: "clamp(46px,8vw,54px)", borderRadius: "clamp(13px,2.5vw,17px)", background: active ? "rgba(255,255,255,0.14)" : hov ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)", border: `1px solid rgba(255,255,255,${active ? 0.28 : hov ? 0.18 : 0.09})`, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", display: "flex", alignItems: "center", justifyContent: "center", transform: press ? "scale(0.86)" : hov ? "scale(1.18) translateY(-8px)" : "scale(1)", transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: hov ? "0 10px 40px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)" : active ? "0 4px 20px rgba(255,255,255,0.06)" : "0 2px 10px rgba(0,0,0,0.4)" }}>
      {children}
    </div>
    <div style={{ width: active ? 4 : hov ? 2 : 0, height: active ? 4 : hov ? 2 : 0, borderRadius: "50%", background: `rgba(255,255,255,${active ? 0.7 : 0.4})`, transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: active ? "0 0 6px rgba(255,255,255,0.5)" : "none" }} />
  </button>);
};

const Dock = ({ active, setActive }) => (
  <div style={{ position: "fixed", bottom: "clamp(18px,4vh,34px)", left: "50%", transform: "translateX(-50%)", zIndex: 100 }}>
    <div style={{ display: "flex", alignItems: "flex-end", gap: "clamp(8px,2vw,14px)", padding: "clamp(10px,2vw,14px) clamp(16px,3vw,22px)", borderRadius: "clamp(22px,4vw,30px)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", backdropFilter: "blur(50px)", WebkitBackdropFilter: "blur(50px)", boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.2)" }}>
      <DockBtn label="Instagram" active={active === "instagram"} onClick={() => { soundSwitch(); setActive("instagram"); }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="6" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" /><circle cx="12" cy="12" r="4.5" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" /><circle cx="17.2" cy="6.8" r="0.85" fill="rgba(255,255,255,0.75)" /></svg>
      </DockBtn>
     {/*  <DockBtn label="Gallery" active={active === "gallery"} onClick={() => { soundSwitch(); setActive("gallery"); }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="3" width="9" height="9" rx="2" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
          <rect x="13" y="3" width="9" height="6" rx="2" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
          <rect x="2" y="14" width="9" height="7" rx="2" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
          <rect x="13" y="11" width="9" height="10" rx="2" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
        </svg>
      </DockBtn>*/}
      <DockBtn label="Home" active={active === "home"} onClick={() => { soundSwitch(); setActive("home"); }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3l9 7.5V21H15v-5h-6v5H3z" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" strokeLinejoin="round" /></svg>
      </DockBtn>
      <DockBtn label="Now Playing" active={active === "nowplaying"} onClick={() => { soundSwitch(); setActive("nowplaying"); }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
          <path d="M12 2a10 10 0 0 1 0 20" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="4 3" />
        </svg>
      </DockBtn>
      <DockBtn label="Spotify" active={active === "spotify"} onClick={() => { soundSwitch(); setActive("spotify"); }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" /><path d="M7 9.5c3-1.2 6.5-1 9 0.8" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" strokeLinecap="round" /><path d="M7.5 12.5c2.5-1 5.5-0.8 7.5 0.7" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" strokeLinecap="round" /><path d="M8 15.5c2-0.8 4.5-0.6 6 0.5" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" strokeLinecap="round" /></svg>
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

  useEffect(() => { const t = setTimeout(() => { setReady(true); soundIntro(); }, 300); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (mobile()) return;
    const down = (e) => { setClick(true); const id = Date.now(); setRipples((r) => [...r.slice(-5), { x: e.clientX, y: e.clientY, id }]); setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 900); };
    const up = () => setClick(false);
    const over = (e) => { const el = e.target; setHover(!!(el.tagName === "BUTTON" || el.tagName === "A" || el.closest("button") || el.closest("a"))); };
    window.addEventListener("mousedown", down); window.addEventListener("mouseup", up); window.addEventListener("mouseover", over);
    return () => { window.removeEventListener("mousedown", down); window.removeEventListener("mouseup", up); window.removeEventListener("mouseover", over); };
  }, []);

  return (<>
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 100%; height: 100%; overflow: hidden; background: #000; cursor: none; }
      @media (max-width: 768px) { html, body { cursor: auto; } }
      @keyframes breathe { 0%,100% { text-shadow: 0 0 80px rgba(255,255,255,0.08), 0 0 180px rgba(255,255,255,0.03); opacity: 0.93; } 50% { text-shadow: 0 0 140px rgba(255,255,255,0.16), 0 0 280px rgba(255,255,255,0.07); opacity: 1; } }
      @keyframes drift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(90px,70px) scale(1.12); } }
      @keyframes drift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-70px,55px) scale(0.88); } }
      @keyframes drift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(50px,-50px) scale(1.06); } }
      @keyframes drift4 { from { transform: translate(0,0) scale(1); } to { transform: translate(-40px,40px) scale(0.92); } }
      @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes rippleOut { from { width: 0; height: 0; opacity: 0.5; } to { width: 200px; height: 200px; opacity: 0; } }
      @keyframes scanMove { from { background-position: 0 0; } to { background-position: 0 100%; } }
    `}</style>

    <Cursor pos={mousePos} hover={hover} click={click} />
    <RippleLayer ripples={ripples} />
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 0 }} />
    <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 80% 60% at 40% 30%, rgba(18,18,18,1) 0%, #000 100%)", zIndex: 0 }} />
    <GlowOrbs />
    <Constellation intensity={active === "gallery" ? 1.5 : 1} />
    <Noise />
    <Scanlines />
    <MouseGlow pos={mousePos} />
    <Clock />
    <StatusBar page={active} />

    <div style={{ position: "fixed", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: active === "home" ? "auto" : "none" }}><HomePage visible={ready && active === "home"} /></div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: active === "instagram" ? "auto" : "none" }}><InstagramPage visible={active === "instagram"} /></div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: active === "gallery" ? "auto" : "none" }}><GalleryPage visible={active === "gallery"} /></div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: active === "nowplaying" ? "auto" : "none" }}><NowPlayingPage visible={active === "nowplaying"} /></div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: active === "spotify" ? "auto" : "none" }}><SpotifyPage visible={active === "spotify"} /></div>
      </div>
    </div>

    <Dock active={active} setActive={setActive} />
  </>);
}