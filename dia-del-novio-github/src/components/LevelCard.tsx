import ScrapbookButton from './ScrapbookButton';

export type LevelStatus = 'available' | 'locked' | 'completed';

interface LevelCardProps {
  number: string;
  emoji: string;
  title: string;
  description: string;
  status: LevelStatus;
  rotate?: number;
  onPlay?: () => void;
}

export default function LevelCard({
  number,
  emoji,
  title,
  description,
  status,
  rotate = 0,
  onPlay,
}: LevelCardProps) {
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';

  return (
    <div
      className={`relative bg-[#faf7f2] border-2 p-5 sm:p-6 transition-all duration-300 ${
        isCompleted
          ? 'border-[#6b1a2a]'
          : isLocked
          ? 'border-[#c9b89a] opacity-60'
          : 'border-[#c9b89a] hover:border-[#8b2438] hover:shadow-[4px_4px_0_#c9b89a] hover:-translate-x-0.5 hover:-translate-y-0.5'
      }`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {/* Tape decoration */}
      <div className="tape">{number}</div>

      {/* Completed stamp */}
      {isCompleted && (
        <div
          className="absolute top-3 right-3 stamp animate-stamp-in"
          style={{ fontFamily: 'Dancing Script, cursive' }}
        >
          ✓ Completado
        </div>
      )}

      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute top-3 right-3 text-2xl opacity-40">🔒</div>
      )}

      {/* Content */}
      <div className="mt-4">
        <div className="text-3xl mb-3">{isLocked ? '🔒' : emoji}</div>

        <h3
          className="text-lg sm:text-xl font-bold text-[#4a0f1c] mb-2 leading-tight"
          style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
        >
          {title}
        </h3>

        <p
          className="text-sm text-[#6b4a52] leading-relaxed mb-4"
          style={{ fontFamily: 'Lato, system-ui' }}
        >
          {description}
        </p>

        {isCompleted ? (
          <div className="flex items-center gap-2">
            <span className="text-xl text-[#6b1a2a]">♥</span>
            <span
              className="text-sm text-[#6b1a2a] font-bold"
              style={{ fontFamily: 'Lato, system-ui' }}
            >
              +1 corazón conseguido
            </span>
          </div>
        ) : (
          <ScrapbookButton
            onClick={onPlay}
            variant={isLocked ? 'secondary' : 'primary'}
            size="sm"
            disabled={isLocked}
          >
            {isLocked ? 'Bloqueado' : 'Jugar →'}
          </ScrapbookButton>
        )}
      </div>
    </div>
  );
}
