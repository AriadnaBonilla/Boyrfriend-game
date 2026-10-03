import { useState, useRef, useCallback, useEffect, useId } from 'react';
import BackButton from '../components/BackButton';
import ScrapbookButton from '../components/ScrapbookButton';
import DecorativeHearts from '../components/DecorativeHearts';
import { LevelId } from './GameHub';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  onComplete: (id: LevelId) => void;
  isCompleted: boolean;
}

type Phase = 'intro' | 'playing' | 'finale' | 'complete';

// Absolute ms from phase='finale' for each scene beat
const FT = [
  0,     // 0  eating anim (beak opens)
  550,   // 1  gulp / satisfied
  900,   // 2  brief pause
  1350,  // 3  "..."
  1900,  // 4  eyes widen / *tic*
  2450,  // 5  "Maridito..."  + slight tremble
  3050,  // 6  "Creo que..."  + intense tremble
  3700,  // 7  POP flash + particles
  5000,  // 8  aftermath ("......")
  5600,  // 9  "PONJITA HA EXPLOTADO."
  6400,  // 10 incident report (CAUSA OFICIAL)
  7200,  // 11 strikethrough animation
  7950,  // 12 CAUSA REAL  ← heart awarded here
  8700,  // 13 "Qué asco."
  9600,  // 14 Ponjita emerges
  10500, // 15 "Estoy bien."
  11400, // 16 "¿Quedan aceitunas?"
];

const COMMENTARY = [
  'Todo bajo control.',
  'Una aceitunita nunca hace daño.',
  'Dos tampoco.',
  'Ponjita está satisfecha.',
  'Sigue satisfecha. Muy satisfecha.',
  'Quizá deberíamos parar...',
  'Claramente no vamos a parar.',
  'Maridito, esto empieza a ser irresponsable.',
  'Creo que ya está.',
  '', // index 9 — handled by game UI
];

const SAFE_TOP = 'env(safe-area-inset-top, 0px)';

// ─── Illustrated Olive ─────────────────────────────────────────────────────────
function OliveSVG({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.38)} viewBox="0 0 24 33" fill="none">
      <path d="M12 5Q14 1 17.5 0" stroke="#4a6820" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="17.5" cy="1.5" rx="3.5" ry="2" fill="#7a9840" transform="rotate(-25 17.5 1.5)" />
      <ellipse cx="12" cy="19" rx="8.5" ry="12" fill="#7a9840" stroke="#4a6820" strokeWidth="1.5" />
      <ellipse cx="9.5" cy="13" rx="3" ry="4.5" fill="#9ab850" opacity="0.42" />
      <ellipse cx="12" cy="18.5" rx="3.5" ry="2.5" fill="#c83020" opacity="0.88" />
      <ellipse cx="12" cy="18" rx="2.5" ry="1.5" fill="#e04838" opacity="0.48" />
    </svg>
  );
}

// ─── SVG Heart ─────────────────────────────────────────────────────────────────
function HeartSVG({ size = 18, color = '#c44070' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 20 18" fill="none">
      <path d="M10 16C6 12 1 8.5 1 5.5A4.5 4.5 0 0110 3.5 4.5 4.5 0 0119 5.5C19 8.5 14 12 10 16z" fill={color} />
    </svg>
  );
}

// ─── Ponjita Character ─────────────────────────────────────────────────────────
// Prop contract (stable — game logic in parent does not change):
//   feedLevel   0-10   drives body inflation / expressions / sweat / stress
//   isEating           beak opens for eating animation
//   isAfterBoom        post-explosion daze: tilted tuft + dizzy marks
//   excited            olive approaching — eyes widen
//   wingsUp            wings raised (happy / begging)
interface PonjitaProps {
  feedLevel: number;
  isEating?: boolean;
  isShaking?: boolean;
  isExploding?: boolean;
  isAfterBoom?: boolean;
  excited?: boolean;
  wingsUp?: boolean;
}

