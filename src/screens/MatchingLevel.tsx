import { useState, useRef, useEffect, useMemo } from 'react';
import BackButton from '../components/BackButton';
import ScrapbookButton from '../components/ScrapbookButton';
import DecorativeHearts from '../components/DecorativeHearts';
import { LevelId } from './GameHub';
import { DATE_MATCHES, type DateMatch } from '../data/dateMatches';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  onComplete: (id: LevelId) => void;
  isCompleted: boolean;
}

type Phase = 'intro' | 'playing' | 'complete';
type Feedback = { correct: boolean; msg: string } | null;

// ─── Constants ──────────────────────────────────────────────────────────────────
const CORRECT_MSGS = [
  'MATCH ❤️',
  'Efectivamente. Ese Maridito estaba ahí.',
  'CASO RESUELTO.',
  'Buena memoria, maridito.',
  'Correcto. Ponjita tiene pruebas.',
  'Confirmado por el archivo oficial de citas.',
];

const WRONG_MSGS = [
  'NO MATCH.',
  '¿Pero tú estabas en esta cita o no?',
  'Maridito, revisa tus propios outfits.',
  'Eso no te lo pusiste aquí.',
  'Ponjita recuerda esto mejor que tú.',
  'Inténtalo otra vez 👀',
];

const FOOD_COLORS = ['#e2d5b5', '#d9ccaa', '#cdc0a5', '#d4c8b0', '#e0d4bc'];
const OUTFIT_COLORS = ['#d5c3cc', '#ccbcc5', '#d4c0c8', '#c8b8c0', '#cfc4ca'];

const SAFE_TOP = 'env(safe-area-inset-top, 0px)';

const ROTATIONS = [-1.5, 1.2, -0.8, 1.8, -1.2];
const OUTFIT_ROTATIONS = [1.0, -1.6, 0.9, -1.1, 1.5];

// ─── Helpers ────────────────────────────────────────────────────────────────────
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function useIsMobile(bp = 768) {
  const [mob, setMob] = useState(() => typeof window !== 'undefined' ? window.innerWidth < bp : true);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < bp);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, [bp]);
  return mob;
}

// ─── Photo / placeholder content ────────────────────────────────────────────────
function PhotoContent({
  src,
  type,
  id,
  position = 'center',
}: {
  src: string | null;
  type: 'food' | 'outfit';
  id: number;
  position?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover"
        style={{ objectPosition: position }}
        draggable={false}
      />
    );
  }
  const bg = type === 'food' ? FOOD_COLORS[id - 1] : OUTFIT_COLORS[id - 1];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5" style={{ background: bg }}>
      <p
        className="text-[9px] tracking-widest font-bold text-[#4a0f1c] uppercase"
        style={{ fontFamily: 'Lato, system-ui', opacity: 0.45 }}
      >
        {type === 'food' ? 'COMIDA' : 'MARIDITO'}
      </p>
      <p
        className="text-3xl font-black text-[#4a0f1c]"
        style={{ fontFamily: 'Playfair Display, Georgia, serif', opacity: 0.55 }}
      >
        0{id}
      </p>
      <p
        className="text-[8px] text-[#6b1a2a] text-center px-2 leading-tight"
        style={{ fontFamily: 'Dancing Script, cursive', opacity: 0.4 }}
      >
        {type === 'food' ? `Prueba #0${id}` : `Sospechoso 0${id}`}
      </p>
    </div>
  );
}

// ─── Polaroid card ──────────────────────────────────────────────────────────────
interface PolaroidProps {
  match: DateMatch;
  type: 'food' | 'outfit';
  rotate?: number;
  isSelected?: boolean;
  isMatched?: boolean;
  isShaking?: boolean;
  onClick?: () => void;
  /** Width class, defaults to w-full */
  className?: string;
}

