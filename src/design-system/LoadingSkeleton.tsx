import React from 'react';

export interface LoadingSkeletonProps {
  lines?: number;
  type?: 'table' | 'card' | 'stats';
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lines = 4,
  type = 'table',
  className = '',
}) => {
  if (type === 'stats') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-lg border border-[#DCE3ED] animate-pulse"
          >
            <div className="h-3 w-24 bg-[#E5E7EB] rounded mb-3"></div>
            <div className="h-8 w-16 bg-[#E5E7EB] rounded mb-2"></div>
            <div className="h-2 w-32 bg-[#F3F4F6] rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div
        className={`bg-white p-6 rounded-lg border border-[#DCE3ED] animate-pulse space-y-4 ${className}`}
      >
        <div className="h-4 w-40 bg-[#E5E7EB] rounded"></div>
        <div className="h-3 w-full bg-[#F3F4F6] rounded"></div>
        <div className="h-3 w-4/5 bg-[#F3F4F6] rounded"></div>
        <div className="h-9 w-28 bg-[#E5E7EB] rounded mt-4"></div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border border-[#DCE3ED] overflow-hidden ${className}`}
    >
      <div className="h-11 bg-[#FAFBFD] border-b border-[#DCE3ED] px-6 flex items-center space-x-6">
        <div className="h-3 w-24 bg-[#E5E7EB] rounded"></div>
        <div className="h-3 w-32 bg-[#E5E7EB] rounded"></div>
        <div className="h-3 w-20 bg-[#E5E7EB] rounded"></div>
      </div>
      <div className="divide-y divide-[#DCE3ED]">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className="px-6 py-4 flex items-center justify-between space-x-4 animate-pulse"
          >
            <div className="flex items-center space-x-4 flex-1">
              <div className="h-3.5 w-1/4 bg-[#E5E7EB] rounded"></div>
              <div className="h-3.5 w-1/3 bg-[#F3F4F6] rounded"></div>
              <div className="h-5 w-20 bg-[#F3F4F6] rounded-full"></div>
            </div>
            <div className="h-8 w-16 bg-[#E5E7EB] rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
