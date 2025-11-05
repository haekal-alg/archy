import React from 'react';

// Router Icon
export const RouterIcon: React.FC<{ color?: string }> = ({ color = '#1976d2' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" fill={color} opacity="0.1" />
    <rect x="12" y="18" width="24" height="16" rx="2" fill={color} />
    <rect x="14" y="20" width="6" height="4" rx="1" fill="white" />
    <rect x="22" y="20" width="6" height="4" rx="1" fill="white" />
    <circle cx="16" cy="28" r="1.5" fill="white" />
    <circle cx="20" cy="28" r="1.5" fill="white" />
    <circle cx="24" cy="28" r="1.5" fill="white" />
    <circle cx="28" cy="28" r="1.5" fill="white" />
    <circle cx="32" cy="28" r="1.5" fill="white" />
    <path d="M24 10 L24 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M20 12 L28 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Server Icon
export const ServerIcon: React.FC<{ color?: string }> = ({ color = '#2e7d32' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="28" height="8" rx="2" fill={color} />
    <rect x="10" y="20" width="28" height="8" rx="2" fill={color} />
    <rect x="10" y="30" width="28" height="8" rx="2" fill={color} />
    <circle cx="14" cy="14" r="1.5" fill="white" />
    <circle cx="18" cy="14" r="1.5" fill="white" />
    <rect x="22" y="12" width="12" height="4" rx="1" fill="white" opacity="0.5" />
    <circle cx="14" cy="24" r="1.5" fill="white" />
    <circle cx="18" cy="24" r="1.5" fill="white" />
    <rect x="22" y="22" width="12" height="4" rx="1" fill="white" opacity="0.5" />
    <circle cx="14" cy="34" r="1.5" fill="white" />
    <circle cx="18" cy="34" r="1.5" fill="white" />
    <rect x="22" y="32" width="12" height="4" rx="1" fill="white" opacity="0.5" />
  </svg>
);

// Firewall Icon
export const FirewallIcon: React.FC<{ color?: string }> = ({ color = '#d32f2f' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 8 L38 14 L38 26 C38 32 34 38 24 40 C14 38 10 32 10 26 L10 14 L24 8Z" fill={color} />
    <path d="M24 12 L34 16 L34 26 C34 30 32 34 24 36 C16 34 14 30 14 26 L14 16 L24 12Z" fill="white" opacity="0.2" />
    <path d="M20 22 L22 24 L28 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 28 L29 28" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M21 31 L27 31" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Desktop Icon
export const DesktopIcon: React.FC<{ color?: string }> = ({ color = '#0078d4' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="10" width="32" height="22" rx="2" fill={color} />
    <rect x="10" y="12" width="28" height="18" rx="1" fill="white" opacity="0.9" />
    <rect x="18" y="32" width="12" height="2" fill={color} />
    <rect x="14" y="34" width="20" height="3" rx="1" fill={color} />
    <circle cx="24" cy="29" r="1" fill={color} />
  </svg>
);

// Linux Server Icon
export const LinuxIcon: React.FC<{ color?: string }> = ({ color = '#f7a41d' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="18" r="6" fill={color} />
    <path d="M24 24 L24 32" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M24 32 L18 38" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M24 32 L30 38" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M18 26 L14 30" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M30 26 L34 30" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <circle cx="22" cy="17" r="1.5" fill="white" />
    <circle cx="26" cy="17" r="1.5" fill="white" />
    <path d="M22 20 Q24 21 26 20" stroke="white" strokeWidth="1" fill="none" />
  </svg>
);

// Switch Icon
export const SwitchIcon: React.FC<{ color?: string }> = ({ color = '#455a64' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="16" width="32" height="16" rx="2" fill={color} />
    <circle cx="12" cy="24" r="2" fill="#4caf50" />
    <circle cx="18" cy="20" r="1.5" fill="white" opacity="0.5" />
    <circle cx="22" cy="20" r="1.5" fill="white" opacity="0.5" />
    <circle cx="26" cy="20" r="1.5" fill="white" opacity="0.5" />
    <circle cx="30" cy="20" r="1.5" fill="white" opacity="0.5" />
    <circle cx="34" cy="20" r="1.5" fill="white" opacity="0.5" />
    <rect x="18" y="26" width="3" height="4" rx="0.5" fill="white" opacity="0.3" />
    <rect x="22" y="26" width="3" height="4" rx="0.5" fill="white" opacity="0.3" />
    <rect x="26" y="26" width="3" height="4" rx="0.5" fill="white" opacity="0.3" />
    <rect x="30" y="26" width="3" height="4" rx="0.5" fill="white" opacity="0.3" />
  </svg>
);

// Cloud Icon
export const CloudIcon: React.FC<{ color?: string }> = ({ color = '#4285f4' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M36 28 C39.3 28 42 25.3 42 22 C42 18.7 39.3 16 36 16 C35.7 16 35.4 16 35.1 16.1 C34.1 11.7 30.1 8.5 25.5 8.5 C20.3 8.5 16 12.8 16 18 C16 18.3 16 18.6 16 18.9 C12.7 19.7 10 22.6 10 26 C10 29.9 13.1 33 17 33 L36 33 C39.3 33 42 30.3 42 27 C42 25.5 41.3 24.2 40.3 23.3" fill={color} />
    <ellipse cx="25" cy="26" rx="12" ry="10" fill="white" opacity="0.3" />
  </svg>
);

// Database Icon
export const DatabaseIcon: React.FC<{ color?: string }> = ({ color = '#7b1fa2' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="14" rx="12" ry="5" fill={color} />
    <path d="M12 14 L12 22 C12 24.8 17.4 27 24 27 C30.6 27 36 24.8 36 22 L36 14" fill={color} />
    <path d="M12 22 L12 30 C12 32.8 17.4 35 24 35 C30.6 35 36 32.8 36 30 L36 22" fill={color} />
    <ellipse cx="24" cy="22" rx="12" ry="5" fill="white" opacity="0.2" />
    <ellipse cx="24" cy="30" rx="12" ry="5" fill="white" opacity="0.2" />
  </svg>
);

// Generic Device Icon
export const GenericIcon: React.FC<{ color?: string }> = ({ color = '#666666' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="14" width="24" height="20" rx="2" fill={color} />
    <rect x="14" y="16" width="20" height="12" rx="1" fill="white" opacity="0.3" />
    <circle cx="24" cy="31" r="1.5" fill="white" />
    <line x1="16" y1="20" x2="32" y2="20" stroke="white" strokeWidth="1" opacity="0.5" />
    <line x1="16" y1="23" x2="28" y2="23" stroke="white" strokeWidth="1" opacity="0.5" />
  </svg>
);

// Laptop Icon
export const LaptopIcon: React.FC<{ color?: string }> = ({ color = '#546e7a' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="12" width="28" height="20" rx="2" fill={color} />
    <rect x="12" y="14" width="24" height="16" rx="1" fill="white" opacity="0.9" />
    <path d="M6 32 L42 32 L40 36 L8 36 Z" fill={color} />
    <rect x="22" y="33" width="4" height="2" rx="1" fill="white" opacity="0.3" />
  </svg>
);

// Attack Icon (for attacker nodes)
export const AttackIcon: React.FC<{ color?: string }> = ({ color = '#e91e63' }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 8 L38 14 L38 26 C38 32 34 38 24 40 C14 38 10 32 10 26 L10 14 L24 8Z" fill={color} />
    <path d="M20 20 L28 28 M28 20 L20 28" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <circle cx="24" cy="24" r="14" fill="none" stroke={color} strokeWidth="2" opacity="0.3" />
  </svg>
);
