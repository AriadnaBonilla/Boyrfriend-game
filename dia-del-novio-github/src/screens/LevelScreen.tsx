import BackButton from '../components/BackButton';
import PhotoPlaceholder from '../components/PhotoPlaceholder';
import ScrapbookButton from '../components/ScrapbookButton';
import DecorativeHearts from '../components/DecorativeHearts';
import { LevelId } from './GameHub';

interface LevelScreenProps {
  levelId: LevelId;
  onBack: () => void;
  onComplete: (id: LevelId) => void;
  isCompleted: boolean;
}

interface LevelConfig {
  number: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  devNote: string;
  content: React.ReactNode;
}

function PuzzleContent() {
  return (
    <div className="flex flex-col items-center gap-6">
      <p
        className="text-center text-[#6b4a52] italic"
        style={{ fontFamily: 'Dancing Script, cursive', fontSize: '1.1rem' }}
      >
        El puzzle se ensamblará aquí...
      </p>
      <PhotoPlaceholder
        label="FOTO_PUZZLE"
        polaroid
        width="w-full"
        height="h-56 sm:h-72"
        caption="Una Ponjita + Un Maridito"
        rotate={-1}
      />
    </div>
  );
}

function QuizContent() {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="bg-[#faf7f2] border border-[#c9b89a] p-5 shadow-[2px_2px_0_#c9b89a]"
        style={{ transform: 'rotate(-0.3deg)' }}
      >
        <p
          className="text-sm text-[#7a6a55] mb-2"
          style={{ fontFamily: 'Lato, system-ui', letterSpacing: '0.1em' }}
        >
          PREGUNTA 1 de ?
        </p>
        <p
          className="text-[#4a0f1c] text-lg font-bold mb-4"
          style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
        >
          ¿Cuál es el plato favorito de Ponjita?
        </p>
        {['Opción A', 'Opción B', 'Opción C', 'Opción D'].map((opt) => (
          <div
            key={opt}
            className="border border-[#c9b89a] p-3 mb-2 text-sm cursor-pointer hover:bg-[#ede5d4] transition-colors"
            style={{ fontFamily: 'Lato, system-ui' }}
          >
            {opt} — (próximamente)
          </div>
        ))}
      </div>
      <p
        className="text-center text-xs text-[#8b5a65] opacity-60 italic"
        style={{ fontFamily: 'Dancing Script, cursive' }}
      >
        El quiz completo se implementará próximamente
      </p>
    </div>
  );
}

function CitasContent() {
  const pairs = [1, 2, 3, 4, 5];
  return (
    <div className="flex flex-col gap-6">
      <p
        className="text-center text-sm text-[#6b4a52]"
        style={{ fontFamily: 'Lato, system-ui' }}
      >
        Empareja cada cena con el guapo de Maridito
      </p>
      {pairs.map((n) => (
        <div key={n} className="grid grid-cols-2 gap-3">
          <PhotoPlaceholder
            label={`CENA_0${n}`}
            polaroid
            height="h-32"
            caption={`Cena ${n}`}
            rotate={-1}
          />
          <PhotoPlaceholder
            label={`JAVI_CENA_0${n}`}
            polaroid
            height="h-32"
            caption={`Maridito en cena ${n}`}
            rotate={1}
          />
        </div>
      ))}
      <p
        className="text-center text-xs text-[#8b5a65] opacity-60 italic"
        style={{ fontFamily: 'Dancing Script, cursive' }}
      >
        La lógica de matching se implementará próximamente
      </p>
    </div>
  );
}

function MusicaContent() {
  const songs = [
    { title: 'First Time', artist: 'Damiano David' },
    { title: 'Sort de tu', artist: 'Oques Grasses' },
    { title: "La gent que estimo", artist: 'Oques Grasses' },
    { title: 'El Cisne', artist: 'Camilo' },
  ];
  return (
    <div className="flex flex-col gap-4">
      {/* Vinyl placeholder */}
      <div className="flex justify-center">
        <div
          className="w-36 h-36 rounded-full bg-[#1a1a1a] border-4 border-[#c9b89a] flex items-center justify-center shadow-lg animate-sway-r"
          style={{ transform: 'rotate(2deg)' }}
        >
          <div className="w-10 h-10 rounded-full bg-[#c9b89a] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#1a1a1a]" />
          </div>
        </div>
      </div>

      {/* Song list */}
      <div className="flex flex-col gap-2 mt-2">
        {songs.map((song, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-[#faf7f2] border border-[#c9b89a] p-3 shadow-[1px_1px_0_#c9b89a]"
            style={{ transform: `rotate(${i % 2 === 0 ? -0.3 : 0.3}deg)` }}
          >
            <span className="text-[#6b1a2a] text-lg">♪</span>
            <div>
              <p
                className="text-[#4a0f1c] font-bold text-sm"
                style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
              >
                {song.title}
              </p>
              <p
                className="text-[#8b5a65] text-xs"
                style={{ fontFamily: 'Lato, system-ui' }}
              >
                {song.artist}
              </p>
            </div>
            <div className="ml-auto opacity-30 text-lg">▶</div>
          </div>
        ))}
      </div>
      <p
        className="text-center text-xs text-[#8b5a65] opacity-60 italic"
        style={{ fontFamily: 'Dancing Script, cursive' }}
      >
        La experiencia musical completa se implementará próximamente
      </p>
    </div>
  );
}

function SurvivalContent() {
  return (
    <div className="flex flex-col gap-5">
      {[
        'Ponjita dice "me caes mal". ¿Qué significa?',
        'Ponjita le dice a Maridito que está guapo. ¿Qué sucede?',
        'Después de todo... ¿realmente nos caemos bien?',
      ].map((q, i) => (
        <div
          key={i}
          className="bg-[#faf7f2] border border-[#c9b89a] p-4 shadow-[2px_2px_0_#c9b89a]"
          style={{ transform: `rotate(${i % 2 === 0 ? -0.4 : 0.4}deg)` }}
        >
          <p
            className="text-[#4a0f1c] font-bold"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            {q}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {['A', 'B', 'C', 'D'].map((opt) => (
              <div
                key={opt}
                className="border border-[#c9b89a] text-xs p-2 text-center hover:bg-[#ede5d4] cursor-pointer"
                style={{ fontFamily: 'Lato, system-ui' }}
              >
                {opt}) próximamente
              </div>
            ))}
          </div>
        </div>
      ))}
      <p
        className="text-center text-xs text-[#8b5a65] opacity-60 italic"
        style={{ fontFamily: 'Dancing Script, cursive' }}
      >
        El test completo se implementará próximamente
      </p>
    </div>
  );
}

