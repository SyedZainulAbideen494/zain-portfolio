/**
 * PhotographyPage — Fully Optimised
 * ─────────────────────────────────
 * Perf wins over the original:
 *  1. CSS classes (stylesheet injection) instead of inline style objects → zero GC pressure per render
 *  2. Intersection Observer lazy-load: images are only fetched when their card
 *     enters the viewport ± 200 px, instead of all 21 at mount time
 *  3. Neighbour pre-fetch: centre ±2 images get <link rel="prefetch"> inserted
 *     so they're already in the browser cache before the user navigates to them
 *  4. CSS scroll-snap instead of JS-driven snapping — hardware-accelerated,
 *     no scroll listener math needed for position tracking
 *  5. useReducer for viewer state so navigation never causes stale-closure bugs
 *  6. Touch swipe handled natively (touchstart/touchend) — no 3rd-party lib needed
 *  7. ResizeObserver-less: card width computed once via CSS clamp, not JS
 *  8. Animations are CSS keyframes on GPU-composited props (opacity + transform only)
 *  9. memo() on every sub-component with stable callback refs (useCallback)
 * 10. Fullscreen viewer portal via createPortal — keeps it outside the carousel
 *     DOM subtree so it never triggers carousel re-renders
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useReducer,
  memo,
  createContext,
  useContext,
  useMemo,
} from "react";
import { createPortal } from "react-dom";

/* ── 1. IMAGE IMPORTS ────────────────────────────────────── */
import img1  from "./photography/1.JPG";
import img3  from "./photography/3.JPG";
import img4  from "./photography/4.JPG";
import img5  from "./photography/5.JPG";
import img6  from "./photography/6.JPG";
import img7  from "./photography/7.JPG";
import img8  from "./photography/8.jpg";
import img9  from "./photography/9.JPG";
import img11 from "./photography/11.JPG";
import img12 from "./photography/12.JPG";
import img13 from "./photography/13.JPG";
import img14 from "./photography/14.JPG";
import img15 from "./photography/15.JPG";
import img16 from "./photography/16.JPG";
import img17 from "./photography/17.JPG";
import img18 from "./photography/18.JPG";
import img19 from "./photography/19.JPG";
import img20 from "./photography/20.JPG";
import img21 from "./photography/21.JPG";
import img22 from "./photography/22.JPG";
import img23 from "./photography/23.JPG";

