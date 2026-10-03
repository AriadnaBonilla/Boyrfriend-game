import { useState, useEffect, useRef, useCallback } from 'react';
import BackButton from '../components/BackButton';
import ScrapbookButton from '../components/ScrapbookButton';
import DecorativeHearts from '../components/DecorativeHearts';
import { LevelId } from './GameHub';

type ObjType = 'heart' | 'heart2' | 'heartfire' | 'sushi' | 'bento' | 'onigiri';

const EMOJIS: Record<ObjType, string> = {
  heart: '❤️',
  heart2: '💗',
  heartfire: '❤️‍🔥',
  sushi: '🍣',
  bento: '🍱',
  onigiri: '🍙',
};

const SUSHI_MSGS = [
  'MARIDITO, ESO NO ES UN CORAZÓN.',
  'Has venido a ligar, no a cenar.',
  'Concéntrate, que Ponjita está mirando.',
  'Eso era sushi.',
  'Maridito...',
  'Prioridades, por favor.',
];

interface FallingObj {
  id: number;
  type: ObjType;
  x: number;  // % from left (center of object)
  y: number;  // % from top (center of object)
  speed: number; // % of area height per second
}

type Phase = 'intro' | 'playing' | 'lost' | 'won';

interface Props {
  onBack: () => void;
  onComplete: (id: LevelId) => void;
  isCompleted: boolean;
}

const SCORE_TARGET = 10;
const CATCHER_HW = 12; // half-width of catcher in % of game area

const PAPER_LINES: React.CSSProperties = {
  backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #6b1a2a 27px, #6b1a2a 28px)',
  backgroundPositionY: '20px',
};

