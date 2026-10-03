import { useState, useEffect, useRef } from 'react';
import HeartCounter from '../components/HeartCounter';
import LevelCard, { LevelStatus } from '../components/LevelCard';
import DecorativeHearts from '../components/DecorativeHearts';

export type LevelId = 'arcade' | 'puzzle' | 'quiz' | 'citas' | 'survival';

interface Level {
  id: LevelId;
  number: string;
  emoji: string;
  title: string;
  description: string;
  rotate: number;
}

const LEVELS: Level[] = [
  {
    id: 'arcade',
    number: 'NIVEL 01',
    emoji: '🍣',
    title: 'Atrapa a Ponjita',
    description: 'Primera cita · 27.02.2026 · Castell de Rosanes + sushi.',
    rotate: -0.8,
  },
  {
    id: 'puzzle',
    number: 'NIVEL 02',
    emoji: '🧩',
    title: 'Reconstruye lo nuestro',
    description: 'Nuestro primer viaje. Una Ponjita, un Maridito y varias piezas.',
    rotate: 0.5,
  },
  {
    id: 'quiz',
    number: 'NIVEL 03',
    emoji: '🔎',
    title: '¿Qué llevabas puesto?',
    description: 'Archivo de citas de Ponjita · Maridito',
    rotate: -0.4,
  },
  {
    id: 'citas',
    number: 'NIVEL 04',
    emoji: '🫒',
    title: 'Alimenta a Ponjita',
    description: '¿Cuántas aceitunas son demasiadas? Respuesta: eso no existe.',
    rotate: 0.7,
  },
  {
    id: 'survival',
    number: 'NIVEL 05',
    emoji: '❤️',
    title: 'Test de supervivencia',
    description: 'Examen final de Maridito. Buena suerte.',
    rotate: -0.6,
  },
];

interface GameHubProps {
  completedLevels: Set<LevelId>;
  onPlayLevel: (id: LevelId) => void;
  onOpenSurprise: () => void;
}

