import { useState } from 'react';
import ScrapbookButton from '../components/ScrapbookButton';
import DecorativeHearts from '../components/DecorativeHearts';

interface CoverProps {
  onStart: () => void;
}

export default function Cover({ onStart }: CoverProps) {
  const [envelopeHovered, setEnvelopeHovered] = useState(false);

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center px-5 py-12 paper-texture overflow-hidden">
      <DecorativeHearts />

      {/* Background paper lines */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #6b1a2a 27px, #6b1a2a 28px)',
          backgroundPositionY: '20px',
        }}
        aria-hidden
      />

      {/* Corner doodles */}
      <div
        className="absolute top-4 left-4 text-[#c9788a] opacity-20 text-4xl select-none animate-sway"
        aria-hidden
        style={{ fontFamily: 'Dancing Script, cursive' }}
      >
        ❀
      </div>
      <div
        className="absolute top-4 right-4 text-[#c9788a] opacity-20 text-3xl select-none animate-sway-r"
        aria-hidden
      >
        ✦
      </div>
      <div
        className="absolute bottom-8 left-6 text-[#6b1a2a] opacity-15 text-5xl select-none animate-sway"
        aria-hidden
      >
        ♡
      </div>
      <div
        className="absolute bottom-10 right-8 text-[#c9788a] opacity-15 text-2xl select-none animate-sway-r"
        aria-hidden
        style={{ fontFamily: 'Dancing Script, cursive' }}
      >
        ❀
      </div>

      {/* Main content card */}
      <div className="relative z-10 max-w-md w-full flex flex-col items-center gap-8 screen-enter">

        {/* Envelope + title cluster */}
        <div className="flex flex-col items-center gap-6 w-full">

          {/* Envelope SVG */}
          <div
            className="relative cursor-pointer select-none"
            onMouseEnter={() => setEnvelopeHovered(true)}
            onMouseLeave={() => setEnvelopeHovered(false)}
            onClick={onStart}
            aria-label="Sobre de Ponjita — pulsa para empezar"
            role="button"
          >
            <svg
              width="140"
              height="100"
              viewBox="0 0 140 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg transition-transform duration-500"
              style={{ transform: envelopeHovered ? 'scale(1.06)' : 'scale(1)' }}
            >
              {/* Envelope body */}
              <rect x="2" y="20" width="136" height="78" rx="3" fill="#faf7f2" stroke="#c9b89a" strokeWidth="1.5" />
              {/* Envelope back flap (opened on hover) */}
              <path
                d={envelopeHovered
                  ? 'M2 20 L70 42 L138 20 L70 5 Z'
                  : 'M2 20 L70 62 L138 20 Z'}
                fill={envelopeHovered ? '#e8dfd0' : '#ede5d4'}
                stroke="#c9b89a"
                strokeWidth="1.5"
                style={{ transition: 'all 0.4s ease' }}
              />
              {/* Left fold */}
              <line x1="2" y1="20" x2="2" y2="98" stroke="#c9b89a" strokeWidth="0.5" opacity="0.5" />
              <line x1="2" y1="98" x2="70" y2="62" stroke="#c9b89a" strokeWidth="0.5" opacity="0.5" />
              {/* Right fold */}
              <line x1="138" y1="20" x2="138" y2="98" stroke="#c9b89a" strokeWidth="0.5" opacity="0.5" />
              <line x1="138" y1="98" x2="70" y2="62" stroke="#c9b89a" strokeWidth="0.5" opacity="0.5" />
              {/* Heart seal */}
              <text
                x="70"
                y={envelopeHovered ? '72' : '66'}
                textAnchor="middle"
                fontSize="18"
                fill="#6b1a2a"
                style={{ transition: 'all 0.4s ease', fontFamily: 'Lato, system-ui' }}
              >
                ♥
              </text>
              {/* Para: label when hovered */}
              {envelopeHovered && (
                <text
                  x="70"
                  y="88"
                  textAnchor="middle"
                  fontSize="9"
                  fill="#7a6a55"
                  fontFamily="Dancing Script, cursive"
                  opacity="0.7"
                >
                  Para: Maridito ❤️
                </text>
              )}
            </svg>

            {envelopeHovered && (
              <p
                className="text-center text-xs text-[#8b2438] mt-1 opacity-70"
                style={{ fontFamily: 'Dancing Script, cursive' }}
              >
                (pulsa para abrir)
              </p>
            )}
          </div>

          {/* Title */}
          <div className="text-center">
            <div
              className="text-sm tracking-widest uppercase text-[#8b2438] opacity-60 mb-2"
              style={{ fontFamily: 'Lato, system-ui', letterSpacing: '0.2em' }}
            >
              Día del Novio
            </div>
            <h1
              className="text-4xl sm:text-5xl font-bold text-[#4a0f1c] leading-tight"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Hola,<br />
              <em className="italic text-[#6b1a2a]">Maridito</em>
              <span className="not-italic"> ❤️</span>
            </h1>
          </div>
        </div>

        {/* Scrapbook note card */}
        <div
          className="relative bg-[#faf7f2] border border-[#c9b89a] p-6 sm:p-8 w-full shadow-[3px_3px_0_#c9b89a] animate-sway"
          style={{ transform: 'rotate(-0.5deg)' }}
        >
          <div className="tape">De Ponjita para Maridito ♡</div>

          <div className="mt-3 text-center flex flex-col gap-4">
            <p
              className="text-[#4a0f1c] text-lg sm:text-xl leading-relaxed"
              style={{ fontFamily: 'Dancing Script, cursive' }}
            >
              Tu Ponjita ha preparado una cosita para ti.
            </p>

            <div
              className="border-t border-dashed border-[#c9b89a] pt-4"
            >
              <p
                className="text-[#4a0f1c] leading-relaxed"
                style={{ fontFamily: 'Lato, system-ui', fontSize: '0.95rem' }}
              >
                Pero no te creas que va a ser tan fácil...
              </p>
              <p
                className="text-[#6b1a2a] font-bold mt-1"
                style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.05rem' }}
              >
                Vas a tener que ganártela.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 animate-fade-in-up delay-4">
          <ScrapbookButton onClick={onStart} size="lg">
            EMPEZAR →
          </ScrapbookButton>

          <p
            className="text-xs text-[#8b2438] opacity-50 text-center mt-1"
            style={{ fontFamily: 'Lato, system-ui' }}
          >
            Ningún maridito ha sufrido daños durante la creación de esta web.
          </p>
          <p
            className="text-xs text-[#8b2438] opacity-35 text-center -mt-2"
            style={{ fontFamily: 'Dancing Script, cursive' }}
          >
            De momento.
          </p>
        </div>
      </div>
    </div>
  );
}
