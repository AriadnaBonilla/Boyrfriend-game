interface PhotoPlaceholderProps {
  label: string;
  width?: string;
  height?: string;
  rotate?: number;
  caption?: string;
  className?: string;
  polaroid?: boolean;
}

export default function PhotoPlaceholder({
  label,
  width = 'w-full',
  height = 'h-40',
  rotate = 0,
  caption,
  className = '',
  polaroid = false,
}: PhotoPlaceholderProps) {
  const inner = (
    <div
      className={`${width} ${height} bg-[#e8dfd0] border border-[#c9b89a] flex flex-col items-center justify-center gap-2 relative overflow-hidden`}
    >
      {/* Film grain texture simulation */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(74,15,28,0.05) 2px, rgba(74,15,28,0.05) 4px)',
        }}
      />
      <div className="text-[#7a6a55] opacity-60 text-3xl">📷</div>
      <p
        className="text-[#7a6a55] text-xs font-bold tracking-widest uppercase text-center px-2"
        style={{ fontFamily: 'Lato, system-ui' }}
      >
        {label}
      </p>
      <p
        className="text-[#9a8870] text-xs opacity-60"
        style={{ fontFamily: 'Dancing Script, cursive' }}
      >
        Añadir foto
      </p>
    </div>
  );

  if (polaroid) {
    return (
      <div
        className={`polaroid ${className} relative`}
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        {inner}
        {caption && (
          <p
            className="text-center text-sm mt-2 text-[#4a0f1c] opacity-70"
            style={{ fontFamily: 'Dancing Script, cursive' }}
          >
            {caption}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className} style={{ transform: `rotate(${rotate}deg)` }}>
      {inner}
      {caption && (
        <p
          className="text-center text-xs mt-1 text-[#4a0f1c] opacity-60"
          style={{ fontFamily: 'Dancing Script, cursive' }}
        >
          {caption}
        </p>
      )}
    </div>
  );
}
