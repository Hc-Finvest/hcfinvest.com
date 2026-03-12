

// Leader_Board.jsx

import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";

/* ═══════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════ */
const TOP3 = [
  {
    rank: 1,
    name: "AlexFX",
    tag: "@alexfx",
    flag: "🇮🇳",
    init: "AF",
    hue: 38,
    roi: 312,
    balance: 5000,
    prize: 5000,
  },
  {
    rank: 2,
    name: "RaviT",
    tag: "@ravit",
    flag: "🇮🇳",
    init: "RT",
    hue: 205,
    roi: 285,
    balance: 3000,
    prize: 3000,
  },
  {
    rank: 3,
    name: "MikeFX",
    tag: "@mikefx",
    flag: "🇺🇸",
    init: "MF",
    hue: 22,
    roi: 260,
    balance: 2000,
    prize: 2000,
  },
];
const TABLE = [
  {
    rank: 4,
    name: "LixePx",
    flag: "🇩🇰",
    init: "LP",
    hue: 170,
    roi: 215,
    balance: 540,
    prize: 2000,
  },
  {
    rank: 5,
    name: "RaviT",
    flag: "🇮🇳",
    init: "RT",
    hue: 205,
    roi: 210,
    balance: 520,
    prize: 2000,
  },
  {
    rank: 6,
    name: "MikeFX",
    flag: "🇺🇸",
    init: "MF",
    hue: 22,
    roi: 260,
    balance: 310,
    prize: 2000,
  },
  {
    rank: 7,
    name: "MikeTrader",
    flag: "🇩🇰",
    init: "MT",
    hue: 280,
    roi: 180,
    balance: 218,
    prize: 2200,
  },
  {
    rank: 8,
    name: "CryptoKing",
    flag: "🇺🇸",
    init: "CK",
    hue: 340,
    roi: 165,
    balance: 265,
    prize: 2000,
  },
];
const TICKER = [
  "BTC/USD +2.4%",
  "ETH/USD +1.8%",
  "XRP/USD -0.6%",
  "SOL/USD +5.1%",
  "ADA/USD +0.9%",
  "BNB/USD +3.2%",
  "DOGE/USD -1.1%",
  "AVAX/USD +4.7%",
];

/* ═══════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════ */
const $ = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
const usd = (n) => `$${Number(n).toLocaleString()}`;

/* ═══════════════════════════════════════════════
   PARTICLE CANVAS
═══════════════════════════════════════════════ */
function Particles({ count = 60, color = "212,175,55" }) {
  const cvs = useRef();
  useEffect(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let W, H, pts, raf;
    const init = () => {
      W = c.width = c.offsetWidth;
      H = c.height = c.offsetHeight;
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * 0.6 + 0.1,
      }));
    };
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (let p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},${p.a})`;
        ctx.fill();
      }
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x,
            dy = pts[i].y - pts[j].y,
            d = Math.hypot(dx, dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(${color},${(1 - d / 100) * 0.1})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      raf = requestAnimationFrame(tick);
    };
    init();
    tick();
    const ro = new ResizeObserver(init);
    ro.observe(c);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);
  return (
    <canvas
      ref={cvs}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════
   AVATAR
═══════════════════════════════════════════════ */
function Avatar({ init, hue, size = 44, ring = false, ringGrad }) {
  return (
    <div
      style={{
        width: ring ? size + 8 : size,
        height: ring ? size + 8 : size,
        borderRadius: "50%",
        flexShrink: 0,
        background: ring ? ringGrad : "none",
        padding: ring ? 3 : 0,
        boxShadow: ring
          ? `0 0 24px ${$(hue, 80, 55, 0.5)},0 0 48px ${$(hue, 80, 55, 0.2)}`
          : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `conic-gradient(from 180deg at 50% 50%, ${$(hue, 80, 55)} 0%, ${$(hue + 50, 70, 38)} 50%, ${$(hue, 80, 55)} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.32,
          fontWeight: 800,
          color: "#fff",
          fontFamily: "'Clash Display',sans-serif",
          letterSpacing: "-.5px",
          boxShadow: `0 2px 12px ${$(hue, 70, 40, 0.5)}`,
        }}
      >
        {init}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ROI BADGE
═══════════════════════════════════════════════ */
function RoiBadge({ v }) {
  const pos = v > 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 12px",
        borderRadius: 99,
        background: pos ? "rgba(0,220,120,.08)" : "rgba(255,70,70,.08)",
        border: `1px solid ${pos ? "rgba(0,220,120,.22)" : "rgba(255,70,70,.22)"}`,
        color: pos ? "#00dc78" : "#ff5050",
        fontFamily: "'DM Mono',monospace",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: ".03em",
      }}
    >
      <span style={{ fontSize: 9 }}>{pos ? "▲" : "▼"}</span>
      {pos ? "+" : ""}
      {v}%
    </span>
  );
}

