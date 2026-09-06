import React from 'react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-dashed border-[#DCE3ED] ${className}`}
    >
      <div className="text-[#8A93A3] mb-3 flex items-center justify-center w-12 h-12 rounded-full bg-[#F7F9FC]">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[#1A1F29] mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-[#5B6472] max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
