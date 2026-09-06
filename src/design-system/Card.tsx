import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  header,
  footer,
  noPadding = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-[#DCE3ED] rounded-xl shadow-sm overflow-hidden ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-4 border-b border-[#DCE3ED] bg-white flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-[#DCE3ED] bg-[#F7F9FC] flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};