/* ═══════════════════════════════════════════════
   PODIUM PILLAR
═══════════════════════════════════════════════ */
const PILLAR = {
  1: {
    h: 185,
    w: 168,
    label: "CHAMPION",
    emoji: "👑",
    ringGrad: "linear-gradient(135deg,#ffe566,#c8820a,#7a4d00,#c8820a,#ffe566)",
    gradTop: "#ffe566",
    gradBot: "#7a4e00",
    glow: "212,175,55",
  },
  2: {
    h: 148,
    w: 152,
    label: "2ND PLACE",
    emoji: "🥈",
    ringGrad: "linear-gradient(135deg,#e8f4ff,#8faec8,#3d6080,#8faec8,#e8f4ff)",
    gradTop: "#c8dff0",
    gradBot: "#2d4f6a",
    glow: "140,185,220",
  },
  3: {
    h: 116,
    w: 145,
    label: "3RD PLACE",
    emoji: "🥉",
    ringGrad: "linear-gradient(135deg,#f5c080,#a05e28,#5a2e08,#a05e28,#f5c080)",
    gradTop: "#f0b870",
    gradBot: "#5a2e08",
    glow: "185,110,50",
  },
};

function PodiumPillar({ t, delay }) {
  const p = PILLAR[t.rank];
  const isFirst = t.rank === 1;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        animation: `riseUp .9s cubic-bezier(.16,1,.3,1) ${delay}s both`,
      }}
    >
      <div
        style={{
          fontSize: isFirst ? 30 : 22,
          marginBottom: 6,
          animation: `float ${isFirst ? 2.6 : 3.2}s ease-in-out ${delay}s infinite`,
          filter: `drop-shadow(0 4px 14px rgba(${p.glow},.6))`,
        }}
      >
        {p.emoji}
      </div>

      <div style={{ marginBottom: 12 }}>
        <Avatar
          init={t.init}
          hue={t.hue}
          size={isFirst ? 74 : 58}
          ring
          ringGrad={p.ringGrad}
        />
      </div>

      <div
        style={{
          fontFamily: "'Clash Display',sans-serif",
          fontWeight: 700,
          fontSize: isFirst ? 17 : 14,
          color: "#f5efe0",
          textShadow: `0 0 24px rgba(${p.glow},.6)`,
          marginBottom: 2,
          letterSpacing: "-.3px",
        }}
      >
        {t.name}
      </div>
      <div style={{ fontSize: 14, marginBottom: 12 }}>{t.flag}</div>

      <div
        style={{
          width: p.w,
          height: p.h,
          borderRadius: "16px 16px 6px 6px",
          background: `linear-gradient(175deg,${p.gradTop} 0%,${p.gradBot} 100%)`,
          position: "relative",
          overflow: "hidden",
          boxShadow: `0 -6px 40px rgba(${p.glow},.45), 0 24px 60px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.25)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(130deg,rgba(255,255,255,.22) 0%,transparent 50%)",
            borderRadius: "inherit",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            backgroundImage:
              "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 8px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 8px)",
          }}
        />
        <div
          style={{
            fontFamily: "'Clash Display',sans-serif",
            fontWeight: 800,
            fontSize: isFirst ? 30 : 22,
            color: "#fff",
            letterSpacing: "-1.5px",
            textShadow: "0 2px 16px rgba(0,0,0,.4)",
            position: "relative",
          }}
        >
          {usd(t.prize)}
        </div>
        <div
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 11.5,
            fontWeight: 500,
            color: "rgba(255,255,255,.75)",
            position: "relative",
          }}
        >
          +{t.roi}% ROI
        </div>
        <div
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 9.5,
            fontWeight: 500,
            color: "rgba(255,255,255,.4)",
            letterSpacing: ".14em",
            textTransform: "uppercase",
            position: "relative",
          }}
        >
          {p.label}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TICKER
═══════════════════════════════════════════════ */
function Ticker() {
  const items = [...TICKER, ...TICKER];
  return (
    <div style={{ overflow: "hidden", width: "100%", position: "relative" }}>
      <div
        style={{
          display: "flex",
          gap: 48,
          animation: "tickerScroll 22s linear infinite",
          width: "max-content",
        }}
      >
        {items.map((t, i) => {
          const pos = t.includes("+");
          return (
            <span
              key={i}
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: 11,
                fontWeight: 500,
                color: pos ? "#00dc78" : "#ff6060",
                letterSpacing: ".06em",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: "rgba(255,255,255,.3)" }}>
                {t.split(" ")[0]}{" "}
              </span>
              {t.split(" ")[1]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPETITION  ← renamed from App
═══════════════════════════════════════════════ */
export default function Leader_Board() {
  const [tab, setTab] = useState("Leaderboard");
  const [hovered, setHov] = useState(null);
  const [showAll, setAll] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frame, start;
    const duration = 1400,
      target = 12200;
    const run = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setCount(Math.round(ease * target));
      if (p < 1) frame = requestAnimationFrame(run);
    };
    const t = setTimeout(() => {
      frame = requestAnimationFrame(run);
    }, 400);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(frame);
    };
  }, []);

  const rows = showAll ? TABLE : TABLE.slice(0, 3);
  const PODIUM_ORDER = [TOP3[1], TOP3[0], TOP3[2]]; // 2nd | 1st | 3rd
  /* 
  return (
    <div className="min-h-screen flex bg-[#070810] text-white">
      {/* Sidebar .*}
      <Sidebar activeMenu="Compitation" />

      {/* Main Content .*}
      <div className="flex-1 overflow-y-auto flex justify-center px-4 py-10">
        <div className="w-full max-w-[860px]">
          {/* Stats Strip .*}
          <div className="flex justify-end gap-3 mb-4">
            {[
              {
                label: "Total Prize Pool",
                val: usd(count),
                accent: "text-yellow-400",
              },
              { label: "Participants", val: "1,248", accent: "text-blue-400" },
              { label: "Days Left", val: "07", accent: "text-green-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur"
              >
                <div className={`font-bold text-lg ${s.accent}`}>{s.val}</div>

                <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Main Card .*}
          <div className="relative rounded-[28px] border border-yellow-500/20 bg-gradient-to-br from-[#111320] to-[#090b16] shadow-2xl overflow-hidden">
            {/* Particles .*}
            <div className="absolute inset-0 opacity-60">
              <Particles count={65} />
            </div>

            {/* NAV .*}
            <div className="relative z-10 flex items-center justify-between px-6 border-b border-yellow-500/10 backdrop-blur">
              <div className="flex">
                {["Leaderboard", "My Performance", "Rules"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-5 py-4 text-xs uppercase tracking-widest font-mono transition ${
                      tab === t
                        ? "text-yellow-400 border-b border-yellow-400"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-[10px] tracking-widest text-green-400">
                    LIVE
                  </span>
                </div>

                <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold">
                  U
                </div>
              </div>
            </div>

            {/* Ticker .*}
            <div className="flex items-center gap-4 px-6 py-2 border-b border-white/5 bg-black/30 backdrop-blur">
              <span className="text-[10px] text-yellow-400/70 tracking-widest">
                MARKETS
              </span>

              <div className="flex-1 overflow-hidden">
                <Ticker />
              </div>
            </div>

            {/* Podium .*}
            <div className="relative z-10 px-8 py-10">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10">
                  <span>🏆</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-yellow-400">
                    Season 2026 · Championship
                  </span>
                </div>
              </div>

              <div className="flex justify-center items-end gap-6">
                {PODIUM_ORDER.map((t, i) => (
                  <PodiumPillar key={t.name} t={t} delay={i * 0.14 + 0.1} />
                ))}
              </div>
            </div>

            {/* Divider .*}
            <div className="h-[1px] mx-8 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>

            {/* Table Header .*}
            <div className="grid grid-cols-[60px_1fr_120px_110px_120px] px-8 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-yellow-400/40">
              <div>Rank</div>
              <div>Trader</div>
              <div className="text-center">Balance</div>
              <div className="text-center">ROI</div>
              <div className="text-center">Prize</div>
            </div>

            {/* Table Rows .*}
            <div>
              {rows.map((t, i) => {
                const hot = hovered === t.rank;

                return (
                  <div
                    key={t.rank}
                    onMouseEnter={() => setHov(t.rank)}
                    onMouseLeave={() => setHov(null)}
                    className="grid grid-cols-[60px_1fr_120px_110px_120px] items-center px-8 py-4 border-b border-white/5 hover:bg-yellow-500/5 transition"
                  >
                    <div className="text-white/40 font-mono">#{t.rank}</div>

                    <div className="flex items-center gap-3">
                      <Avatar init={t.init} hue={t.hue} size={38} />
                      <div>
                        <div className="font-semibold text-sm text-white">
                          {t.name}
                        </div>
                        <div className="text-xs text-white/40">{t.flag}</div>
                      </div>
                    </div>

                    <div className="text-center text-sm text-white/70 font-mono">
                      {usd(t.balance)}
                    </div>

                    <div className="text-center">
                      <RoiBadge v={t.roi} />
                    </div>

                    <div className="text-center">
                      <span className="px-3 py-1 rounded-full border border-yellow-400/20 bg-yellow-400/10 text-yellow-400 text-xs">
                        {usd(t.prize)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View Button .*}
            <div className="text-center py-6 border-t border-white/5">
              <button
                onClick={() => setAll(!showAll)}
                className="px-6 py-2 rounded-full border border-yellow-400/30 text-yellow-400 text-xs uppercase tracking-widest hover:bg-yellow-400/10 transition"
              >
                {showAll ? "▲ Show Less" : "▼ View All Traders"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ); */

  return (
    <div className="min-h-screen flex bg-[#070810] text-white">
      {/* Sidebar */}
      <Sidebar activeMenu="Leader Board" />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-10">
        <div className="w-full">
          {/* Stats Strip */}
          <div className="flex justify-end gap-3 mb-4">
            {[
              {
                label: "Total Prize Pool",
                val: usd(count),
                accent: "text-yellow-400",
              },
              { label: "Participants", val: "1,248", accent: "text-blue-400" },
              { label: "Days Left", val: "07", accent: "text-green-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur"
              >
                <div className={`font-bold text-lg ${s.accent}`}>{s.val}</div>

                <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Main Card */}
          <div className="relative w-full rounded-[28px] border border-yellow-500/20 bg-gradient-to-br from-[#111320] to-[#090b16] shadow-2xl overflow-hidden">
            {/* Particles */}
            <div className="absolute inset-0 opacity-60">
              <Particles count={65} />
            </div>

            {/* NAV */}
            <div className="relative z-10 flex items-center justify-between px-6 border-b border-yellow-500/10 backdrop-blur">
              <div className="flex">
                {["Leaderboard", "My Performance", "Rules"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-5 py-4 text-xs uppercase tracking-widest font-mono transition ${
                      tab === t
                        ? "text-yellow-400 border-b border-yellow-400"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-[10px] tracking-widest text-green-400">
                    LIVE
                  </span>
                </div>

                <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold">
                  U
                </div>
              </div>
            </div>

            {/* Ticker */}
            <div className="flex items-center gap-4 px-6 py-2 border-b border-white/5 bg-black/30 backdrop-blur">
              <span className="text-[10px] text-yellow-400/70 tracking-widest">
                MARKETS
              </span>

              <div className="flex-1 overflow-hidden">
                <Ticker />
              </div>
            </div>

            {/* Podium */}
            <div className="relative z-10 px-8 py-12">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10">
                  <span>🏆</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-yellow-400">
                    Season 2026 · Championship
                  </span>
                </div>
              </div>

              <div className="flex justify-center items-end gap-10">
                {PODIUM_ORDER.map((t, i) => (
                  <PodiumPillar key={t.name} t={t} delay={i * 0.14 + 0.1} />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-[1px] mx-8 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>

            {/* Table Header */}
            <div className="grid grid-cols-[60px_1fr_120px_110px_120px] px-8 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-yellow-400/40">
              <div>Rank</div>
              <div>Trader</div>
              <div className="text-center">Balance</div>
              <div className="text-center">ROI</div>
              <div className="text-center">Prize</div>
            </div>

            {/* Table Rows */}
            <div>
              {rows.map((t) => (
                <div
                  key={t.rank}
                  onMouseEnter={() => setHov(t.rank)}
                  onMouseLeave={() => setHov(null)}
                  className="grid grid-cols-[60px_1fr_120px_110px_120px] items-center px-8 py-4 border-b border-white/5 hover:bg-yellow-500/5 transition"
                >
                  <div className="text-white/40 font-mono">#{t.rank}</div>

                  <div className="flex items-center gap-3">
                    <Avatar init={t.init} hue={t.hue} size={38} />

                    <div>
                      <div className="font-semibold text-sm text-white">
                        {t.name}
                      </div>

                      <div className="text-xs text-white/40">{t.flag}</div>
                    </div>
                  </div>

                  <div className="text-center text-sm text-white/70 font-mono">
                    {usd(t.balance)}
                  </div>

                  <div className="text-center">
                    <RoiBadge v={t.roi} />
                  </div>

                  <div className="text-center">
                    <span className="px-3 py-1 rounded-full border border-yellow-400/20 bg-yellow-400/10 text-yellow-400 text-xs">
                      {usd(t.prize)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* View Button */}
            <div className="text-center py-6 border-t border-white/5">
              <button
                onClick={() => setAll(!showAll)}
                className="px-6 py-2 rounded-full border border-yellow-400/30 text-yellow-400 text-xs uppercase tracking-widest hover:bg-yellow-400/10 transition"
              >
                {showAll ? "▲ Show Less" : "▼ View All Traders"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
