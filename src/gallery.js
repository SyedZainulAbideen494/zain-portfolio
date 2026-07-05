/**
 * PhotographyPage — ULTRA Edition
 * ─────────────────────────────────
 * What's new:
 *  1. Fisher-Yates shuffle on mount — photos appear in a different order every time
 *  2. Magnetic nav buttons — cursor pulls them with spring physics via CSS vars
 *  3. Card spotlight — radial highlight follows cursor on center card
 *  4. Film-grain SVG overlay (animated) on center card + viewer
 *  5. Live counter pill in header — morphs as you navigate
 *  6. Parallax tilt on center card (pointer-tracking → CSS custom props)
 *  7. Ambient color bleed — center card's accent value tints the orb
 *  8. Stagger-in for cards (each card animates with a staggered delay)
 *  9. Shutter-blink transition when navigating in viewer
 * 10. Haptic micro-bounce on nav button click (CSS keyframes)
 * 11. Film-strip progress indicator below dots
 * 12. Film perforation holes on center card (hover reveal)
 * 13. Title slide-in animation on viewer nav
 * 14. Noise texture overlay on page background
 * 15. Shimmer sweep on page title
 * 16. Underline flick on center card caption hover
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useReducer,
  memo,
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
const PHOTOS_SOURCE = [
  { id: 1,  src: img1,  title: "Still Light",         location: "Bengaluru", year: "2024", date: "March 14, 2024",    camera: "iPhone 15 Pro",  lens: "Main · 24mm",               accent: "120,100,80"  },
  { id: 3,  src: img3,  title: "Last Hour",            location: "Mysore",    year: "2023", date: "August 21, 2023",   camera: "iPhone 14 Pro",  lens: "Ultrawide · 13mm",          accent: "80,110,140"  },
  { id: 4,  src: img4,  title: "Between Frames",       location: "Bengaluru", year: "2024", date: "January 3, 2024",   camera: "Shot on Film",   lens: "50mm · Ilford HP5",         accent: "140,120,90"  },
  { id: 5,  src: img5,  title: "Quiet Intersection",   location: "Goa",       year: "2023", date: "December 29, 2023", camera: "iPhone 15 Pro",  lens: "Telephoto · 77mm",          accent: "90,130,110"  },
  { id: 6,  src: img6,  title: "Second Exposure",      location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "130,105,85"  },
  { id: 7,  src: img7,  title: "Grain & Light",        location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "110,95,75"   },
  { id: 8,  src: img8,  title: "Residue",              location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "95,85,70"    },
  { id: 9,  src: img9,  title: "Periphery",            location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "100,120,95"  },
  { id: 11, src: img11, title: "Overstay",             location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "115,100,80"  },
  { id: 12, src: img12, title: "Held Breath",          location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "105,115,125" },
  { id: 14, src: img14, title: "Diffuse",              location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "120,110,90"  },
  { id: 15, src: img15, title: "Underexposed",         location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "85,80,75"    },
  { id: 16, src: img16, title: "Soft Stop",            location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "130,115,95"  },
  { id: 17, src: img17, title: "Negative Space",       location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "100,100,110" },
  { id: 18, src: img18, title: "Long Exposure",        location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "90,105,120"  },
  { id: 19, src: img19, title: "ISO Push",             location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "125,110,85"  },
  { id: 20, src: img20, title: "Zone System",          location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "110,100,90"  },
  { id: 21, src: img21, title: "Bleach Bypass",        location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "95,110,130"  },
  { id: 22, src: img22, title: "Contact Print",        location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "115,105,85"  },
  { id: 23, src: img23, title: "Fixed Lens",           location: "Bengaluru", year: "2024", date: "February 18, 2024", camera: "Shot on Film",   lens: "28mm · Fuji Superia 400",   accent: "105,95,80"   },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── 3. STYLESHEET ───────────────────────────────────────── */
