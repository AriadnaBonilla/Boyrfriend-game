import { ReactNode } from 'react';

interface ScrapbookButtonProps {
  onClick?: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export default function ScrapbookButton({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
}: ScrapbookButtonProps) {
  const base =
    'relative inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 active:scale-95 select-none cursor-pointer border-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variants = {
    primary: `
      bg-[#6b1a2a] text-[#f5f0e8] border-[#4a0f1c]
      hover:bg-[#4a0f1c] hover:shadow-[3px_3px_0_#4a0f1c]
      hover:-translate-x-0.5 hover:-translate-y-0.5
      shadow-[2px_2px_0_#4a0f1c]
      font-[Lato,system-ui]
    `,
    secondary: `
      bg-[#f5f0e8] text-[#6b1a2a] border-[#6b1a2a]
      hover:bg-[#ede5d4] hover:shadow-[3px_3px_0_#6b1a2a]
      hover:-translate-x-0.5 hover:-translate-y-0.5
      shadow-[2px_2px_0_#6b1a2a]
      font-[Lato,system-ui]
    `,
    ghost: `
      bg-transparent text-[#6b1a2a] border-transparent
      hover:border-[#6b1a2a] hover:bg-[#f5f0e8]
      font-[Lato,system-ui]
    `,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      style={{ fontFamily: 'Lato, system-ui' }}
    >
      {children}
    </button>
  );
}
