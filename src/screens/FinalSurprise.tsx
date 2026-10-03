import { useState, useEffect, useRef, useCallback } from 'react';

interface FinalSurpriseProps {
  onBack: () => void;
}

const SAFE_TOP = 'env(safe-area-inset-top, 0px)';

// Detect reduced-motion preference
function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return reduced;
}

// ── Scroll-reveal paragraph ───────────────────────────────────────────────────
function RevealPara({
  children,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0.6,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── CSS Envelope (hero) ───────────────────────────────────────────────────────
function Envelope({
  flapOpen,
  sinking,
  onClick,
}: {
  flapOpen: boolean;
  sinking: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      style={{
        width: 'clamp(220px, 68vw, 300px)',
        aspectRatio: '3/2',
        position: 'relative',
        animation: sinking ? 'envelope-sink 0.7s ease-out forwards' : 'none',
      }}
    >
      {/* Drop shadow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          top: 6,
          left: 5,
          background: 'rgba(74,15,28,0.1)',
          borderRadius: 3,
        }}
      />

      {/* Envelope body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#faf7f2',
          border: '1.5px solid #c9b89a',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Inner fold lines - V shape from bottom corners to center */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 300 200" fill="none" preserveAspectRatio="none">
          <line x1="0" y1="200" x2="150" y2="118" stroke="#c9b89a" strokeWidth="1" opacity="0.45" />
          <line x1="300" y1="200" x2="150" y2="118" stroke="#c9b89a" strokeWidth="1" opacity="0.45" />
          <line x1="0" y1="0" x2="0" y2="200" stroke="#c9b89a" strokeWidth="0.8" opacity="0.2" />
          <line x1="300" y1="0" x2="300" y2="200" stroke="#c9b89a" strokeWidth="0.8" opacity="0.2" />
        </svg>

        {/* Address label */}
        <div
          style={{
            position: 'absolute',
            bottom: '14%',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            width: '60%',
          }}
        >
          <p style={{ fontFamily: 'Lato, system-ui', fontSize: '0.55rem', color: '#7a6a55', letterSpacing: '0.12em', marginBottom: 2 }}>PARA:</p>
          <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '0.9rem', fontWeight: 700, color: '#4a0f1c', marginBottom: 6 }}>MARIDITO</p>
          <p style={{ fontFamily: 'Lato, system-ui', fontSize: '0.55rem', color: '#7a6a55', letterSpacing: '0.12em', marginBottom: 2 }}>DE:</p>
          <p style={{ fontFamily: 'Dancing Script, cursive', fontSize: '0.85rem', color: '#6b1a2a' }}>Ponjita ❤️</p>
        </div>

        {/* Postage stamp (top right) */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 32,
            height: 38,
            border: '1px solid #c9b89a',
            background: '#ede5d4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
          }}
          aria-hidden
        >
          ❤️
        </div>
      </div>

      {/* Flap — clip-path animates open */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#ede5d4',
          border: '1.5px solid #c9b89a',
          borderRadius: 2,
          clipPath: flapOpen
            ? 'polygon(-1% -1%, 101% -1%, 50% -1%)'
            : 'polygon(-1% -1%, 101% -1%, 50% 66%)',
          transition: 'clip-path 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 3,
        }}
      />

      {/* Wax seal */}
      <div
        style={{
          position: 'absolute',
          top: '57%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 4,
          opacity: flapOpen ? 0 : 1,
          transition: 'opacity 0.25s ease',
          pointerEvents: 'none',
        }}
        aria-hidden
      >
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="#6b1a2a" opacity="0.9" />
          <text x="18" y="23" textAnchor="middle" fontSize="16" fill="#faf7f2" fontFamily="serif">♥</text>
        </svg>
      </div>

      {/* Clickable overlay */}
      {onClick && (
        <button
          onClick={onClick}
          aria-label="Abrir el sobre"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: 5,
            borderRadius: 2,
          }}
        />
      )}
    </div>
  );
}