// LevelScreen handles only placeholder levels not yet implemented as full components.
// arcade → ArcadeLevel, puzzle → PuzzleLevel, survival → SurvivalLevel (all in App.tsx)
const LEVEL_CONFIGS: Partial<Record<LevelId, LevelConfig>> = {
  quiz: {
    number: 'NIVEL 03',
    emoji: '🧠',
    title: '¿Cuánto conoces a tu Ponjita?',
    subtitle: 'Meses de relación puestos a prueba.',
    description: 'Responde las preguntas sobre nuestra relación. Spoiler: conoces la respuesta.',
    devNote: 'Quiz de preguntas sobre la relación',
    content: <QuizContent />,
  },
  citas: {
    number: 'NIVEL 04',
    emoji: '🍽️',
    title: 'Maridito, identifica la cita',
    subtitle: 'Muchos restaurantes, una cara conocida.',
    description: 'Empareja cada foto de restaurante con la foto tuya de esa misma noche.',
    devNote: 'Matching CENA_0X con JAVI_CENA_0X',
    content: <CitasContent />,
  },
};

export default function LevelScreen({ levelId, onBack, onComplete, isCompleted }: LevelScreenProps) {
  const config = LEVEL_CONFIGS[levelId] ?? {
    number: levelId.toUpperCase(),
    emoji: '🎮',
    title: levelId,
    subtitle: 'Próximamente',
    description: 'Este nivel se implementará próximamente.',
    devNote: 'Nivel sin configurar',
    content: null,
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

      <div className="relative z-10 max-w-xl mx-auto px-4 py-8 sm:py-12 screen-enter">

        {/* Back nav */}
        <div className="mb-6">
          <BackButton onClick={onBack} />
        </div>

        {/* Level header */}
        <div className="text-center mb-8">
          <div
            className="inline-block stamp mb-4 animate-stamp-in"
            style={{ fontFamily: 'Dancing Script, cursive' }}
          >
            {config.number}
          </div>
          <div className="text-4xl mb-3">{config.emoji}</div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[#4a0f1c] leading-tight mb-2"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            {config.title}
          </h1>
          <p
            className="text-[#8b5a65] text-base"
            style={{ fontFamily: 'Dancing Script, cursive' }}
          >
            {config.subtitle}
          </p>
        </div>

        {/* Description note */}
        <div
          className="bg-[#faf7f2] border border-[#c9b89a] p-4 mb-6 shadow-[2px_2px_0_#c9b89a]"
          style={{ transform: 'rotate(-0.4deg)' }}
        >
          <p
            className="text-sm text-[#6b4a52] leading-relaxed"
            style={{ fontFamily: 'Lato, system-ui' }}
          >
            {config.description}
          </p>
        </div>

        {/* Dev note */}
        <div
          className="border border-dashed border-[#c9b89a] p-3 mb-6 bg-[#ede5d4] opacity-60"
        >
          <p
            className="text-xs text-[#7a3a2a] text-center"
            style={{ fontFamily: 'Dancing Script, cursive' }}
          >
            🚧 Próximamente: {config.devNote}
          </p>
        </div>

        {/* Level preview content */}
        <div className="mb-8">
          {config.content}
        </div>

        {/* Complete button — dev mode only */}
        <div className="flex flex-col items-center gap-3">
          {isCompleted ? (
            <div className="flex items-center gap-2 text-[#6b1a2a]">
              <span className="text-2xl">♥</span>
              <span
                className="font-bold"
                style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
              >
                ¡Nivel completado!
              </span>
            </div>
          ) : (
            <>
              <ScrapbookButton onClick={() => onComplete(levelId)} variant="primary" size="md">
                ✓ Marcar como completado (dev)
              </ScrapbookButton>
              <p
                className="text-xs text-[#8b5a65] opacity-50 text-center"
                style={{ fontFamily: 'Dancing Script, cursive' }}
              >
                Botón provisional — el minijuego real lo completará automáticamente
              </p>
            </>
          )}

          <button
            onClick={onBack}
            className="mt-2 text-sm text-[#6b1a2a] opacity-50 hover:opacity-80 transition-opacity"
            style={{ fontFamily: 'Lato, system-ui' }}
          >
            ← Volver al menú
          </button>
        </div>
      </div>
    </div>
  );
}
