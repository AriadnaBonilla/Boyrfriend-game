interface HeartCounterProps {
  completed: number;
  total?: number;
  unlocking?: boolean;
}

export default function HeartCounter({ completed, total = 5, unlocking = false }: HeartCounterProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p
        className="text-xs tracking-widest uppercase text-[#8b2438] opacity-70"
        style={{ fontFamily: 'Lato, system-ui', letterSpacing: '0.15em' }}
      >
        Progreso de Maridito
      </p>
      <div className="flex gap-3 items-center">
        {Array.from({ length: total }).map((_, i) => {
          const done = i < completed;
          return (
            <span
              key={i}
              className={`text-3xl sm:text-4xl transition-all duration-500 ${
                done
                  ? unlocking
                    ? 'animate-heart-unlock-pulse'
                    : 'animate-heart-beat'
                  : 'opacity-30'
              }`}
              style={{
                animationDelay: unlocking ? `${i * 0.18}s` : `${i * 0.15}s`,
                filter: done ? 'drop-shadow(0 0 4px rgba(107,26,42,0.4))' : 'none',
              }}
            >
              {done ? '♥' : '♡'}
            </span>
          );
        })}
      </div>
      <p
        className="text-xs text-[#8b2438] opacity-50 mt-1"
        style={{ fontFamily: 'Dancing Script, cursive' }}
      >
        {completed === 0
          ? 'Ningún corazón todavía... mejor empieza ya'
          : completed === total
          ? '¡Lo conseguiste, Maridito! 🎉'
          : `${completed} de ${total} corazones`}
      </p>
    </div>
  );
}
