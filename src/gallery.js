import { useState, useEffect, useRef, useCallback, memo } from "react";
import img1 from './photography/1.JPG'
import img2 from './photography/2.JPG'
import img3 from './photography/3.JPG'
import img4 from './photography/4.JPG'
import img5 from './photography/5.JPG'
import img6 from './photography/6.JPG'
import img7 from './photography/7.JPG'
import img8 from './photography/8.jpg'
import img9 from './photography/9.JPG'
import img10 from './photography/10.JPG'
import img11 from './photography/11.JPG'
import img12 from './photography/12.JPG'
import img13 from './photography/13.JPG'
import img14 from './photography/14.JPG'
import img15 from './photography/15.JPG'
import img16 from './photography/16.JPG'
import img17 from './photography/17.JPG'
import img18 from './photography/18.JPG'
import img19 from './photography/19.JPG'
import img20 from './photography/20.JPG'
import img21 from './photography/21.JPG'
import img22 from './photography/22.JPG'
import img23 from './photography/23.JPG'
/* ─────────────────────────────────────────────────────────────
   PHOTOGRAPHY PAGE
   Drop-in replacement for GalleryPage in App.jsx
   Usage: import { PhotographyPage } from "./PhotographyPage";
   Then swap <GalleryPage> for <PhotographyPage> in App.jsx
   and add a dock button for "photography" (or rename the gallery slot).

   PHOTOS ARRAY — replace `src` values with your real image imports.
   Example at top of file:
       import shot1 from "./gallery/IMG_2183.JPG";
   Then set src: shot1 on the first PHOTOS entry.
───────────────────────────────────────────────────────────── */

/* ── Placeholder colour swatches (swap with real imports) ─── */
const PLACEHOLDER = {
  warm:  "linear-gradient(160deg,#1a1512 0%,#2d2118 50%,#1a1512 100%)",
  cool:  "linear-gradient(160deg,#0f1218 0%,#1a2030 50%,#0f1218 100%)",
  smoke: "linear-gradient(160deg,#111111 0%,#1c1c1c 50%,#111111 100%)",
  dusk:  "linear-gradient(160deg,#13101a 0%,#221830 50%,#13101a 100%)",
  mist:  "linear-gradient(160deg,#0d1210 0%,#162018 50%,#0d1210 100%)",
  haze:  "linear-gradient(160deg,#181410 0%,#26201a 50%,#181410 100%)",
};