const STYLE_ID = "phot-ultra-v2";
const CSS = `
  .pp-root {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    overflow: hidden;
    transition: opacity .5s ease;
  }
  .pp-root.hidden  { opacity: 0; pointer-events: none; }
  .pp-root.visible { opacity: 1; pointer-events: auto; }

  .pp-orb {
    position: absolute; top: 5%; left: 50%;
    transform: translateX(-50%);
    width: min(70vw,700px); height: min(70vw,700px);
    border-radius: 50%;
    background: radial-gradient(circle,
      rgba(var(--orb-color,255,255,255),.045) 0%, transparent 65%);
    filter: blur(100px);
    pointer-events: none; z-index: 0;
    animation: ppDrift 16s ease-in-out infinite;
    transition: background 1.4s ease;
    will-change: transform;
  }
  .pp-noise {
    position: absolute; inset: 0;
    pointer-events: none; z-index: 1; opacity: .015;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 200px 200px;
    animation: ppNoise .1s steps(1) infinite;
  }

  /* Header */
  .pp-header {
    text-align: center;
    margin-bottom: clamp(26px,4vh,46px);
    z-index: 2; opacity: 0; position: relative;
  }
  .pp-header.in { animation: ppSlideUp .9s cubic-bezier(.16,1,.3,1) forwards; }
  .pp-eyebrow {
    font-family: 'SF Mono','Fira Code',monospace;
    font-size: clamp(7px,.7vw,8px); letter-spacing: .42em;
    color: rgba(255,255,255,.12); text-transform: uppercase;
    margin-bottom: 14px;
    display: flex; align-items: center; justify-content: center; gap: 12px;
  }
  .pp-eyebrow::before,.pp-eyebrow::after {
    content:''; display:block; width:28px; height:1px;
    background:rgba(255,255,255,.09);
  }
  .pp-title {
    font-family: 'SF Pro Display','Helvetica Neue',sans-serif;
    font-size: clamp(36px,6.5vw,76px); font-weight: 100;
    letter-spacing: .28em; color: rgba(255,255,255,.88); line-height: 1;
    position: relative; display: inline-block;
  }
  .pp-title::after {
    content: attr(data-text);
    position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.1) 50%, transparent 70%);
    background-size: 300% 100%;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ppShimmer 7s ease-in-out infinite 1.2s;
    pointer-events: none;
  }
  .pp-subtitle {
    margin-top: 12px;
    font-family: 'SF Pro Display','Helvetica Neue',sans-serif;
    font-size: clamp(10px,1vw,13px); font-weight: 200;
    letter-spacing: .12em; color: rgba(255,255,255,.17);
    font-style: italic; line-height: 1.85;
  }
  .pp-counter-pill {
    display: inline-flex; align-items: center; gap: 8px;
    margin-top: 16px; padding: 5px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.065);
    background: rgba(255,255,255,.02);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  }
  .pp-counter-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: rgba(var(--orb-color,255,255,255),.55);
    animation: ppPulse 2.2s ease-in-out infinite;
    transition: background 1.4s ease;
  }
  .pp-counter-num {
    font-family: 'SF Mono','Fira Code',monospace;
    font-size: 9px; letter-spacing: .18em; color: rgba(255,255,255,.38);
    font-variant-numeric: tabular-nums; transition: all .35s cubic-bezier(.16,1,.3,1);
  }
  .pp-counter-sep { width: 1px; height: 8px; background: rgba(255,255,255,.09); }
  .pp-counter-total {
    font-family: 'SF Mono','Fira Code',monospace;
    font-size: 9px; letter-spacing: .18em; color: rgba(255,255,255,.11);
  }

  /* Carousel */
  .pp-carousel-row {
    display: flex; align-items: center;
    gap: clamp(6px,1.2vw,18px); width: 100%; z-index: 2; opacity: 0;
  }
  .pp-carousel-row.in { animation: ppSlideUp .9s .18s cubic-bezier(.16,1,.3,1) forwards; }
  .pp-scroll {
    flex: 1; display: flex; align-items: center;
    gap: clamp(14px,2.2vw,32px);
    overflow-x: auto;
    padding: 24px clamp(46px,8vw,120px);
    cursor: grab; user-select: none;
    scroll-snap-type: x mandatory;
    scrollbar-width: none; -ms-overflow-style: none;
    -webkit-overflow-scrolling: touch;
  }
  .pp-scroll::-webkit-scrollbar { display: none; }
  .pp-scroll.dragging { cursor: grabbing; }
  .pp-snap { scroll-snap-align: center; flex-shrink: 0; }

  @keyframes ppCardIn {
    from { opacity: 0; transform: translateY(30px) scale(.93); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .pp-card-enter {
    opacity: 0;
    animation: ppCardIn .65s cubic-bezier(.16,1,.3,1) both;
  }

  /* Card */
  .pp-card {
    display: flex; flex-direction: column; align-items: center; gap: 14px;
    cursor: pointer;
    transition: opacity .55s cubic-bezier(.16,1,.3,1),
                transform .55s cubic-bezier(.34,1.56,.64,1);
  }
  .pp-card.center { opacity: 1; transform: scale(1); }
  .pp-card.near   { opacity: .48; transform: scale(.85); }
  .pp-card.far    { opacity: .22; transform: scale(.75); }

  /* Frame */
  .pp-frame {
    position: relative; overflow: hidden;
    transition: border-radius .5s ease, box-shadow .5s ease,
                transform .6s cubic-bezier(.34,1.56,.64,1);
    will-change: transform;
  }
  .pp-card.center .pp-frame {
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,.11);
    box-shadow: 0 40px 120px rgba(0,0,0,.92),
                0 0 0 1px rgba(255,255,255,.05),
                inset 0 1px 0 rgba(255,255,255,.065);
    width: clamp(228px,26.5vw,308px);
    height: clamp(305px,36vw,415px);
  }
  .pp-card:not(.center) .pp-frame {
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,.055);
    box-shadow: 0 12px 40px rgba(0,0,0,.68);
    width: clamp(148px,16.5vw,196px);
    height: clamp(196px,23vw,262px);
  }
  /* Tilt inner — CSS vars set by JS */
  .pp-frame-inner {
    width: 100%; height: 100%; position: relative;
    transform: rotateX(calc(var(--tx,0)*1deg)) rotateY(calc(var(--ty,0)*1deg));
    transition: transform .22s ease;
    will-change: transform;
  }
  .pp-img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: filter .5s ease, transform .6s cubic-bezier(.34,1.56,.64,1);
    will-change: transform;
  }
  .pp-card:not(.center) .pp-img { filter: brightness(.48) grayscale(.25); }
  .pp-card:hover .pp-img { transform: scale(1.045); }

  /* Spotlight */
  .pp-spotlight {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(circle 130px at var(--sx,50%) var(--sy,50%),
      rgba(255,255,255,.09), transparent 72%);
    opacity: 0; transition: opacity .3s ease;
  }
  .pp-card.center:hover .pp-spotlight { opacity: 1; }

  /* Film grain */
  .pp-grain {
    position: absolute; inset: 0; pointer-events: none; opacity: .032;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
    background-size: 150px 150px; mix-blend-mode: overlay;
    animation: ppGrain .1s steps(1) infinite;
  }
  .pp-vignette {
    position: absolute; bottom: 0; left: 0; right: 0; height: 42%;
    background: linear-gradient(to top, rgba(0,0,0,.76), transparent);
    pointer-events: none;
  }

  /* Film perforations */
  .pp-perf {
    position: absolute; top: 0; bottom: 0; width: 14px;
    display: flex; flex-direction: column; justify-content: space-evenly;
    align-items: center; pointer-events: none;
    opacity: 0; transition: opacity .4s ease;
  }
  .pp-perf.left  { left: -7px; }
  .pp-perf.right { right: -7px; }
  .pp-card.center:hover .pp-perf { opacity: .3; }
  .pp-perf-hole {
    width: 6px; height: 6px; border-radius: 1px;
    background: rgba(0,0,0,.85); border: 1px solid rgba(255,255,255,.1); flex-shrink: 0;
  }

  /* Expand hint */
  .pp-expand-hint {
    position: absolute; bottom: 14px; right: 14px;
    width: 30px; height: 30px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,.2);
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    background: rgba(255,255,255,.05);
    opacity: 0; transition: opacity .3s ease, transform .35s cubic-bezier(.34,1.56,.64,1);
    pointer-events: none; transform: scale(.65);
  }
  .pp-card.center:hover .pp-expand-hint { opacity: 1; transform: scale(1); }

  /* Skeleton */
  .pp-skeleton {
    width: 100%; height: 100%;
    background: linear-gradient(120deg, #0d0d0d 25%, #181818 50%, #0d0d0d 75%);
    background-size: 200% 100%;
    animation: ppSkeleton 1.9s ease infinite;
  }

  /* Caption */
  .pp-caption { text-align: center; transition: opacity .5s ease; }
  .pp-card.center .pp-caption { opacity: 1; }
  .pp-card:not(.center) .pp-caption { opacity: .25; }
  .pp-caption-title {
    font-family: 'SF Pro Display','Helvetica Neue',sans-serif;
    font-weight: 200; color: rgba(255,255,255,.8);
    letter-spacing: .025em; margin-bottom: 5px;
  }
  .pp-card.center  .pp-caption-title { font-size: clamp(12px,1.25vw,15px); }
  .pp-card:not(.center) .pp-caption-title { font-size: clamp(9px,.95vw,11px); }
  .pp-caption-inner {
    position: relative; display: inline-block;
  }
  .pp-caption-inner::after {
    content: ''; position: absolute; bottom: -2px; left: 0;
    width: 0; height: 1px; background: rgba(255,255,255,.28);
    transition: width .4s cubic-bezier(.16,1,.3,1);
  }
  .pp-card.center:hover .pp-caption-inner::after { width: 100%; }
  .pp-caption-meta {
    font-family: 'SF Mono','Fira Code',monospace;
    font-size: clamp(7px,.68vw,8px); letter-spacing: .22em;
    color: rgba(255,255,255,.18); text-transform: uppercase;
  }

  /* Nav button */
  .pp-navbtn {
    flex-shrink: 0; width: 44px; height: 44px; border-radius: 50%;
    background: rgba(255,255,255,.032);
    border: 1px solid rgba(255,255,255,.085);
    backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: width .4s cubic-bezier(.34,1.56,.64,1),
                height .4s cubic-bezier(.34,1.56,.64,1),
                background .3s ease, border-color .3s ease,
                box-shadow .3s ease, transform .2s cubic-bezier(.34,1.56,.64,1);
    box-shadow: 0 4px 16px rgba(0,0,0,.32); z-index: 20;
  }
  .pp-navbtn:hover {
    width: 50px; height: 50px;
    background: rgba(255,255,255,.075);
    border-color: rgba(255,255,255,.18);
    box-shadow: 0 8px 28px rgba(0,0,0,.48),
                0 0 16px rgba(255,255,255,.04),
                inset 0 1px 0 rgba(255,255,255,.08);
  }
  .pp-navbtn:active { transform: scale(.88); }
  .pp-navbtn.bounce { animation: ppBounce .36s cubic-bezier(.34,1.56,.64,1); }

  /* Magnetic wrapper */
  .pp-mag {
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    width: 68px; height: 68px;
    transform: translate(calc(var(--mx,0)*1px), calc(var(--my,0)*1px));
    transition: transform .22s cubic-bezier(.16,1,.3,1);
  }
  .pp-mag.left  { padding-left:  clamp(12px,2.2vw,32px); }
  .pp-mag.right { padding-right: clamp(12px,2.2vw,32px); }

  /* Dots */
  .pp-dots {
    display: flex; gap: 6px; align-items: center;
    margin-top: clamp(16px,2.5vh,26px); z-index: 2; opacity: 0;
    transition: opacity .8s .46s ease;
  }
  .pp-dots.in { opacity: 1; }
  .pp-dot {
    height: 3px; border-radius: 2px; cursor: pointer;
    transition: all .45s cubic-bezier(.34,1.56,.64,1);
  }
  .pp-dot.active { width: 18px; background: rgba(255,255,255,.48); }
  .pp-dot:not(.active) { width: 3px; background: rgba(255,255,255,.09); }
  .pp-dot:hover:not(.active) { background: rgba(255,255,255,.2); width: 6px; }

  /* Film strip */
  .pp-filmstrip {
    display: flex; align-items: center; gap: 0;
    margin-top: 9px; z-index: 2; opacity: 0;
    transition: opacity .8s .56s ease;
  }
  .pp-filmstrip.in { opacity: 1; }
  .pp-strip-cell {
    width: 8px; height: 3px;
    border-right: 1px solid rgba(255,255,255,.035);
    transition: background .5s ease;
  }
  .pp-strip-cell.filled { background: rgba(255,255,255,.07); }
  .pp-strip-cell.active { background: rgba(255,255,255,.3); }

  /* Hint */
  .pp-hint {
    position: absolute; bottom: 26px; left: 50%;
    transform: translateX(-50%);
    font-family: 'SF Mono','Fira Code',monospace;
    font-size: 7px; letter-spacing: .28em; color: rgba(255,255,255,.08);
    text-transform: uppercase; white-space: nowrap; z-index: 2; opacity: 0;
    transition: opacity .8s .66s ease;
    display: flex; align-items: center; gap: 10px;
  }
  .pp-hint.in { opacity: 1; }
  .pp-hint::before,.pp-hint::after {
    content:''; display:block; width:18px; height:1px; background:rgba(255,255,255,.06);
  }

  /* ── VIEWER ───────────────────────────── */
  .pp-viewer {
    position: fixed; inset: 0; z-index: 400;
    display: flex; align-items: center; justify-content: center;
  }
  .pp-viewer-bg {
    position: absolute; inset: 0; background: rgba(0,0,0,.97);
    backdrop-filter: blur(70px); -webkit-backdrop-filter: blur(70px);
    opacity: 0; transition: opacity .5s ease;
  }
  .pp-viewer-bg.in { opacity: 1; }
  .pp-shutter {
    position: absolute; inset: 0; z-index: 50;
    background: rgba(255,255,255,.16); pointer-events: none; opacity: 0;
  }
  .pp-shutter.flash { animation: ppShutter .28s ease forwards; }
  .pp-viewer-topbar {
    position: absolute; top: 26px; left: 50%; transform: translateX(-50%);
    z-index: 10; display: flex; align-items: center;
    opacity: 0; transition: opacity .5s .24s ease;
  }
  .pp-viewer-topbar.in { opacity: 1; }
  .pp-viewer-tag {
    font-family: 'SF Mono','Fira Code',monospace; font-size: 8px;
    letter-spacing: .3em; color: rgba(255,255,255,.14); text-transform: uppercase;
    padding: 5px 12px; border: 1px solid rgba(255,255,255,.065); border-radius: 999px;
    background: rgba(255,255,255,.018);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  }
  .pp-viewer-close {
    position: absolute; top: 26px; right: 26px; z-index: 10;
    width: 38px; height: 38px; border-radius: 50%;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    opacity: 0; transition: opacity .5s .2s ease, background .3s ease, transform .3s cubic-bezier(.34,1.56,.64,1);
  }
  .pp-viewer-close.in { opacity: 1; }
  .pp-viewer-close:hover { background: rgba(255,255,255,.085); transform: scale(1.1); }
  .pp-viewer-close:active { transform: scale(.88); }
  .pp-viewer-content {
    position: relative; z-index: 5;
    display: flex; align-items: center;
    gap: clamp(16px,2.2vw,32px);
    opacity: 0; transform: scale(.93) translateY(18px);
    transition: opacity .6s cubic-bezier(.16,1,.3,1),
                transform .6s cubic-bezier(.34,1.56,.64,1);
  }
  .pp-viewer-content.in { opacity: 1; transform: scale(1) translateY(0); }
  .pp-viewer-col { display: flex; flex-direction: column; align-items: center; gap: 20px; }
  .pp-viewer-img-wrap {
    border-radius: 22px; overflow: hidden;
    border: 1px solid rgba(255,255,255,.08);
    box-shadow: 0 60px 180px rgba(0,0,0,.99), 0 0 0 1px rgba(255,255,255,.03);
    width: clamp(248px,36vw,505px); height: clamp(328px,49vw,685px);
    position: relative;
    transition: opacity .2s ease;
  }
  .pp-viewer-img-wrap.switching { opacity: 0; }
  .pp-viewer-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pp-viewer-grain {
    position: absolute; inset: 0; pointer-events: none; opacity: .022;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
    background-size: 150px 150px; mix-blend-mode: overlay;
    animation: ppGrain .12s steps(1) infinite;
  }
  .pp-viewer-dots { display: flex; gap: 7px; align-items: center; }
  .pp-viewer-dot {
    height: 3px; border-radius: 2px; cursor: pointer;
    transition: all .4s cubic-bezier(.34,1.56,.64,1);
  }
  .pp-viewer-dot.active { width: 16px; background: rgba(255,255,255,.52); }
  .pp-viewer-dot:not(.active) { width: 3px; background: rgba(255,255,255,.11); }

  /* Meta */
  .pp-viewer-meta {
    position: absolute; bottom: 30px; left: 30px; z-index: 10;
    opacity: 0; transform: translateY(10px);
    transition: opacity .7s .38s ease, transform .7s .38s cubic-bezier(.16,1,.3,1);
  }
  .pp-viewer-meta.in { opacity: 1; transform: translateY(0); }
  .pp-meta-title {
    font-family: 'SF Pro Display','Helvetica Neue',sans-serif;
    font-size: clamp(16px,1.9vw,21px); font-weight: 100;
    color: rgba(255,255,255,.85); letter-spacing: -.01em;
    margin-bottom: 5px; overflow: hidden;
  }
  .pp-meta-title-inner {
    display: block;
    transition: transform .3s cubic-bezier(.16,1,.3,1), opacity .3s ease;
  }
  .pp-meta-title-inner.exit { transform: translateY(-100%); opacity: 0; }
  .pp-meta-title-inner.enter { animation: ppTitleIn .32s cubic-bezier(.16,1,.3,1) forwards; }
  .pp-meta-loc {
    font-family: 'SF Mono','Fira Code',monospace; font-size: clamp(7px,.72vw,8.5px);
    letter-spacing: .24em; color: rgba(255,255,255,.17);
    text-transform: uppercase; margin-bottom: 4px;
  }
  .pp-meta-date {
    font-family: 'SF Mono','Fira Code',monospace; font-size: clamp(6px,.68vw,8px);
    letter-spacing: .2em; color: rgba(255,255,255,.11);
    text-transform: uppercase; margin-bottom: 4px;
  }
  .pp-meta-cam {
    font-family: 'SF Pro Display','Helvetica Neue',sans-serif; font-size: clamp(9px,.88vw,11px);
    font-weight: 200; color: rgba(255,255,255,.19);
    letter-spacing: .04em; font-style: italic; margin-bottom: 2px;
  }
  .pp-meta-lens {
    font-family: 'SF Mono','Fira Code',monospace; font-size: clamp(6px,.62vw,7.5px);
    letter-spacing: .18em; color: rgba(255,255,255,.08); text-transform: uppercase;
  }
  .pp-viewer-count {
    position: absolute; bottom: 30px; right: 30px; z-index: 10;
    display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
    opacity: 0; transition: opacity .7s .5s ease;
  }
  .pp-viewer-count.in { opacity: 1; }
  .pp-viewer-count-num {
    font-family: 'SF Mono','Fira Code',monospace; font-size: 11px;
    letter-spacing: .18em; color: rgba(255,255,255,.2);
    font-variant-numeric: tabular-nums;
    transition: all .28s ease;
  }
  .pp-viewer-count-esc {
    font-family: 'SF Mono','Fira Code',monospace; font-size: 7px;
    letter-spacing: .28em; color: rgba(255,255,255,.07); text-transform: uppercase;
  }

  /* ── Keyframes ── */
  @keyframes ppSlideUp  { from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)} }
  @keyframes ppDrift    { 0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-8px)} }
  @keyframes ppSkeleton { 0%{background-position:200% 0}100%{background-position:-200% 0} }
  @keyframes ppNoise    { 0%{transform:translate(0,0)}25%{transform:translate(-1%,-1%)}50%{transform:translate(1%,0)}75%{transform:translate(0,1%)}100%{transform:translate(-1%,0)} }
  @keyframes ppGrain    { 0%{background-position:0 0}25%{background-position:-5% -5%}50%{background-position:-10% 5%}75%{background-position:5% -10%}100%{background-position:10% 0} }
  @keyframes ppShimmer  { 0%{background-position:200% 0}100%{background-position:-200% 0} }
  @keyframes ppPulse    { 0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.35)} }
  @keyframes ppBounce   { 0%{transform:scale(1)}40%{transform:scale(.82)}70%{transform:scale(1.14)}100%{transform:scale(1)} }
  @keyframes ppShutter  { 0%{opacity:1}100%{opacity:0} }
  @keyframes ppTitleIn  { from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1} }
  @keyframes ppCardIn   { from{opacity:0;transform:translateY(30px) scale(.93)}to{opacity:1;transform:translateY(0) scale(1)} }

  @media (prefers-reduced-motion: reduce) {
    .pp-orb,.pp-noise,.pp-grain,.pp-viewer-grain { animation: none !important; }
    .pp-card,.pp-frame,.pp-img,.pp-navbtn,.pp-dot,
    .pp-viewer-bg,.pp-viewer-content,.pp-viewer-meta,
    .pp-frame-inner,.pp-viewer-img-wrap,.pp-meta-title-inner,
    .pp-expand-hint,.pp-perf,.pp-spotlight { transition: none !important; animation: none !important; }
  }
`;

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID; el.textContent = CSS;
  document.head.appendChild(el);
}

