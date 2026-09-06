import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'navy' | 'steel' | 'subtle';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    neutral: 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]',
    navy: 'bg-[#0F2A4A]/10 text-[#0F2A4A] border-[#0F2A4A]/20',
    steel: 'bg-[#4B7BAE]/15 text-[#1E4470] border-[#4B7BAE]/30',
    subtle: 'bg-white text-[#5B6472] border-[#DCE3ED]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded border whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