/* ── PHOTOS DATA — replace src with real image imports ───── */
export const PHOTOS = [
  {
    id: 1,
    src: img1,           // e.g. import img1 from "./gallery/IMG_xxx.JPG"; → src: img1
    placeholder: PLACEHOLDER.warm,
    title: "Still Light",
    location: "Bengaluru",
    year: "2024",
    date: "March 14, 2024",
    camera: "iPhone 15 Pro",
    lens: "Main · 24mm",
    emoji: "◈",
  },

  {
    id: 3,
    src: img3,
    placeholder: PLACEHOLDER.smoke,
    title: "Last Hour",
    location: "Mysore",
    year: "2023",
    date: "August 21, 2023",
    camera: "iPhone 14 Pro",
    lens: "Ultrawide · 13mm",
    emoji: "◉",
  },
  {
    id: 4,
    src: img4,
    placeholder: PLACEHOLDER.dusk,
    title: "Between Frames",
    location: "Bengaluru",
    year: "2024",
    date: "January 3, 2024",
    camera: "Shot on Film",
    lens: "50mm · Ilford HP5",
    emoji: "◫",
  },
  {
    id: 5,
    src: img5,
    placeholder: PLACEHOLDER.mist,
    title: "Quiet Intersection",
    location: "Goa",
    year: "2023",
    date: "December 29, 2023",
    camera: "iPhone 15 Pro",
    lens: "Telephoto · 77mm",
    emoji: "◌",
  },
  {
    id: 6,
    src: img6,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
    {
    id: 7,
    src: img7,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
    {
    id: 8,
    src: img8,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
    {
    id: 9,
    src: img9,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
   {
    id: 10,
    src: img10,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
   {
    id:11,
    src: img11,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
   {
    id:12,
    src: img12,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
    {
    id: 13,
    src: img13,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
  {
    id: 14,
    src: img14,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
  {
    id: 15,
    src: img15,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
  {
    id: 16,
    src: img16,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
  {
    id: 17,
    src: img17,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
  {
    id: 18,
    src: img18,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
  {
    id: 19,
    src: img19,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
  {
    id: 20,
    src: img20,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
  {
    id: 21,
    src: img21,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
  {
    id: 22,
    src: img22,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
  {
    id: 23,
    src: img23,
    placeholder: PLACEHOLDER.haze,
    title: "Second Exposure",
    location: "Bengaluru",
    year: "2024",
    date: "February 18, 2024",
    camera: "Shot on Film",
    lens: "28mm · Fuji Superia 400",
    emoji: "⬢",
  },
];

/* ─── PHOTO CARD ─────────────────────────────────────────── */
const PhotoCard = memo(({ photo, isCenter, onClick, style }) => {
  const [hov, setHov] = useState(false);

  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        cursor: "pointer",
        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
        ...style,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onClick(photo)}
    >
      {/* Image frame */}
      <div
        style={{
          position: "relative",
          borderRadius: isCenter ? 28 : 20,
          overflow: "hidden",
          border: `1px solid rgba(255,255,255,${isCenter ? 0.14 : 0.07})`,
          boxShadow: isCenter
            ? "0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)"
            : "0 16px 50px rgba(0,0,0,0.7)",
          transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1)",
          transform: hov && isCenter ? "scale(1.025)" : "scale(1)",
          width: isCenter ? "clamp(240px,28vw,320px)" : "clamp(160px,18vw,210px)",
          height: isCenter ? "clamp(320px,38vw,430px)" : "clamp(210px,25vw,280px)",
        }}
      >
        {/* Image or placeholder */}
        {photo.src ? (
          <img
            src={photo.src}
            alt={photo.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: isCenter ? "none" : "brightness(0.55) grayscale(0.2)",
              transition: "filter 0.5s ease, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
              transform: hov ? "scale(1.04)" : "scale(1)",
            }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: photo.placeholder,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              filter: isCenter ? "none" : "brightness(0.5)",
              transition: "filter 0.5s ease",
            }}
          >
            {/* Grain overlay */}
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: isCenter ? 0.09 : 0.05,
                pointerEvents: "none",
                mixBlendMode: "overlay",
              }}
            >
              <filter id={`g-${photo.id}`}>
                <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <rect width="100%" height="100%" filter={`url(#g-${photo.id})`} />
            </svg>
            <span
              style={{
                fontSize: isCenter ? 52 : 36,
                color: "rgba(255,255,255,0.07)",
                userSelect: "none",
                position: "relative",
                zIndex: 2,
              }}
            >
              {photo.emoji}
            </span>
          </div>
        )}

        {/* Lens flare on hover */}
        {hov && isCenter && (
          <div
            style={{
              position: "absolute",
              top: "10%",
              left: "15%",
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
              animation: "photoFlare 1s ease-in-out infinite alternate",
            }}
          />
        )}

        {/* Bottom gradient */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "35%",
            background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
            pointerEvents: "none",
          }}
        />

        {/* Tap/click hint */}
        {isCenter && (
          <div
            style={{
              position: "absolute",
              bottom: 14,
              right: 14,
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              opacity: hov ? 1 : 0,
              transition: "opacity 0.3s ease",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5h6M6 3l2 2-2 2" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Caption */}
      <div
        style={{
          textAlign: "center",
          opacity: isCenter ? 1 : 0.3,
          transition: "opacity 0.5s ease",
        }}
      >
        <div
          style={{
            fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif",
            fontSize: isCenter ? "clamp(13px,1.4vw,16px)" : "clamp(10px,1.1vw,12px)",
            fontWeight: 200,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "0.03em",
            marginBottom: 5,
          }}
        >
          {photo.title}
        </div>
        <div
          style={{
            fontFamily: "'SF Mono','Fira Code',monospace",
            fontSize: "clamp(8px,0.75vw,9px)",
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.22)",
            textTransform: "uppercase",
          }}
        >
          {photo.location} · {photo.year}
        </div>
      </div>
    </div>
  );
});

/* ─── NAV BUTTON ─────────────────────────────────────────── */
const NavBtn = memo(({ dir, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: hov ? 52 : 46,
        height: hov ? 52 : 46,
        borderRadius: "50%",
        background: hov ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)",
        border: `1px solid rgba(255,255,255,${hov ? 0.22 : 0.1})`,
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: hov
          ? "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.1)"
          : "0 4px 16px rgba(0,0,0,0.4)",
        zIndex: 20,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        {dir === "left" ? (
          <path d="M9 2L4 7l5 5" stroke={`rgba(255,255,255,${hov ? 0.85 : 0.45})`} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M5 2l5 5-5 5" stroke={`rgba(255,255,255,${hov ? 0.85 : 0.45})`} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
});

/* ─── FULLSCREEN VIEWER ──────────────────────────────────── */
const FullscreenViewer = memo(({ photo, allPhotos, onClose, onNav }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 30);
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNav(-1);
      if (e.key === "ArrowRight") onNav(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNav]);

  const idx = allPhotos.findIndex((p) => p.id === photo.id);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.96)",
          backdropFilter: "blur(60px)",
          WebkitBackdropFilter: "blur(60px)",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 28,
          right: 28,
          zIndex: 10,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.5s 0.2s ease",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      {/* Main image */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: "clamp(20px,3vw,40px)",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "scale(1) translateY(0)" : "scale(0.92) translateY(20px)",
          transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <NavBtn dir="left" onClick={() => onNav(-1)} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          {/* Image */}
          <div
            style={{
              borderRadius: 24,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 60px 180px rgba(0,0,0,0.98), 0 0 0 1px rgba(255,255,255,0.04)",
              width: "clamp(260px,38vw,520px)",
              height: "clamp(340px,52vw,700px)",
              position: "relative",
            }}
          >
            {photo.src ? (
              <img
                src={photo.src}
                alt={photo.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: photo.placeholder,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.1, pointerEvents: "none" }}>
                  <filter id={`gv-${photo.id}`}>
                    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                  </filter>
                  <rect width="100%" height="100%" filter={`url(#gv-${photo.id})`} />
                </svg>
                <span style={{ fontSize: 80, color: "rgba(255,255,255,0.06)", position: "relative", zIndex: 2 }}>{photo.emoji}</span>
              </div>
            )}
          </div>

          {/* Dot indicators */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {allPhotos.map((p, i) => (
              <div
                key={p.id}
                style={{
                  width: p.id === photo.id ? 18 : 4,
                  height: 4,
                  borderRadius: 2,
                  background: p.id === photo.id ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)",
                  transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              />
            ))}
          </div>
        </div>

        <NavBtn dir="right" onClick={() => onNav(1)} />
      </div>

      {/* Metadata — bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: 36,
          zIndex: 10,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.7s 0.35s ease, transform 0.7s 0.35s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          style={{
            fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif",
            fontSize: "clamp(18px,2.2vw,24px)",
            fontWeight: 100,
            color: "rgba(255,255,255,0.88)",
            letterSpacing: "-0.01em",
            marginBottom: 6,
          }}
        >
          {photo.title}
        </div>
        <div
          style={{
            fontFamily: "'SF Mono','Fira Code',monospace",
            fontSize: "clamp(8px,0.8vw,9px)",
            letterSpacing: "0.22em",
            color: "rgba(255,255,255,0.2)",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          {photo.location}
        </div>
        <div
          style={{
            fontFamily: "'SF Mono','Fira Code',monospace",
            fontSize: "clamp(8px,0.8vw,9px)",
            letterSpacing: "0.22em",
            color: "rgba(255,255,255,0.14)",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          {photo.date}
        </div>
        <div
          style={{
            fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif",
            fontSize: "clamp(10px,0.95vw,12px)",
            fontWeight: 200,
            color: "rgba(255,255,255,0.22)",
            letterSpacing: "0.04em",
            fontStyle: "italic",
            marginBottom: 2,
          }}
        >
          {photo.camera}
        </div>
        {photo.lens && (
          <div
            style={{
              fontFamily: "'SF Mono','Fira Code',monospace",
              fontSize: "clamp(7px,0.7vw,8px)",
              letterSpacing: "0.16em",
              color: "rgba(255,255,255,0.1)",
              textTransform: "uppercase",
            }}
          >
            {photo.lens}
          </div>
        )}
      </div>

      {/* ESC hint — bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          right: 36,
          zIndex: 10,
          fontFamily: "'SF Mono',monospace",
          fontSize: 8,
          letterSpacing: "0.28em",
          color: "rgba(255,255,255,0.1)",
          textTransform: "uppercase",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.7s 0.5s ease",
        }}
      >
        {idx + 1} / {allPhotos.length} · ESC to close
      </div>
    </div>
  );
});

/* ─── PHOTOGRAPHY PAGE ───────────────────────────────────── */
export const PhotographyPage = memo(({ visible }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [viewer, setViewer]         = useState(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [carouselVisible, setCarouselVisible] = useState(false);
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart  = useRef(0);
  const scrollStart = useRef(0);

  /* Stagger header / carousel reveal */
  useEffect(() => {
    if (!visible) { setHeaderVisible(false); setCarouselVisible(false); return; }
    const t1 = setTimeout(() => setHeaderVisible(true), 200);
    const t2 = setTimeout(() => setCarouselVisible(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible]);

  /* Mouse-wheel → horizontal scroll */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY * 1.2;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* Drag-to-scroll */
  const onMouseDown = useCallback((e) => {
    isDragging.current = true;
    dragStart.current  = e.clientX;
    scrollStart.current = scrollRef.current?.scrollLeft || 0;
  }, []);
  const onMouseMove = useCallback((e) => {
    if (!isDragging.current || !scrollRef.current) return;
    scrollRef.current.scrollLeft = scrollStart.current - (e.clientX - dragStart.current);
  }, []);
  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  /* Snap to a card index */
  const snapTo = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(PHOTOS.length - 1, idx));
    setCurrentIdx(clamped);
    const el = scrollRef.current;
    if (!el) return;
    const cards = el.querySelectorAll("[data-photoidx]");
    const card  = cards[clamped];
    if (card) {
      card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, []);

  /* Track which card is closest to center */
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cx = el.scrollLeft + el.clientWidth / 2;
    const cards = el.querySelectorAll("[data-photoidx]");
    let closest = 0, minDist = Infinity;
    cards.forEach((card, i) => {
      const cardCx = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCx - cx);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setCurrentIdx(closest);
  }, []);

  const openViewer = useCallback((photo) => setViewer(photo), []);
  const closeViewer = useCallback(() => setViewer(null), []);
  const navViewer = useCallback((delta) => {
    setViewer((prev) => {
      const idx = PHOTOS.findIndex((p) => p.id === prev.id);
      const next = (idx + delta + PHOTOS.length) % PHOTOS.length;
      return PHOTOS[next];
    });
  }, []);

  return (
    <>
      <style>{`
        @keyframes photoFlare {
          from { opacity: 0; transform: translate(-10%, -10%) scale(0.8); }
          to   { opacity: 1; transform: translate(0%, 0%) scale(1.1); }
        }
        @keyframes photoHeaderSlide {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes photoCarouselFloat {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes photoSubtleDrift {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        .photo-scroll::-webkit-scrollbar { display: none; }
        .photo-scroll { scrollbar-width: none; -ms-overflow-style: none; scroll-snap-type: x mandatory; scroll-behavior: smooth; }
        .photo-card-snap { scroll-snap-align: center; }
      `}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.5s ease",
          pointerEvents: visible ? "auto" : "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* ── Ambient background orb ── */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(60vw, 600px)",
            height: "min(60vw, 600px)",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 65%)",
            filter: "blur(80px)",
            animation: "photoSubtleDrift 14s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* ── Header ── */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "clamp(36px,5vh,52px)",
            zIndex: 2,
            opacity: headerVisible ? 1 : 0,
            animation: headerVisible ? "photoHeaderSlide 0.9s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
          }}
        >
          <div
            style={{
              fontFamily: "'SF Mono','Fira Code',monospace",
              fontSize: "clamp(8px,0.75vw,9px)",
              letterSpacing: "0.38em",
              color: "rgba(255,255,255,0.15)",
              textTransform: "uppercase",
              marginBottom: 18,
              animation: headerVisible ? "photoHeaderSlide 0.9s 0.1s cubic-bezier(0.16,1,0.3,1) both" : "none",
            }}
          >
            visual archive
          </div>
          <div
            style={{
              fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif",
              fontSize: "clamp(38px,7vw,80px)",
              fontWeight: 100,
              letterSpacing: "0.25em",
              color: "rgba(255,255,255,0.9)",
              lineHeight: 1,
              textShadow: "0 0 80px rgba(255,255,255,0.06)",
              animation: headerVisible ? "photoHeaderSlide 0.9s 0.15s cubic-bezier(0.16,1,0.3,1) both" : "none",
            }}
          >
            PHOTOGRAPHY
          </div>
          <div
            style={{
              marginTop: 16,
              fontFamily: "'SF Pro Display','Helvetica Neue',sans-serif",
              fontSize: "clamp(11px,1.1vw,14px)",
              fontWeight: 200,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.2)",
              fontStyle: "italic",
              animation: headerVisible ? "photoHeaderSlide 0.9s 0.25s cubic-bezier(0.16,1,0.3,1) both" : "none",
            }}
          >
The shots i find amusing<br/>Yes i'm self obsessed
       </div>
        </div>

        {/* ── Carousel + nav ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(12px,2vw,24px)",
            width: "100%",
            zIndex: 2,
            opacity: carouselVisible ? 1 : 0,
            animation: carouselVisible ? "photoCarouselFloat 0.9s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
          }}
        >
          {/* Left button */}
          <div style={{ flexShrink: 0, paddingLeft: "clamp(16px,3vw,40px)" }}>
            <NavBtn dir="left" onClick={() => snapTo(currentIdx - 1)} />
          </div>

          {/* Scroll strip */}
          <div
            ref={scrollRef}
            className="photo-scroll"
            onScroll={onScroll}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "clamp(20px,3vw,40px)",
              overflowX: "auto",
              paddingTop: 20,
              paddingBottom: 20,
              paddingLeft: "clamp(60px,10vw,140px)",
              paddingRight: "clamp(60px,10vw,140px)",
              cursor: isDragging.current ? "grabbing" : "grab",
              userSelect: "none",
            }}
          >
            {PHOTOS.map((photo, i) => (
              <div key={photo.id} data-photoidx={i} className="photo-card-snap">
                <PhotoCard
                  photo={photo}
                  isCenter={i === currentIdx}
                  onClick={openViewer}
                  style={{
                    opacity: i === currentIdx ? 1 : Math.abs(i - currentIdx) === 1 ? 0.55 : 0.3,
                    transform:
                      i === currentIdx
                        ? "scale(1)"
                        : Math.abs(i - currentIdx) === 1
                        ? "scale(0.88)"
                        : "scale(0.78)",
                    transition: "opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Right button */}
          <div style={{ flexShrink: 0, paddingRight: "clamp(16px,3vw,40px)" }}>
            <NavBtn dir="right" onClick={() => snapTo(currentIdx + 1)} />
          </div>
        </div>

        {/* ── Dot strip ── */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginTop: "clamp(20px,3vh,32px)",
            zIndex: 2,
            opacity: carouselVisible ? 1 : 0,
            transition: "opacity 0.8s 0.4s ease",
          }}
        >
          {PHOTOS.map((p, i) => (
            <div
              key={p.id}
              onClick={() => snapTo(i)}
              style={{
                width: i === currentIdx ? 20 : 4,
                height: 4,
                borderRadius: 2,
                background: i === currentIdx ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)",
                transition: "all 0.45s cubic-bezier(0.34,1.56,0.64,1)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* ── Scroll hint ── */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'SF Mono','Fira Code',monospace",
            fontSize: 8,
            letterSpacing: "0.26em",
            color: "rgba(255,255,255,0.1)",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            zIndex: 2,
            opacity: carouselVisible ? 1 : 0,
            transition: "opacity 0.8s 0.6s ease",
          }}
        >
          scroll or drag · click to expand
        </div>
      </div>

      {/* ── Fullscreen viewer ── */}
      {viewer && (
        <FullscreenViewer
          photo={viewer}
          allPhotos={PHOTOS}
          onClose={closeViewer}
          onNav={navViewer}
        />
      )}
    </>
  );
});

export default PhotographyPage;