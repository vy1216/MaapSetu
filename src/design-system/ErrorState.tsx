import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "We couldn't load your data right now.",
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`p-6 rounded-lg bg-[#FEF2F2]/60 border border-[#FECACA] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#FEE2E2] text-[#DC2626] rounded-full shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#991B1B]">{message}</p>
          <p className="text-xs text-[#B91C1C]">
            Please check your connection or try again.
          </p>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          className="border-[#DC2626]/40 text-[#991B1B] hover:bg-[#FEF2F2]"
        >
          Retry
        </Button>
      )}
    </div>
  );
};
