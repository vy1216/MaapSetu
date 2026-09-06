import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/20 disabled:cursor-not-allowed whitespace-nowrap rounded-lg shadow-xs';

  const variantClasses = {
    primary:
      'bg-[#0F2A4A] text-white hover:bg-[#1A3D63] active:bg-[#0F2A4A] disabled:bg-[#0F2A4A]/40 disabled:text-white/80',
    secondary:
      'bg-white text-[#0F2A4A] border border-[#DCE3ED] hover:bg-[#F7F9FC] active:bg-[#EBF3FC] disabled:border-[#DCE3ED] disabled:text-[#8A93A3]',
    danger:
      'bg-[#DC2626] text-white hover:bg-[#B91C1C] disabled:bg-[#DC2626]/40 disabled:text-white/80',
    ghost:
      'bg-transparent text-[#0F2A4A] hover:bg-blue-50/60 shadow-none disabled:text-[#8A93A3]',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2.5',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
