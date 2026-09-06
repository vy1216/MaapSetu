import React from 'react';
import { AppStatus } from './tokens';

export interface StatusPillProps {
  status: AppStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  customLabel?: string;
}

interface StatusConfig {
  color: string;
  bg: string;
  border: string;
  label: string;
  dotColor: string;
}

const STATUS_CONFIG_MAP: Record<string, StatusConfig> = {
  submitted: {
    color: '#374151',
    bg: '#F3F4F6',
    border: '#D1D5DB',
    label: 'Submitted',
    dotColor: '#6B7280',
  },
  assigned: {
    color: '#1E40AF',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    label: 'Assigned',
    dotColor: '#2563EB',
  },
  in_progress: {
    color: '#92400E',
    bg: '#FFFBEB',
    border: '#FDE68A',
    label: 'In Progress',
    dotColor: '#D97706',
  },
  completed: {
    color: '#166534',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    label: 'Completed',
    dotColor: '#16A34A',
  },
  certified: {
    color: '#166534',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    label: 'Certified',
    dotColor: '#16A34A',
  },
  rejected: {
    color: '#991B1B',
    bg: '#FEF2F2',
    border: '#FECACA',
    label: 'Rejected',
    dotColor: '#DC2626',
  },
  active: {
    color: '#166534',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    label: 'Valid / Active',
    dotColor: '#16A34A',
  },
  valid: {
    color: '#166534',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    label: 'Valid',
    dotColor: '#16A34A',
  },
  expiring_soon: {
    color: '#92400E',
    bg: '#FFFBEB',
    border: '#FDE68A',
    label: 'Expiring Soon',
    dotColor: '#D97706',
  },
  expired: {
    color: '#374151',
    bg: '#F3F4F6',
    border: '#D1D5DB',
    label: 'Expired',
    dotColor: '#6B7280',
  },
  revoked: {
    color: '#991B1B',
    bg: '#FEF2F2',
    border: '#FECACA',
    label: 'Revoked',
    dotColor: '#DC2626',
  },
};

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  size = 'md',
  className = '',
  customLabel,
}) => {
  const normalizedKey = status.toLowerCase().replace('-', '_');
  const config = STATUS_CONFIG_MAP[normalizedKey] || {
    color: '#374151',
    bg: '#F3F4F6',
    border: '#D1D5DB',
    label: status,
    dotColor: '#6B7280',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1.5',
    md: 'px-2 py-1 text-[10px] font-bold uppercase tracking-wider gap-1.5',
    lg: 'px-2.5 py-1 text-xs font-bold uppercase tracking-wider gap-2',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: config.color,
        borderColor: config.border,
      }}
      className={`inline-flex items-center rounded-md border shrink-0 whitespace-nowrap font-bold ${sizeClasses[size]} ${className}`}
    >
      <span
        style={{ backgroundColor: config.dotColor }}
        className={`rounded-full shrink-0 ${dotSizes[size]}`}
        aria-hidden="true"
      />
      <span>{customLabel || config.label}</span>
    </span>
  );
};