// ── Letter sheet (rises from envelope during animation) ───────────────────────
function LetterSheet({ rising }: { rising: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '10%',
        right: '10%',
        bottom: '15%',
        height: '90%',
        background: '#fff9f4',
        border: '1px solid #e8d5b7',
        boxShadow: '0 2px 12px rgba(74,15,28,0.1)',
        zIndex: 2,
        transform: rising ? 'translateY(-68%)' : 'translateY(0)',
        opacity: rising ? 1 : 0,
        transition: 'transform 0.85s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      <p style={{ fontFamily: 'Dancing Script, cursive', fontSize: '0.65rem', color: '#c9b89a', opacity: 0.6, letterSpacing: '0.08em' }}>
        CARTA DE PONJITA
      </p>
    </div>
  );
}

// ── Small drawn heart (inline SVG) ───────────────────────────────────────────
function DrawnHeart({ size = 18, color = '#6b1a2a', style }: { size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} aria-hidden>
      <path
        d="M12 21C12 21 3 14 3 8.5C3 6 4.79 4 7.5 4C9.24 4 10.91 5.07 12 6.57C13.09 5.07 14.76 4 16.5 4C19.21 4 21 6 21 8.5C21 14 12 21 12 21Z"
        fill={color}
        opacity="0.75"
        stroke={color}
        strokeWidth="0.5"
      />
    </svg>
  );
}