/* ── LazyImg ─────────────────────────────────────────────── */
const LazyImg = memo(({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{width:"100%",height:"100%",position:"relative"}}>
      {!loaded && <div className="pp-skeleton"/>}
      {inView && (
        <img src={src} alt={alt} onLoad={() => setLoaded(true)}
          style={{opacity:loaded?1:0,transition:"opacity .4s ease",
                  position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}
          loading="lazy" decoding="async"/>
      )}
    </div>
  );
});

/* ── NavBtn ──────────────────────────────────────────────── */
const NavBtn = memo(({ dir, onClick }) => {
  const ref = useRef(null);
  const handle = useCallback(() => {
    onClick();
    const el = ref.current; if (!el) return;
    el.classList.remove("bounce"); void el.offsetWidth; el.classList.add("bounce");
  }, [onClick]);
  return (
    <button ref={ref} className="pp-navbtn" onClick={handle}
      aria-label={dir === "left" ? "Previous" : "Next"}>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        {dir === "left"
          ? <path d="M8.5 2L4 6.5l4.5 4.5" stroke="rgba(255,255,255,.48)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M4.5 2L9 6.5 4.5 11"  stroke="rgba(255,255,255,.48)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>}
      </svg>
    </button>
  );
});

/* ── MagneticNav ─────────────────────────────────────────── */
const MagneticNav = memo(({ dir, children }) => {
  const ref = useRef(null); const raf = useRef(null);
  const onMove = useCallback((e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width/2)) * .32;
    const dy = (e.clientY - (r.top  + r.height/2)) * .32;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", dx.toFixed(2));
      el.style.setProperty("--my", dy.toFixed(2));
    });
  }, []);
  const onLeave = useCallback(() => {
    ref.current?.style.setProperty("--mx","0");
    ref.current?.style.setProperty("--my","0");
  }, []);
  return (
    <div ref={ref} className={`pp-mag ${dir}`}
      onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
});