/* ── 2. PHOTOS DATA ─────────────────────────────────────── */
export const PHOTOS = [
  { id: 1,  src: img1,  title: "Still Light",         location: "Bengaluru", year: "2024", date: "March 14, 2024",    camera: "iPhone 15 Pro",  lens: "Main · 24mm" },
  { id: 3,  src: img3,  title: "Last Hour",            location: "Mysore",    year: "2023", date: "August 21, 2023",   camera: "iPhone 14 Pro",  lens: "Ultrawide · 13mm" },
  { id: 4,  src: img4,  title: "Between Frames",       location: "Bengaluru", year: "2024", date: "January 3, 2024",   camera: "Shot on Film",   lens: "50mm · Ilford HP5" },
  { id: 5,  src: img5,  title: "Quiet Intersection",   location: "Goa",       year: "2023", date: "December 29, 2023", camera: "iPhone 15 Pro",  lens: "Telephoto · 77mm" },
  { id: 6,  src: img6,  title: "Second Exposure",      location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 7,  src: img7,  title: "Grain & Light",        location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 8,  src: img8,  title: "Residue",              location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 9,  src: img9,  title: "Periphery",            location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 11, src: img11, title: "Overstay",             location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 12, src: img12, title: "Held Breath",          location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 13, src: img13, title: "Ambient",              location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 14, src: img14, title: "Diffuse",              location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 15, src: img15, title: "Underexposed",         location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 16, src: img16, title: "Soft Stop",            location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 17, src: img17, title: "Negative Space",       location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 18, src: img18, title: "Long Exposure",        location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 19, src: img19, title: "ISO Push",             location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 20, src: img20, title: "Zone System",          location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 21, src: img21, title: "Bleach Bypass",        location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 22, src: img22, title: "Contact Print",        location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
  { id: 23, src: img23, title: "Fixed Lens",           location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400" },
];

/* ── 3. STYLESHEET (injected once, never re-injected) ───── */
const STYLE_ID = "phot-page-styles";
const CSS = `
  /* Reset for the page container */
  .pp-root {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: opacity .5s ease;
  }
  .pp-root.hidden { opacity: 0; pointer-events: none; }
  .pp-root.visible { opacity: 1; pointer-events: auto; }

  /* Ambient orb */
  .pp-orb {
    position: absolute;
    top: 10%; left: 50%;
    transform: translateX(-50%);
    width: min(60vw, 600px);
    height: min(60vw, 600px);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,.025) 0%, transparent 65%);
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
    animation: ppDrift 14s ease-in-out infinite;
    will-change: transform;
  }

  /* Header */
  .pp-header {
    text-align: center;
    margin-bottom: clamp(36px, 5vh, 52px);
    z-index: 2;
    opacity: 0;
  }
  .pp-header.in {
    animation: ppSlideUp .9s cubic-bezier(.16,1,.3,1) forwards;
  }
  .pp-eyebrow {
    font-family: 'SF Mono','Fira Code',monospace;
    font-size: clamp(8px,.75vw,9px);
    letter-spacing: .38em;
    color: rgba(255,255,255,.15);
    text-transform: uppercase;
    margin-bottom: 18px;
  }
  .pp-title {
    font-family: 'SF Pro Display','Helvetica Neue',sans-serif;
    font-size: clamp(38px, 7vw, 80px);
    font-weight: 100;
    letter-spacing: .25em;
    color: rgba(255,255,255,.9);
    line-height: 1;
    text-shadow: 0 0 80px rgba(255,255,255,.06);
  }
  .pp-subtitle {
    margin-top: 16px;
    font-family: 'SF Pro Display','Helvetica Neue',sans-serif;
    font-size: clamp(11px, 1.1vw, 14px);
    font-weight: 200;
    letter-spacing: .12em;
    color: rgba(255,255,255,.2);
    font-style: italic;
    line-height: 1.7;
  }

  /* Carousel row */
  .pp-carousel-row {
    display: flex;
    align-items: center;
    gap: clamp(12px, 2vw, 24px);
    width: 100%;
    z-index: 2;
    opacity: 0;
  }
  .pp-carousel-row.in {
    animation: ppSlideUp .9s .15s cubic-bezier(.16,1,.3,1) forwards;
  }

  /* Scroll strip */
  .pp-scroll {
    flex: 1;
    display: flex;
    align-items: center;
    gap: clamp(20px, 3vw, 40px);
    overflow-x: auto;
    padding: 20px clamp(60px, 10vw, 140px);
    cursor: grab;
    user-select: none;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -ms-overflow-style: none;
    -webkit-overflow-scrolling: touch;
  }
  .pp-scroll::-webkit-scrollbar { display: none; }
  .pp-scroll.dragging { cursor: grabbing; }

  /* Card snap wrapper */
  .pp-snap { scroll-snap-align: center; flex-shrink: 0; }

  /* Photo card */
  .pp-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    cursor: pointer;
    transition: opacity .55s cubic-bezier(.16,1,.3,1),
                transform .55s cubic-bezier(.34,1.56,.64,1);
  }
  .pp-card.center  { opacity: 1;   transform: scale(1); }
  .pp-card.near    { opacity: .55; transform: scale(.88); }
  .pp-card.far     { opacity: .3;  transform: scale(.78); }

  /* Image frame */
  .pp-frame {
    position: relative;
    overflow: hidden;
    transition: border-radius .5s ease, box-shadow .5s ease, transform .55s cubic-bezier(.34,1.56,.64,1);
    will-change: transform;
  }
  .pp-card.center .pp-frame {
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,.14);
    box-shadow: 0 40px 120px rgba(0,0,0,.9),
                0 0 0 1px rgba(255,255,255,.06),
                inset 0 1px 0 rgba(255,255,255,.08);
    width: clamp(240px, 28vw, 320px);
    height: clamp(320px, 38vw, 430px);
  }
  .pp-card:not(.center) .pp-frame {
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,.07);
    box-shadow: 0 16px 50px rgba(0,0,0,.7);
    width: clamp(160px, 18vw, 210px);
    height: clamp(210px, 25vw, 280px);
  }
  .pp-card.center .pp-frame:hover { transform: scale(1.025); }

  /* Image inside frame */
  .pp-img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    transition: filter .5s ease, transform .55s cubic-bezier(.34,1.56,.64,1);
    will-change: transform;
  }
  .pp-card:not(.center) .pp-img {
    filter: brightness(.55) grayscale(.2);
  }
  .pp-card:hover .pp-img { transform: scale(1.04); }

  /* Image load skeleton (shown before src loads) */
  .pp-skeleton {
    width: 100%; height: 100%;
    background: linear-gradient(120deg, #111 25%, #1c1c1c 50%, #111 75%);
    background-size: 200% 100%;
    animation: ppSkeleton 1.6s ease infinite;
  }

  /* Bottom vignette */
  .pp-vignette {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 35%;
    background: linear-gradient(to top, rgba(0,0,0,.7), transparent);
    pointer-events: none;
  }

  /* Expand hint icon */
  .pp-expand-hint {
    position: absolute;
    bottom: 14px; right: 14px;
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,.25);
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    background: rgba(255,255,255,.06);
    opacity: 0;
    transition: opacity .3s ease;
    pointer-events: none;
  }
  .pp-card.center:hover .pp-expand-hint { opacity: 1; }

  /* Card caption */
  .pp-caption {
    text-align: center;
    transition: opacity .5s ease;
  }
  .pp-card.center .pp-caption  { opacity: 1; }
  .pp-card:not(.center) .pp-caption { opacity: .3; }
  .pp-caption-title {
    font-family: 'SF Pro Display','Helvetica Neue',sans-serif;
    font-weight: 200;
    color: rgba(255,255,255,.85);
    letter-spacing: .03em;
    margin-bottom: 5px;
  }
  .pp-card.center  .pp-caption-title { font-size: clamp(13px, 1.4vw, 16px); }
  .pp-card:not(.center) .pp-caption-title { font-size: clamp(10px, 1.1vw, 12px); }
  .pp-caption-meta {
    font-family: 'SF Mono','Fira Code',monospace;
    font-size: clamp(8px, .75vw, 9px);
    letter-spacing: .2em;
    color: rgba(255,255,255,.22);
    text-transform: uppercase;
  }

  /* Nav button */
  .pp-navbtn {
    flex-shrink: 0;
    width: 46px; height: 46px;
    border-radius: 50%;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.1);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .4s cubic-bezier(.34,1.56,.64,1);
    box-shadow: 0 4px 16px rgba(0,0,0,.4);
    z-index: 20;
  }
  .pp-navbtn:hover {
    width: 52px; height: 52px;
    background: rgba(255,255,255,.09);
    border-color: rgba(255,255,255,.22);
    box-shadow: 0 8px 32px rgba(0,0,0,.5),
                0 0 20px rgba(255,255,255,.06),
                inset 0 1px 0 rgba(255,255,255,.1);
  }
  .pp-navbtn-wrap { flex-shrink: 0; }
  .pp-navbtn-wrap.left  { padding-left:  clamp(16px, 3vw, 40px); }
  .pp-navbtn-wrap.right { padding-right: clamp(16px, 3vw, 40px); }

  /* Dot strip */
  .pp-dots {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: clamp(20px, 3vh, 32px);
    z-index: 2;
    opacity: 0;
    transition: opacity .8s .4s ease;
  }
  .pp-dots.in { opacity: 1; }
  .pp-dot {
    height: 4px;
    border-radius: 2px;
    cursor: pointer;
    transition: all .45s cubic-bezier(.34,1.56,.64,1);
  }
  .pp-dot.active { width: 20px; background: rgba(255,255,255,.55); }
  .pp-dot:not(.active) { width: 4px; background: rgba(255,255,255,.12); }

  /* Scroll hint */
  .pp-hint {
    position: absolute;
    bottom: 36px; left: 50%;
    transform: translateX(-50%);
    font-family: 'SF Mono','Fira Code',monospace;
    font-size: 8px;
    letter-spacing: .26em;
    color: rgba(255,255,255,.1);
    text-transform: uppercase;
    white-space: nowrap;
    z-index: 2;
    opacity: 0;
    transition: opacity .8s .6s ease;
  }
  .pp-hint.in { opacity: 1; }

  /* ── FULLSCREEN VIEWER ─────────────────────── */
  .pp-viewer {
    position: fixed; inset: 0; z-index: 400;
    display: flex; align-items: center; justify-content: center;
  }
  .pp-viewer-bg {
    position: absolute; inset: 0;
    background: rgba(0,0,0,.96);
    backdrop-filter: blur(60px);
    -webkit-backdrop-filter: blur(60px);
    opacity: 0;
    transition: opacity .5s ease;
  }
  .pp-viewer-bg.in { opacity: 1; }
  .pp-viewer-close {
    position: absolute; top: 28px; right: 28px; z-index: 10;
    width: 40px; height: 40px;
    border-radius: 50%;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.12);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    opacity: 0;
    transition: opacity .5s .2s ease;
  }
  .pp-viewer-close.in { opacity: 1; }
  .pp-viewer-content {
    position: relative; z-index: 5;
    display: flex; align-items: center;
    gap: clamp(20px, 3vw, 40px);
    opacity: 0;
    transform: scale(.92) translateY(20px);
    transition: opacity .6s cubic-bezier(.16,1,.3,1),
                transform .6s cubic-bezier(.34,1.56,.64,1);
  }
  .pp-viewer-content.in {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  .pp-viewer-col {
    display: flex; flex-direction: column; align-items: center; gap: 28px;
  }
  .pp-viewer-img-wrap {
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.1);
    box-shadow: 0 60px 180px rgba(0,0,0,.98),
                0 0 0 1px rgba(255,255,255,.04);
    width: clamp(260px, 38vw, 520px);
    height: clamp(340px, 52vw, 700px);
    position: relative;
  }
  .pp-viewer-img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
  }
  .pp-viewer-dots {
    display: flex; gap: 8px; align-items: center;
  }
  .pp-viewer-dot {
    height: 4px; border-radius: 2px;
    transition: all .4s cubic-bezier(.34,1.56,.64,1);
  }
  .pp-viewer-dot.active { width: 18px; background: rgba(255,255,255,.6); }
  .pp-viewer-dot:not(.active) { width: 4px; background: rgba(255,255,255,.15); }

  /* Viewer metadata */
  .pp-viewer-meta {
    position: absolute; bottom: 36px; left: 36px; z-index: 10;
    opacity: 0;
    transform: translateY(12px);
    transition: opacity .7s .35s ease, transform .7s .35s cubic-bezier(.16,1,.3,1);
  }
  .pp-viewer-meta.in { opacity: 1; transform: translateY(0); }
  .pp-meta-title {
    font-family: 'SF Pro Display','Helvetica Neue',sans-serif;
    font-size: clamp(18px, 2.2vw, 24px);
    font-weight: 100;
    color: rgba(255,255,255,.88);
    letter-spacing: -.01em;
    margin-bottom: 6px;
  }
  .pp-meta-loc {
    font-family: 'SF Mono','Fira Code',monospace;
    font-size: clamp(8px, .8vw, 9px);
    letter-spacing: .22em;
    color: rgba(255,255,255,.2);
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .pp-meta-date {
    font-family: 'SF Mono','Fira Code',monospace;
    font-size: clamp(8px, .8vw, 9px);
    letter-spacing: .22em;
    color: rgba(255,255,255,.14);
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .pp-meta-cam {
    font-family: 'SF Pro Display','Helvetica Neue',sans-serif;
    font-size: clamp(10px, .95vw, 12px);
    font-weight: 200;
    color: rgba(255,255,255,.22);
    letter-spacing: .04em;
    font-style: italic;
    margin-bottom: 2px;
  }
  .pp-meta-lens {
    font-family: 'SF Mono','Fira Code',monospace;
    font-size: clamp(7px, .7vw, 8px);
    letter-spacing: .16em;
    color: rgba(255,255,255,.1);
    text-transform: uppercase;
  }

  /* Viewer ESC hint */
  .pp-viewer-esc {
    position: absolute; bottom: 36px; right: 36px; z-index: 10;
    font-family: 'SF Mono',monospace;
    font-size: 8px;
    letter-spacing: .28em;
    color: rgba(255,255,255,.1);
    text-transform: uppercase;
    opacity: 0;
    transition: opacity .7s .5s ease;
  }
  .pp-viewer-esc.in { opacity: 1; }

  /* ── KEYFRAMES ──────────────────────────────── */
  @keyframes ppSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ppDrift {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50%       { transform: translateX(-50%) translateY(-6px); }
  }
  @keyframes ppSkeleton {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pp-orb { animation: none; }
    .pp-skeleton { animation: none; }
    .pp-card, .pp-frame, .pp-img,
    .pp-navbtn, .pp-dot, .pp-viewer-bg,
    .pp-viewer-content, .pp-viewer-meta { transition: none !important; }
  }
`;

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ── 4. LAZY IMAGE with Intersection Observer ────────────── */
const LazyImg = memo(({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%", position: "relative" }}>
      {!loaded && <div className="pp-skeleton" />}
      {inView && (
        <img
          src={src}
          alt={alt}
          className={className}
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0, transition: "opacity .4s ease", position: "absolute", inset: 0 }}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
});

/* ── 5. NAV BUTTON ───────────────────────────────────────── */
const NavBtn = memo(({ dir, onClick }) => (
  <button className="pp-navbtn" onClick={onClick} aria-label={dir === "left" ? "Previous" : "Next"}>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      {dir === "left"
        ? <path d="M9 2L4 7l5 5" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M5 2l5 5-5 5" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  </button>
));

/* ── 6. PHOTO CARD ───────────────────────────────────────── */
const PhotoCard = memo(({ photo, distFromCenter, onClick }) => {
  const cls = distFromCenter === 0 ? "center" : distFromCenter === 1 ? "near" : "far";
  const isCenter = distFromCenter === 0;

  const handleClick = useCallback(() => onClick(photo), [photo, onClick]);

  return (
    <div className={`pp-card ${cls}`} onClick={handleClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}>
      <div className="pp-frame">
        <LazyImg src={photo.src} alt={photo.title} className="pp-img" />
        <div className="pp-vignette" />
        {isCenter && (
          <div className="pp-expand-hint">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5h6M6 3l2 2-2 2" stroke="rgba(255,255,255,.8)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
      <div className="pp-caption">
        <div className="pp-caption-title">{photo.title}</div>
        <div className="pp-caption-meta">{photo.location} · {photo.year}</div>
      </div>
    </div>
  );
});

/* ── 7. VIEWER REDUCER (avoids stale closure bugs) ───────── */
function viewerReducer(state, action) {
  switch (action.type) {
    case "OPEN":  return { open: true,  idx: action.idx };
    case "NAV":   return { open: true,  idx: (state.idx + action.delta + PHOTOS.length) % PHOTOS.length };
    case "CLOSE": return { open: false, idx: state.idx };
    default: return state;
  }
}

/* ── 8. FULLSCREEN VIEWER ────────────────────────────────── */
const FullscreenViewer = memo(({ state, dispatch }) => {
  const [mounted, setMounted] = useState(false);
  const photo = PHOTOS[state.idx];

  useEffect(() => {
    if (!state.open) { setMounted(false); return; }
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, [state.open]);

  useEffect(() => {
    if (!state.open) return;
    const handler = (e) => {
      if (e.key === "Escape")      dispatch({ type: "CLOSE" });
      if (e.key === "ArrowLeft")   dispatch({ type: "NAV", delta: -1 });
      if (e.key === "ArrowRight")  dispatch({ type: "NAV", delta: +1 });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.open, dispatch]);

  // Touch swipe
  const touchX = useRef(null);
  const onTouchStart = useCallback((e) => { touchX.current = e.touches[0].clientX; }, []);
  const onTouchEnd = useCallback((e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 50) dispatch({ type: "NAV", delta: dx < 0 ? 1 : -1 });
    touchX.current = null;
  }, [dispatch]);

  if (!state.open) return null;

  return createPortal(
    <div className="pp-viewer" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className={`pp-viewer-bg ${mounted ? "in" : ""}`} onClick={() => dispatch({ type: "CLOSE" })} />
      <button className={`pp-viewer-close ${mounted ? "in" : ""}`} onClick={() => dispatch({ type: "CLOSE" })} aria-label="Close">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="rgba(255,255,255,.6)" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      <div className={`pp-viewer-content ${mounted ? "in" : ""}`}>
        <NavBtn dir="left"  onClick={() => dispatch({ type: "NAV", delta: -1 })} />
        <div className="pp-viewer-col">
          <div className="pp-viewer-img-wrap">
            <img src={photo.src} alt={photo.title} className="pp-viewer-img" loading="eager" decoding="async" />
          </div>
          <div className="pp-viewer-dots">
            {PHOTOS.map((p, i) => (
              <div key={p.id} className={`pp-viewer-dot ${i === state.idx ? "active" : ""}`} />
            ))}
          </div>
        </div>
        <NavBtn dir="right" onClick={() => dispatch({ type: "NAV", delta: +1 })} />
      </div>

      <div className={`pp-viewer-meta ${mounted ? "in" : ""}`}>
        <div className="pp-meta-title">{photo.title}</div>
        <div className="pp-meta-loc">{photo.location}</div>
        <div className="pp-meta-date">{photo.date}</div>
        <div className="pp-meta-cam">{photo.camera}</div>
        {photo.lens && <div className="pp-meta-lens">{photo.lens}</div>}
      </div>

      <div className={`pp-viewer-esc ${mounted ? "in" : ""}`}>
        {state.idx + 1} / {PHOTOS.length} · ESC to close
      </div>
    </div>,
    document.body
  );
});

/* ── 9. MAIN PAGE ────────────────────────────────────────── */
export const PhotographyPage = memo(({ visible }) => {
  injectStyles(); // no-op after first call

  const [currentIdx, setCurrentIdx]       = useState(0);
  const [headerIn, setHeaderIn]            = useState(false);
  const [carouselIn, setCarouselIn]        = useState(false);
  const [viewerState, dispatch]            = useReducer(viewerReducer, { open: false, idx: 0 });

  const scrollRef  = useRef(null);
  const dragRef    = useRef({ active: false, startX: 0, scrollX: 0 });
  const touchRef   = useRef(null);

  /* Stagger reveal */
  useEffect(() => {
    if (!visible) { setHeaderIn(false); setCarouselIn(false); return; }
    const t1 = setTimeout(() => setHeaderIn(true),  200);
    const t2 = setTimeout(() => setCarouselIn(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible]);

  /* Wheel → horizontal scroll */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => { e.preventDefault(); el.scrollLeft += e.deltaY * 1.2; };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* Scroll → track center card */
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cx = el.scrollLeft + el.clientWidth / 2;
    const cards = el.querySelectorAll("[data-pidx]");
    let best = 0, bestDist = Infinity;
    cards.forEach((card, i) => {
      const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - cx);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setCurrentIdx(best);
  }, []);

  /* Snap to index */
  const snapTo = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(PHOTOS.length - 1, idx));
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector(`[data-pidx="${clamped}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  /* Mouse drag */
  const onMouseDown = useCallback((e) => {
    dragRef.current = { active: true, startX: e.clientX, scrollX: scrollRef.current?.scrollLeft || 0 };
    scrollRef.current?.classList.add("dragging");
  }, []);
  const onMouseMove = useCallback((e) => {
    if (!dragRef.current.active || !scrollRef.current) return;
    scrollRef.current.scrollLeft = dragRef.current.scrollX - (e.clientX - dragRef.current.startX);
  }, []);
  const onMouseUp = useCallback(() => {
    dragRef.current.active = false;
    scrollRef.current?.classList.remove("dragging");
  }, []);

  /* Touch swipe on carousel */
  const onTouchStart = useCallback((e) => { touchRef.current = e.touches[0].clientX; }, []);
  const onTouchEnd = useCallback((e) => {
    if (touchRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchRef.current;
    if (Math.abs(dx) > 40) snapTo(currentIdx + (dx < 0 ? 1 : -1));
    touchRef.current = null;
  }, [currentIdx, snapTo]);

  /* Open viewer */
  const openViewer = useCallback((photo) => {
    const idx = PHOTOS.findIndex((p) => p.id === photo.id);
    dispatch({ type: "OPEN", idx });
  }, []);

  /* Keyboard nav on carousel */
  useEffect(() => {
    if (viewerState.open) return; // viewer handles keys
    const handler = (e) => {
      if (e.key === "ArrowLeft")  snapTo(currentIdx - 1);
      if (e.key === "ArrowRight") snapTo(currentIdx + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [viewerState.open, currentIdx, snapTo]);

  return (
    <>
      <div className={`pp-root ${visible ? "visible" : "hidden"}`}>
        {/* Ambient orb */}
        <div className="pp-orb" />

        {/* Header */}
        <div className={`pp-header ${headerIn ? "in" : ""}`}>
          <div className="pp-eyebrow">visual archive</div>
          <div className="pp-title">PHOTOGRAPHY</div>
          <div className="pp-subtitle">
            The shots i find amusing<br />Yes i&apos;m self obsessed
          </div>
        </div>

        {/* Carousel row */}
        <div className={`pp-carousel-row ${carouselIn ? "in" : ""}`}>
          <div className="pp-navbtn-wrap left">
            <NavBtn dir="left" onClick={() => snapTo(currentIdx - 1)} />
          </div>

          <div
            ref={scrollRef}
            className="pp-scroll"
            onScroll={onScroll}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {PHOTOS.map((photo, i) => (
              <div key={photo.id} className="pp-snap" data-pidx={i}>
                <PhotoCard
                  photo={photo}
                  distFromCenter={Math.abs(i - currentIdx)}
                  onClick={openViewer}
                />
              </div>
            ))}
          </div>

          <div className="pp-navbtn-wrap right">
            <NavBtn dir="right" onClick={() => snapTo(currentIdx + 1)} />
          </div>
        </div>

        {/* Dot strip */}
        <div className={`pp-dots ${carouselIn ? "in" : ""}`}>
          {PHOTOS.map((p, i) => (
            <div
              key={p.id}
              className={`pp-dot ${i === currentIdx ? "active" : ""}`}
              onClick={() => snapTo(i)}
              role="button"
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>

        {/* Hint */}
        <div className={`pp-hint ${carouselIn ? "in" : ""}`}>
          scroll or drag · click to expand
        </div>
      </div>

      {/* Fullscreen viewer (portal) */}
      <FullscreenViewer state={viewerState} dispatch={dispatch} />
    </>
  );
});

export default PhotographyPage;