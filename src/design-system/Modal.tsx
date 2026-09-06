import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm?: () => void;
  isConfirmLoading?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  isConfirmLoading = false,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A4A]/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg border border-[#DCE3ED] shadow-xl w-full ${maxWidthClasses[maxWidth]} overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCE3ED] bg-[#FAFBFD]">
          <div>
            <h3 className="text-base font-semibold text-[#1A1F29]">{title}</h3>
            {description && (
              <p className="text-xs text-[#5B6472] mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8A93A3] hover:text-[#1A1F29] hover:bg-[#DCE3ED]/40 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children && <div className="p-6 text-sm text-[#1A1F29]">{children}</div>}

        {(onConfirm || confirmLabel) && (
          <div className="px-6 py-3.5 border-t border-[#DCE3ED] bg-[#FAFBFD] flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            {onConfirm && (
              <Button
                variant={confirmVariant}
                size="sm"
                onClick={onConfirm}
                loading={isConfirmLoading}
              >
                {confirmLabel || 'Confirm'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