/* ── PhotoCard ───────────────────────────────────────────── */
const PERFS = Array(8).fill(null);
const PhotoCard = memo(({ photo, distFromCenter, onClick, enterDelay }) => {
  const cls = distFromCenter === 0 ? "center" : distFromCenter === 1 ? "near" : "far";
  const isCenter = distFromCenter === 0;
  const frameRef = useRef(null);

  const onMove = useCallback((e) => {
    if (!isCenter) return;
    const el = frameRef.current; if (!el) return;
    const inner = el.querySelector(".pp-frame-inner");
    const spot  = el.querySelector(".pp-spotlight");
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top)  / r.height;
    if (inner) {
      inner.style.setProperty("--tx", ((py - .5) * -8).toFixed(2));
      inner.style.setProperty("--ty", ((px - .5) *  8).toFixed(2));
    }
    if (spot) {
      spot.style.setProperty("--sx", `${(px*100).toFixed(1)}%`);
      spot.style.setProperty("--sy", `${(py*100).toFixed(1)}%`);
    }
  }, [isCenter]);

  const onLeave = useCallback(() => {
    const el = frameRef.current; if (!el) return;
    const inner = el.querySelector(".pp-frame-inner");
    if (inner) { inner.style.setProperty("--tx","0"); inner.style.setProperty("--ty","0"); }
  }, []);

  const handleClick = useCallback(() => onClick(photo), [photo, onClick]);

  return (
    <div
      className={`pp-card ${cls} pp-card-enter`}
      style={{ animationDelay: `${enterDelay}ms`, animationFillMode: "both" }}
      onClick={handleClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      onMouseMove={onMove} onMouseLeave={onLeave}
    >
      <div className="pp-frame" ref={frameRef}>
        {isCenter && <>
          <div className="pp-perf left">{PERFS.map((_,i)=><div key={i} className="pp-perf-hole"/>)}</div>
          <div className="pp-perf right">{PERFS.map((_,i)=><div key={i} className="pp-perf-hole"/>)}</div>
        </>}
        <div className="pp-frame-inner">
          <LazyImg src={photo.src} alt={photo.title}/>
          <div className="pp-vignette"/>
          {isCenter && <div className="pp-spotlight"/>}
          {isCenter && <div className="pp-grain"/>}
          {isCenter && (
            <div className="pp-expand-hint">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5h7M6 3l2 2-2 2" stroke="rgba(255,255,255,.72)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>
      </div>
      <div className="pp-caption">
        <div className="pp-caption-title">
          <span className="pp-caption-inner">{photo.title}</span>
        </div>
        <div className="pp-caption-meta">{photo.location} · {photo.year}</div>
      </div>
    </div>
  );
});

/* ── viewerReducer ───────────────────────────────────────── */
function viewerReducer(state, action) {
  switch (action.type) {
    case "OPEN":  return { open: true,  idx: action.idx, photos: action.photos };
    case "NAV":   return { ...state, idx: (state.idx + action.delta + state.photos.length) % state.photos.length };
    case "CLOSE": return { ...state, open: false };
    default: return state;
  }
}

/* ── FullscreenViewer ────────────────────────────────────── */
const FullscreenViewer = memo(({ state, dispatch }) => {
  const [mounted,   setMounted]   = useState(false);
  const [switching, setSwitching] = useState(false);
  const [titleAnim, setTitleAnim] = useState("");
  const shutterRef = useRef(null);
  const photos = state.photos || [];
  const photo  = photos[state.idx];

  useEffect(() => {
    if (!state.open) { setMounted(false); return; }
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, [state.open]);

  const handleNav = useCallback((delta) => {
    const sh = shutterRef.current;
    if (sh) { sh.classList.remove("flash"); void sh.offsetWidth; sh.classList.add("flash"); }
    setTitleAnim("exit"); setSwitching(true);
    setTimeout(() => {
      dispatch({ type: "NAV", delta });
      setSwitching(false); setTitleAnim("enter");
      setTimeout(() => setTitleAnim(""), 380);
    }, 210);
  }, [dispatch]);

  useEffect(() => {
    if (!state.open) return;
    const h = (e) => {
      if (e.key === "Escape")     dispatch({ type: "CLOSE" });
      if (e.key === "ArrowLeft")  handleNav(-1);
      if (e.key === "ArrowRight") handleNav(+1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.open]);

  const tx = useRef(null);
  const onTS = useCallback((e) => { tx.current = e.touches[0].clientX; }, []);
  const onTE = useCallback((e) => {
    if (tx.current === null) return;
    const dx = e.changedTouches[0].clientX - tx.current;
    if (Math.abs(dx) > 50) handleNav(dx < 0 ? 1 : -1);
    tx.current = null;
  }, [handleNav]);

  if (!state.open || !photo) return null;
  const pad = n => String(n+1).padStart(2,"0");

  return createPortal(
    <div className="pp-viewer" onTouchStart={onTS} onTouchEnd={onTE}>
      <div className={`pp-viewer-bg ${mounted?"in":""}`} onClick={() => dispatch({type:"CLOSE"})}/>
      <div ref={shutterRef} className="pp-shutter"/>
      <div className={`pp-viewer-topbar ${mounted?"in":""}`}>
        <div className="pp-viewer-tag">visual archive</div>
      </div>
      <button className={`pp-viewer-close ${mounted?"in":""}`}
        onClick={() => dispatch({type:"CLOSE"})} aria-label="Close">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M1 1l9 9M10 1L1 10" stroke="rgba(255,255,255,.52)" strokeWidth="1.25" strokeLinecap="round"/>
        </svg>
      </button>
      <div className={`pp-viewer-content ${mounted?"in":""}`}>
        <NavBtn dir="left"  onClick={() => handleNav(-1)}/>
        <div className="pp-viewer-col">
          <div className={`pp-viewer-img-wrap ${switching?"switching":""}`}>
            <img src={photo.src} alt={photo.title} className="pp-viewer-img" loading="eager" decoding="async"/>
            <div className="pp-viewer-grain"/>
          </div>
          <div className="pp-viewer-dots">
            {photos.map((p,i) => (
              <div key={p.id}
                className={`pp-viewer-dot ${i===state.idx?"active":""}`}
                onClick={() => dispatch({type:"NAV", delta: i - state.idx})}
              />
            ))}
          </div>
        </div>
        <NavBtn dir="right" onClick={() => handleNav(+1)}/>
      </div>
      <div className={`pp-viewer-meta ${mounted?"in":""}`}>
        <div className="pp-meta-title">
          <span className={`pp-meta-title-inner ${titleAnim}`}>{photo.title}</span>
        </div>
        <div className="pp-meta-loc">{photo.location}</div>
        <div className="pp-meta-date">{photo.date}</div>
        <div className="pp-meta-cam">{photo.camera}</div>
        {photo.lens && <div className="pp-meta-lens">{photo.lens}</div>}
      </div>
      <div className={`pp-viewer-count ${mounted?"in":""}`}>
        <div className="pp-viewer-count-num">{pad(state.idx)} / {String(photos.length).padStart(2,"0")}</div>
        <div className="pp-viewer-count-esc">esc to close</div>
      </div>
    </div>,
    document.body
  );
});

/* ── PhotographyPage (main) ──────────────────────────────── */
export const PhotographyPage = memo(({ visible }) => {
  injectStyles();

  const photos = useMemo(() => shuffle(PHOTOS_SOURCE), []);
  const total  = photos.length;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [headerIn,   setHeaderIn]   = useState(false);
  const [carouselIn, setCarouselIn] = useState(false);
  const [viewerState, dispatch]     = useReducer(viewerReducer, { open: false, idx: 0, photos });

  const scrollRef = useRef(null);
  const dragRef   = useRef({ active: false, startX: 0, scrollX: 0 });
  const touchRef  = useRef(null);
  const orbRef    = useRef(null);

  useEffect(() => {
    if (!visible) { setHeaderIn(false); setCarouselIn(false); return; }
    const t1 = setTimeout(() => setHeaderIn(true),  180);
    const t2 = setTimeout(() => setCarouselIn(true), 560);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible]);

  /* Orb color bleed */
  useEffect(() => {
    orbRef.current?.style.setProperty("--orb-color", photos[currentIdx]?.accent || "255,255,255");
  }, [currentIdx, photos]);

  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    const h = (e) => { e.preventDefault(); el.scrollLeft += e.deltaY * 1.3; };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current; if (!el) return;
    const cx = el.scrollLeft + el.clientWidth / 2;
    let best = 0, bestD = Infinity;
    el.querySelectorAll("[data-pidx]").forEach((card, i) => {
      const d = Math.abs(card.offsetLeft + card.offsetWidth/2 - cx);
      if (d < bestD) { bestD = d; best = i; }
    });
    setCurrentIdx(best);
  }, []);

  const snapTo = useCallback((idx) => {
    const c = Math.max(0, Math.min(total-1, idx));
    scrollRef.current?.querySelector(`[data-pidx="${c}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [total]);

  const onMouseDown = useCallback((e) => {
    dragRef.current = { active: true, startX: e.clientX, scrollX: scrollRef.current?.scrollLeft||0 };
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

  const onTouchStart = useCallback((e) => { touchRef.current = e.touches[0].clientX; }, []);
  const onTouchEnd   = useCallback((e) => {
    if (touchRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchRef.current;
    if (Math.abs(dx) > 40) snapTo(currentIdx + (dx < 0 ? 1 : -1));
    touchRef.current = null;
  }, [currentIdx, snapTo]);

  useEffect(() => {
    if (viewerState.open) return;
    const h = (e) => {
      if (e.key === "ArrowLeft")  snapTo(currentIdx - 1);
      if (e.key === "ArrowRight") snapTo(currentIdx + 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [viewerState.open, currentIdx, snapTo]);

  const openViewer = useCallback((photo) => {
    const idx = photos.findIndex(p => p.id === photo.id);
    dispatch({ type: "OPEN", idx, photos });
  }, [photos]);

  const pad = n => String(n+1).padStart(2,"0");

  return (
    <>
      <div className={`pp-root ${visible ? "visible" : "hidden"}`}>
        <div className="pp-noise"/>
        <div className="pp-orb" ref={orbRef}/>

        <div className={`pp-header ${headerIn ? "in" : ""}`}>
          <div className="pp-eyebrow">visual archive</div>
          <div className="pp-title" data-text="PHOTOGRAPHY">PHOTOGRAPHY</div>
          <div className="pp-subtitle">
            The shots i find amusing<br/>Yes i&apos;m self obsessed
          </div>
          <div className="pp-counter-pill">
            <div className="pp-counter-dot" style={{"--orb-color": photos[currentIdx]?.accent||"255,255,255"}}/>
            <div className="pp-counter-num">{pad(currentIdx)}</div>
            <div className="pp-counter-sep"/>
            <div className="pp-counter-total">{String(total).padStart(2,"0")}</div>
          </div>
        </div>

        <div className={`pp-carousel-row ${carouselIn ? "in" : ""}`}>
          <MagneticNav dir="left">
            <NavBtn dir="left" onClick={() => snapTo(currentIdx - 1)}/>
          </MagneticNav>
          <div ref={scrollRef} className="pp-scroll"
            onScroll={onScroll}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove}
            onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            {photos.map((photo, i) => (
              <div key={photo.id} className="pp-snap" data-pidx={i}>
                <PhotoCard
                  photo={photo}
                  distFromCenter={Math.abs(i - currentIdx)}
                  onClick={openViewer}
                  enterDelay={carouselIn ? i * 42 : 0}
                />
              </div>
            ))}
          </div>
          <MagneticNav dir="right">
            <NavBtn dir="right" onClick={() => snapTo(currentIdx + 1)}/>
          </MagneticNav>
        </div>

        <div className={`pp-dots ${carouselIn ? "in" : ""}`}>
          {photos.map((p,i) => (
            <div key={p.id}
              className={`pp-dot ${i===currentIdx?"active":""}`}
              onClick={() => snapTo(i)}
              role="button" aria-label={`Go to photo ${i+1}`}/>
          ))}
        </div>

        <div className={`pp-filmstrip ${carouselIn ? "in" : ""}`}>
          {photos.map((p,i) => (
            <div key={p.id}
              className={`pp-strip-cell ${i<currentIdx?"filled":i===currentIdx?"active":""}`}
            />
          ))}
        </div>

        <div className={`pp-hint ${carouselIn ? "in" : ""}`}>
          drag · scroll · click to expand
        </div>
      </div>

      <FullscreenViewer state={viewerState} dispatch={dispatch}/>
    </>
  );
});

export default PhotographyPage;