// ── Small olive (easter egg) ──────────────────────────────────────────────────
function DrawnOlive({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="20" height="28" viewBox="0 0 20 28" fill="none" style={style} aria-hidden>
      <ellipse cx="10" cy="17" rx="7" ry="9" fill="#6b8c3a" opacity="0.65" />
      <ellipse cx="10" cy="16" rx="4" ry="5" fill="#4a6b28" opacity="0.4" />
      <ellipse cx="10" cy="14" rx="2.5" ry="3" fill="#d4c4a8" opacity="0.7" />
      <line x1="10" y1="8" x2="10" y2="2" stroke="#6b8c3a" strokeWidth="1.2" opacity="0.6" />
      <path d="M10 2 C12 0 15 2 13 4" fill="none" stroke="#6b8c3a" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FinalSurprise({ onBack }: FinalSurpriseProps) {
  const reduced = useReducedMotion();

  // 'envelope' | 'opening' | 'letter'
  const [phase, setPhase] = useState<'envelope' | 'opening' | 'letter'>('envelope');
  const [flapOpen, setFlapOpen] = useState(false);
  const [letterRising, setLetterRising] = useState(false);
  const [envelopeSinking, setEnvelopeSinking] = useState(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleOpen = useCallback(() => {
    if (phase !== 'envelope') return;

    if (reduced) {
      // Skip animation
      setPhase('letter');
      return;
    }

    setPhase('opening');
    const add = (fn: () => void, ms: number) => {
      const t = setTimeout(fn, ms);
      timersRef.current.push(t);
    };
    add(() => setFlapOpen(true), 60);
    add(() => setLetterRising(true), 550);
    add(() => setEnvelopeSinking(true), 1150);
    add(() => setPhase('letter'), 1750);
  }, [phase, reduced]);

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  // ── ENVELOPE PHASE ──────────────────────────────────────────────────────────
  if (phase === 'envelope' || phase === 'opening') {
    return (
      <div
        className="relative min-h-dvh paper-texture overflow-x-hidden flex flex-col"
        style={{ background: '#f5f0e8' }}
      >
        {/* Subtle lined paper */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          aria-hidden
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #6b1a2a 27px, #6b1a2a 28px)',
            backgroundPositionY: '20px',
          }}
        />

        <div
          className="relative z-10 flex flex-col items-center justify-center flex-1 gap-8 px-4"
          style={{ paddingTop: `calc(${SAFE_TOP} + 1rem)`, paddingBottom: '2rem' }}
        >
          {/* Back — subtle */}
          <div className="self-start">
            <button
              onClick={onBack}
              className="text-[#8b5a65] text-sm hover:text-[#6b1a2a] transition-colors"
              style={{ fontFamily: 'Lato, system-ui', opacity: 0.6 }}
            >
              ← Volver
            </button>
          </div>

          {/* Header */}
          <div className="text-center flex flex-col items-center gap-2 screen-enter">
            <div
              className="stamp animate-stamp-in"
              style={{ fontFamily: 'Dancing Script, cursive', transform: 'rotate(-2deg)' }}
            >
              para maridito
            </div>

            <h1
              className="text-2xl sm:text-3xl font-bold text-[#4a0f1c] mt-3 leading-snug"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Lo conseguiste.
            </h1>
            <p
              className="text-[#8b5a65]"
              style={{ fontFamily: 'Dancing Script, cursive', fontSize: '1.05rem' }}
            >
              5 corazones. 1 Ponjita muy orgullosa.
            </p>
          </div>

          {/* Envelope + letter sheet wrapper */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {/* Letter sheet (rises out) */}
            <div style={{ position: 'absolute', inset: 0 }}>
              <LetterSheet rising={letterRising} />
            </div>

            {/* Envelope */}
            <div style={{ opacity: envelopeSinking ? 0 : 1, transition: 'opacity 0.5s ease' }}>
              <Envelope
                flapOpen={flapOpen}
                sinking={envelopeSinking}
                onClick={phase === 'envelope' ? handleOpen : undefined}
              />
            </div>
          </div>

          {/* ABRIR button (only in envelope phase) */}
          {phase === 'envelope' && (
            <div className="flex flex-col items-center gap-2 animate-fade-in">
              <button
                onClick={handleOpen}
                className="border-2 border-[#6b1a2a] bg-transparent text-[#6b1a2a] font-bold px-8 py-3 hover:bg-[#6b1a2a] hover:text-white transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1a2a] focus-visible:ring-offset-2"
                style={{ fontFamily: 'Lato, system-ui', letterSpacing: '0.12em', fontSize: '0.85rem' }}
              >
                ABRIR
              </button>
              <p
                className="text-xs opacity-40 text-[#6b1a2a]"
                style={{ fontFamily: 'Dancing Script, cursive', fontSize: '0.85rem' }}
              >
                Pulsa para abrir el sobre
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── LETTER PHASE ────────────────────────────────────────────────────────────
  return (
    <div
      className="relative min-h-dvh paper-texture overflow-x-hidden"
      style={{ background: '#f8f4ee' }}
    >
      {/* Very subtle lined paper — lighter than games */}
      <div
        className="absolute inset-0 opacity-[0.018] pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #6b1a2a 31px, #6b1a2a 32px)',
          backgroundPositionY: '24px',
        }}
      />

      {/* Letter content */}
      <div
        className="relative z-10 mx-auto px-5 sm:px-8 pb-20 screen-enter"
        style={{
          maxWidth: 700,
          paddingTop: `calc(${SAFE_TOP} + 2.5rem)`,
        }}
      >
        {/* Back — very subtle at top */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-[#8b5a65] text-sm hover:text-[#6b1a2a] transition-colors"
            style={{ fontFamily: 'Lato, system-ui', opacity: 0.5 }}
          >
            ← Volver a las misiones
          </button>
        </div>

        {/* ── LETTER HEADER ─────────────────────────────────────────────────── */}
        <RevealPara style={{ marginBottom: '2rem' }}>
          {/* Washi tape detail */}
          <div style={{ position: 'relative', paddingTop: '1rem', marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'inline-block',
                background: 'rgba(232, 213, 183, 0.65)',
                padding: '3px 20px',
                transform: 'rotate(-1.5deg)',
                fontFamily: 'Dancing Script, cursive',
                fontSize: '0.7rem',
                color: '#7a3a2a',
                letterSpacing: '0.06em',
                marginBottom: '0.5rem',
              }}
            >
              carta de ponjita — confidencial
            </div>
          </div>

          <h2
            style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 'clamp(1.4rem, 4vw, 1.9rem)',
              fontWeight: 700,
              color: '#4a0f1c',
              lineHeight: 1.3,
              marginBottom: '0.4rem',
            }}
          >
            Para mi Maridito ❤️
          </h2>
          <p
            style={{
              fontFamily: 'Dancing Script, cursive',
              fontSize: '0.95rem',
              color: '#8b5a65',
              marginBottom: '0.2rem',
            }}
          >
            3 de octubre de 2026
          </p>
          {/* Drawn divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: '0.75rem', opacity: 0.35 }}>
            <div style={{ height: 1, flex: 1, background: '#6b1a2a' }} />
            <DrawnHeart size={14} />
            <div style={{ height: 1, flex: 1, background: '#6b1a2a' }} />
          </div>
        </RevealPara>

        {/* ── BODY ──────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Opening */}
          <RevealPara>
            <p className="letter-body-p">Bueno, has llegado hasta aquí.</p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              Has sobrevivido al sushi, has reconstruido nuestros recuerdos, has demostrado que recuerdas tus propios outfits, has alimentado a Ponjita hasta hacerla explotar y, sorprendentemente, has aprobado el test de supervivencia.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">Así que supongo que te has ganado esto.</p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              No sé muy bien en qué momento pasamos de conocernos, vacilarnos y decirnos que nos caíamos mal, a convertirnos en esto. Bueno, en realidad sí sé cuándo empezó todo, y me hace muchísima gracia pensar que desde aquel día ya sentía que no quería separarme de ti.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              Desde entonces han pasado unos meses, pero siento que hemos vivido tantísimas cosas juntos que a veces parece muchísimo más tiempo. Viajes, cenas, escapadas, nuestras tonterías, conocer a nuestras familias, planes que hace no tanto ni existían y que ahora me parece completamente normal imaginar contigo.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              Me acuerdo de nuestro primer viaje, de Gaztelugatxe, de la lluvia y de ese beso que probablemente tú no sabías lo importante que iba a ser para mí. De las alpacas intentando escupirnos por comida. De Huesca. De todas las cenas, excursiones y momentos que hemos ido acumulando casi sin darnos cuenta.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              Pero también quiero acordarme de la otra parte, porque nosotros tampoco somos una película romántica y creo que precisamente eso hace que lo nuestro sea más de verdad.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              Somos dos cabezotas. Muchísimo. Y cuando nos enfadamos podemos llegar a estar tan convencidos de lo que pensamos que a veces parece que estamos compitiendo por ver quién consigue bajarse del burro el último. Y encima hemos llegado a un punto en el que nos conocemos tanto que a veces cometemos el error de pensar que ya sabemos lo que el otro va a decir, lo que va a pensar o cómo va a reaccionar antes incluso de darle la oportunidad de hacerlo.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              Pero supongo que conocernos tanto también significa aprender a no darlo todo por hecho. A seguir descubriéndonos, incluso cuando creemos que ya sabemos perfectamente cómo funciona el otro.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              Porque habrá momentos en los que me enfade contigo y tú conmigo. Habrá días en los que ninguno quiera dar su brazo a torcer y seguramente habrá más de un "ya sabía que ibas a decir eso" que deberíamos habernos ahorrado. Pero incluso en esos momentos, nunca quiero que se nos olvide todo lo bueno que hay detrás.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              No quiero que lo nuestro sea perfecto. Quiero que siga siendo nuestro. Con nuestros piques, nuestras tonterías, nuestros momentos buenos y también aquellos en los que toca entendernos un poquito más.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              Porque quererte no son solo los viajes, las cenas, Gaztelugatxe bajo la lluvia o los días en los que todo es fácil. También es seguir queriéndote cuando me caes mal de verdad durante cinco minutos.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">Aunque luego obviamente se me pase porque eres demasiado guapo. Qué rabia.</p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">Y, curiosamente, no creo que sean los viajes ni los planes lo que más me hace quererte.</p>
          </RevealPara>

          {/* Special: "Son las cosas pequeñas." */}
          <RevealPara style={{ position: 'relative' }}>
            {/* Margin annotation */}
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: -40,
                top: 2,
                fontFamily: 'Dancing Script, cursive',
                fontSize: '0.65rem',
                color: '#c9788a',
                transform: 'rotate(-4deg)',
                whiteSpace: 'nowrap',
                opacity: 0.55,
                display: 'none', // hidden on mobile, shown on wider
              }}
              className="margin-note-sm"
            >
              ← esto
            </span>
            <p
              style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: 'clamp(1.1rem, 3.5vw, 1.35rem)',
                fontWeight: 600,
                color: '#4a0f1c',
                fontStyle: 'italic',
                lineHeight: 1.4,
              }}
            >
              Son las cosas pequeñas.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              Que me hagas reír. Que pueda ser completamente idiota contigo. Que me escuches. Que me cuides. Que me hagas sentir querida. Que consiga decirte catorce veces que estás guapo solo para verte ponerte rojo otras catorce veces. Que podamos pasar de decirnos "me caes mal" y "qué asco" a estar dándonos besitos cinco segundos después como dos personas con absolutamente cero credibilidad.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">Y, sobre todo, me gusta muchísimo cómo me siento cuando estoy contigo.</p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              En muy poco tiempo te has convertido en mi persona para contarle las cosas, para hacer planes, para viajar, para reírme, para quejarme y también para imaginar cosas que todavía quedan muy lejos.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              Al principio bromeábamos con que parecía que llevábamos mucho más tiempo juntos. Y creo que sigo sintiéndolo. Porque no siento que simplemente tenga novio. Siento que he encontrado un compañero. Alguien con quien quiero seguir creciendo, descubriendo sitios, haciendo planes absurdos y viendo qué nos va trayendo la vida.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">Y sí, evidentemente, también alguien a quien seguir diciéndole que me cae mal durante muchos años.</p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              No sé dónde estaremos cuando volvamos a leer esto dentro de un tiempo. No sé cuántos viajes habremos hecho, cuántas fotos horribles tendremos, cuántos restaurantes habremos probado o cuántas veces habremos discutido sobre quién tiene razón —aunque eso último sabemos perfectamente que siempre será Ponjita—.
            </p>
          </RevealPara>

          {/* Special: "Pero hay algo que sí sé." with extra space before */}
          <RevealPara style={{ paddingTop: '1rem' }}>
            <p
              style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: 'clamp(1rem, 3vw, 1.15rem)',
                fontWeight: 600,
                color: '#4a0f1c',
                fontStyle: 'italic',
              }}
            >
              Pero hay algo que sí sé.
            </p>
          </RevealPara>

          {/* Callback to Nivel 05 — more space, slightly set apart */}
          <RevealPara style={{ paddingTop: '0.5rem', paddingBottom: '0.25rem' }}>
            <div
              style={{
                borderLeft: '2px solid rgba(107,26,42,0.15)',
                paddingLeft: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <p className="letter-body-p">
                Si después de todos estos meses me volvieran a poner delante aquel botón del último juego y me preguntaran:
              </p>
              <p
                style={{
                  fontFamily: 'Dancing Script, cursive',
                  fontSize: '1.1rem',
                  color: '#6b1a2a',
                  fontStyle: 'italic',
                }}
              >
                "¿Seguirías eligiendo a tu Maridito?"
              </p>
              <p className="letter-body-p">Yo tampoco necesitaría un botón de NO.</p>
            </div>
          </RevealPara>

          {/* "Te elegiría a ti." — centred, prominent */}
          <RevealPara style={{ textAlign: 'center', padding: '1.5rem 0 1rem' }}>
            <p
              style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: 'clamp(1.25rem, 4vw, 1.6rem)',
                fontWeight: 700,
                color: '#6b1a2a',
                fontStyle: 'italic',
                lineHeight: 1.3,
              }}
            >
              Te elegiría a ti.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.6rem' }}>
              <DrawnHeart size={20} color="#6b1a2a" />
            </div>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              Con tus cosas buenas, tus manías, tus tonterías, tus momentos de ponerte rojo, tus besitos, nuestros piques y todo lo que todavía nos queda por descubrir del otro.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              Gracias por estos meses. Por cuidarme como lo haces, por hacerme sentir tan querida y por construir conmigo algo que me hace tan feliz.
            </p>
          </RevealPara>

          <RevealPara>
            <p className="letter-body-p">
              Y gracias especialmente por aquella primera cita. Porque sin saberlo, entre sushi y dos personas intentando actuar con normalidad, empezó una de mis partes favoritas de mi vida.
            </p>
          </RevealPara>

          {/* ── CLOSING — spaced out lines ─────────────────────────────────── */}
          <RevealPara style={{ paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p
              style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: 'clamp(1rem, 3vw, 1.15rem)',
                color: '#4a0f1c',
              }}
            >
              Te quiero muchísimo, Maridito. ❤️
            </p>
            <p
              style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: '0.95rem',
                color: '#6b4a52',
                fontStyle: 'italic',
              }}
            >
              Aunque quererse esté sobrevalorado.
            </p>
            <p
              style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: '0.95rem',
                color: '#6b4a52',
                fontStyle: 'italic',
              }}
            >
              Y aunque me caigas mal.
            </p>
            <p
              style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: '1rem',
                color: '#4a0f1c',
                fontWeight: 600,
              }}
            >
              Feliz Día del Novio.
            </p>
          </RevealPara>

          {/* ── SIGNATURE ─────────────────────────────────────────────────── */}
          <RevealPara style={{ paddingTop: '1rem', paddingBottom: '0.5rem' }}>
            <p
              style={{
                fontFamily: 'Dancing Script, cursive',
                fontSize: 'clamp(1.4rem, 5vw, 1.8rem)',
                color: '#6b1a2a',
                lineHeight: 1.3,
              }}
            >
              Tu Ponjita ❤️
            </p>

            {/* Drawn heart after signature */}
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, opacity: 0.45 }}>
              <DrawnHeart size={16} color="#6b1a2a" />
              <DrawnHeart size={11} color="#c9788a" />
              <DrawnHeart size={16} color="#6b1a2a" />
            </div>

            {/* Hidden olive easter egg */}
            <div style={{ marginTop: '0.5rem', display: 'inline-block', opacity: 0.18 }} title="🫒">
              <DrawnOlive />
            </div>
          </RevealPara>

          {/* ── EPILOGUE ──────────────────────────────────────────────────── */}
          <RevealPara style={{ paddingTop: '3rem' }}>
            <div
              style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {/* Stamp-style seal */}
              <div
                style={{
                  display: 'inline-block',
                  border: '2px solid #6b1a2a',
                  padding: '6px 16px',
                  transform: 'rotate(-1.5deg)',
                  opacity: 0.6,
                }}
              >
                <p
                  style={{
                    fontFamily: 'Dancing Script, cursive',
                    fontSize: '0.9rem',
                    color: '#6b1a2a',
                    letterSpacing: '0.08em',
                  }}
                >
                  OPERACIÓN COMPLETADA ❤️
                </p>
              </div>
              <p
                style={{
                  fontFamily: 'Dancing Script, cursive',
                  fontSize: '0.8rem',
                  color: '#8b5a65',
                  opacity: 0.5,
                  marginTop: 4,
                }}
              >
                Maridito ha conseguido su sorpresa.
              </p>
            </div>
          </RevealPara>

          {/* ── BACK BUTTON ───────────────────────────────────────────────── */}
          <RevealPara style={{ paddingTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={onBack}
              className="border border-[#c9b89a] bg-[#faf7f2] text-[#4a0f1c] hover:border-[#6b1a2a] hover:bg-[#f5f0e8] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1a2a]"
              style={{
                fontFamily: 'Lato, system-ui',
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                padding: '10px 24px',
              }}
            >
              VOLVER A NUESTROS RECUERDOS
            </button>
          </RevealPara>

          {/* ── EASTER EGG ────────────────────────────────────────────────── */}
          <RevealPara style={{ paddingTop: '3rem', paddingBottom: '1rem' }}>
            <div
              style={{
                borderTop: '1px solid rgba(107,26,42,0.1)',
                paddingTop: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              <p
                style={{
                  fontFamily: 'Lato, system-ui',
                  fontSize: '0.65rem',
                  color: '#8b5a65',
                  opacity: 0.45,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '0.4rem',
                }}
              >
                Estado actual de la relación:
              </p>
              {[
                ['❤️', 'Nos queremos.'],
                ['✓', 'Aún no nos hemos matado.'],
                ['🫒', 'Ponjita sigue queriendo aceitunas.'],
                ['⚠️', 'Nivel de asco: preocupantemente alto.'],
              ].map(([icon, text]) => (
                <p
                  key={text}
                  style={{
                    fontFamily: 'Lato, system-ui',
                    fontSize: '0.7rem',
                    color: '#6b4a52',
                    opacity: 0.4,
                  }}
                >
                  {icon} {text}
                </p>
              ))}
            </div>
          </RevealPara>

        </div>
        {/* End letter body */}
      </div>

      {/* Global CSS for letter body text */}
      <style>{`
        .letter-body-p {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(0.92rem, 2.8vw, 1.05rem);
          color: #3a0d18;
          line-height: 1.85;
        }
        @media (min-width: 640px) {
          .margin-note-sm {
            display: inline !important;
          }
        }
      `}</style>
    </div>
  );
}
