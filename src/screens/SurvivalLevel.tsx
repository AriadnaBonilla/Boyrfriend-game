import { useState, useRef, useCallback } from 'react';
import BackButton from '../components/BackButton';
import ScrapbookButton from '../components/ScrapbookButton';
import DecorativeHearts from '../components/DecorativeHearts';
import { LevelId } from './GameHub';

interface Question {
  text: string;
  options: string[];
  correct: number; // option index
  successTitle: string;
  successText: string;
  failText: string;
  successEmoji?: string;
  forceCorrect?: boolean; // Q3 — must pick correct answer to proceed
}

const QUESTIONS: Question[] = [
  {
    text: '¿Qué llevaba años queriendo vivir Ponjita y Maridito consiguió cumplir en nuestro primer viaje?',
    options: ['Ver un amanecer juntos', 'Un beso bajo la lluvia', 'Dormir bajo las estrellas', 'Que Maridito admitiera que Ponjita tiene razón'],
    correct: 1,
    successTitle: 'CORRECTO ❤️',
    successText: 'Gaztelugatxe + lluvia + tú. Esta sí que cuenta.',
    failText: 'Pista mental: 🌧️ + 💋 + un Maridito bastante mono.',
    successEmoji: '🌧️ 💋 ❤️',
  },
  {
    text: 'Cuando Ponjita dice "me caes mal", ¿qué significa realmente?',
    options: ['Me caes mal', 'Necesito cinco minutos', 'Te quiero muchísimo pero no pienso ponerlo tan fácil', 'Has cometido un delito contra Ponjita'],
    correct: 2,
    successTitle: 'CORRECTO.',
    successText: 'Por desgracia, ya conoces el idioma Ponjita.',
    failText: 'Después de todos estos meses y todavía no hablas Ponjita...',
  },
  {
    text: '¿Quién tiene siempre la razón?',
    options: ['Ponjita', 'Maridito', 'Depende', 'Un comité independiente debería investigarlo'],
    correct: 0,
    successTitle: 'EXACTO ❤️',
    successText: 'Veo que esta relación tiene futuro.',
    failText: 'Qué raro. Inténtalo otra vez, maridito.',
    forceCorrect: true,
  },
  {
    text: 'Ponjita lleva 3 minutos diciéndote lo guapo que eres. ¿Qué ocurre a continuación?',
    options: ['Maridito acepta el cumplido con normalidad', 'Maridito cambia de tema', 'Maridito se pone rojo como un tomate', 'Ponjita deja de decírselo'],
    correct: 2,
    successTitle: 'CORRECTO 🍅',
    successText: 'Y Ponjita procede a decírtelo otras 14 veces.',
    failText: '¿Aceptar un cumplido con normalidad? Sabemos perfectamente que no.',
  },
  {
    text: 'Después de una discusión extremadamente seria sobre cuánto asco nos damos, ¿qué es lo más probable que pase?',
    options: ['Dejamos de hablarnos', 'Uno se va enfadado', 'Acabamos dándonos besitos como dos hipócritas', 'Llamamos a un mediador'],
    correct: 2,
    successTitle: 'CORRECTO ❤️',
    successText: 'Cero credibilidad como enemigos.',
    failText: 'Nuestro historial como enemigos no es precisamente brillante.',
  },
  {
    text: '¿Cuál es el estado actual de nuestra relación?',
    options: ['Nos queremos', 'Nos caemos mal', 'Aún no nos hemos matado', 'Todas las anteriores'],
    correct: 3,
    successTitle: 'DIAGNÓSTICO CORRECTO.',
    successText: '',
    failText: 'Respuesta incompleta. Nuestro vínculo es mucho más complejo que eso.',
    successEmoji: '❤️',
  },
];

const NO_ATTEMPT_MSGS = [
  '¿Perdona?',
  'Maridito...',
  'Deja de intentarlo.',
  'Sabes perfectamente cuál es la respuesta.',
];

function getNoPos(attempt: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const bw = 110;
  const margin = 18;
  const positions = [
    { left: margin, top: h * 0.62 },
    { left: w - bw - margin, top: h * 0.62 },
    { left: margin, top: h * 0.18 },
    { left: w - bw - margin, top: h * 0.18 },
    { left: margin, top: h * 0.78 },
    { left: w - bw - margin, top: h * 0.78 },
    { left: Math.max(margin, w / 2 - bw / 2), top: h * 0.82 },
  ];
  // Pick a position different from previous (simple offset)
  return positions[attempt % positions.length];
}

