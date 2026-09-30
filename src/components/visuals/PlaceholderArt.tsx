import type { PlaceholderArt as ArtKind } from "@/data/media";
import { WolfMark, Wordmark } from "./WolfMark";

/**
 * Designed placeholders — cinematic dark compositions that hold the
 * layout and mood until the real AI-generated imagery is dropped in.
 * Each fills its container like `object-fit: cover`.
 */

/* ───────── Shared building blocks ───────── */

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-spot`} cx="50%" cy="38%" r="60%">
        <stop offset="0%" stopColor="#0066FF" stopOpacity="0.32" />
        <stop offset="45%" stopColor="#06152F" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#050505" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-floor`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00A8FF" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#00A8FF" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0A0A0D" />
        <stop offset="100%" stopColor="#050505" />
      </linearGradient>
      <linearGradient id={`${id}-cloth`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1b1d24" />
        <stop offset="60%" stopColor="#101116" />
        <stop offset="100%" stopColor="#08080b" />
      </linearGradient>
      <linearGradient id={`${id}-rim`} x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#00A8FF" stopOpacity="0.9" />
        <stop offset="45%" stopColor="#0066FF" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#F5F7FA" stopOpacity="0.06" />
      </linearGradient>
      <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#00A8FF" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}-streak`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#00A8FF" stopOpacity="0" />
        <stop offset="70%" stopColor="#00A8FF" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#F5F7FA" stopOpacity="0.9" />
      </linearGradient>
      <radialGradient id={`${id}-vignette`} cx="50%" cy="50%" r="75%">
        <stop offset="55%" stopColor="#050505" stopOpacity="0" />
        <stop offset="100%" stopColor="#050505" stopOpacity="0.85" />
      </radialGradient>
      <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="18" />
      </filter>
      <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>
  );
}

function Frame({
  id,
  w,
  h,
  children,
  label,
}: {
  id: string;
  w: number;
  h: number;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <Defs id={id} />
      <rect width={w} height={h} fill={`url(#${id}-bg)`} />
      {children}
      <rect width={w} height={h} fill={`url(#${id}-vignette)`} />
      {label && (
        <text
          x={w - 16}
          y={h - 16}
          textAnchor="end"
          fill="#70757D"
          fontSize={Math.max(9, w / 60)}
          fontFamily="var(--font-mono)"
          letterSpacing="2"
          opacity="0.6"
        >
          {label}
        </text>
      )}
    </svg>
  );
}

/* ───────── Garments (4:5) ───────── */

const GARMENTS = {
  tee: {
    body: "M130,86 L170,72 Q200,92 230,72 L270,86 L338,126 L316,186 L282,170 L284,420 L116,420 L118,170 L84,186 L62,126 Z",
    detail: ["M170,72 Q200,104 230,72", "M118,410 L282,410"],
  },
  oversized: {
    body: "M118,92 L168,74 Q200,94 232,74 L282,92 L354,158 L322,222 L292,206 L298,430 L102,430 L108,206 L78,222 L46,158 Z",
    detail: ["M168,74 Q200,106 232,74", "M118,92 L108,206", "M282,92 L292,206"],
  },
  shorts: {
    body: "M108,118 L292,118 L306,338 L212,354 L200,226 L188,354 L94,338 Z",
    detail: ["M108,142 L292,142", "M190,142 L186,176", "M210,142 L214,176", "M232,150 Q262,200 296,214"],
  },
  hoodie: {
    body: "M138,112 Q146,40 200,36 Q254,40 262,112 L302,126 L352,172 L342,384 L306,388 L300,214 L298,424 L102,424 L100,214 L94,388 L58,384 L48,172 L98,126 Z",
    detail: ["M166,116 Q200,62 234,116 Q200,146 166,116 Z", "M138,318 L262,318 L274,392 L126,392 Z", "M188,146 L186,208", "M212,146 L214,208"],
  },
} as const;