function PolaroidCard({
  match, type, rotate = 0, isSelected, isMatched, isShaking, onClick, className = '',
}: PolaroidProps) {
  const src = type === 'food' ? match.food : match.outfit;
  const pos = type === 'food' ? (match.foodPosition ?? 'center') : (match.outfitPosition ?? 'center top');

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={`polaroid relative select-none outline-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        transform: `rotate(${rotate}deg)${isSelected ? ' translateY(-6px) scale(1.03)' : ''}`,
        boxShadow: isSelected
          ? '0 10px 28px rgba(107,26,42,0.28), 2px 4px 12px rgba(74,15,28,0.15)'
          : undefined,
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        animation: isShaking ? 'olive-tremble 0.45s ease-out' : 'none',
        opacity: isMatched ? 0.65 : 1,
      }}
    >
      {/* Photo area — portrait ratio */}
      <div className="w-full aspect-[3/4] overflow-hidden bg-[#ede5d4] relative">
        <PhotoContent src={src} type={type} id={match.id} position={pos} />

        {/* Selected pin */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#6b1a2a] flex items-center justify-center shadow-sm">
            <span className="text-white text-[7px] font-bold">✓</span>
          </div>
        )}

        {/* Match stamp overlay */}
        {isMatched && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="bg-[#6b1a2a] text-white text-[10px] font-bold px-2 py-1"
              style={{ fontFamily: 'Dancing Script, cursive', transform: 'rotate(-8deg)' }}
            >
              MATCH ❤️
            </div>
          </div>
        )}
      </div>

      {/* Caption strip */}
      <div className="pt-2 pb-1 px-1 text-center">
        <p
          className="text-[9px] leading-tight"
          style={{
            fontFamily: isMatched ? 'Lato, system-ui' : 'Dancing Script, cursive',
            color: '#4a0f1c',
            opacity: isMatched ? 0.9 : 0.5,
            fontWeight: isMatched ? 700 : 400,
          }}
        >
          {isMatched
            ? `CITA 0${match.id} ❤️`
            : type === 'food'
            ? `Prueba #0${match.id}`
            : '?'}
        </p>
      </div>
    </div>
  );
}