function Ponjita({ feedLevel, isEating, isAfterBoom, excited, wingsUp }: PonjitaProps) {
  const uid = useId().replace(/:/g, '');

  // ── Geometry ────────────────────────────────────────────────────────────────
  // Body grows; head / beak / wings / feet / tuft stay fixed — that's the joke
  const bX = 60, bY = 96;
  const bRx = 22 + feedLevel * 3.1;   // 22 → 53
  const bRy = 23 + feedLevel * 3.5;   // 23 → 58

  const hX = 60, hY = 52, hR = 18;

  // Wings: small stubs fixed at body sides — look comically tiny on inflated body
  const wW = 13, wH = 7;
  const wY = bY - bRy * 0.05;
  const lwX = bX - bRx;
  const rwX = bX + bRx;
  const wRotL = wingsUp ? -55 : -22;
  const wRotR = wingsUp ? 55 : 22;

  const bodyBottom = bY + bRy;
  const footY = 148;
  const feetFull = bodyBottom < footY - 2;
  const feetPeek = !feetFull && bodyBottom < footY + 14;

  const worried = feedLevel >= 7;
  const eyeR = (excited || worried) ? 5.5 : 4.5;
  const eLx = hX - 7, eRx = hX + 7;
  const eY = hY - 1;

  // Feather tuft — 3 spikes on top of head; slightly tilted when after-boom
  const tuftTilt = isAfterBoom ? 28 : 0;

  return (
    <svg viewBox="0 0 120 162" fill="none" style={{ width: '100%', height: '100%', display: 'block' }} aria-hidden>
      <defs>
        {/* Body gradient — warm butter yellow */}
        <radialGradient id={`body-${uid}`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#fef5c0" />
          <stop offset="45%" stopColor="#f9c74f" />
          <stop offset="100%" stopColor="#e8a020" />
        </radialGradient>
        {/* Head gradient — slightly lighter */}
        <radialGradient id={`head-${uid}`} cx="32%" cy="28%" r="68%">
          <stop offset="0%" stopColor="#fefbd8" />
          <stop offset="100%" stopColor="#f0c040" />
        </radialGradient>
        {/* Wing gradient */}
        <radialGradient id={`wing-${uid}`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fef0a8" />
          <stop offset="100%" stopColor="#e0a818" />
        </radialGradient>
        {/* Belly highlight */}
        <radialGradient id={`belly-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fefbd8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fef5c0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse
        cx="60"
        cy={Math.min(157, bY + bRy + 5)}
        rx={Math.min(bRx * 0.6, 36)}
        ry="3.5"
        fill="#8C4B3C"
        opacity="0.1"
      />

      {/* Feet (appear below body; covered as body inflates) */}
      {feetFull && (
        <>
          {/* Left foot */}
          <ellipse cx="44" cy={footY + 6} rx="10" ry="5" fill="#F97316" stroke="#8C4B3C" strokeWidth="1.4" />
          <ellipse cx="38" cy={footY + 4} rx="4.5" ry="3" fill="#F97316" stroke="#8C4B3C" strokeWidth="1" />
          {/* Right foot */}
          <ellipse cx="76" cy={footY + 6} rx="10" ry="5" fill="#F97316" stroke="#8C4B3C" strokeWidth="1.4" />
          <ellipse cx="82" cy={footY + 4} rx="4.5" ry="3" fill="#F97316" stroke="#8C4B3C" strokeWidth="1" />
        </>
      )}
      {feetPeek && (
        <>
          <ellipse cx="47" cy={footY + 8} rx="7" ry="3.5" fill="#F97316" stroke="#8C4B3C" strokeWidth="1.1" />
          <ellipse cx="73" cy={footY + 8} rx="7" ry="3.5" fill="#F97316" stroke="#8C4B3C" strokeWidth="1.1" />
        </>
      )}

      {/* ── BODY ── main growing element */}
      <ellipse
        cx={bX} cy={bY}
        rx={bRx} ry={bRy}
        fill={`url(#body-${uid})`}
        stroke="#8C4B3C"
        strokeWidth="2.2"
      />
      {/* Belly highlight ellipse */}
      <ellipse
        cx={bX} cy={bY + bRy * 0.18}
        rx={bRx * 0.52} ry={bRy * 0.32}
        fill={`url(#belly-${uid})`}
      />

      {/* ── LEFT WING — stub; pushed to body edge, looks tiny at high feedLevel */}
      <ellipse
        cx={lwX} cy={wY}
        rx={wW / 2} ry={wH / 2}
        fill={`url(#wing-${uid})`}
        stroke="#8C4B3C"
        strokeWidth="1.7"
        transform={`rotate(${wRotL} ${lwX} ${wY})`}
      />
      {/* ── RIGHT WING */}
      <ellipse
        cx={rwX} cy={wY}
        rx={wW / 2} ry={wH / 2}
        fill={`url(#wing-${uid})`}
        stroke="#8C4B3C"
        strokeWidth="1.7"
        transform={`rotate(${wRotR} ${rwX} ${wY})`}
      />

      {/* ── HEAD — fixed size */}
      <circle
        cx={hX} cy={hY} r={hR}
        fill={`url(#head-${uid})`}
        stroke="#8C4B3C"
        strokeWidth="2.2"
      />
      {/* Head highlight */}
      <ellipse cx={hX - 5} cy={hY - 6} rx="6" ry="4.5" fill="#fefbd8" opacity="0.32" />

      {/* ── FEATHER TUFT — 3 small curved spikes on top of head */}
      <g transform={`rotate(${tuftTilt} ${hX} ${hY - hR})`}>
        {/* Centre spike */}
        <path
          d={`M${hX} ${hY - hR + 1}Q${hX - 1} ${hY - hR - 11}${hX} ${hY - hR - 14}Q${hX + 1} ${hY - hR - 11}${hX + 1} ${hY - hR}`}
          fill="#f0c040" stroke="#8C4B3C" strokeWidth="1.2" strokeLinejoin="round"
        />
        {/* Left spike */}
        <path
          d={`M${hX - 5} ${hY - hR + 2}Q${hX - 8} ${hY - hR - 8}${hX - 5} ${hY - hR - 11}Q${hX - 2} ${hY - hR - 8}${hX - 3} ${hY - hR + 1}`}
          fill="#f9c74f" stroke="#8C4B3C" strokeWidth="1.1" strokeLinejoin="round"
        />
        {/* Right spike */}
        <path
          d={`M${hX + 5} ${hY - hR + 2}Q${hX + 8} ${hY - hR - 8}${hX + 5} ${hY - hR - 11}Q${hX + 2} ${hY - hR - 8}${hX + 3} ${hY - hR + 1}`}
          fill="#f9c74f" stroke="#8C4B3C" strokeWidth="1.1" strokeLinejoin="round"
        />
      </g>

      {/* ── CHEEKS — rosy pink circles */}
      <ellipse cx={eLx - 2} cy={eY + 10} rx="7" ry="4.5" fill="#F4A0B8" opacity="0.65" />
      <ellipse cx={eRx + 2} cy={eY + 10} rx="7" ry="4.5" fill="#F4A0B8" opacity="0.65" />

      {/* ── WORRIED BROWS (feedLevel ≥ 7) */}
      {worried && (
        <>
          <path
            d={`M${eLx - 5} ${eY - 7}Q${eLx - 1} ${eY - 11}${eLx + 4} ${eY - 7}`}
            stroke="#8C4B3C" strokeWidth="1.8" strokeLinecap="round" fill="none"
          />
          <path
            d={`M${eRx - 4} ${eY - 7}Q${eRx + 1} ${eY - 11}${eRx + 5} ${eY - 7}`}
            stroke="#8C4B3C" strokeWidth="1.8" strokeLinecap="round" fill="none"
          />
        </>
      )}

      {/* ── EYES — large expressive circles */}
      <circle cx={eLx} cy={eY} r={eyeR} fill="#1a0a04" />
      <circle cx={eRx} cy={eY} r={eyeR} fill="#1a0a04" />
      {/* Highlight dots */}
      <circle cx={eLx + 1.6} cy={eY - 1.4} r="1.4" fill="white" />
      <circle cx={eRx + 1.6} cy={eY - 1.4} r="1.4" fill="white" />
      {/* Small lower highlight */}
      <circle cx={eLx - 1} cy={eY + 2} r="0.7" fill="white" opacity="0.5" />
      <circle cx={eRx - 1} cy={eY + 2} r="0.7" fill="white" opacity="0.5" />

      {/* ── BEAK — small orange triangle; split when eating */}
      {isEating ? (
        <>
          {/* Upper beak */}
          <path
            d={`M${hX - 5} ${hY + 8}L${hX + 5} ${hY + 8}L${hX} ${hY + 5}Z`}
            fill="#F97316" stroke="#8C4B3C" strokeWidth="1.2" strokeLinejoin="round"
          />
          {/* Lower beak */}
          <path
            d={`M${hX - 4.5} ${hY + 10}L${hX + 4.5} ${hY + 10}L${hX} ${hY + 16}Z`}
            fill="#e05c0a" stroke="#8C4B3C" strokeWidth="1.2" strokeLinejoin="round"
          />
        </>
      ) : (
        <path
          d={`M${hX - 5} ${hY + 8}L${hX + 5} ${hY + 8}L${hX} ${hY + 14}Z`}
          fill="#F97316" stroke="#8C4B3C" strokeWidth="1.3" strokeLinejoin="round"
        />
      )}

      {/* ── SWEAT DROPS — appear progressively */}
      {feedLevel >= 4 && (
        <path d={`M${hX + 20} ${hY - 4}Q${hX + 21.5} ${hY - 10}${hX + 23} ${hY - 4}Q${hX + 23} ${hY + 2}${hX + 21.5} ${hY + 2}Q${hX + 20} ${hY + 2}${hX + 20} ${hY - 4}`}
          fill="#aad4e8" opacity="0.85" />
      )}
      {feedLevel >= 6 && (
        <path d={`M${hX - 24} ${hY}Q${hX - 22.5} ${hY - 6}${hX - 21} ${hY}Q${hX - 21} ${hY + 6}${hX - 22.5} ${hY + 6}Q${hX - 24} ${hY + 6}${hX - 24} ${hY}`}
          fill="#aad4e8" opacity="0.8" />
      )}
      {feedLevel >= 8 && (
        <path d={`M${bX + bRx - 4} ${bY - 6}Q${bX + bRx - 2.5} ${bY - 12}${bX + bRx - 1} ${bY - 6}Q${bX + bRx - 1} ${bY}${bX + bRx - 2.5} ${bY}Q${bX + bRx - 4} ${bY}${bX + bRx - 4} ${bY - 6}`}
          fill="#aad4e8" opacity="0.75" />
      )}

      {/* ── STRESS MARKS — appear at high fill */}
      {feedLevel >= 7 && (
        <text x={hX + 20} y={hY - 10} fontSize="9" fill="#c44060" opacity="0.7" textAnchor="middle">✦</text>
      )}
      {feedLevel >= 8 && (
        <text x={hX - 22} y={hY - 8} fontSize="8" fill="#c44060" opacity="0.6" textAnchor="middle">✦</text>
      )}
      {feedLevel >= 9 && (
        <>
          <text x={hX + 18} y={bY - bRy * 0.5} fontSize="7" fill="#c44060" opacity="0.5">!</text>
          <text x={hX - 19} y={bY - bRy * 0.5} fontSize="7" fill="#c44060" opacity="0.5">!</text>
        </>
      )}

      {/* ── AFTER-BOOM DAZE — dizzy stars */}
      {isAfterBoom && (
        <>
          <text x={hX + 19} y={hY - 6} fontSize="10" fill="#c44060" opacity="0.55" textAnchor="middle">★</text>
          <text x={hX - 20} y={hY - 4} fontSize="9" fill="#c44060" opacity="0.45" textAnchor="middle">✦</text>
          <text x={hX} y={hY - hR - 18} fontSize="8" fill="#c44060" opacity="0.4" textAnchor="middle">★</text>
        </>
      )}
    </svg>
  );
}

// ─── Particles ─────────────────────────────────────────────────────────────────
type PType = 'heart' | 'heart-sm' | 'olive' | 'leaf' | 'confetti';
interface Particle { id: number; type: PType; dx: number; dy: number; size: number; delay: number; color: string; rot: number; }

const HC = ['#c44070','#e8809a','#a02040','#d4608a','#8b1a2a','#f0a0b8','#b83060'];
const CC = ['#c9b89a','#e8b4bf','#f5e4cc','#8b2438','#7a9840','#d4a880'];

function makeParticles(): Particle[] {
  return Array.from({ length: 34 }, (_, i) => {
    const angle = (i / 34) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const dist = 40 + Math.random() * 110; // constrained — won't overflow container
    const type: PType = i < 16 ? 'heart' : i < 23 ? 'heart-sm' : i < 28 ? 'olive' : i < 31 ? 'leaf' : 'confetti';
    return {
      id: i, type,
      dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist,
      size: type === 'heart' ? 13 + Math.random() * 18 : type === 'heart-sm' ? 6 + Math.random() * 9 : 6 + Math.random() * 8,
      delay: Math.floor(Math.random() * 280),
      color: (type === 'heart' || type === 'heart-sm') ? HC[i % HC.length] : CC[i % CC.length],
      rot: Math.random() * 360,
    };
  });
}

function ParticleEl({ p }: { p: Particle }) {
  // Particles are absolute within the explosion container (position:relative, overflow:hidden)
  const base: React.CSSProperties = {
    position: 'absolute', left: '50%', top: '50%',
    pointerEvents: 'none', opacity: 0,
    animation: `particle-fly 2.0s ${p.delay}ms ease-out forwards`,
    '--dx': `${p.dx}px`, '--dy': `${p.dy}px`,
  } as React.CSSProperties;
  if (p.type === 'heart' || p.type === 'heart-sm') return (
    <svg width={p.size} height={p.size * 0.9} viewBox="0 0 20 18" style={base} fill="none">
      <path d="M10 16C6 12 1 8.5 1 5.5A4.5 4.5 0 0110 3.5 4.5 4.5 0 0119 5.5C19 8.5 14 12 10 16z" fill={p.color} />
    </svg>
  );
  if (p.type === 'olive') return (
    <div style={{ ...base, transform: 'translate(-50%,-50%)' }}><OliveSVG size={p.size} /></div>
  );
  if (p.type === 'leaf') return (
    <svg width={p.size * 1.6} height={p.size} viewBox="0 0 24 14" style={base} fill="none">
      <ellipse cx="12" cy="7" rx="10" ry="5.5" fill="#7a9840" transform="rotate(-22 12 7)" />
    </svg>
  );
  return <div style={{ ...base, width: p.size * 0.6, height: p.size * 0.38, backgroundColor: p.color, transform: `translate(-50%,-50%) rotate(${p.rot}deg)`, borderRadius: 1 }} />;
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function FeedingLevel({ onBack, onComplete, isCompleted }: Props) {
  // ── Game state ──────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('intro');
  const [count, setCount] = useState(0);
  const [eating, setEating] = useState(false);
  const [selectedOlive, setSelectedOlive] = useState(false);
  const [dragging, setDragging] = useState<{ x: number; y: number } | null>(null);
  const [oliveFlying, setOliveFlying] = useState(false);

  // ── Finale / scene state ────────────────────────────────────────────────────
  const [particles, setParticles] = useState<Particle[]>([]);
  const [finaleStep, setFinaleStep] = useState(0);

  // ── Stable refs (don't cause re-renders) ───────────────────────────────────
  const ponjitoRef = useRef<HTMLDivElement>(null);
  const feedLock    = useRef(false);
  const countRef    = useRef(0);
  // Progress refs — separate from state so drama useEffect can't re-trigger
  const hasAwardedRef       = useRef(isCompleted);
  const wasCompletedOnMount = useRef(isCompleted);

  useEffect(() => { countRef.current = count; }, [count]);

  // ── Collision detection ─────────────────────────────────────────────────────
  const isOverPonjita = useCallback((cx: number, cy: number) => {
    if (!ponjitoRef.current) return false;
    const r = ponjitoRef.current.getBoundingClientRect();
    return cx >= r.left - 28 && cx <= r.right + 28 && cy >= r.top - 28 && cy <= r.bottom + 28;
  }, []);

  // ── Core feed action ────────────────────────────────────────────────────────
  // doFeed is the single entry point for all feeding interactions.
  // It must not be changed when the Ponjita visual is replaced.
  const doFeed = useCallback(() => {
    if (feedLock.current || countRef.current >= 10) return;
    feedLock.current = true;
    const next = countRef.current + 1;
    setEating(true);
    setSelectedOlive(false);

    if (next === 10) {
      // Animate olive flying into beak, then trigger finale
      setOliveFlying(true);
      setTimeout(() => {
        setOliveFlying(false);
        setCount(10);
        setParticles(makeParticles());
        setFinaleStep(0);
        setPhase('finale');
        feedLock.current = false;
      }, 530);
    } else {
      setCount(next);
      setTimeout(() => { setEating(false); feedLock.current = false; }, 520);
    }
  }, []);

  // ── Drag-and-drop (pointer events — works for mouse and touch) ─────────────
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => setDragging({ x: e.clientX, y: e.clientY });
    const onUp   = (e: PointerEvent) => {
      setDragging(null);
      if (isOverPonjita(e.clientX, e.clientY) && !feedLock.current && countRef.current < 10) doFeed();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [dragging, isOverPonjita, doFeed]);

  // ── Finale orchestration — all timeouts set up once when phase = 'finale' ──
  useEffect(() => {
    if (phase !== 'finale') return;
    const timers = FT.slice(1).map((ms, i) => setTimeout(() => setFinaleStep(i + 1), ms));
    // Award global heart at CAUSA REAL (step 12) — only first time
    timers.push(setTimeout(() => {
      if (!hasAwardedRef.current) { onComplete('citas'); hasAwardedRef.current = true; }
    }, FT[12]));
    // Advance to complete screen
    timers.push(setTimeout(() => setPhase('complete'), FT[16] + 1300));
    return () => timers.forEach(clearTimeout);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Replay ──────────────────────────────────────────────────────────────────
  const resetGame = () => {
    setCount(0); countRef.current = 0;
    setEating(false); setSelectedOlive(false); setDragging(null);
    setParticles([]); setFinaleStep(0); feedLock.current = false; setOliveFlying(false);
    setPhase('playing');
  };

  const remaining = Math.max(0, 10 - count);

  // ── INTRO ───────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className="relative min-h-dvh paper-texture overflow-x-hidden">
      <DecorativeHearts />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden
        style={{ backgroundImage: 'repeating-linear-gradient(transparent,transparent 27px,#6b1a2a 27px,#6b1a2a 28px)', backgroundPositionY: '20px' }} />
      <div
        className="relative z-10 max-w-xl mx-auto px-4 pb-10 flex flex-col gap-5 screen-enter"
        style={{ paddingTop: `calc(${SAFE_TOP} + 1.5rem)` }}
      >
        <BackButton onClick={onBack} />
        <div className="text-center">
          <div className="inline-block stamp mb-3 animate-stamp-in" style={{ fontFamily: 'Dancing Script, cursive' }}>NIVEL 04</div>
          {/* Ponjita preview — contained wrapper */}
          <div className="flex justify-center my-3">
            <div style={{ width: 'clamp(72px, 24vw, 96px)', aspectRatio: '1 / 1.16' }}>
              <Ponjita feedLevel={0} wingsUp />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#4a0f1c] leading-tight" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Alimenta a Ponjita
          </h1>
        </div>
        <div className="bg-[#faf7f2] border border-[#c9b89a] p-4 sm:p-5 shadow-[2px_2px_0_#c9b89a]" style={{ transform: 'rotate(-0.5deg)' }}>
          <p className="text-[#4a0f1c] text-center leading-relaxed text-sm sm:text-base" style={{ fontFamily: 'Lato, system-ui' }}>
            Existe una cosa que Ponjita podría comer en cantidades preocupantes.
          </p>
          <p className="text-[#6b1a2a] text-center text-xl sm:text-2xl font-bold mt-2" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>ACEITUNAS.</p>
        </div>
        <p className="text-center text-[#8b5a65] text-lg sm:text-xl" style={{ fontFamily: 'Dancing Script, cursive' }}>
          Maridito, esto está bajo tu responsabilidad.
        </p>
        <div className="flex justify-center pt-1">
          <ScrapbookButton onClick={() => setPhase('playing')} variant="primary" size="lg">EMPEZAR →</ScrapbookButton>
        </div>
      </div>
    </div>
  );

  // ── PLAYING ─────────────────────────────────────────────────────────────────
  if (phase === 'playing') {
    const commentary = COMMENTARY[count];
    const trembling = count >= 8;
    const intenseTrembling = count === 9;

    return (
      <div className="relative min-h-dvh paper-texture overflow-x-hidden select-none">
        <DecorativeHearts />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden
          style={{ backgroundImage: 'repeating-linear-gradient(transparent,transparent 27px,#6b1a2a 27px,#6b1a2a 28px)', backgroundPositionY: '20px' }} />

        {/* Drag ghost — follows pointer, no layout impact */}
        {dragging && (
          <div className="fixed pointer-events-none z-50" style={{ left: dragging.x - 14, top: dragging.y - 18 }}>
            <OliveSVG size={28} />
          </div>
        )}

        <div
          className="relative z-10 max-w-xl mx-auto px-4 pb-6 flex flex-col gap-3"
          style={{ paddingTop: `calc(${SAFE_TOP} + 0.75rem)` }}
        >
          <BackButton onClick={onBack} />

          {/* Counter strip */}
          <div className="flex items-center justify-between bg-[#faf7f2] border border-[#c9b89a] px-3 py-1.5 shadow-[2px_2px_0_#c9b89a]" style={{ transform: 'rotate(-0.2deg)' }}>
            <span className="text-[11px] font-bold text-[#6b4a52] tracking-wider uppercase" style={{ fontFamily: 'Lato, system-ui' }}>Aceitunas comidas</span>
            <div className="flex items-center gap-1.5">
              <OliveSVG size={14} />
              <span className="text-base font-bold text-[#6b1a2a]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>{count} / 10</span>
            </div>
          </div>

          {/* Warning at 9/10 */}
          {count === 9 && (
            <div className="text-center animate-fade-in-up">
              <p className="text-xl font-black text-[#6b1a2a]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>NO LE DES OTRA.</p>
              <p className="text-[#8b5a65]" style={{ fontFamily: 'Dancing Script, cursive', fontSize: '1rem' }}>En serio.</p>
            </div>
          )}

          {/* ── Ponjita — contained wrapper; scales as a unit ── */}
          <div className="flex flex-col items-center">
            {/* Shake wrapper — CSS animation applied here; Ponjita SVG is self-contained */}
            <div style={{
              animation: intenseTrembling
                ? 'olive-tremble-intense 0.13s infinite'
                : trembling ? 'olive-tremble 0.2s infinite'
                : 'none',
            }}>
              {/* Bounce wrapper — eating bounce */}
              <div style={{ animation: eating ? 'olive-bounce 0.5s ease-out' : 'none' }}>
                {/*
                 * Ponjita tap target + visual container.
                 * width drives everything — aspect-ratio keeps it proportional.
                 * overflow:hidden prevents the flying-olive from escaping the box.
                 * position:relative anchors the flying olive.
                 */}
                <div
                  ref={ponjitoRef}
                  onClick={() => { if (selectedOlive && !feedLock.current && countRef.current < 10 && !eating) doFeed(); }}
                  className="cursor-pointer touch-none relative overflow-hidden"
                  style={{
                    width: 'clamp(120px, 36vw, 172px)',
                    aspectRatio: '120 / 138', // matches SVG viewBox 120×158 ≈ keep duck proportional
                  }}
                >
                  {/* Game state → Ponjita props; visual internals isolated */}
                  <Ponjita
                    feedLevel={count}
                    isEating={eating || oliveFlying}
                    excited={selectedOlive || !!dragging}
                    wingsUp={count >= 3 && count < 7}
                  />

                  {/* Olive flying into beak — last bite animation.
                   * Positioned relative to Ponjita container, not the viewport. */}
                  <div style={{
                    position: 'absolute', left: '50%',
                    bottom: oliveFlying ? '58%' : '3%',
                    transform: 'translateX(-50%)',
                    opacity: oliveFlying ? 0 : 1,
                    transition: oliveFlying
                      ? 'bottom 0.44s cubic-bezier(0.4,0,0.2,1), opacity 0.06s 0.38s'
                      : 'none',
                    pointerEvents: 'none', zIndex: 10,
                  }}>
                    <OliveSVG size={22} />
                  </div>
                </div>
              </div>
            </div>

            {selectedOlive && !dragging && (
              <p className="text-xs text-[#6b1a2a] mt-1 animate-bounce" style={{ fontFamily: 'Dancing Script, cursive' }}>
                ¡Ahora toca a Ponjita! ↑
              </p>
            )}
          </div>

          {/* Commentary */}
          {commentary && (
            <p key={count} className="text-center text-[#6b4a52] animate-fade-in-up text-sm sm:text-base" style={{ fontFamily: 'Dancing Script, cursive' }}>
              {commentary}
            </p>
          )}

          {/* Olive plate — interaction area */}
          <div className="relative bg-[#faf7f2] border border-[#c9b89a] p-3 sm:p-4 shadow-[2px_2px_0_#c9b89a]" style={{ transform: 'rotate(0.4deg)' }}>
            <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>plato de aceitunas</div>
            {remaining > 0 ? (
              <div className="flex flex-col gap-2 pt-2">
                <div
                  className="flex flex-wrap justify-center gap-2 sm:gap-3 cursor-grab active:cursor-grabbing touch-none"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (feedLock.current || countRef.current >= 10 || eating) return;
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    setDragging({ x: e.clientX, y: e.clientY });
                    setSelectedOlive(true);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (feedLock.current || countRef.current >= 10 || eating || dragging) return;
                    setSelectedOlive(p => !p);
                  }}
                >
                  {Array.from({ length: remaining }, (_, i) => (
                    <div key={i} className={`transition-transform duration-100 ${selectedOlive && i === 0 ? 'scale-125' : 'hover:scale-110'}`}>
                      <OliveSVG size={28} />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-[#8b5a65] text-center" style={{ fontFamily: 'Lato, system-ui' }}>
                  {selectedOlive
                    ? '→ Ahora toca a Ponjita para alimentarla'
                    : 'Arrastra una aceituna hasta Ponjita · o toca aquí y luego a Ponjita'}
                </p>
              </div>
            ) : (
              <p className="text-center text-[#6b1a2a] font-bold pt-2 text-sm" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>Plato vacío.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── FINALE ──────────────────────────────────────────────────────────────────
  if (phase === 'finale') {
    const S = finaleStep;
    const preExp  = S < 7;
    const showPop = S === 7;
    const showParticles = S >= 7 && S <= 9;
    const showScene = S >= 8;

    const fEating  = S === 0;
    const fWorried = S >= 3;  // worried brows driven via feedLevel=10 in Ponjita; this is for extra clarity
    const fTremble = S === 5 ? 'olive-tremble 0.18s infinite'
                   : S === 6 ? 'olive-tremble-intense 0.1s infinite'
                   : 'none';

    return (
      /*
       * Outer container: position:relative + overflow:hidden
       * This is the anchor for BOTH the explosion flash AND the particles.
       * No fixed-position overlays — everything stays within document flow.
       */
      <div className="relative min-h-dvh paper-texture overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden
          style={{ backgroundImage: 'repeating-linear-gradient(transparent,transparent 27px,#6b1a2a 27px,#6b1a2a 28px)', backgroundPositionY: '20px' }} />

        {/* EXPLOSION FLASH — absolute within outer container, not fixed */}
        {showPop && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(255,200,220,0.88) 0%, rgba(255,240,248,0.5) 50%, transparent 72%)' }}>
            <p className="font-black text-[#6b1a2a] select-none"
              style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: 'clamp(3rem, 16vw, 5.5rem)',
                textShadow: '4px 4px 0 #c9b89a, -1px -1px 0 #f0d8b8',
                animation: 'olive-bounce 0.38s ease-out',
              }}>
              POP!
            </p>
          </div>
        )}

        {/* PARTICLES — absolute within outer container (overflow:hidden clips them) */}
        {showParticles && (
          <div className="absolute inset-0 z-20 pointer-events-none" aria-hidden>
            {particles.map(p => <ParticleEl key={p.id} p={p} />)}
          </div>
        )}

        {/* SCENE CONTENT — normal document flow */}
        <div
          className="relative z-10 max-w-xl mx-auto px-4 pb-8 flex flex-col gap-3"
          style={{ paddingTop: `calc(${SAFE_TOP} + 1.5rem)` }}
        >
          {/* PRE-EXPLOSION: Ponjita + step text */}
          {preExp && (
            <>
              <div className="flex items-center justify-center gap-2 bg-[#faf7f2] border border-[#c9b89a] px-4 py-1.5 shadow-[2px_2px_0_#c9b89a] self-center" style={{ transform: 'rotate(-0.2deg)' }}>
                <OliveSVG size={13} />
                <span className="text-base font-bold text-[#6b1a2a]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>10 / 10</span>
              </div>

              {/* Ponjita — same contained wrapper as playing phase */}
              <div className="flex flex-col items-center">
                <div style={{ animation: fTremble }}>
                  <div style={{ width: 'clamp(132px, 38vw, 178px)', aspectRatio: '120 / 138' }}>
                    <Ponjita
                      feedLevel={10}
                      isEating={fEating}
                      // isShaking communicated via parent wrapper CSS (fTremble)
                    />
                  </div>
                </div>
              </div>

              {/* Step-specific speech */}
              <div className="text-center min-h-[2rem]">
                {(S === 1) && <p className="text-[#6b4a52] italic animate-fade-in-up" style={{ fontFamily: 'Dancing Script, cursive', fontSize: '1rem' }}>*gulp*</p>}
                {(S === 2 || S === 3) && <p className="text-[#4a0f1c] text-2xl font-bold animate-fade-in-up" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>...</p>}
                {S === 4 && (
                  <div className="animate-fade-in-up">
                    <p className="text-[#4a0f1c] text-2xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>...</p>
                    <p className="text-[#6b4a52] text-xs" style={{ fontFamily: 'Dancing Script, cursive' }}>*tic*</p>
                  </div>
                )}
                {S === 5 && <p className="text-[#6b1a2a] text-xl font-bold animate-fade-in-up" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>Maridito...</p>}
                {S === 6 && <p className="text-[#6b1a2a] text-2xl font-black animate-fade-in-up" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>Creo que...</p>}
              </div>
            </>
          )}

          {/* POST-EXPLOSION SCENE — builds step by step in normal flow */}
          {showScene && (
            <>
              {/* "PONJITA HA EXPLOTADO." */}
              {S >= 9 && (
                <div className="w-full bg-[#faf7f2] border border-[#c9b89a] px-4 py-2 shadow-[2px_2px_0_#c9b89a] text-center animate-fade-in-up"
                  style={{ transform: 'rotate(-0.4deg)' }}>
                  <p className="text-sm sm:text-base font-bold text-[#4a0f1c]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                    PONJITA HA EXPLOTADO.
                  </p>
                </div>
              )}

              {/* Incident report card — grows in place */}
              {S >= 10 && (
                <div className="relative w-full bg-[#faf7f2] border border-[#c9b89a] p-4 shadow-[2px_2px_0_#c9b89a] animate-fade-in-up"
                  style={{ transform: 'rotate(-0.5deg)' }}>
                  <div className="tape" style={{ fontFamily: 'Dancing Script, cursive', fontSize: '0.65rem' }}>informe del incidente</div>

                  <p className="text-[10px] font-bold text-[#7a6a55] mt-1 mb-1 tracking-widest uppercase" style={{ fontFamily: 'Lato, system-ui' }}>CAUSA OFICIAL:</p>

                  <div className="relative inline-block">
                    <span className="text-sm text-[#4a0f1c]" style={{ fontFamily: 'Lato, system-ui', opacity: S >= 11 ? 0.3 : 1, transition: 'opacity 0.3s 0.35s' }}>
                      Demasiadas aceitunas.
                    </span>
                    {S >= 11 && (
                      <div className="absolute top-1/2 left-0 h-[2px] bg-[#4a0f1c] opacity-65"
                        style={{ animation: 'strike-through 0.5s ease-out forwards' }} />
                    )}
                  </div>

                  {/* CAUSA REAL */}
                  {S >= 12 && (
                    <div className="mt-3 pt-3 border-t border-[#c9b89a] animate-fade-in-up">
                      <p className="text-[10px] font-bold text-[#6b1a2a] mb-1.5 tracking-widest uppercase" style={{ fontFamily: 'Lato, system-ui' }}>CAUSA REAL:</p>
                      <div className="flex items-start gap-2 flex-wrap">
                        <p className="text-base font-bold text-[#6b1a2a] leading-snug" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                          Demasiado amor por Maridito.
                        </p>
                        <span style={{ flexShrink: 0, marginTop: 2 }}><HeartSVG size={14} color="#c44070" /></span>
                      </div>
                      {S >= 13 && (
                        <p className="text-[#8b5a65] mt-1.5 animate-fade-in-up" style={{ fontFamily: 'Dancing Script, cursive', fontSize: '0.92rem' }}>
                          Qué asco. ♡
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Ponjita re-emerges + speech bubbles */}
              {S >= 14 && (
                <div
                  className="flex items-end gap-3 w-full"
                  style={{ animation: 'emerge-from-bottom 0.7s cubic-bezier(0.34,1.56,0.64,1) both' }}
                >
                  {/* Duck — back to size 0/10, dazed */}
                  <div style={{ width: 'clamp(72px, 22vw, 96px)', aspectRatio: '120 / 138', flexShrink: 0 }}>
                    <Ponjita feedLevel={0} isAfterBoom />
                  </div>

                  {/* Speech bubbles stacked */}
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {S >= 15 && (
                      <div className="bg-[#faf7f2] border border-[#c9b89a] px-3 py-2 shadow-[2px_2px_0_#c9b89a] self-start animate-fade-in-up"
                        style={{ borderRadius: '0 10px 10px 10px' }}>
                        <p className="text-[#4a0f1c] font-bold text-sm" style={{ fontFamily: 'Lato, system-ui' }}>Estoy bien.</p>
                      </div>
                    )}
                    {S >= 16 && (
                      <div className="bg-[#faf7f2] border border-[#c9b89a] px-3 py-2 shadow-[2px_2px_0_#c9b89a] self-start animate-fade-in-up"
                        style={{ borderRadius: '0 10px 10px 10px' }}>
                        <p className="text-[#8b5a65]" style={{ fontFamily: 'Dancing Script, cursive', fontSize: '0.9rem' }}>¿Quedan aceitunas?</p>
                      </div>
                    )}
                  </div>

                  {/* Surviving olive */}
                  {S >= 16 && (
                    <div className="self-center flex-shrink-0 animate-fade-in-up" style={{ animation: 'olive-bounce 0.6s 0.15s ease-out both' }}>
                      <OliveSVG size={20} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── COMPLETE ────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-dvh paper-texture overflow-x-hidden">
      <DecorativeHearts />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden
        style={{ backgroundImage: 'repeating-linear-gradient(transparent,transparent 27px,#6b1a2a 27px,#6b1a2a 28px)', backgroundPositionY: '20px' }} />

      <div
        className="relative z-10 max-w-xl mx-auto px-4 pb-10 flex flex-col items-center gap-4 screen-enter"
        style={{ paddingTop: `calc(${SAFE_TOP} + 1.5rem)` }}
      >
        {/* Ponjita — protagonist of complete screen */}
        <div className="flex flex-col items-center gap-2">
          <div style={{ width: 'clamp(88px, 26vw, 112px)', aspectRatio: '120 / 138' }}>
            <Ponjita feedLevel={0} isAfterBoom />
          </div>
          <div className="inline-block stamp animate-stamp-in" style={{ fontFamily: 'Dancing Script, cursive' }}>MISIÓN SUPERADA</div>
        </div>

        {/* Gag — speech bubble layout */}
        <div className="flex items-center gap-3 w-full justify-center">
          <div className="bg-[#faf7f2] border border-[#c9b89a] px-3 py-2 shadow-[2px_2px_0_#c9b89a]"
            style={{ borderRadius: '0 10px 10px 10px', maxWidth: '65%' }}>
            <p className="text-[#4a0f1c] font-bold text-sm" style={{ fontFamily: 'Lato, system-ui' }}>Estoy bien.</p>
            <p className="text-[#8b5a65] text-xs mt-0.5" style={{ fontFamily: 'Dancing Script, cursive', fontSize: '0.85rem' }}>¿Quedan aceitunas?</p>
          </div>
          <OliveSVG size={20} />
        </div>

        {/* Compact heart reward — not a giant card */}
        <div className="flex items-center gap-3 bg-[#faf7f2] border border-[#c9b89a] px-4 py-2.5 shadow-[2px_2px_0_#c9b89a] w-full"
          style={{ transform: 'rotate(-0.3deg)', maxWidth: 340 }}>
          <span className="animate-heart-beat" style={{ display: 'inline-block', flexShrink: 0 }}>
            <HeartSVG size={24} color="#c44070" />
          </span>
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-bold text-[#6b1a2a]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>+1 corazón</p>
            <p className="text-xs text-[#8b5a65] leading-tight" style={{ fontFamily: 'Lato, system-ui' }}>
              {wasCompletedOnMount.current ? '(ya tenías este corazón, tramposo)' : 'Corazón global desbloqueado'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full pt-1">
          <ScrapbookButton onClick={onBack} variant="primary" size="lg">VOLVER A LAS MISIONES</ScrapbookButton>
          <button onClick={resetGame}
            className="text-sm text-[#6b1a2a] opacity-55 hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'Dancing Script, cursive', fontSize: '0.95rem' }}>
            Alimentar otra vez a Ponjita
          </button>
        </div>
      </div>
    </div>
  );
}