function Garment({ id, kind, back }: { id: string; kind: keyof typeof GARMENTS; back?: boolean }) {
  const g = GARMENTS[kind];
  return (
    <>
      <circle cx="200" cy="200" r="220" fill={`url(#${id}-spot)`} />
      <ellipse cx="200" cy="458" rx="170" ry="16" fill={`url(#${id}-floor)`} />
      <line x1="0" y1="458" x2="400" y2="458" stroke="#F5F7FA" strokeOpacity="0.05" />
      <g transform={back ? "translate(400,0) scale(-1,1)" : undefined}>
        <path d={g.body} fill={`url(#${id}-cloth)`} />
        <path d={g.body} fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.4" />
        {g.detail.map((d) => (
          <path key={d} d={d} fill="none" stroke="#F5F7FA" strokeOpacity="0.1" strokeWidth="1" />
        ))}
      </g>
      {back ? (
        <g opacity="0.85">
          <g transform={`translate(${kind === "shorts" ? 176 : 158},${kind === "shorts" ? 256 : 206})`} color="#F5F7FA">
            <WolfMark outline size={kind === "shorts" ? 48 : 84} />
          </g>
          {kind !== "shorts" && (
            <text x="200" y="300" textAnchor="middle" fill="#F5F7FA" fillOpacity="0.55" fontSize="11" letterSpacing="4" fontFamily="var(--font-mono)">
              HUNT YOUR APEX
            </text>
          )}
        </g>
      ) : (
        <g
          transform={`translate(${kind === "shorts" ? 226 : kind === "hoodie" ? 162 : 164},${kind === "shorts" ? 308 : kind === "hoodie" ? 250 : 156})`}
          color="#F5F7FA"
          opacity="0.8"
        >
          <Wordmark size={kind === "shorts" ? 50 : 76} />
        </g>
      )}
    </>
  );
}

/* ───────── Atmospheres ───────── */

function Beam({ id, x, w, h, opacity = 1 }: { id: string; x: number; w: number; h: number; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <polygon points={`${x - w * 0.06},0 ${x + w * 0.06},0 ${x + w * 0.4},${h} ${x - w * 0.4},${h}`} fill={`url(#${id}-beam)`} opacity="0.35" filter={`url(#${id}-blur)`} />
      <line x1={x} y1="0" x2={x} y2={h * 0.9} stroke="#00A8FF" strokeOpacity="0.25" />
    </g>
  );
}

function Smoke({ id, cx, cy, r, o = 0.5 }: { id: string; cx: number; cy: number; r: number; o?: number }) {
  return <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.45} fill="#0066FF" opacity={o * 0.18} filter={`url(#${id}-blur)`} />;
}

function Grid({ w, h, y, step = 60 }: { w: number; h: number; y: number; step?: number }) {
  // Perspective floor grid — motorsport / tech feel.
  const lines = [];
  const vp = w / 2;
  for (let i = -12; i <= 12; i++) {
    lines.push(<line key={`v${i}`} x1={vp} y1={y} x2={vp + i * step * 2.2} y2={h} stroke="#00A8FF" strokeOpacity="0.09" />);
  }
  for (let j = 1; j <= 8; j++) {
    const yy = y + (h - y) * Math.pow(j / 8, 1.8);
    lines.push(<line key={`h${j}`} x1="0" y1={yy} x2={w} y2={yy} stroke="#00A8FF" strokeOpacity={0.04 + j * 0.012} />);
  }
  return <g>{lines}</g>;
}

function Streaks({ id, w, y, count = 7, spread = 120 }: { id: string; w: number; y: number; count?: number; spread?: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const yy = y + (i - count / 2) * (spread / count);
        const len = w * (0.25 + ((i * 37) % 50) / 100);
        const x = ((i * 131) % 100) / 100 * (w - len);
        return <rect key={i} x={x} y={yy} width={len} height={i % 3 === 0 ? 2 : 1} fill={`url(#${id}-streak)`} opacity={0.25 + (i % 4) * 0.15} />;
      })}
    </g>
  );
}

