interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

export default function BackButton({ onClick, label = '← Volver al menú' }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="text-sm text-[#6b1a2a] opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1 underline underline-offset-2"
      style={{ fontFamily: 'Lato, system-ui' }}
    >
      {label}
    </button>
  );
}