type Phase = 'intro' | 'quiz' | 'q7' | 'q7_yes' | 'result' | 'complete';

interface Props {
  onBack: () => void;
  onComplete: (id: LevelId) => void;
  isCompleted: boolean;
  totalCompleted: number; // so we can detect 5/5 moment
}

const PAPER_LINES: React.CSSProperties = {
  backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #6b1a2a 27px, #6b1a2a 28px)',
  backgroundPositionY: '20px',
};

export default function SurvivalLevel({ onBack, onComplete, isCompleted, totalCompleted }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [qIndex, setQIndex] = useState(0);       // current question (0-5)
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);         // correct answers Q1-Q6
  const [hasAwarded, setHasAwarded] = useState(isCompleted);
  const [willBeFifth, setWillBeFifth] = useState(false); // 5/5 moment

  // Q7 state
  const [noAttempts, setNoAttempts] = useState(0);
  const [noPos, setNoPos] = useState<{ left: number; top: number } | null>(null);
  const [noMsg, setNoMsg] = useState<string | null>(null);
  const noMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const currentQ = QUESTIONS[qIndex];
  const isCorrect = selected === currentQ?.correct;

  const handleSelectOption = (optIdx: number) => {
    if (answered && !currentQ?.forceCorrect) return; // already answered, can't change
    setSelected(optIdx);

    if (currentQ?.forceCorrect) {
      if (optIdx === currentQ.correct) {
        setAnswered(true);
      }
      // else: stays not answered (can re-select)
      return;
    }

    setAnswered(true);
    if (optIdx === currentQ.correct) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    const nextIndex = qIndex + 1;
    if (nextIndex < QUESTIONS.length) {
      setQIndex(nextIndex);
      setSelected(null);
      setAnswered(false);
    } else {
      // All 6 questions done — go to Q7
      setPhase('q7');
    }
  };

  const handleNoEscape = useCallback((e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const attempt = noAttempts;
    setNoAttempts(a => a + 1);
    setNoPos(getNoPos(attempt + 1)); // move to next position
    const msg = NO_ATTEMPT_MSGS[Math.min(attempt, NO_ATTEMPT_MSGS.length - 1)];
    setNoMsg(msg);
    if (noMsgTimerRef.current) clearTimeout(noMsgTimerRef.current);
    noMsgTimerRef.current = setTimeout(() => setNoMsg(null), 2000);
  }, [noAttempts]);

  const handleYes = () => {
    setPhase('q7_yes');
    setTimeout(() => {
      setWillBeFifth(!isCompleted && totalCompleted === 4);
      if (!hasAwarded) {
        onComplete('survival');
        setHasAwarded(true);
      }
      setPhase('result');
    }, 2800);
  };

  const resetQuiz = () => {
    setQIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setNoAttempts(0);
    setNoPos(null);
    setNoMsg(null);
    setPhase('intro');
  };

  const getResult = () => {
    if (score === 6) return { title: 'SOSPECHOSAMENTE BIEN.', text: '¿Has estudiado?' };
    if (score >= 4) return { title: 'MARIDITO APROBADO ❤️', text: 'Puedes conservar a tu Ponjita.' };
    if (score >= 2) return { title: 'APROBADO POR LOS PELOS.', text: 'Tenemos cosas que hablar.' };
    return { title: '¿QUIÉN ERES?', text: 'Y qué has hecho con mi Maridito.' };
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
            <div className="inline-block stamp mb-3 animate-stamp-in" style={{ fontFamily: 'Dancing Script, cursive' }}>
              NIVEL 05
            </div>
            <div className="text-4xl mb-3">❤️</div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#4a0f1c] leading-tight mb-1"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Test de supervivencia
            </h1>
            <p className="text-[#8b5a65]" style={{ fontFamily: 'Dancing Script, cursive', fontSize: '1.05rem' }}>
              Has llegado demasiado lejos para echarte atrás.
            </p>
          </div>

          <div
            className="relative bg-[#faf7f2] border-2 border-[#6b1a2a] p-5 sm:p-6 shadow-[3px_3px_0_#6b1a2a]"
            style={{ transform: 'rotate(-0.5deg)' }}
          >
            <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>EXAMEN FINAL DE MARIDITO</div>
            <p className="text-[#4a0f1c] mt-3 mb-2 leading-relaxed" style={{ fontFamily: 'Lato, system-ui', fontSize: '0.95rem' }}>
              6 situaciones. Una pregunta definitiva. Y la reputación de Maridito en juego.
            </p>
            <p className="text-[#8b2438] text-lg mt-2" style={{ fontFamily: 'Dancing Script, cursive' }}>
              "Ponjita está evaluando."
            </p>
          </div>

          <div className="flex justify-center mt-2">
            <ScrapbookButton onClick={() => setPhase('quiz')} size="lg">
              ACEPTO LAS CONSECUENCIAS →
            </ScrapbookButton>
          </div>
        </div>
      </div>
    );
  }

  // ─── PHASE: QUIZ (Q1-Q6) ────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = currentQ;
    const qNum = qIndex + 1;
    const progress = ((qIndex) / QUESTIONS.length) * 100;

    return (
      <div className="relative min-h-dvh paper-texture overflow-x-hidden">
        <DecorativeHearts />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden style={PAPER_LINES} />
        <div className="relative z-10 max-w-xl mx-auto px-4 py-6 sm:py-10 screen-enter flex flex-col gap-5">

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <BackButton onClick={onBack} />
            <div className="text-right">
              <p className="text-xs text-[#8b5a65] opacity-60 uppercase tracking-widest" style={{ fontFamily: 'Lato, system-ui', letterSpacing: '0.15em' }}>
                Pregunta
              </p>
              <p className="text-lg font-bold text-[#4a0f1c]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                {qNum} de {QUESTIONS.length}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="h-1.5 bg-[#e8dfd0] rounded overflow-hidden">
            <div
              className="h-full bg-[#6b1a2a] rounded transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question card */}
          <div
            className="relative bg-[#faf7f2] border border-[#c9b89a] p-5 shadow-[2px_2px_0_#c9b89a]"
            style={{ transform: 'rotate(-0.3deg)' }}
          >
            <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>
              {q.forceCorrect ? 'piensa bien la respuesta...' : `pregunta ${qNum}`}
            </div>
            <p
              className="mt-3 text-[#4a0f1c] font-bold text-base sm:text-lg leading-snug"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              {q.text}
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              const showResult = answered && isSelected;
              const correct = q.correct === i;
              return (
                <button
                  key={i}
                  onClick={() => handleSelectOption(i)}
                  disabled={answered && !q.forceCorrect && !isSelected}
                  className={`w-full text-left p-4 border-2 transition-all duration-200 text-sm sm:text-base ${
                    showResult
                      ? correct
                        ? 'border-[#6b1a2a] bg-[#f5e8eb] text-[#4a0f1c]'
                        : 'border-[#c9786a] bg-[#fde8e4] text-[#4a0f1c]'
                      : isSelected && q.forceCorrect && !answered
                        ? 'border-[#c9786a] bg-[#fde8e4]'
                        : 'border-[#c9b89a] bg-[#faf7f2] hover:border-[#8b2438] hover:bg-[#f5eaec] hover:-translate-x-0.5'
                  }`}
                  style={{
                    fontFamily: 'Lato, system-ui',
                    transform: `rotate(${(i % 2 === 0 ? -0.2 : 0.2)}deg)`,
                  }}
                >
                  <span className="font-bold text-[#6b1a2a] mr-2">{['A', 'B', 'C', 'D'][i]})</span>
                  {opt}
                  {showResult && correct && <span className="ml-2">✓</span>}
                  {showResult && !correct && <span className="ml-2">✗</span>}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {answered && (
            <div
              className="bg-[#faf7f2] border border-[#c9b89a] p-4 shadow-[2px_2px_0_#c9b89a] animate-fade-in-up"
              style={{ transform: 'rotate(0.3deg)' }}
            >
              {isCorrect ? (
                <>
                  <p
                    className="font-bold text-[#4a0f1c] text-base sm:text-lg"
                    style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
                  >
                    {q.successTitle}
                  </p>
                  {q.successEmoji && (
                    <p className="text-xl mt-1">{q.successEmoji}</p>
                  )}
                  {qIndex === 5 && isCorrect && (
                    <div className="mt-2 p-3 border border-[#c9b89a] bg-[#f5ece8] text-sm" style={{ fontFamily: 'Lato, system-ui' }}>
                      <p className="font-bold text-[#4a0f1c]">ESTADO: ❤️ Operativa</p>
                      <p className="text-[#6b4a52]">SUPERVIVENCIA: ✓ Confirmada</p>
                      <p className="text-[#6b4a52]">NIVEL DE ASCO: Elevado</p>
                    </div>
                  )}
                  <p className="text-[#6b4a52] mt-1 text-sm" style={{ fontFamily: 'Lato, system-ui' }}>{q.successText}</p>
                </>
              ) : (
                <p className="text-[#4a0f1c] text-sm" style={{ fontFamily: 'Lato, system-ui' }}>
                  <span className="font-bold">Incorrecto, maridito.</span> {q.failText}
                </p>
              )}

              {q.forceCorrect && !isCorrect ? (
                <p
                  className="text-[#8b2438] text-sm mt-2"
                  style={{ fontFamily: 'Dancing Script, cursive' }}
                >
                  Inténtalo otra vez, maridito.
                </p>
              ) : (
                <button
                  onClick={handleNext}
                  className="mt-3 text-sm font-bold text-[#6b1a2a] hover:opacity-80 transition-opacity flex items-center gap-1"
                  style={{ fontFamily: 'Lato, system-ui' }}
                >
                  Siguiente pregunta →
                </button>
              )}
            </div>
          )}

          {/* Force-correct instruction */}
          {q.forceCorrect && selected !== null && selected !== q.correct && !answered && (
            <div
              className="text-center animate-fade-in"
              aria-live="polite"
            >
              <p className="text-sm text-[#8b2438]" style={{ fontFamily: 'Dancing Script, cursive' }}>
                RESPUESTA INCORRECTA. Qué raro.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── PHASE: Q7 (final question) ─────────────────────────────────────────────
  if (phase === 'q7') {
    return (
      <div className="relative min-h-dvh paper-texture overflow-x-hidden">
        <DecorativeHearts />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden style={PAPER_LINES} />

        <div className="relative z-10 max-w-xl mx-auto px-4 py-10 sm:py-16 screen-enter flex flex-col items-center gap-6">

          {/* Back */}
          <div className="self-start">
            <BackButton onClick={onBack} />
          </div>

          {/* Transition text */}
          <div className="text-center flex flex-col gap-3">
            <div className="inline-block stamp animate-stamp-in" style={{ fontFamily: 'Dancing Script, cursive', transform: 'rotate(-1deg)' }}>
              PREGUNTA FINAL
            </div>
            <p
              className="text-[#6b4a52] text-lg"
              style={{ fontFamily: 'Dancing Script, cursive' }}
            >
              Bueno, maridito...
            </p>
            <p
              className="text-[#4a0f1c] text-base"
              style={{ fontFamily: 'Lato, system-ui' }}
            >
              Después de todo este tiempo...
            </p>
          </div>

          {/* The final question card */}
          <div
            className="w-full relative bg-[#faf7f2] border-2 border-[#6b1a2a] p-6 sm:p-8 text-center shadow-[3px_3px_0_#6b1a2a]"
            style={{ transform: 'rotate(-0.5deg)' }}
          >
            <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>la pregunta definitiva</div>
            <h2
              className="text-xl sm:text-2xl font-bold text-[#4a0f1c] mt-4 leading-snug"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              ¿Seguirías eligiendo a tu Ponjita?
            </h2>
            <div className="text-4xl mt-3 animate-heart-beat inline-block">❤️</div>
          </div>

          {/* Escape message */}
          {noMsg && (
            <p
              className="text-center text-[#8b2438] font-bold animate-fade-in"
              style={{ fontFamily: 'Dancing Script, cursive', fontSize: '1.1rem' }}
              aria-live="polite"
            >
              {noMsg}
            </p>
          )}

          {/* Buttons */}
          <div className="flex flex-col items-center gap-4 w-full">
            <ScrapbookButton onClick={handleYes} size="lg">
              SÍ ❤️
            </ScrapbookButton>

            <p className="text-xs text-[#8b5a65] opacity-50" style={{ fontFamily: 'Dancing Script, cursive' }}>
              (la otra opción no está disponible)
            </p>
          </div>

          {/* Escaping NO button — fixed position */}
          <button
            className="fixed z-50 border-2 border-[#c9b89a] bg-[#f5f0e8] text-[#8b5a65] text-sm py-2 font-bold transition-none"
            style={{
              fontFamily: 'Lato, system-ui',
              width: 110,
              ...(noPos
                ? { left: noPos.left, top: noPos.top }
                : { bottom: '5%', right: '5%' }),
            }}
            onMouseEnter={handleNoEscape}
            onTouchStart={handleNoEscape}
            onPointerDown={handleNoEscape}
            aria-label="NO (botón esquivo)"
          >
            NO
          </button>
        </div>
      </div>
    );
  }

  // ─── PHASE: Q7 YES response ─────────────────────────────────────────────────
  if (phase === 'q7_yes') {
    return (
      <div className="relative min-h-dvh paper-texture overflow-x-hidden">
        <DecorativeHearts />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden style={PAPER_LINES} />
        <div className="relative z-10 max-w-xl mx-auto px-4 py-14 sm:py-20 screen-enter flex flex-col items-center gap-6">
          <div className="text-5xl animate-heart-beat">❤️</div>
          <div className="text-center">
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#4a0f1c]"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              RESPUESTA CORRECTA, MARIDITO ❤️
            </h2>
            <p className="text-[#6b4a52] mt-3" style={{ fontFamily: 'Lato, system-ui' }}>
              Tampoco tenías muchas opciones.
            </p>
            <p
              className="text-[#8b2438] text-xl mt-4"
              style={{ fontFamily: 'Dancing Script, cursive' }}
            >
              Pero me alegro de que sigas eligiéndome.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── PHASE: RESULT ──────────────────────────────────────────────────────────
  if (phase === 'result') {
    const res = getResult();
    return (
      <div className="relative min-h-dvh paper-texture overflow-x-hidden">
        <DecorativeHearts />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden style={PAPER_LINES} />
        <div className="relative z-10 max-w-xl mx-auto px-4 py-10 sm:py-14 screen-enter flex flex-col items-center gap-6">

          {/* Score card */}
          <div
            className="w-full bg-[#faf7f2] border border-[#c9b89a] p-6 text-center shadow-[3px_3px_0_#c9b89a]"
            style={{ transform: 'rotate(-0.4deg)' }}
          >
            <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>resultado final</div>
            <p
              className="text-xs tracking-widest uppercase text-[#8b5a65] opacity-60 mt-3"
              style={{ fontFamily: 'Lato, system-ui', letterSpacing: '0.15em' }}
            >
              Puntuación
            </p>
            <p
              className="text-4xl font-bold text-[#4a0f1c] my-1"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              {score} / 6
            </p>
            <h2
              className="text-xl sm:text-2xl font-bold text-[#6b1a2a] mt-2"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              {res.title}
            </h2>
            <p className="text-[#6b4a52] mt-1 text-sm" style={{ fontFamily: 'Dancing Script, cursive', fontSize: '1rem' }}>
              {res.text}
            </p>
          </div>

          {/* 5/5 special message */}
          {willBeFifth && (
            <div
              className="w-full bg-[#faf7f2] border-2 border-[#6b1a2a] p-5 text-center shadow-[3px_3px_0_#6b1a2a] animate-fade-in-up"
              style={{ transform: 'rotate(0.3deg)' }}
            >
              <div className="tape" style={{ fontFamily: 'Dancing Script, cursive' }}>¡5 / 5! ♥</div>
              <p className="text-2xl mt-3">❤️ ❤️ ❤️ ❤️ ❤️</p>
              <h3
                className="text-xl font-bold text-[#4a0f1c] mt-2"
                style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
              >
                MARIDITO...
              </h3>
              <p className="text-[#4a0f1c] mt-1" style={{ fontFamily: 'Lato, system-ui' }}>
                Has completado todas las misiones.
              </p>
              <p
                className="text-[#8b2438] text-lg mt-2"
                style={{ fontFamily: 'Dancing Script, cursive' }}
              >
                Supongo que te has ganado tu sorpresa. ❤️
              </p>
            </div>
          )}

          {/* MISIÓN FINAL */}
          <div className="text-center">
            <p
              className="text-lg font-bold text-[#4a0f1c]"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              MISIÓN FINAL SUPERADA
            </p>
            <div className="flex items-center justify-center gap-2 mt-3 text-[#6b1a2a]">
              <span className="text-3xl animate-heart-beat">♥</span>
              <span className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                +1 ❤️
              </span>
            </div>
            {isCompleted && (
              <p className="text-xs text-[#8b5a65] mt-2 opacity-55" style={{ fontFamily: 'Dancing Script, cursive' }}>
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
              onClick={resetQuiz}
              className="text-sm text-[#6b1a2a] opacity-50 hover:opacity-80 transition-opacity underline underline-offset-2"
              style={{ fontFamily: 'Lato, system-ui' }}
            >
              Volver a hacer el test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PHASE: COMPLETE (unreachable in practice but for safety) ───────────────
  return null;
}