function Car({ id }: { id: string }) {
  // Low coupe side profile, lit only by its rim.
  const body =
    "M88,208 L78,182 Q84,166 112,160 L236,146 Q290,104 356,96 L452,94 Q510,98 560,136 L668,152 Q716,160 728,184 L730,204 L700,210 Q696,172 656,172 Q616,172 612,210 L262,212 Q258,174 218,174 Q178,174 174,210 Z";
  return (
    <g>
      <ellipse cx="400" cy="222" rx="330" ry="14" fill={`url(#${id}-floor)`} />
      <path d={body} fill="#07080b" />
      <path d={body} fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.6" />
      <path d="M262,146 Q300,112 356,106 L446,104 Q494,108 530,138 Z" fill="#0b0d12" stroke="#00A8FF" strokeOpacity="0.25" />
      <line x1="120" y1="176" x2="700" y2="182" stroke="#00A8FF" strokeOpacity="0.45" strokeWidth="1" />
      {[218, 656].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="206" r="32" fill="#050505" stroke="#F5F7FA" strokeOpacity="0.14" />
          <circle cx={cx} cy="206" r="20" fill="none" stroke="#00A8FF" strokeOpacity="0.4" />
        </g>
      ))}
      <rect x="712" y="170" width="18" height="3" fill="#00A8FF" filter={`url(#${id}-soft)`} />
      <rect x="80" y="180" width="14" height="3" fill="#0066FF" filter={`url(#${id}-soft)`} />
      {/* reflection */}
      <g transform="translate(0,432) scale(1,-1)" opacity="0.08">
        <path d={body} fill="none" stroke="#00A8FF" />
      </g>
    </g>
  );
}

/* ───────── Router ───────── */

