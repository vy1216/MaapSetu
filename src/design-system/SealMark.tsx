import React from 'react';

export interface SealMarkProps {
  className?: string;
  size?: number;
  color?: string;
  isCalibrating?: boolean;
}

/**
 * Custom line-art circular seal mark: compass/gauge needle inside calibrated concentric rings.
 * Represents precision measurement and official statutory stamping.
 */
export const SealMark: React.FC<SealMarkProps> = ({
  className = '',
  size = 24,
  color = '#A6772E',
  isCalibrating = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${isCalibrating ? 'animate-spin duration-3000' : ''} ${className}`}
    >
      {/* Outer Calibrated Ring */}
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.25" strokeDasharray="1.5 2.5" />
      {/* Inner Precision Ring */}
      <circle cx="12" cy="12" r="7.5" stroke={color} strokeWidth="0.75" />
      {/* Vernier Center Axis */}
      <circle cx="12" cy="12" r="1.5" fill={color} />
      {/* Calibration Gauge Needle */}
      <line x1="12" y1="4.5" x2="12" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="12" x2="16.5" y2="16.5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
};
