const HEARTS = [
  { top: '8%', left: '5%', size: '1.2rem', delay: '0s', opacity: 0.12 },
  { top: '15%', right: '8%', size: '0.8rem', delay: '0.8s', opacity: 0.1 },
  { top: '40%', left: '3%', size: '1rem', delay: '1.6s', opacity: 0.08 },
  { top: '60%', right: '5%', size: '1.4rem', delay: '0.4s', opacity: 0.12 },
  { top: '75%', left: '8%', size: '0.7rem', delay: '2s', opacity: 0.1 },
  { top: '85%', right: '10%', size: '1rem', delay: '1.2s', opacity: 0.08 },
  { top: '25%', left: '50%', size: '0.6rem', delay: '2.4s', opacity: 0.07 },
];

export default function DecorativeHearts() {
  return (
    <div className="bg-hearts-decor" aria-hidden>
      {HEARTS.map((h, i) => (
        <span
          key={i}
          className="absolute text-[#6b1a2a] animate-float-heart select-none"
          style={{
            top: h.top,
            left: 'left' in h ? (h as any).left : undefined,
            right: 'right' in h ? (h as any).right : undefined,
            fontSize: h.size,
            animationDelay: h.delay,
            opacity: h.opacity,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}
