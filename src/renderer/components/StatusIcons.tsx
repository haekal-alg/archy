import React from 'react';

interface IconProps {
  color?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const PlugIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 14, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <path d="M6 1V5M10 1V5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <rect x="4" y="5" width="8" height="4" rx="1" stroke={color} strokeWidth="1.3" />
    <path d="M8 9V12" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <path d="M5 12H11" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const LatencyDot: React.FC<IconProps> = ({ color = 'currentColor', size = 10, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" className={className} style={{ flexShrink: 0, ...style }}>
    <circle cx="5" cy="5" r="4" fill={color} />
  </svg>
);

export const LightningIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 14, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <path d="M9 1L3 9H8L7 15L13 7H8L9 1Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 14, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <path d="M3 7L6 10L11 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WarningIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 14, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <path d="M7 1.5L1 12.5H13L7 1.5Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M7 6V8.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="7" cy="10.5" r="0.6" fill={color} />
  </svg>
);

export const CrossIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 14, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 14, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1.2" />
    <path d="M7 6.5V10" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="7" cy="4.5" r="0.6" fill={color} />
  </svg>
);

export const KeyboardIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 14, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <rect x="1" y="3" width="14" height="10" rx="1.5" stroke={color} strokeWidth="1.2" />
    <path d="M4 6H5M7 6H8M10 6H11M4 9H5M7 9H8M10 9H11" stroke={color} strokeWidth="1" strokeLinecap="round" />
    <path d="M5 12H11" stroke={color} strokeWidth="1" strokeLinecap="round" />
  </svg>
);

export const SaveIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 14, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <path d="M11 13H3C2.44772 13 2 12.5523 2 12V2C2 1.44772 2.44772 1 3 1H9L12 4V12C12 12.5523 11.5523 13 11 13Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    <rect x="5" y="8" width="4" height="3" rx="0.5" stroke={color} strokeWidth="1" />
    <path d="M5 1V4H9" stroke={color} strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

export const PencilIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 14, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <path d="M2 12L2.5 9.5L9.5 2.5C10.0523 1.94772 10.9477 1.94772 11.5 2.5C12.0523 3.05228 12.0523 3.94772 11.5 4.5L4.5 11.5L2 12Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M8.5 3.5L10.5 5.5" stroke={color} strokeWidth="1.2" />
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 14, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <path d="M9 3L5 7L9 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 14, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <path d="M5 3L9 7L5 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ExportIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 14, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <path d="M7 1V9M7 9L4 6M7 9L10 6" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 10V12C2 12.5523 2.44772 13 3 13H11C11.5523 13 12 12.5523 12 12V10" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const SortAscIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 10, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <path d="M5 2L8 7H2L5 2Z" fill={color} />
  </svg>
);

export const SortDescIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 10, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <path d="M5 8L2 3H8L5 8Z" fill={color} />
  </svg>
);

export const AppleIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 16, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <path d="M8 3C8 1.5 9.5 0.5 10.5 1C9.5 1.5 9 2.5 9 3.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
    <path d="M5.5 4C3.5 4 2 6 2 8.5C2 11.5 4 14.5 5.5 14.5C6.5 14.5 7 14 8 14C9 14 9.5 14.5 10.5 14.5C12 14.5 14 11.5 14 8.5C14 6 12.5 4 10.5 4C9.5 4 9 4.5 8 4.5C7 4.5 6.5 4 5.5 4Z" stroke={color} strokeWidth="1.2" />
  </svg>
);

export const TerminalIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 14, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} style={{ flexShrink: 0, ...style }}>
    <rect x="1" y="2" width="12" height="10" rx="1.5" stroke={color} strokeWidth="1.2" fill="none" />
    <path d="M3.5 5L5.5 7L3.5 9" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 9H10" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