export default function ArcadeLevel({ onBack, onComplete, isCompleted }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [maridatoMode, setMaridatoMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bonusMsg, setBonusMsg] = useState<string | null>(null);
  const [hasAwarded, setHasAwarded] = useState(isCompleted);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const objectsContainerRef = useRef<HTMLDivElement>(null);
  const catcherRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bonusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // All mutable game state — avoids stale closures in RAF
  const gs = useRef({
    objects: [] as FallingObj[],
    catcherX: 50,
    score: 0,
    lives: 3,
    nextId: 0,
    spawnTimer: 0,
    maridatoTimer: 0,
    lastTime: 0,
    keysHeld: new Set<string>(),
  });

  // Award heart exactly once
  useEffect(() => {
    if (phase === 'won' && !hasAwarded) {
      onComplete('arcade');
      setHasAwarded(true);
    }
  }, [phase, hasAwarded, onComplete]);

  const showError = useCallback((msg: string) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setErrorMsg(msg);
    errorTimerRef.current = setTimeout(() => setErrorMsg(null), 2400);
  }, []);

  const showBonus = useCallback((msg: string) => {
    if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
    setBonusMsg(msg);
    bonusTimerRef.current = setTimeout(() => setBonusMsg(null), 1400);
  }, []);

  // Main game loop via useEffect — runs when phase = 'playing'
  useEffect(() => {
    if (phase !== 'playing') return;

    const g = gs.current;
    g.objects = [];
    g.catcherX = 50;
    g.score = 0;
    g.lives = 3;
    g.nextId = 0;
    g.spawnTimer = 800;
    g.maridatoTimer = 0;
    g.keysHeld.clear();

    setScore(0);
    setLives(3);
    setMaridatoMode(false);
    setErrorMsg(null);
    setBonusMsg(null);

    // ── Helpers ─────────────────────────────────────────────────────────────

    const spawnObj = () => {
      const sc = g.score;
      const rand = Math.random();
      let type: ObjType;

      if (sc < 4) {
        type = rand < 0.48 ? 'heart' : rand < 0.60 ? 'heart2' : rand < 0.62 ? 'heartfire'
          : rand < 0.78 ? 'sushi' : rand < 0.90 ? 'bento' : 'onigiri';
      } else if (sc < 7) {
        type = rand < 0.42 ? 'heart' : rand < 0.54 ? 'heart2' : rand < 0.57 ? 'heartfire'
          : rand < 0.75 ? 'sushi' : rand < 0.88 ? 'bento' : 'onigiri';
      } else {
        type = rand < 0.38 ? 'heart' : rand < 0.50 ? 'heart2' : rand < 0.52 ? 'heartfire'
          : rand < 0.72 ? 'sushi' : rand < 0.86 ? 'bento' : 'onigiri';
      }

      const baseSpeed = sc < 4 ? 30 : sc < 7 ? 38 : 46;
      g.objects.push({
        id: g.nextId++,
        type,
        x: 8 + Math.random() * 84,
        y: -8,
        speed: baseSpeed + Math.random() * 10,
      });
    };

    const updateDOM = () => {
      const container = objectsContainerRef.current;
      if (!container) return;
      const existing = new Map<number, HTMLElement>();
      Array.from(container.children).forEach(c => {
        const el = c as HTMLElement;
        const id = parseInt(el.dataset.objId ?? '');
        if (!isNaN(id)) existing.set(id, el);
      });
      g.objects.forEach(obj => {
        let el = existing.get(obj.id);
        if (!el) {
          el = document.createElement('div');
          el.dataset.objId = String(obj.id);
          el.style.cssText =
            'position:absolute;font-size:32px;line-height:1;user-select:none;pointer-events:none;transform:translate(-50%,-50%);transition:none;';
          el.textContent = EMOJIS[obj.type];
          container.appendChild(el);
        }
        el.style.left = `${obj.x}%`;
        el.style.top = `${obj.y}%`;
        existing.delete(obj.id);
      });
      existing.forEach(el => container.removeChild(el));
    };

    const clearDOM = () => {
      if (objectsContainerRef.current) objectsContainerRef.current.innerHTML = '';
    };

    // ── Keyboard ────────────────────────────────────────────────────────────

    const onKeyDown = (e: KeyboardEvent) => g.keysHeld.add(e.key);
    const onKeyUp = (e: KeyboardEvent) => g.keysHeld.delete(e.key);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // ── Mouse / Touch control ────────────────────────────────────────────────

    const area = gameAreaRef.current;
    const updateCatcherFromX = (clientX: number) => {
      if (!area) return;
      const rect = area.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      g.catcherX = Math.max(8, Math.min(92, pct));
    };
    const onMouseMove = (e: MouseEvent) => updateCatcherFromX(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches[0]) updateCatcherFromX(e.touches[0].clientX);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) updateCatcherFromX(e.touches[0].clientX);
    };
    area?.addEventListener('mousemove', onMouseMove);
    area?.addEventListener('touchmove', onTouchMove, { passive: false });
    area?.addEventListener('touchstart', onTouchStart, { passive: false });

    // ── Game loop ────────────────────────────────────────────────────────────

    g.lastTime = performance.now();

    const loop = (timestamp: number) => {
      const elapsed = Math.min(timestamp - g.lastTime, 50);
      g.lastTime = timestamp;

      const speedMult = g.maridatoTimer > 0 ? 0.42 : 1;

      // Keyboard catcher movement
      const keys = g.keysHeld;
      if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) {
        g.catcherX = Math.max(8, g.catcherX - 65 * elapsed / 1000);
      }
      if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) {
        g.catcherX = Math.min(92, g.catcherX + 65 * elapsed / 1000);
      }

      // Update catcher DOM
      if (catcherRef.current) {
        catcherRef.current.style.left = `${g.catcherX}%`;
      }

      // Move objects + collision
      const toRemove = new Set<number>();
      let scoreChanged = false;
      let livesChanged = false;

      for (const obj of g.objects) {
        obj.y += (obj.speed * speedMult * elapsed) / 1000 * (100 / 100); // % per second × elapsed_s

        // Collision window: y between 81-89, x within catcher half-width
        if (obj.y >= 81 && obj.y <= 90) {
          if (Math.abs(obj.x - g.catcherX) < CATCHER_HW) {
            toRemove.add(obj.id);
            if (obj.type === 'sushi' || obj.type === 'bento' || obj.type === 'onigiri') {
              g.lives = Math.max(0, g.lives - 1);
              livesChanged = true;
              showError(SUSHI_MSGS[Math.floor(Math.random() * SUSHI_MSGS.length)]);
            } else {
              const pts = obj.type === 'heart2' ? 2 : 1;
              g.score = Math.min(SCORE_TARGET, g.score + pts);
              scoreChanged = true;
              if (obj.type === 'heartfire') {
                g.maridatoTimer = 3000;
                setMaridatoMode(true);
                showBonus('MARIDITO ENAMORADO ❤️‍🔥');
              } else if (obj.type === 'heart2') {
                showBonus('+2 ❤️');
              }
            }
            continue;
          }
        }

        if (obj.y > 108) toRemove.add(obj.id);
      }

      if (toRemove.size > 0) {
        g.objects = g.objects.filter(o => !toRemove.has(o.id));
      }

      // Maridato timer
      if (g.maridatoTimer > 0) {
        g.maridatoTimer -= elapsed;
        if (g.maridatoTimer <= 0) {
          g.maridatoTimer = 0;
          setMaridatoMode(false);
        }
      }

      // Spawn timer
      g.spawnTimer -= elapsed;
      if (g.spawnTimer <= 0) {
        const sc = g.score;
        const interval = sc < 4 ? 1050 : sc < 7 ? 820 : 680;
        g.spawnTimer = interval + Math.random() * 350;
        const visible = g.objects.filter(o => o.y > -5 && o.y < 100).length;
        if (visible < 5) spawnObj();
      }

      updateDOM();

      if (scoreChanged) setScore(g.score);
      if (livesChanged) setLives(g.lives);

      // Win/lose
      if (g.lives <= 0) {
        clearDOM();
        setPhase('lost');
        return;
      }
      if (g.score >= SCORE_TARGET) {
        clearDOM();
        setPhase('won');
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      area?.removeEventListener('mousemove', onMouseMove);
      area?.removeEventListener('touchmove', onTouchMove);
      area?.removeEventListener('touchstart', onTouchStart);
      clearDOM();
    };
  }, [phase, showError, showBonus]);

  const startGame = () => setPhase('playing');

  const resetGame = () => {
    setPhase('playing'); // triggers useEffect re-run
  };

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
              className="inline-block stamp mb-2 animate-stamp-in"
              style={{ fontFamily: 'Dancing Script, cursive' }}
            >
              NIVEL 01
            </div>
            <div
              className="inline-block stamp ml-2 animate-stamp-in"
              style={{ fontFamily: 'Dancing Script, cursive', transform: 'rotate(-2deg)', fontSize: '0.65rem' }}
            >
              27.02.2026 · PRIMERA CITA
            </div>
            <div className="text-4xl mt-3 mb-3">🍣 ❤️</div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#4a0f1c] leading-tight mb-2"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Atrapa a Ponjita ❤️
            </h1>
          </div>

          {/* Story note */}
          <div
            className="relative bg-[#faf7f2] border border-[#c9b89a] p-5 shadow-[2px_2px_0_#c9b89a]"
            style={{ transform: 'rotate(-0.5deg)' }}
          >
            <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>27 de febrero de 2026</div>
            <p className="text-[#4a0f1c] mt-3 text-sm leading-relaxed" style={{ fontFamily: 'Lato, system-ui' }}>
              Todo empezó con una primera cita, sushi y dos personas intentando actuar con normalidad.
            </p>
          </div>

          {/* Mission card */}
          <div
            className="relative bg-[#faf7f2] border-2 border-[#6b1a2a] p-5 shadow-[3px_3px_0_#6b1a2a]"
            style={{ transform: 'rotate(0.4deg)' }}
          >
            <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>tu misión</div>
            <p className="text-[#4a0f1c] mt-3 mb-1 text-sm" style={{ fontFamily: 'Lato, system-ui' }}>
              Tu misión es sencilla, maridito.
            </p>
            <p
              className="text-xl sm:text-2xl font-bold text-[#6b1a2a] leading-snug"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              ATRAPA LOS CORAZONES.<br />
              NO EL SUSHI.
            </p>
            <div className="flex gap-4 mt-3 text-2xl">
              <span>❤️ +1</span>
              <span className="opacity-50">·</span>
              <span>💗 +2</span>
              <span className="opacity-50">·</span>
              <span>🍣 −1 vida</span>
            </div>
            <p
              className="text-[#8b5a65] text-sm mt-3 italic"
              style={{ fontFamily: 'Dancing Script, cursive' }}
            >
              "No confundas el sushi con el amor."
            </p>
          </div>

          {/* Controls note */}
          <div className="border border-dashed border-[#c9b89a] p-3 text-center">
            <p className="text-xs text-[#8b5a65] opacity-70" style={{ fontFamily: 'Lato, system-ui' }}>
              Mueve el plato con el ratón · teclas ← → / A D · o arrastra con el dedo en móvil
            </p>
          </div>

          <div className="flex justify-center mt-2">
            <ScrapbookButton onClick={startGame} size="lg">
              EMPEZAR LA CITA →
            </ScrapbookButton>
          </div>
        </div>
      </div>
    );
  }

  // ─── PHASE: LOST ────────────────────────────────────────────────────────────
  if (phase === 'lost') {
    return (
      <div className="relative min-h-dvh paper-texture overflow-x-hidden">
        <DecorativeHearts />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden style={PAPER_LINES} />
        <div className="relative z-10 max-w-xl mx-auto px-4 py-10 sm:py-16 screen-enter flex flex-col items-center gap-6">
          <div className="text-6xl">🍣</div>
          <div
            className="bg-[#faf7f2] border border-[#c9b89a] p-6 w-full text-center shadow-[3px_3px_0_#c9b89a]"
            style={{ transform: 'rotate(-0.5deg)' }}
          >
            <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>demasiado sushi</div>
            <h2
              className="text-2xl font-bold text-[#4a0f1c] mt-3"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              MARIDITO... 🍣
            </h2>
            <p className="text-[#6b4a52] mt-2" style={{ fontFamily: 'Lato, system-ui' }}>
              Has atrapado más sushi que sentimientos.
            </p>
            <p
              className="text-[#8b2438] text-lg mt-3"
              style={{ fontFamily: 'Dancing Script, cursive' }}
            >
              Menos mal que nuestra primera cita salió mejor.
            </p>
          </div>
          <ScrapbookButton onClick={resetGame} size="lg">
            VOLVER A INTENTAR
          </ScrapbookButton>
          <button
            onClick={onBack}
            className="text-sm text-[#6b1a2a] opacity-50 hover:opacity-80 transition-opacity underline underline-offset-2"
            style={{ fontFamily: 'Lato, system-ui' }}
          >
            ← Volver al menú
          </button>
        </div>
      </div>
    );
  }

  // ─── PHASE: WON ─────────────────────────────────────────────────────────────
  if (phase === 'won') {
    return (
      <div className="relative min-h-dvh paper-texture overflow-x-hidden">
        <DecorativeHearts />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden style={PAPER_LINES} />
        <div className="relative z-10 max-w-xl mx-auto px-4 py-10 sm:py-14 screen-enter flex flex-col items-center gap-6">

          <div className="flex gap-3 text-3xl" aria-hidden>
            {[0, 0.2, 0.4, 0.6, 0.8].map((d, i) => (
              <span key={i} className="text-[#6b1a2a] animate-float-heart" style={{ animationDelay: `${d}s` }}>
                {i % 2 === 0 ? '♥' : '♡'}
              </span>
            ))}
          </div>

          <div
            className="bg-[#faf7f2] border border-[#c9b89a] p-6 w-full text-center shadow-[3px_3px_0_#c9b89a]"
            style={{ transform: 'rotate(-0.4deg)' }}
          >
            <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>¡misión superada!</div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#4a0f1c] mt-3"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              MISIÓN SUPERADA ❤️
            </h2>
            <p className="text-[#6b4a52] mt-2" style={{ fontFamily: 'Lato, system-ui' }}>
              10 corazones atrapados.
            </p>
            <div className="border-t border-dashed border-[#c9b89a] mt-4 pt-4">
              <p className="text-[#4a0f1c] leading-relaxed" style={{ fontFamily: 'Lato, system-ui' }}>
                Al final de aquella cita también atrapaste uno.
              </p>
              <p
                className="text-[#8b2438] text-xl mt-2"
                style={{ fontFamily: 'Dancing Script, cursive' }}
              >
                El de tu Ponjita. ❤️
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 mt-5 text-[#6b1a2a]">
              <span className="text-4xl animate-heart-beat">♥</span>
              <span
                className="text-2xl font-bold"
                style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
              >
                +1 ❤️
              </span>
            </div>
            {isCompleted && (
              <p className="text-xs text-[#8b5a65] mt-2 opacity-55" style={{ fontFamily: 'Dancing Script, cursive' }}>
                (ya tenías mi corazón, tramposo)
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 w-full">
            <ScrapbookButton onClick={onBack} size="lg">
              VOLVER A LAS MISIONES
            </ScrapbookButton>
            <button
              onClick={resetGame}
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

  // ─── PHASE: PLAYING ──────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-dvh paper-texture overflow-x-hidden select-none">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden style={PAPER_LINES} />

      <div className="relative z-10 max-w-xl mx-auto px-3 py-4 screen-enter flex flex-col gap-3">

        {/* HUD */}
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} />
          <div className="flex items-center gap-4">
            {/* Lives */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`text-xl transition-all ${i < lives ? 'text-[#6b1a2a]' : 'opacity-20 grayscale'}`}>
                  ♥
                </span>
              ))}
            </div>
            {/* Score */}
            <div className="text-right">
              <p className="text-[10px] tracking-widest uppercase text-[#8b5a65] opacity-60 leading-none" style={{ fontFamily: 'Lato, system-ui' }}>
                corazones
              </p>
              <p className="text-xl font-bold text-[#4a0f1c] leading-none" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                {score} / {SCORE_TARGET}
              </p>
            </div>
          </div>
        </div>

        {/* Maridato mode banner */}
        {maridatoMode && (
          <div
            className="text-center py-1 px-3 bg-[#6b1a2a] text-[#faf7f2] text-xs font-bold animate-fade-in"
            style={{ fontFamily: 'Dancing Script, cursive', fontSize: '0.9rem' }}
            aria-live="polite"
          >
            ❤️‍🔥 MARIDITO ENAMORADO — objetos más lentos
          </div>
        )}

        {/* Bonus message */}
        {bonusMsg && (
          <div
            className="text-center text-lg font-bold text-[#6b1a2a] animate-fade-in"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            aria-live="polite"
          >
            {bonusMsg}
          </div>
        )}

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

        {/* Game area */}
        <div
          className="relative overflow-hidden border-2 border-[#c9b89a] bg-[#faf7f2] shadow-[3px_3px_0_#c9b89a]"
          style={{
            height: 'min(58vh, 460px)',
            transform: 'rotate(0.2deg)',
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(107,26,42,0.04) 27px, rgba(107,26,42,0.04) 28px)',
            touchAction: 'none',
          }}
          ref={gameAreaRef}
        >
          {/* Decorative tape */}
          <div className="tape" style={{ fontFamily: 'Dancing Script, cursive', fontSize: '0.65rem', top: '-9px' }}>
            CASTELL DE ROSANES · PRIMERA CITA
          </div>

          {/* Objects container — DOM-managed */}
          <div ref={objectsContainerRef} className="absolute inset-0" aria-hidden />

          {/* Catcher — DOM-positioned for smooth animation */}
          <div
            ref={catcherRef}
            className="absolute"
            style={{
              top: '83%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '22%',
              maxWidth: '88px',
              minWidth: '64px',
              pointerEvents: 'none',
            }}
            aria-hidden
          >
            <div className="w-full h-8 bg-[#faf7f2] border-2 border-[#6b1a2a] rounded-full flex items-center justify-center shadow-[1px_1px_0_#4a0f1c] relative">
              <span className="text-xs font-bold text-[#6b1a2a]">♥</span>
            </div>
          </div>

          {/* Decorative bottom label */}
          <div
            className="absolute bottom-1 left-0 right-0 text-center text-[9px] text-[#8b5a65] opacity-30"
            style={{ fontFamily: 'Dancing Script, cursive' }}
            aria-hidden
          >
            atrapa los ❤️ · evita el 🍣
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-[#8b5a65] opacity-50" style={{ fontFamily: 'Lato, system-ui' }}>0</span>
          <div className="flex-1 h-1.5 bg-[#e8dfd0] rounded overflow-hidden">
            <div
              className="h-full bg-[#6b1a2a] rounded transition-all duration-300"
              style={{ width: `${(score / SCORE_TARGET) * 100}%` }}
            />
          </div>
          <span className="text-xs text-[#6b1a2a] font-bold" style={{ fontFamily: 'Lato, system-ui' }}>
            {SCORE_TARGET} ❤️
          </span>
        </div>

      </div>
    </div>
  );
}
