import { useState, useEffect, useRef, useCallback } from 'react';
import BackButton from '../components/BackButton';
import ScrapbookButton from '../components/ScrapbookButton';
import DecorativeHearts from '../components/DecorativeHearts';
import { LevelId } from './GameHub';
import puzzleImg from '../assets/puzzle/primer-viaje.jpg';

const PUZZLE_IMAGE = puzzleImg;

const COLS = 4;
const ROWS = 3;
const TOTAL = COLS * ROWS; // 12

const ERROR_MSGS = [
  'Eso no va ahí, maridito.',
  'Concentración.',
  '¿Seguro que me conoces?',
  'Te estoy juzgando 👀',
  'Venga, que tú puedes.',
  'Maridito...',
];

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getPieceBg(pieceId: number): React.CSSProperties {
  const col = pieceId % COLS;
  const row = Math.floor(pieceId / COLS);
  const posX = COLS <= 1 ? 0 : (col / (COLS - 1)) * 100;
  const posY = ROWS <= 1 ? 0 : (row / (ROWS - 1)) * 100;
  return {
    backgroundImage: `url("${PUZZLE_IMAGE}")`,
    backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
    backgroundPosition: `${posX}% ${posY}%`,
  };
}

type Phase = 'intro' | 'memorize' | 'puzzle' | 'complete';

interface Props {
  onBack: () => void;
  onComplete: (id: LevelId) => void;
  isCompleted: boolean;
}

// Ruled paper background lines (reused across phases)
const PAPER_LINES: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(transparent, transparent 27px, #6b1a2a 27px, #6b1a2a 28px)',
  backgroundPositionY: '20px',
};