export function PlaceholderArt({ art, label }: { art: ArtKind; label?: string }) {
  const id = `ph-${art}`;

  switch (art) {
    case "tee":
    case "tee-back":
      return <Frame id={id} w={400} h={500} label={label}><Garment id={id} kind="tee" back={art.endsWith("back")} /></Frame>;
    case "oversized":
    case "oversized-back":
      return <Frame id={id} w={400} h={500} label={label}><Garment id={id} kind="oversized" back={art.endsWith("back")} /></Frame>;
    case "shorts":
    case "shorts-back":
      return <Frame id={id} w={400} h={500} label={label}><Garment id={id} kind="shorts" back={art.endsWith("back")} /></Frame>;
    case "hoodie":
    case "hoodie-back":
      return <Frame id={id} w={400} h={500} label={label}><Garment id={id} kind="hoodie" back={art.endsWith("back")} /></Frame>;

    case "wolf":
      return (
        <Frame id={id} w={1600} h={900} label={label}>
          <circle cx="800" cy="420" r="520" fill={`url(#${id}-spot)`} />
          <Smoke id={id} cx={500} cy={700} r={420} />
          <Smoke id={id} cx={1150} cy={640} r={380} />
          <g transform="translate(580,230)"><WolfMark size={440} /></g>
        </Frame>
      );

    case "campaign":
      return (
        <Frame id={id} w={1600} h={900} label={label}>
          <Beam id={id} x={1120} w={1600} h={900} />
          <circle cx="1120" cy="560" r="420" fill={`url(#${id}-spot)`} />
          <Smoke id={id} cx={1100} cy={780} r={520} o={0.8} />
          <line x1="0" y1="742" x2="1600" y2="742" stroke="#F5F7FA" strokeOpacity="0.06" />
          <ellipse cx="1120" cy="742" rx="260" ry="12" fill={`url(#${id}-floor)`} />
          {/* monolith */}
          <rect x="1086" y="420" width="68" height="322" fill="#08090c" stroke={`url(#${id}-rim)`} strokeWidth="1.2" />
          <text x="1120" y="400" textAnchor="middle" fill="#70757D" fontSize="12" letterSpacing="5" fontFamily="var(--font-mono)">WFX—CAMPAIGN 01</text>
        </Frame>
      );

    case "motor":
      return (
        <Frame id={id} w={800} h={380} label={label}>
          <Grid w={800} h={380} y={150} step={36} />
          <Streaks id={id} w={800} y={170} count={9} spread={90} />
          <circle cx="620" cy="130" r="220" fill={`url(#${id}-spot)`} />
          <g transform="translate(0,70)"><Car id={id} /></g>
        </Frame>
      );

    case "cat-men":
      return (
        <Frame id={id} w={600} h={800} label={label}>
          <Beam id={id} x={300} w={600} h={800} />
          <circle cx="300" cy="330" r="300" fill={`url(#${id}-spot)`} />
          <g transform="translate(90,250)" opacity="0.9"><WolfMark size={420} /></g>
          <Smoke id={id} cx={300} cy={700} r={300} />
        </Frame>
      );
    case "cat-women":
      return (
        <Frame id={id} w={600} h={800} label={label}>
          <circle cx="300" cy="360" r="300" fill={`url(#${id}-spot)`} />
          <ellipse cx="300" cy="380" rx="210" ry="210" fill="none" stroke="#00A8FF" strokeOpacity="0.35" strokeWidth="1.2" />
          <ellipse cx="300" cy="380" rx="250" ry="70" fill="none" stroke="#0066FF" strokeOpacity="0.3" transform="rotate(-24 300 380)" />
          <ellipse cx="300" cy="380" rx="150" ry="150" fill="none" stroke="#F5F7FA" strokeOpacity="0.08" />
          <circle cx="470" cy="286" r="4" fill="#00A8FF" filter={`url(#${id}-soft)`} />
          <Smoke id={id} cx={300} cy={720} r={320} />
        </Frame>
      );
    case "cat-performance":
      return (
        <Frame id={id} w={1000} h={620} label={label}>
          <Grid w={1000} h={620} y={300} step={46} />
          <Streaks id={id} w={1000} y={260} count={11} spread={180} />
          <circle cx="760" cy="200" r="300" fill={`url(#${id}-spot)`} />
        </Frame>
      );
    case "cat-accessories":
      return (
        <Frame id={id} w={1000} h={620} label={label}>
          <circle cx="500" cy="300" r="320" fill={`url(#${id}-spot)`} />
          {[150, 112, 74].map((r, i) => (
            <circle key={r} cx="500" cy="300" r={r} fill="none" stroke={i === 0 ? "#00A8FF" : "#F5F7FA"} strokeOpacity={i === 0 ? 0.4 : 0.1} />
          ))}
          <polygon points="500,196 590,248 590,352 500,404 410,352 410,248" fill="#0b0c10" stroke={`url(#${id}-rim)`} />
          <ellipse cx="500" cy="470" rx="220" ry="10" fill={`url(#${id}-floor)`} />
        </Frame>
      );

    case "pack-1":
    case "pack-2":
    case "pack-3":
    case "pack-4": {
      const n = Number(art.slice(-1));
      return (
        <Frame id={id} w={540} h={675} label={label}>
          {n === 1 && <><Beam id={id} x={160} w={540} h={675} /><circle cx="160" cy="300" r="260" fill={`url(#${id}-spot)`} /></>}
          {n === 2 && <><Grid w={540} h={675} y={380} step={30} /><Streaks id={id} w={540} y={330} count={6} spread={80} /></>}
          {n === 3 && <><circle cx="270" cy="300" r="280" fill={`url(#${id}-spot)`} /><rect x="120" y="296" width="300" height="8" rx="4" fill="#0b0c10" stroke="#00A8FF" strokeOpacity="0.4" /><rect x="96" y="262" width="22" height="76" rx="3" fill="#0b0c10" stroke="#F5F7FA" strokeOpacity="0.15" /><rect x="422" y="262" width="22" height="76" rx="3" fill="#0b0c10" stroke="#F5F7FA" strokeOpacity="0.15" /></>}
          {n === 4 && <><circle cx="400" cy="220" r="260" fill={`url(#${id}-spot)`} /><g transform="translate(-130,300) scale(0.85)"><Car id={id} /></g></>}
          <Smoke id={id} cx={270} cy={620} r={260} />
        </Frame>
      );
    }
  }
}
