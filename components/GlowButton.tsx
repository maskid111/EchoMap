import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlowButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  as?: 'button' | 'span';
}

export function GlowButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className,
  type = 'button',
  as = 'button',
}: GlowButtonProps) {
  const variantClasses = {
    primary: 'bg-cyan-500 hover:bg-cyan-400 text-black glow-cyan',
    secondary: 'bg-purple-500 hover:bg-purple-600 text-white glow-purple',
    accent: 'bg-pink-500 hover:bg-pink-600 text-white glow-pink',
    ghost: 'bg-transparent border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const buttonClasses = cn(
    'font-semibold rounded-lg transition-all duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (as === 'span') {
    return (
      <span className={buttonClasses}>
        {children}
      </span>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {children}
    </button>
  );
}