// Mini CSS envelope for the surprise card
function MiniEnvelope({ unlocked }: { unlocked: boolean }) {
  return (
    <div
      style={{
        width: 72,
        height: 52,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: unlocked ? '#faf7f2' : '#f0ebe2',
          border: `1.5px solid ${unlocked ? '#c9b89a' : '#d4c9b4'}`,
          borderRadius: 2,
          boxShadow: unlocked ? '2px 3px 8px rgba(74,15,28,0.15)' : 'none',
        }}
      />
      {/* Fold lines (SVG) */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 72 52" fill="none">
        <line x1="0" y1="52" x2="36" y2="30" stroke="#c9b89a" strokeWidth="0.8" opacity="0.5" />
        <line x1="72" y1="52" x2="36" y2="30" stroke="#c9b89a" strokeWidth="0.8" opacity="0.5" />
        {/* Flap */}
        <polygon
          points="1,1 71,1 36,30"
          fill={unlocked ? '#ede5d4' : '#e4ddd0'}
          stroke="#c9b89a"
          strokeWidth="1"
        />
        {/* Wax seal */}
        {unlocked && (
          <>
            <circle cx="36" cy="27" r="8" fill="#6b1a2a" opacity="0.85" />
            <text x="36" y="31" textAnchor="middle" fontSize="9" fill="#faf7f2" fontFamily="serif">♥</text>
          </>
        )}
        {/* Lock icon if not unlocked */}
        {!unlocked && (
          <text x="36" y="34" textAnchor="middle" fontSize="13" fill="#9a8870" opacity="0.5">🔒</text>
        )}
      </svg>
    </div>
  );
}

export default function GameHub({ completedLevels, onPlayLevel, onOpenSurprise }: GameHubProps) {
  const completedCount = completedLevels.size;
  const allCompleted = completedCount === 5;

  // Detect first-time unlock to trigger cascade animation
  const prevCountRef = useRef(completedCount);
  const [unlocking, setUnlocking] = useState(false);
  const [surpriseJustUnlocked, setSurpriseJustUnlocked] = useState(false);

  useEffect(() => {
    if (prevCountRef.current < 5 && completedCount === 5) {
      setUnlocking(true);
      setSurpriseJustUnlocked(true);
      // Stop heart animation after cascade finishes (5 hearts × 0.18s delay + 0.55s anim)
      const t1 = setTimeout(() => setUnlocking(false), 5 * 180 + 700);
      const t2 = setTimeout(() => setSurpriseJustUnlocked(false), 1200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    prevCountRef.current = completedCount;
  }, [completedCount]);

  const getStatus = (id: LevelId): LevelStatus => {
    if (completedLevels.has(id)) return 'completed';
    return 'available';
  };

  return (
    <div className="relative min-h-dvh paper-texture overflow-x-hidden">
      <DecorativeHearts />

      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #6b1a2a 27px, #6b1a2a 28px)',
          backgroundPositionY: '20px',
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 sm:py-14 screen-enter">

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div
            className="text-xs tracking-widest uppercase text-[#8b2438] opacity-60 mb-3"
            style={{ fontFamily: 'Lato, system-ui', letterSpacing: '0.2em' }}
          >
            Misión secreta
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold text-[#4a0f1c] leading-tight mb-3"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            Operación:<br />
            <em className="italic text-[#6b1a2a]">Conseguir tu sorpresa</em>
          </h1>
          <p
            className="text-[#6b4a52] text-base sm:text-lg"
            style={{ fontFamily: 'Dancing Script, cursive' }}
          >
            5 pruebas. 5 corazones. 1 sorpresa.
          </p>

          <div className="flex items-center gap-3 mt-5 justify-center opacity-30" aria-hidden>
            <div className="h-px flex-1 max-w-16 bg-[#6b1a2a]" />
            <span className="text-[#6b1a2a] text-xs">✦</span>
            <div className="h-px flex-1 max-w-16 bg-[#6b1a2a]" />
          </div>
        </div>

        {/* Heart counter */}
        <div className="bg-[#faf7f2] border border-[#c9b89a] p-5 sm:p-6 mb-8 sm:mb-12 shadow-[3px_3px_0_#c9b89a]" style={{ transform: 'rotate(0.3deg)' }}>
          <div className="tape-left tape" style={{ top: '-10px', left: '16px', transform: 'rotate(-2deg)' }}>progreso</div>
          <HeartCounter completed={completedCount} unlocking={unlocking} />
        </div>

        {/* Levels grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7 mb-10 sm:mb-14">
          {LEVELS.map((level) => (
            <div key={level.id} className={level.id === 'survival' ? 'sm:col-span-2 sm:max-w-sm sm:mx-auto w-full' : ''}>
              <LevelCard
                number={level.number}
                emoji={level.emoji}
                title={level.title}
                description={level.description}
                status={getStatus(level.id)}
                rotate={level.rotate}
                onPlay={() => onPlayLevel(level.id)}
              />
            </div>
          ))}
        </div>

        {/* Final surprise section */}
        <div
          className={`relative border-2 p-5 sm:p-7 flex items-center gap-5 transition-all duration-700 ${
            allCompleted
              ? `border-[#6b1a2a] bg-[#faf7f2] shadow-[4px_4px_0_#6b1a2a] cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#6b1a2a] ${surpriseJustUnlocked ? 'animate-surprise-unlock' : ''}`
              : 'border-[#c9b89a] bg-[#f5f0e8] opacity-70'
          }`}
          onClick={allCompleted ? onOpenSurprise : undefined}
          role={allCompleted ? 'button' : undefined}
          tabIndex={allCompleted ? 0 : undefined}
          onKeyDown={allCompleted ? (e) => { if (e.key === 'Enter' || e.key === ' ') onOpenSurprise(); } : undefined}
          aria-label={allCompleted ? 'Abrir sorpresa final' : 'Sorpresa final bloqueada'}
          style={{ transform: 'rotate(-0.3deg)' }}
        >
          <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>
            {allCompleted ? 'para ti ♥' : 'bloqueado'}
          </div>

          {/* Mini CSS envelope */}
          <div className="mt-1 flex-shrink-0">
            <MiniEnvelope unlocked={allCompleted} />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h2
              className="text-lg sm:text-xl font-bold text-[#4a0f1c] mb-0.5 leading-snug"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Sorpresa Final
            </h2>

            {allCompleted ? (
              <>
                <p
                  className="text-[#6b1a2a] text-base"
                  style={{ fontFamily: 'Dancing Script, cursive' }}
                >
                  Para mi Maridito ❤️
                </p>
                <p
                  className="text-xs text-[#8b5a65] opacity-70 mt-0.5"
                  style={{ fontFamily: 'Dancing Script, cursive' }}
                >
                  De tu Ponjita
                </p>
                <p
                  className="text-xs text-[#6b1a2a] mt-2 font-bold"
                  style={{ fontFamily: 'Lato, system-ui', letterSpacing: '0.05em' }}
                >
                  ABRIR →
                </p>
              </>
            ) : (
              <>
                <p
                  className="text-[#6b4a52] text-sm"
                  style={{ fontFamily: 'Lato, system-ui' }}
                >
                  Necesitas{' '}
                  <span className="text-[#6b1a2a] font-bold">5 corazones</span>{' '}
                  para desbloquear esto.
                </p>
                <p
                  className="text-xs text-[#8b5a65] mt-1 opacity-60"
                  style={{ fontFamily: 'Dancing Script, cursive' }}
                >
                  {5 - completedCount} {5 - completedCount === 1 ? 'prueba' : 'pruebas'} más...
                </p>
              </>
            )}
          </div>
        </div>

        <p
          className="text-center text-xs text-[#8b2438] opacity-30 mt-10"
          style={{ fontFamily: 'Dancing Script, cursive' }}
        >
          Con todo mi amor. Y un poco de maldad. — Ponjita ♡
        </p>
      </div>
    </div>
  );
}