export default function PuzzleLevel({ onBack, onComplete, isCompleted }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [tray, setTray] = useState<number[]>(() =>
    shuffleArr(Array.from({ length: TOTAL }, (_, i) => i))
  );
  const [placedSet, setPlacedSet] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hasAwarded, setHasAwarded] = useState(isCompleted);
  const [snapping, setSnapping] = useState<Set<number>>(new Set());

  // Stable refs to avoid stale closures in global event handlers
  const pendingPieceRef = useRef<number | null>(null);
  const hasMovedRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef<number | null>(null);
  const placedSetRef = useRef(placedSet);
  placedSetRef.current = placedSet;
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tryPlaceRef = useRef<(pieceId: number, slotId: number) => void>(() => {});

  // Memorize phase auto-advance after 3 s
  useEffect(() => {
    if (phase !== 'memorize') return;
    const t = setTimeout(() => setPhase('puzzle'), 3000);
    return () => clearTimeout(t);
  }, [phase]);

  // Award heart exactly once on completion
  useEffect(() => {
    if (phase === 'complete' && !hasAwarded) {
      onComplete('puzzle');
      setHasAwarded(true);
    }
  }, [phase, hasAwarded, onComplete]);

  const showError = useCallback(() => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    const msg = ERROR_MSGS[Math.floor(Math.random() * ERROR_MSGS.length)];
    setErrorMsg(msg);
    errorTimerRef.current = setTimeout(() => setErrorMsg(null), 2200);
  }, []);

  const tryPlace = useCallback(
    (pieceId: number, slotId: number) => {
      if (pieceId === slotId) {
        setPlacedSet((prev) => {
          if (prev.has(pieceId)) return prev;
          const next = new Set([...prev, pieceId]);
          // Snap animation
          setSnapping((s) => new Set([...s, pieceId]));
          setTimeout(
            () => setSnapping((s) => { const n = new Set(s); n.delete(pieceId); return n; }),
            450
          );
          // Transition to complete when all 12 placed
          if (next.size === TOTAL) {
            setTimeout(() => setPhase('complete'), 750);
          }
          return next;
        });
        setTray((prev) => prev.filter((p) => p !== pieceId));
        setSelected(null);
      } else {
        showError();
        setSelected(null);
      }
    },
    [showError]
  );

  // Keep tryPlaceRef current so global listener always calls latest version
  tryPlaceRef.current = tryPlace;

  // Global pointer listeners for drag — registered once
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (pendingPieceRef.current === null) return;
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      if (!hasMovedRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        hasMovedRef.current = true;
        const pid = pendingPieceRef.current;
        setDragging(pid);
        draggingRef.current = pid;
        setSelected(null);
      }
      if (hasMovedRef.current) {
        setDragPos({ x: e.clientX, y: e.clientY });
      }
    };

    const onUp = (e: PointerEvent) => {
      if (pendingPieceRef.current === null) return;
      const pid = pendingPieceRef.current;

      if (hasMovedRef.current && draggingRef.current !== null) {
        // Drag released — find slot under pointer
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const slotEl = el?.closest('[data-slot-id]') as HTMLElement | null;
        if (slotEl) {
          const slotId = parseInt(slotEl.dataset.slotId ?? '');
          if (!isNaN(slotId) && !placedSetRef.current.has(slotId)) {
            tryPlaceRef.current(pid, slotId);
          }
        }
      } else {
        // Tap — toggle selection
        setSelected((prev) => (prev === pid ? null : pid));
      }

      setDragging(null);
      setDragPos(null);
      pendingPieceRef.current = null;
      draggingRef.current = null;
      hasMovedRef.current = false;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []); // empty — all state read through refs

  const handlePiecePointerDown = (e: React.PointerEvent, pieceId: number) => {
    e.preventDefault();
    if (placedSetRef.current.has(pieceId)) return;
    pendingPieceRef.current = pieceId;
    hasMovedRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleSlotClick = (slotId: number) => {
    if (placedSetRef.current.has(slotId)) return;
    if (selected !== null) {
      tryPlace(selected, slotId);
    }
  };

  const handleHint = () => {
    setShowHint(true);
    setTimeout(() => setShowHint(false), 2000);
  };

  const resetPuzzle = () => {
    setTray(shuffleArr(Array.from({ length: TOTAL }, (_, i) => i)));
    setPlacedSet(new Set());
    setSelected(null);
    setDragging(null);
    setDragPos(null);
    setErrorMsg(null);
    setSnapping(new Set());
    setPhase('intro');
  };

  const placedCount = placedSet.size;

  // ─── HINT OVERLAY ───────────────────────────────────────────────────────────
  if (showHint) {
    return (
      <div className="fixed inset-0 z-50 bg-[#4a0f1c]/85 flex items-center justify-center p-4 animate-fade-in">
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <p
            className="text-[#faf7f2] text-xl text-center"
            style={{ fontFamily: 'Dancing Script, cursive' }}
          >
            Memorízala bien esta vez 👀
          </p>
          <div className="polaroid w-full">
            <img
              src={PUZZLE_IMAGE}
              alt="Pista — imagen completa"
              className="w-full object-cover"
              style={{ maxHeight: '60vh' }}
            />
            <p
              className="text-center text-sm mt-2 text-[#4a0f1c]"
              style={{ fontFamily: 'Dancing Script, cursive' }}
            >
              primer viaje juntos ❤️
            </p>
          </div>
          <div className="h-1 w-full max-w-sm bg-[#faf7f2]/20 rounded overflow-hidden">
            <div
              className="h-full bg-[#faf7f2]/60"
              style={{ animation: 'shrink-bar 2s linear forwards' }}
            />
          </div>
        </div>
        <style>{`@keyframes shrink-bar { from{width:100%} to{width:0%} }`}</style>
      </div>
    );
  }

  // ─── PHASE: INTRO ───────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="relative min-h-dvh paper-texture overflow-x-hidden">
        <DecorativeHearts />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden style={PAPER_LINES} />
        <div className="relative z-10 max-w-xl mx-auto px-4 py-8 sm:py-12 screen-enter flex flex-col gap-6">
          <BackButton onClick={onBack} />

          <div className="text-center">
            <div
              className="inline-block stamp mb-4 animate-stamp-in"
              style={{ fontFamily: 'Dancing Script, cursive' }}
            >
              NIVEL 02
            </div>
            <div className="text-4xl mb-3">🧩</div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#4a0f1c] leading-tight mb-2"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Reconstruye lo nuestro
            </h1>
            <p className="text-[#6b4a52] leading-relaxed" style={{ fontFamily: 'Lato, system-ui' }}>
              Una Ponjita. Un Maridito. Varias piezas.
              <br />
              Intenta no estropearlo.
            </p>
          </div>

          {/* Handwritten note */}
          <div
            className="relative bg-[#faf7f2] border border-[#c9b89a] p-5 shadow-[2px_2px_0_#c9b89a]"
            style={{ transform: 'rotate(-0.6deg)' }}
          >
            <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>
              nota de Ponjita
            </div>
            <p
              className="text-center text-[#4a0f1c] mt-3 text-lg leading-relaxed"
              style={{ fontFamily: 'Dancing Script, cursive' }}
            >
              "Esto debería ser más fácil
              <br />
              que entenderme a mí."
            </p>
          </div>

          {/* Instructions for mobile */}
          <div
            className="border border-dashed border-[#c9b89a] p-3 text-center"
            style={{ transform: 'rotate(0.3deg)' }}
          >
            <p className="text-xs text-[#8b5a65] opacity-70" style={{ fontFamily: 'Lato, system-ui' }}>
              Arrastra las piezas al tablero · o toca una pieza y luego toca su posición
            </p>
          </div>

          <div className="flex justify-center mt-2">
            <ScrapbookButton onClick={() => setPhase('memorize')} size="lg">
              EMPEZAR →
            </ScrapbookButton>
          </div>
        </div>
      </div>
    );
  }

  // ─── PHASE: MEMORIZE ────────────────────────────────────────────────────────
  if (phase === 'memorize') {
    return (
      <div className="relative min-h-dvh paper-texture overflow-x-hidden">
        <DecorativeHearts />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden style={PAPER_LINES} />
        <div className="relative z-10 max-w-xl mx-auto px-4 py-8 sm:py-12 screen-enter flex flex-col items-center gap-6">

          <div className="text-center">
            <div
              className="inline-block stamp mb-3 animate-stamp-in"
              style={{ fontFamily: 'Dancing Script, cursive', transform: 'rotate(-2deg)' }}
            >
              PRIMERA MISIÓN
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#4a0f1c] mt-3"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Volvamos a nuestro primer viaje... ❤️
            </h2>
          </div>

          <div
            className="polaroid w-full max-w-sm relative"
            style={{ transform: 'rotate(-1deg)' }}
          >
            <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Memorízala, maridito 👀
            </div>
            <img
              src={PUZZLE_IMAGE}
              alt="Nuestro primer viaje — memoriza esta imagen"
              className="w-full object-cover"
              style={{ maxHeight: '55vh' }}
            />
            <p
              className="text-center text-sm mt-2 text-[#4a0f1c] opacity-70"
              style={{ fontFamily: 'Dancing Script, cursive' }}
            >
              primer viaje juntos ❤️
            </p>
          </div>

          {/* Countdown bar */}
          <div className="w-full max-w-sm flex flex-col gap-1">
            <div className="h-1.5 bg-[#e8dfd0] rounded overflow-hidden">
              <div
                className="h-full bg-[#6b1a2a] rounded"
                style={{ animation: 'shrink-bar 3s linear forwards' }}
              />
            </div>
            <p className="text-xs text-center text-[#8b5a65] opacity-50" style={{ fontFamily: 'Dancing Script, cursive' }}>
              preparando el puzzle...
            </p>
          </div>
        </div>
        <style>{`@keyframes shrink-bar { from{width:100%} to{width:0%} }`}</style>
      </div>
    );
  }

  // ─── PHASE: COMPLETE ────────────────────────────────────────────────────────
  if (phase === 'complete') {
    return (
      <div className="relative min-h-dvh paper-texture overflow-x-hidden">
        <DecorativeHearts />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden style={PAPER_LINES} />
        <div className="relative z-10 max-w-xl mx-auto px-4 py-8 sm:py-14 screen-enter flex flex-col items-center gap-6">

          {/* Assembled image */}
          <div
            className="polaroid w-full max-w-sm animate-sway"
            style={{ transform: 'rotate(-1deg)' }}
          >
            <img
              src={PUZZLE_IMAGE}
              alt="Nuestro primer viaje — reconstruido"
              className="w-full object-cover"
            />
            <p
              className="text-center text-sm mt-2 text-[#4a0f1c]"
              style={{ fontFamily: 'Dancing Script, cursive' }}
            >
              Nuestro primer viaje juntos ❤️
            </p>
          </div>

          {/* Floating hearts celebration */}
          <div className="flex gap-3 justify-center" aria-hidden>
            {[0, 0.2, 0.4, 0.6, 0.8].map((delay, i) => (
              <span
                key={i}
                className="text-2xl text-[#6b1a2a] animate-float-heart"
                style={{ animationDelay: `${delay}s` }}
              >
                {i % 2 === 0 ? '♥' : '♡'}
              </span>
            ))}
          </div>

          {/* Result card */}
          <div
            className="bg-[#faf7f2] border border-[#c9b89a] p-6 w-full text-center shadow-[3px_3px_0_#c9b89a] relative"
            style={{ transform: 'rotate(-0.4deg)' }}
          >
            <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>¡conseguido! ♥</div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#4a0f1c] mt-3"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              LO CONSEGUISTE ❤️
            </h2>
            <p className="text-[#6b4a52] mt-2 text-base" style={{ fontFamily: 'Lato, system-ui' }}>
              Nuestro primer viaje juntos.
            </p>
            <p
              className="text-[#8b2438] text-xl mt-2"
              style={{ fontFamily: 'Dancing Script, cursive' }}
            >
              Y por suerte, no fue el último.
            </p>

            {/* Heart reward */}
            <div className="flex items-center justify-center gap-2 mt-5 text-[#6b1a2a]">
              <span className="text-4xl animate-heart-beat">♥</span>
              <span
                className="text-2xl font-bold"
                style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
              >
                +1 ❤️
              </span>
            </div>

            {/* Already had it note (replay) */}
            {isCompleted && (
              <p
                className="text-xs text-[#8b5a65] mt-2 opacity-55"
                style={{ fontFamily: 'Dancing Script, cursive' }}
              >
                (ya tenías mi corazón, tramposo)
              </p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex flex-col items-center gap-3 w-full">
            <ScrapbookButton onClick={onBack} size="lg">
              VOLVER A LAS MISIONES
            </ScrapbookButton>
            <button
              onClick={resetPuzzle}
              className="text-sm text-[#6b1a2a] opacity-50 hover:opacity-80 transition-opacity underline underline-offset-2"
              style={{ fontFamily: 'Lato, system-ui' }}
            >
              Volver a jugar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PHASE: PUZZLE ──────────────────────────────────────────────────────────
  return (
    <div
      className="relative min-h-dvh paper-texture overflow-x-hidden select-none"
      style={{ touchAction: dragging !== null ? 'none' : undefined }}
    >
      <DecorativeHearts />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden style={PAPER_LINES} />

      <div className="relative z-10 max-w-xl mx-auto px-3 py-5 sm:py-8 screen-enter flex flex-col gap-4">

        {/* Top bar: back + counter */}
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} />
          <div className="text-right">
            <p
              className="text-[10px] tracking-widest uppercase text-[#8b5a65] opacity-60"
              style={{ fontFamily: 'Lato, system-ui', letterSpacing: '0.15em' }}
            >
              piezas
            </p>
            <p
              className="text-xl font-bold text-[#4a0f1c] leading-none"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              {placedCount} / {TOTAL}
            </p>
          </div>
        </div>

        {/* Prompt */}
        <p
          className="text-center text-[#6b1a2a] opacity-65"
          style={{ fontFamily: 'Dancing Script, cursive', fontSize: '1.15rem' }}
        >
          Ahora arréglalo.
        </p>

        {/* Error message */}
        {errorMsg && (
          <div
            className="text-center py-2 px-4 bg-[#8b2438] text-[#faf7f2] text-sm font-bold animate-fade-in"
            style={{ fontFamily: 'Lato, system-ui', transform: 'rotate(-0.5deg)' }}
            aria-live="polite"
          >
            {errorMsg}
          </div>
        )}

        {/* ── BOARD ── */}
        <div
          className="w-full border-2 border-[#c9b89a] bg-[#d4c4aa] p-[3px] shadow-[3px_3px_0_#c9b89a]"
          style={{ transform: 'rotate(0.3deg)' }}
        >
          <div
            className="grid gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          >
            {Array.from({ length: TOTAL }, (_, slotId) => {
              const isPlaced = placedSet.has(slotId);
              const isSnapping = snapping.has(slotId);
              const isTarget = selected !== null && !isPlaced;
              return (
                <div
                  key={slotId}
                  data-slot-id={slotId}
                  onClick={() => handleSlotClick(slotId)}
                  className={`relative aspect-square cursor-pointer transition-all duration-200 overflow-hidden ${
                    isPlaced
                      ? isSnapping ? 'scale-[1.04] z-10 shadow-md' : 'scale-100'
                      : isTarget
                        ? 'ring-2 ring-inset ring-[#8b2438] bg-[#f0dfe3]'
                        : 'bg-[#c4b49a] hover:bg-[#b8a68e]'
                  }`}
                >
                  {isPlaced ? (
                    <div
                      className={`w-full h-full ${isSnapping ? 'animate-fade-in' : ''}`}
                      style={getPieceBg(slotId)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div
                        className="w-[60%] h-[60%] border border-dashed border-[#8b7a60] rounded-sm opacity-40"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selection hint */}
        {selected !== null && (
          <p
            className="text-center text-sm text-[#6b1a2a] animate-fade-in"
            style={{ fontFamily: 'Dancing Script, cursive' }}
            aria-live="polite"
          >
            Pieza seleccionada ✓ — toca una posición del tablero
          </p>
        )}

        {/* ── TRAY ── */}
        <div
          className="bg-[#faf7f2] border border-[#c9b89a] p-3 shadow-[2px_2px_0_#c9b89a]"
          style={{ transform: 'rotate(-0.3deg)' }}
        >
          <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>
            piezas disponibles
          </div>
          <div className="mt-3">
            {tray.length === 0 ? (
              <p
                className="text-center text-sm text-[#6b1a2a] py-3"
                style={{ fontFamily: 'Dancing Script, cursive' }}
              >
                ¡Todas colocadas! 🎉
              </p>
            ) : (
              <div
                className="flex flex-wrap gap-[6px] justify-center"
                style={{ touchAction: 'none' }}
              >
                {tray.map((pieceId) => {
                  const isDraggingThis = dragging === pieceId;
                  const isSelectedThis = selected === pieceId;
                  return (
                    <div
                      key={pieceId}
                      onPointerDown={(e) => handlePiecePointerDown(e, pieceId)}
                      className={`border-2 transition-all duration-150 cursor-grab active:cursor-grabbing ${
                        isDraggingThis
                          ? 'opacity-25 border-[#c9b89a]'
                          : isSelectedThis
                            ? 'border-[#6b1a2a] shadow-[0_0_0_3px_rgba(107,26,42,0.25)] scale-110 z-10'
                            : 'border-[#c9b89a] hover:border-[#8b2438] hover:-translate-y-0.5 hover:shadow-sm'
                      }`}
                      style={{
                        ...getPieceBg(pieceId),
                        width: 68,
                        height: 68,
                        touchAction: 'none',
                        flexShrink: 0,
                      }}
                      aria-label={`Pieza ${pieceId + 1}`}
                      role="button"
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── HINT ── */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleHint}
            className="text-sm text-[#6b1a2a] opacity-60 hover:opacity-95 transition-opacity border border-dashed border-[#c9b89a] px-4 py-2 active:bg-[#f5e8eb]"
            style={{ fontFamily: 'Lato, system-ui' }}
          >
            NECESITO UNA PISTA
          </button>
          <p
            className="text-xs text-[#8b5a65] opacity-45"
            style={{ fontFamily: 'Dancing Script, cursive' }}
          >
            Sí, puedes hacer trampas. Ponjita no juzga.
          </p>
        </div>
      </div>

      {/* ── FLOATING DRAG GHOST ── */}
      {dragging !== null && dragPos && (
        <div
          className="fixed z-50 pointer-events-none border-2 border-[#6b1a2a] shadow-xl opacity-90"
          style={{
            ...getPieceBg(dragging),
            width: 68,
            height: 68,
            left: dragPos.x - 34,
            top: dragPos.y - 34,
            transform: 'rotate(4deg) scale(1.08)',
          }}
          aria-hidden
        />
      )}
    </div>
  );
}