// ─── Match flash (mobile) ───────────────────────────────────────────────────────
function MatchFlash({
  foodMatch,
  outfitMatch,
  message,
}: {
  foodMatch: DateMatch;
  outfitMatch: DateMatch;
  message: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 px-6"
      style={{ background: 'rgba(245, 240, 232, 0.96)' }}>
      <div className="flex items-center gap-4 w-full max-w-xs">
        <div className="flex-1">
          <PolaroidCard match={foodMatch} type="food" rotate={-2} isMatched />
        </div>
        <div className="flex flex-col items-center gap-1 text-[#6b1a2a]">
          <span className="text-2xl">❤️</span>
        </div>
        <div className="flex-1">
          <PolaroidCard match={outfitMatch} type="outfit" rotate={2} isMatched />
        </div>
      </div>
      <p
        className="text-lg font-bold text-[#6b1a2a] text-center"
        style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
      >
        {message}
      </p>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────
export default function MatchingLevel({ onBack, onComplete, isCompleted }: Props) {
  const isMobile = useIsMobile();

  // ── Game state ────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('intro');
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [shakingId, setShakingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [mobileIdx, setMobileIdx] = useState(0);
  const [matchFlash, setMatchFlash] = useState<{ foodId: number; outfitId: number; msg: string } | null>(null);

  // Shuffle outfits once per game session
  const [shuffledIds, setShuffledIds] = useState<number[]>(() => shuffle([1, 2, 3, 4, 5]));

  // ── Progress refs ─────────────────────────────────────────────────────────────
  const hasAwardedRef = useRef(isCompleted);
  const wasCompletedOnMount = useRef(isCompleted);

  // ── Derived data ──────────────────────────────────────────────────────────────
  const matchById = useMemo(() => {
    const m: Record<number, DateMatch> = {};
    DATE_MATCHES.forEach(d => { m[d.id] = d; });
    return m;
  }, []);

  const shuffledOutfits = useMemo(
    () => shuffledIds.map(id => matchById[id]),
    [shuffledIds, matchById]
  );

  // Mobile: outfits not yet matched
  const availableOutfits = useMemo(
    () => shuffledOutfits.filter(o => !matched.has(o.id)),
    [shuffledOutfits, matched]
  );

  // Mobile: current food (sequential index)
  const mobileFood = DATE_MATCHES[mobileIdx] ?? DATE_MATCHES[DATE_MATCHES.length - 1];

  // ── Match logic ───────────────────────────────────────────────────────────────
  const handleOutfitClick = (outfitId: number) => {
    if (matchFlash) return;
    const foodId = isMobile ? mobileFood.id : selectedFoodId;
    if (!foodId) return;
    if (matched.has(foodId)) return;

    if (outfitId === foodId) {
      // CORRECT
      const msg = pickRandom(CORRECT_MSGS);
      const newMatched = new Set([...matched, foodId]);
      setMatched(newMatched);
      setSelectedFoodId(null);
      setFeedback({ correct: true, msg });

      if (newMatched.size === DATE_MATCHES.length) {
        // All matched — award heart then transition
        setTimeout(() => {
          setFeedback(null);
          if (!hasAwardedRef.current) {
            onComplete('quiz');
            hasAwardedRef.current = true;
          }
          setPhase('complete');
        }, isMobile ? 1200 : 900);
      } else if (isMobile) {
        setMatchFlash({ foodId, outfitId, msg });
        setTimeout(() => {
          setMatchFlash(null);
          setFeedback(null);
          setMobileIdx(i => i + 1);
        }, 1300);
      } else {
        setTimeout(() => setFeedback(null), 1800);
      }
    } else {
      // WRONG
      const msg = pickRandom(WRONG_MSGS);
      setFeedback({ correct: false, msg });
      setShakingId(outfitId);
      setTimeout(() => setShakingId(null), 500);
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  const handleFoodClick = (foodId: number) => {
    if (matched.has(foodId)) return;
    setSelectedFoodId(prev => prev === foodId ? null : foodId);
    setFeedback(null);
  };

  // ── Replay ────────────────────────────────────────────────────────────────────
  const resetGame = () => {
    setMatched(new Set());
    setSelectedFoodId(null);
    setShakingId(null);
    setFeedback(null);
    setMobileIdx(0);
    setMatchFlash(null);
    setShuffledIds(shuffle([1, 2, 3, 4, 5]));
    setPhase('playing');
  };

  const matchedCount = matched.size;

  // ── Progress bar ──────────────────────────────────────────────────────────────
  function ProgressRow() {
    return (
      <div
        className="flex items-center gap-2 bg-[#faf7f2] border border-[#c9b89a] px-3 py-1.5 shadow-[2px_2px_0_#c9b89a] self-start"
        style={{ transform: 'rotate(-0.2deg)' }}
      >
        <span className="text-[10px] font-bold text-[#6b4a52] uppercase tracking-wider" style={{ fontFamily: 'Lato, system-ui' }}>
          Casos resueltos
        </span>
        <span className="text-sm font-bold text-[#6b1a2a]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
          {matchedCount} / {DATE_MATCHES.length}
        </span>
        <span className="text-sm">❤️</span>
      </div>
    );
  }

  // ── INTRO ─────────────────────────────────────────────────────────────────────
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
          <div className="inline-block stamp mb-2 animate-stamp-in" style={{ fontFamily: 'Dancing Script, cursive' }}>NIVEL 03</div>
          <div className="text-4xl my-2">🔎</div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[#4a0f1c] leading-tight"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            ¿Qué llevabas puesto,<br />Maridito?
          </h1>
          <p className="text-[#8b5a65] mt-1" style={{ fontFamily: 'Dancing Script, cursive', fontSize: '1rem' }}>
            Archivo de citas de Ponjita
          </p>
        </div>

        {/* Expediente intro card */}
        <div
          className="bg-[#faf7f2] border border-[#c9b89a] p-5 shadow-[2px_2px_0_#c9b89a]"
          style={{ transform: 'rotate(-0.4deg)' }}
        >
          <div className="tape" style={{ fontFamily: 'Dancing Script, cursive', fontSize: '0.65rem' }}>CONFIDENCIAL</div>
          <p className="text-[#4a0f1c] leading-relaxed text-sm sm:text-base mt-1" style={{ fontFamily: 'Lato, system-ui' }}>
            Ponjita conserva pruebas de absolutamente todo.
          </p>
          <p className="text-[#6b4a52] text-sm mt-2 italic" style={{ fontFamily: 'Dancing Script, cursive', fontSize: '0.95rem' }}>
            Incluso de lo que cenaste.
          </p>
        </div>

        <div
          className="bg-[#ede5d4] border border-[#c9b89a] p-4 shadow-[1px_1px_0_#c9b89a]"
          style={{ transform: 'rotate(0.3deg)' }}
        >
          <p className="text-[10px] font-bold text-[#7a6a55] mb-2 uppercase tracking-widest" style={{ fontFamily: 'Lato, system-ui' }}>MISIÓN:</p>
          <p className="text-[#4a0f1c] font-bold text-base sm:text-lg" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Relaciona cada comida con el Maridito correspondiente.
          </p>
          <p className="text-[#8b5a65] text-sm mt-1 italic" style={{ fontFamily: 'Dancing Script, cursive' }}>
            Sí, hay archivo fotográfico.
          </p>
        </div>

        <p className="text-center text-[#8b5a65] opacity-70 text-xs" style={{ fontFamily: 'Dancing Script, cursive', fontSize: '0.9rem' }}>
          Material altamente comprometedor.
        </p>

        <div className="flex justify-center pt-1">
          <ScrapbookButton onClick={() => setPhase('playing')} variant="primary" size="lg">
            ABRIR EL EXPEDIENTE →
          </ScrapbookButton>
        </div>
      </div>
    </div>
  );

  // ── PLAYING ───────────────────────────────────────────────────────────────────
  if (phase === 'playing') {
    // ── MOBILE layout ──────────────────────────────────────────────────────────
    const MobileLayout = () => (
      <div
        className="relative z-10 max-w-xl mx-auto px-4 pb-8 flex flex-col gap-4"
        style={{ paddingTop: `calc(${SAFE_TOP} + 0.75rem)` }}
      >
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} />
          <ProgressRow />
        </div>

        {/* Caso indicator */}
        <div className="text-center">
          <p className="text-[11px] tracking-widest uppercase font-bold text-[#8b2438] opacity-60" style={{ fontFamily: 'Lato, system-ui' }}>
            CASO {mobileIdx + 1} DE {DATE_MATCHES.length}
          </p>
        </div>

        {/* Food card — large protagonist */}
        <div className="flex justify-center">
          <div style={{ width: 'clamp(140px, 52vw, 210px)' }}>
            <PolaroidCard
              match={mobileFood}
              type="food"
              rotate={ROTATIONS[mobileIdx % ROTATIONS.length]}
            />
          </div>
        </div>

        {/* Prompt */}
        <p className="text-center text-[#4a0f1c] font-bold text-sm sm:text-base" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
          ¿Qué Maridito pertenece a esta cita?
        </p>

        {/* Feedback */}
        {feedback && !matchFlash && (
          <div
            className={`text-center py-1.5 px-3 border animate-fade-in-up text-sm font-bold ${
              feedback.correct
                ? 'bg-[#f5ede8] border-[#c9b89a] text-[#6b1a2a]'
                : 'bg-[#faf0f0] border-[#e8b8b8] text-[#8b2438]'
            }`}
            style={{ fontFamily: 'Playfair Display, Georgia, serif', transform: 'rotate(-0.3deg)' }}
          >
            {feedback.msg}
          </div>
        )}

        {/* Available outfit grid */}
        {availableOutfits.length > 0 ? (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${Math.min(availableOutfits.length, 3)}, 1fr)` }}
          >
            {availableOutfits.map((m, i) => (
              <PolaroidCard
                key={m.id}
                match={m}
                type="outfit"
                rotate={OUTFIT_ROTATIONS[i % OUTFIT_ROTATIONS.length]}
                isShaking={shakingId === m.id}
                onClick={() => handleOutfitClick(m.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-[#6b4a52] text-sm" style={{ fontFamily: 'Dancing Script, cursive' }}>
            Todos los Mariditos han sido identificados.
          </p>
        )}
      </div>
    );

    // ── DESKTOP layout (sm+) ───────────────────────────────────────────────────
    const DesktopLayout = () => (
      <div
        className="relative z-10 max-w-5xl mx-auto px-6 pb-10 flex flex-col gap-5"
        style={{ paddingTop: `calc(${SAFE_TOP} + 1.25rem)` }}
      >
        <div className="flex items-start justify-between gap-4">
          <BackButton onClick={onBack} />
          <div className="text-center flex-1">
            <p className="text-[11px] tracking-widest uppercase font-bold text-[#8b2438] opacity-60" style={{ fontFamily: 'Lato, system-ui' }}>
              ARCHIVO DE CITAS DE PONJITA
            </p>
          </div>
          <ProgressRow />
        </div>

        {/* Instruction / feedback */}
        <div className="text-center min-h-[1.5rem]">
          {feedback ? (
            <p
              className={`text-sm font-bold animate-fade-in-up inline-block px-3 py-1 border ${
                feedback.correct
                  ? 'bg-[#f5ede8] border-[#c9b89a] text-[#6b1a2a]'
                  : 'bg-[#faf0f0] border-[#e8b8b8] text-[#8b2438]'
              }`}
              style={{ fontFamily: 'Playfair Display, Georgia, serif', transform: 'rotate(-0.4deg)' }}
            >
              {feedback.msg}
            </p>
          ) : selectedFoodId ? (
            <p className="text-sm text-[#6b1a2a] italic" style={{ fontFamily: 'Dancing Script, cursive' }}>
              PRUEBA SELECCIONADA — ahora elige al Maridito correspondiente →
            </p>
          ) : (
            <p className="text-sm text-[#8b5a65] italic opacity-70" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Selecciona una prueba de la izquierda
            </p>
          )}
        </div>

        {/* Two-column board */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left: PRUEBAS (food) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="tape-left tape" style={{ position: 'relative', top: 0, left: 0, translate: 'none', transform: 'rotate(-2deg)' }}>
                PRUEBAS
              </div>
              <p className="text-[10px] text-[#6b4a52] opacity-50 ml-16" style={{ fontFamily: 'Dancing Script, cursive' }}>
                Ponjita lo guarda todo.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {DATE_MATCHES.map((m, i) => (
                <PolaroidCard
                  key={m.id}
                  match={m}
                  type="food"
                  rotate={ROTATIONS[i]}
                  isSelected={selectedFoodId === m.id}
                  isMatched={matched.has(m.id)}
                  onClick={matched.has(m.id) ? undefined : () => handleFoodClick(m.id)}
                />
              ))}
            </div>
          </div>

          {/* Right: SOSPECHOSOS (outfits, shuffled) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="tape-left tape" style={{ position: 'relative', top: 0, left: 0, translate: 'none', transform: 'rotate(2deg)' }}>
                SOSPECHOSOS
              </div>
              <p className="text-[10px] text-[#6b4a52] opacity-50 ml-20" style={{ fontFamily: 'Dancing Script, cursive' }}>
                Sospechoso: Maridito
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {shuffledOutfits.map((m, i) => (
                <PolaroidCard
                  key={m.id}
                  match={m}
                  type="outfit"
                  rotate={OUTFIT_ROTATIONS[i]}
                  isMatched={matched.has(m.id)}
                  isShaking={shakingId === m.id}
                  onClick={matched.has(m.id) ? undefined : () => handleOutfitClick(m.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="relative min-h-dvh paper-texture overflow-x-hidden">
        <DecorativeHearts />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden
          style={{ backgroundImage: 'repeating-linear-gradient(transparent,transparent 27px,#6b1a2a 27px,#6b1a2a 28px)', backgroundPositionY: '20px' }} />

        {/* Match flash overlay (mobile only) */}
        {matchFlash && (
          <MatchFlash
            foodMatch={matchById[matchFlash.foodId]}
            outfitMatch={matchById[matchFlash.outfitId]}
            message={matchFlash.msg}
          />
        )}

        {isMobile ? <MobileLayout /> : <DesktopLayout />}
      </div>
    );
  }

  // ── COMPLETE ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-dvh paper-texture overflow-x-hidden">
      <DecorativeHearts />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden
        style={{ backgroundImage: 'repeating-linear-gradient(transparent,transparent 27px,#6b1a2a 27px,#6b1a2a 28px)', backgroundPositionY: '20px' }} />
      <div
        className="relative z-10 max-w-xl mx-auto px-4 pb-10 flex flex-col items-center gap-5 screen-enter"
        style={{ paddingTop: `calc(${SAFE_TOP} + 1.5rem)` }}
      >
        {/* Big stamp */}
        <div className="text-center">
          <div className="text-5xl mb-2">🔎❤️</div>
          <div
            className="inline-block border-4 border-[#6b1a2a] px-6 py-3 rotate-[-2deg] animate-stamp-in"
            style={{ opacity: 0.85 }}
          >
            <p className="text-2xl sm:text-3xl font-bold text-[#6b1a2a]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              CASO RESUELTO
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <p className="text-lg sm:text-xl font-bold text-[#4a0f1c]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            IDENTIDAD CONFIRMADA.
          </p>
          <p className="text-[#6b4a52] mt-1 text-sm" style={{ fontFamily: 'Lato, system-ui' }}>
            Confirmado: hemos comido mucho.
          </p>
          <p className="text-[#8b5a65] mt-1 italic" style={{ fontFamily: 'Dancing Script, cursive', fontSize: '1rem' }}>
            Y Ponjita aparentemente te hace demasiadas fotos.
          </p>
        </div>

        {/* Mini solved pairs row */}
        <div className="flex flex-wrap justify-center gap-2 w-full">
          {DATE_MATCHES.map((m, i) => (
            <div key={m.id} style={{ width: 'clamp(52px, 14vw, 68px)' }}>
              <PolaroidCard match={m} type="food" rotate={ROTATIONS[i]} isMatched />
            </div>
          ))}
        </div>

        <p className="text-xs text-[#8b5a65] opacity-60" style={{ fontFamily: 'Dancing Script, cursive' }}>
          Archivo cerrado.
        </p>

        {/* Heart reward — compact */}
        <div
          className="flex items-center gap-3 bg-[#faf7f2] border border-[#c9b89a] px-4 py-2.5 shadow-[2px_2px_0_#c9b89a] w-full"
          style={{ transform: 'rotate(-0.3deg)', maxWidth: 340 }}
        >
          <span className="animate-heart-beat text-xl" style={{ display: 'inline-block', flexShrink: 0 }}>❤️</span>
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-bold text-[#6b1a2a]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              +1 corazón
            </p>
            <p className="text-xs text-[#8b5a65]" style={{ fontFamily: 'Lato, system-ui' }}>
              {wasCompletedOnMount.current
                ? '(ya tenías este corazón, tramposo)'
                : 'Corazón global desbloqueado'}
            </p>
          </div>
        </div>

        <div className="stamp animate-stamp-in" style={{ fontFamily: 'Dancing Script, cursive', position: 'relative', top: 0, left: 'auto', translate: 'none' }}>
          MISIÓN SUPERADA
        </div>

        <div className="flex flex-col gap-3 w-full pt-1">
          <ScrapbookButton onClick={onBack} variant="primary" size="lg">
            VOLVER A LAS MISIONES
          </ScrapbookButton>
          <button
            onClick={resetGame}
            className="text-sm text-[#6b1a2a] opacity-55 hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'Dancing Script, cursive', fontSize: '0.95rem' }}
          >
            Reabrir el expediente
          </button>
        </div>
      </div>
    </div>
  );
}
