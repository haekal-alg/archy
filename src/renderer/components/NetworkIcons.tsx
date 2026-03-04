import React from 'react';
import { getIconByDeviceType } from '../iconStore';

export interface IconProps {
  color?: string;
  size?: number;
}

const ICON_FILTER = 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))';

/**
 * DynamicIcon renders an SVG loaded from disk.
 * Falls back to the built-in icon if no custom SVG is loaded.
 */
export const DynamicIcon: React.FC<{ deviceType: string; fallback: React.ReactElement; size?: number }> = ({ deviceType, fallback, size = 52 }) => {
  const loaded = getIconByDeviceType(deviceType);
  if (!loaded) return fallback;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: ICON_FILTER,
      }}
      dangerouslySetInnerHTML={{ __html: loaded.svg.replace(/width="[^"]*"/, `width="${size}"`).replace(/height="[^"]*"/, `height="${size}"`) }}
    />
  );
};

// Router Icon - 3D router box with antennas, display panels, and LED port indicators
export const RouterIcon: React.FC<IconProps> = ({ color = '#4d7cfe', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" style={{ filter: ICON_FILTER }}>
    {/* Cast shadow */}
    <rect x="10" y="25" width="38" height="19" rx="3" fill="black" opacity="0.18" />
    {/* Main body */}
    <rect x="8" y="22" width="38" height="19" rx="3" fill={color} />
    {/* Top face highlight */}
    <path d="M11 22 H43 Q46 22 46 25 V28 H8 V25 Q8 22 11 22Z" fill="white" opacity="0.18" />
    {/* Right edge depth */}
    <path d="M42 22 H43 Q46 22 46 25 V38 Q46 41 43 41 H42 V22Z" fill="black" opacity="0.12" />
    {/* Bottom edge depth */}
    <rect x="8" y="37" width="38" height="4" rx="0 0 3 3" fill="black" opacity="0.08" />
    {/* Display panel 1 */}
    <rect x="12" y="25" width="10" height="6" rx="1.5" fill="black" opacity="0.35" />
    <rect x="12.5" y="25.5" width="9" height="5" rx="1" fill="white" opacity="0.82" />
    <rect x="13.5" y="27" width="3" height="1" rx="0.5" fill={color} opacity="0.5" />
    <rect x="13.5" y="28.5" width="5" height="1" rx="0.5" fill={color} opacity="0.3" />
    {/* Display panel 2 */}
    <rect x="24" y="25" width="10" height="6" rx="1.5" fill="black" opacity="0.35" />
    <rect x="24.5" y="25.5" width="9" height="5" rx="1" fill="white" opacity="0.82" />
    <rect x="25.5" y="27" width="4" height="1" rx="0.5" fill={color} opacity="0.5" />
    <rect x="25.5" y="28.5" width="6" height="1" rx="0.5" fill={color} opacity="0.3" />
    {/* Ventilation grille */}
    <line x1="37" y1="26" x2="43" y2="26" stroke="white" strokeWidth="0.8" opacity="0.12" />
    <line x1="37" y1="28" x2="43" y2="28" stroke="white" strokeWidth="0.8" opacity="0.12" />
    <line x1="37" y1="30" x2="43" y2="30" stroke="white" strokeWidth="0.8" opacity="0.12" />
    {/* LED indicators row */}
    <circle cx="14" cy="36" r="1.5" fill="#4caf50" />
    <circle cx="14" cy="36" r="0.7" fill="white" opacity="0.5" />
    <circle cx="18" cy="36" r="1.5" fill="#4caf50" opacity="0.75" />
    <circle cx="22" cy="36" r="1.5" fill="#ffab40" opacity="0.7" />
    <circle cx="26" cy="36" r="1.5" fill="white" opacity="0.2" />
    <circle cx="30" cy="36" r="1.5" fill="white" opacity="0.2" />
    <circle cx="34" cy="36" r="1.5" fill="white" opacity="0.2" />
    <circle cx="38" cy="36" r="1.5" fill="white" opacity="0.2" />
    <circle cx="42" cy="36" r="1.5" fill="white" opacity="0.2" />
    {/* Left antenna */}
    <rect x="18.5" y="11" width="3" height="11" rx="1.5" fill={color} />
    <rect x="18.5" y="11" width="3" height="4" rx="1.5" fill="white" opacity="0.15" />
    <circle cx="20" cy="9" r="3.5" fill={color} />
    <circle cx="19" cy="8" r="1.3" fill="white" opacity="0.3" />
    {/* Right antenna */}
    <rect x="32.5" y="13" width="3" height="9" rx="1.5" fill={color} />
    <rect x="32.5" y="13" width="3" height="3" rx="1.5" fill="white" opacity="0.15" />
    <circle cx="34" cy="11" r="3.5" fill={color} />
    <circle cx="33" cy="10" r="1.3" fill="white" opacity="0.3" />
    {/* Signal arcs */}
    <path d="M14.5 8 Q12 5.5 14.5 3" stroke={color} strokeWidth="1.3" fill="none" opacity="0.3" strokeLinecap="round" />
    <path d="M12 9.5 Q9 6 12 2.5" stroke={color} strokeWidth="1" fill="none" opacity="0.2" strokeLinecap="round" />
  </svg>
);

// Server Icon - 3D rack server stack with drive bays, LEDs, and ventilation
export const ServerIcon: React.FC<IconProps> = ({ color = '#3dd68c', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" style={{ filter: ICON_FILTER }}>
    {/* Cast shadow */}
    <rect x="10" y="10" width="38" height="40" rx="3" fill="black" opacity="0.15" />

    {/* === Rack Unit 1 (top) === */}
    <rect x="8" y="8" width="38" height="12" rx="2.5" fill={color} />
    <rect x="8" y="8" width="38" height="4" rx="2.5" fill="white" opacity="0.18" />
    <path d="M42 8 H43.5 Q46 8 46 10.5 V17.5 Q46 20 43.5 20 H42 V8Z" fill="black" opacity="0.12" />
    {/* Power LED */}
    <circle cx="13" cy="14" r="1.8" fill="#4caf50" />
    <circle cx="13" cy="13.5" r="0.7" fill="white" opacity="0.5" />
    {/* Activity LED */}
    <circle cx="17.5" cy="14" r="1.5" fill="#ffab40" opacity="0.7" />
    {/* Drive bay */}
    <rect x="22" y="11" width="14" height="6" rx="1" fill="black" opacity="0.2" />
    <rect x="22.5" y="11.5" width="13" height="5" rx="0.5" fill="white" opacity="0.12" />
    <line x1="26" y1="11.5" x2="26" y2="16.5" stroke="white" strokeWidth="0.5" opacity="0.15" />
    <line x1="30" y1="11.5" x2="30" y2="16.5" stroke="white" strokeWidth="0.5" opacity="0.15" />
    {/* Vent holes */}
    <circle cx="40" cy="12" r="0.8" fill="white" opacity="0.12" />
    <circle cx="43" cy="12" r="0.8" fill="white" opacity="0.12" />
    <circle cx="40" cy="15" r="0.8" fill="white" opacity="0.12" />
    <circle cx="43" cy="15" r="0.8" fill="white" opacity="0.12" />

    {/* === Rack Unit 2 (middle) === */}
    <rect x="8" y="22" width="38" height="12" rx="2.5" fill={color} />
    <rect x="8" y="22" width="38" height="4" rx="2.5" fill="white" opacity="0.12" />
    <path d="M42 22 H43.5 Q46 22 46 24.5 V31.5 Q46 34 43.5 34 H42 V22Z" fill="black" opacity="0.12" />
    <circle cx="13" cy="28" r="1.8" fill="#4caf50" />
    <circle cx="13" cy="27.5" r="0.7" fill="white" opacity="0.5" />
    <circle cx="17.5" cy="28" r="1.5" fill="#4caf50" opacity="0.5" />
    <rect x="22" y="25" width="14" height="6" rx="1" fill="black" opacity="0.2" />
    <rect x="22.5" y="25.5" width="13" height="5" rx="0.5" fill="white" opacity="0.12" />
    <line x1="26" y1="25.5" x2="26" y2="30.5" stroke="white" strokeWidth="0.5" opacity="0.15" />
    <line x1="30" y1="25.5" x2="30" y2="30.5" stroke="white" strokeWidth="0.5" opacity="0.15" />
    <circle cx="40" cy="26" r="0.8" fill="white" opacity="0.12" />
    <circle cx="43" cy="26" r="0.8" fill="white" opacity="0.12" />
    <circle cx="40" cy="29" r="0.8" fill="white" opacity="0.12" />
    <circle cx="43" cy="29" r="0.8" fill="white" opacity="0.12" />

    {/* === Rack Unit 3 (bottom) === */}
    <rect x="8" y="36" width="38" height="12" rx="2.5" fill={color} />
    <rect x="8" y="36" width="38" height="4" rx="2.5" fill="white" opacity="0.08" />
    <path d="M42 36 H43.5 Q46 36 46 38.5 V45.5 Q46 48 43.5 48 H42 V36Z" fill="black" opacity="0.12" />
    <rect x="8" y="44" width="38" height="4" rx="0 0 2.5 2.5" fill="black" opacity="0.08" />
    <circle cx="13" cy="42" r="1.8" fill="#4caf50" opacity="0.6" />
    <circle cx="17.5" cy="42" r="1.5" fill="white" opacity="0.25" />
    <rect x="22" y="39" width="14" height="6" rx="1" fill="black" opacity="0.2" />
    <rect x="22.5" y="39.5" width="13" height="5" rx="0.5" fill="white" opacity="0.12" />
    <line x1="26" y1="39.5" x2="26" y2="44.5" stroke="white" strokeWidth="0.5" opacity="0.15" />
    <line x1="30" y1="39.5" x2="30" y2="44.5" stroke="white" strokeWidth="0.5" opacity="0.15" />
    <circle cx="40" cy="40" r="0.8" fill="white" opacity="0.12" />
    <circle cx="43" cy="40" r="0.8" fill="white" opacity="0.12" />
    <circle cx="40" cy="43" r="0.8" fill="white" opacity="0.12" />
    <circle cx="43" cy="43" r="0.8" fill="white" opacity="0.12" />
  </svg>
);

// Firewall Icon - 3D beveled shield with lock symbol and wall pattern
export const FirewallIcon: React.FC<IconProps> = ({ color = '#ff5c5c', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" style={{ filter: ICON_FILTER }}>
    {/* Cast shadow */}
    <path d="M29 8 L46 16 V30 C46 38 40 44 29 48 C18 44 12 38 12 30 V16 L29 8Z" fill="black" opacity="0.18" />
    {/* Outer shield */}
    <path d="M28 6 L44 14 V28 C44 36 38 42 28 46 C18 42 12 36 12 28 V14 L28 6Z" fill={color} />
    {/* Left highlight bevel */}
    <path d="M28 6 L12 14 V28 C12 30 13 32 14 34 L28 9 Z" fill="white" opacity="0.18" />
    {/* Right shadow bevel */}
    <path d="M28 6 L44 14 V28 C44 36 38 42 28 46 L28 43 C36 40 40 35 40 28 V16 L28 9 Z" fill="black" opacity="0.1" />
    {/* Inner shield */}
    <path d="M28 10 L40 16 V28 C40 34 35 39 28 42 C21 39 16 34 16 28 V16 L28 10Z" fill="white" opacity="0.08" />
    {/* Brick wall pattern */}
    <rect x="18" y="17" width="9" height="4" rx="0.8" fill="white" opacity="0.12" />
    <rect x="29" y="17" width="9" height="4" rx="0.8" fill="white" opacity="0.12" />
    <rect x="15" y="23" width="8" height="4" rx="0.8" fill="white" opacity="0.1" />
    <rect x="25" y="23" width="8" height="4" rx="0.8" fill="white" opacity="0.1" />
    <rect x="35" y="23" width="5" height="4" rx="0.8" fill="white" opacity="0.1" />
    <rect x="18" y="29" width="9" height="4" rx="0.8" fill="white" opacity="0.08" />
    <rect x="29" y="29" width="7" height="4" rx="0.8" fill="white" opacity="0.08" />
    {/* Lock body */}
    <rect x="24" y="26" width="8" height="7" rx="1.5" fill="white" opacity="0.85" />
    <rect x="24.5" y="26.5" width="7" height="6" rx="1" fill={color} opacity="0.25" />
    {/* Lock shackle */}
    <path d="M26 26 V23 Q26 20 28 20 Q30 20 30 23 V26" stroke="white" strokeWidth="2" fill="none" opacity="0.85" strokeLinecap="round" />
    {/* Keyhole */}
    <circle cx="28" cy="29.5" r="1.5" fill={color} opacity="0.6" />
    <rect x="27.3" y="30.5" width="1.4" height="2" rx="0.5" fill={color} opacity="0.6" />
  </svg>
);

// Desktop Icon - 3D monitor with screen glow, stand, and base
export const DesktopIcon: React.FC<IconProps> = ({ color = '#00d4ff', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" style={{ filter: ICON_FILTER }}>
    {/* Monitor cast shadow */}
    <rect x="10" y="10" width="38" height="26" rx="3" fill="black" opacity="0.15" />
    {/* Monitor body */}
    <rect x="8" y="8" width="38" height="26" rx="3" fill={color} />
    {/* Top highlight */}
    <path d="M11 8 H43 Q46 8 46 11 V14 H8 V11 Q8 8 11 8Z" fill="white" opacity="0.2" />
    {/* Right edge depth */}
    <path d="M42 8 H43 Q46 8 46 11 V31 Q46 34 43 34 H42 V8Z" fill="black" opacity="0.12" />
    {/* Screen bezel */}
    <rect x="11" y="11" width="32" height="20" rx="1.5" fill="black" opacity="0.4" />
    {/* Screen */}
    <rect x="11.5" y="11.5" width="31" height="19" rx="1" fill="#0a1628" />
    {/* Screen content - window bars */}
    <rect x="13" y="13" width="27" height="3" rx="0.5" fill={color} opacity="0.3" />
    <circle cx="15" cy="14.5" r="0.8" fill="#ff5f56" opacity="0.6" />
    <circle cx="17.5" cy="14.5" r="0.8" fill="#ffbd2e" opacity="0.6" />
    <circle cx="20" cy="14.5" r="0.8" fill="#27c93f" opacity="0.6" />
    {/* Screen text lines */}
    <rect x="13" y="18" width="18" height="1.2" rx="0.5" fill={color} opacity="0.25" />
    <rect x="13" y="20.5" width="24" height="1.2" rx="0.5" fill={color} opacity="0.18" />
    <rect x="13" y="23" width="14" height="1.2" rx="0.5" fill={color} opacity="0.15" />
    <rect x="13" y="25.5" width="20" height="1.2" rx="0.5" fill={color} opacity="0.12" />
    {/* Screen reflection */}
    <path d="M11.5 11.5 L20 11.5 L11.5 20 Z" fill="white" opacity="0.06" />
    {/* Chin with logo */}
    <circle cx="27" cy="32" r="1.2" fill="white" opacity="0.3" />
    {/* Stand neck */}
    <rect x="24" y="34" width="6" height="4" fill={color} />
    <rect x="24" y="34" width="2" height="4" fill="white" opacity="0.1" />
    <rect x="28" y="34" width="2" height="4" fill="black" opacity="0.1" />
    {/* Base */}
    <rect x="16" y="38" width="22" height="4" rx="1.5" fill={color} />
    <rect x="16" y="38" width="22" height="1.5" rx="1.5" fill="white" opacity="0.15" />
    <rect x="16" y="40.5" width="22" height="1.5" rx="0 0 1.5 1.5" fill="black" opacity="0.1" />
    {/* Base highlight dot */}
    <circle cx="27" cy="40" r="0.8" fill="white" opacity="0.2" />
  </svg>
);

// Linux Icon - 3D terminal window with title bar, prompt, and command output
export const LinuxIcon: React.FC<IconProps> = ({ color = '#ffab40', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" style={{ filter: ICON_FILTER }}>
    {/* Cast shadow */}
    <rect x="9" y="9" width="40" height="40" rx="4" fill="black" opacity="0.18" />
    {/* Window frame */}
    <rect x="7" y="7" width="40" height="40" rx="4" fill="#1e2433" />
    {/* Right edge depth */}
    <path d="M43 7 H43 Q47 7 47 11 V43 Q47 47 43 47 H43 V7Z" fill="black" opacity="0.15" />
    {/* Bottom edge depth */}
    <rect x="7" y="43" width="40" height="4" rx="0 0 4 4" fill="black" opacity="0.08" />
    {/* Title bar */}
    <rect x="7" y="7" width="40" height="10" rx="4 4 0 0" fill={color} />
    <rect x="7" y="13" width="40" height="4" fill={color} />
    {/* Title bar highlight */}
    <rect x="7" y="7" width="40" height="4" rx="4 4 0 0" fill="white" opacity="0.2" />
    {/* Traffic light buttons */}
    <circle cx="13" cy="12" r="2.2" fill="#ff5f56" />
    <circle cx="12.5" cy="11.5" r="0.8" fill="white" opacity="0.3" />
    <circle cx="19" cy="12" r="2.2" fill="#ffbd2e" />
    <circle cx="18.5" cy="11.5" r="0.8" fill="white" opacity="0.3" />
    <circle cx="25" cy="12" r="2.2" fill="#27c93f" />
    <circle cx="24.5" cy="11.5" r="0.8" fill="white" opacity="0.3" />
    {/* Title text placeholder */}
    <rect x="31" y="11" width="12" height="2" rx="1" fill="white" opacity="0.2" />
    {/* Terminal screen */}
    <rect x="9" y="17" width="36" height="28" fill="#0d1117" />
    {/* Prompt line 1 */}
    <rect x="12" y="20" width="4" height="2" rx="0.5" fill={color} opacity="0.9" />
    <rect x="18" y="20" width="14" height="2" rx="0.5" fill="#3dd68c" opacity="0.7" />
    {/* Output line 1 */}
    <rect x="12" y="25" width="20" height="1.5" rx="0.5" fill="white" opacity="0.35" />
    {/* Output line 2 */}
    <rect x="12" y="28.5" width="16" height="1.5" rx="0.5" fill="white" opacity="0.25" />
    {/* Output line 3 */}
    <rect x="12" y="32" width="24" height="1.5" rx="0.5" fill="white" opacity="0.2" />
    {/* Prompt line 2 */}
    <rect x="12" y="36.5" width="4" height="2" rx="0.5" fill={color} opacity="0.9" />
    {/* Cursor block */}
    <rect x="18" y="36.5" width="3" height="2" rx="0.5" fill={color} opacity="0.6" />
    {/* Screen reflection */}
    <path d="M9 17 L18 17 L9 26 Z" fill="white" opacity="0.03" />
  </svg>
);

// Switch Icon - 3D wide network switch with ports, LEDs, and panel detail
export const SwitchIcon: React.FC<IconProps> = ({ color = '#7b8fa3', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" style={{ filter: ICON_FILTER }}>
    {/* Cast shadow */}
    <rect x="6" y="20" width="46" height="18" rx="3" fill="black" opacity="0.18" />
    {/* Main body */}
    <rect x="4" y="18" width="46" height="18" rx="3" fill={color} />
    {/* Top face highlight */}
    <path d="M7 18 H47 Q50 18 50 21 V24 H4 V21 Q4 18 7 18Z" fill="white" opacity="0.18" />
    {/* Right edge depth */}
    <path d="M46 18 H47 Q50 18 50 21 V33 Q50 36 47 36 H46 V18Z" fill="black" opacity="0.12" />
    {/* Bottom edge */}
    <rect x="4" y="32" width="46" height="4" rx="0 0 3 3" fill="black" opacity="0.08" />
    {/* Power LED */}
    <circle cx="9" cy="27" r="2.2" fill="#4caf50" />
    <circle cx="8.5" cy="26.5" r="0.8" fill="white" opacity="0.45" />
    {/* Brand line */}
    <rect x="13" y="21" width="10" height="2" rx="1" fill="white" opacity="0.15" />
    {/* Port row - 8 ethernet ports */}
    <rect x="8" y="29" width="4.2" height="5" rx="0.8" fill="black" opacity="0.3" />
    <rect x="8.3" y="29.3" width="3.6" height="4.4" rx="0.5" fill="white" opacity="0.12" />
    <rect x="13.5" y="29" width="4.2" height="5" rx="0.8" fill="black" opacity="0.3" />
    <rect x="13.8" y="29.3" width="3.6" height="4.4" rx="0.5" fill="white" opacity="0.12" />
    <rect x="19" y="29" width="4.2" height="5" rx="0.8" fill="black" opacity="0.3" />
    <rect x="19.3" y="29.3" width="3.6" height="4.4" rx="0.5" fill="white" opacity="0.12" />
    <rect x="24.5" y="29" width="4.2" height="5" rx="0.8" fill="black" opacity="0.3" />
    <rect x="24.8" y="29.3" width="3.6" height="4.4" rx="0.5" fill="white" opacity="0.12" />
    <rect x="30" y="29" width="4.2" height="5" rx="0.8" fill="black" opacity="0.3" />
    <rect x="30.3" y="29.3" width="3.6" height="4.4" rx="0.5" fill="white" opacity="0.12" />
    <rect x="35.5" y="29" width="4.2" height="5" rx="0.8" fill="black" opacity="0.3" />
    <rect x="35.8" y="29.3" width="3.6" height="4.4" rx="0.5" fill="white" opacity="0.12" />
    <rect x="41" y="29" width="4.2" height="5" rx="0.8" fill="black" opacity="0.3" />
    <rect x="41.3" y="29.3" width="3.6" height="4.4" rx="0.5" fill="white" opacity="0.12" />
    {/* Port status LEDs */}
    <circle cx="10.1" cy="22.5" r="1" fill="#4caf50" opacity="0.8" />
    <circle cx="15.6" cy="22.5" r="1" fill="#4caf50" opacity="0.6" />
    <circle cx="21.1" cy="22.5" r="1" fill="#ffab40" opacity="0.6" />
    <circle cx="26.6" cy="22.5" r="1" fill="#4caf50" opacity="0.5" />
    <circle cx="32.1" cy="22.5" r="1" fill="white" opacity="0.15" />
    <circle cx="37.6" cy="22.5" r="1" fill="white" opacity="0.15" />
    <circle cx="43.1" cy="22.5" r="1" fill="white" opacity="0.15" />
    {/* Console port */}
    <rect x="46" y="25" width="2.5" height="3" rx="0.5" fill="white" opacity="0.15" />
  </svg>
);

// Cloud Icon - Layered 3D cloud with shadow depth and highlights
export const CloudIcon: React.FC<IconProps> = ({ color = '#6b96ff', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" style={{ filter: ICON_FILTER }}>
    {/* Ground shadow */}
    <ellipse cx="28" cy="44" rx="18" ry="3" fill="black" opacity="0.12" />
    {/* Back cloud layer (depth) */}
    <circle cx="22" cy="26" r="11" fill={color} opacity="0.35" />
    <circle cx="36" cy="28" r="8" fill={color} opacity="0.35" />
    <rect x="11" y="28" width="33" height="12" rx="6" fill={color} opacity="0.35" />
    {/* Main cloud body */}
    <circle cx="20" cy="24" r="11" fill={color} />
    <circle cx="34" cy="22" r="9" fill={color} />
    <circle cx="42" cy="28" r="7" fill={color} />
    <circle cx="12" cy="30" r="6" fill={color} />
    <rect x="6" y="28" width="43" height="12" rx="6" fill={color} />
    {/* Top highlight bumps */}
    <path d="M12 22 Q16 14 24 16 Q28 12 34 14 Q36 12 40 18" stroke="white" strokeWidth="1.5" fill="none" opacity="0.2" strokeLinecap="round" />
    {/* Surface highlights */}
    <circle cx="18" cy="20" r="4" fill="white" opacity="0.12" />
    <circle cx="33" cy="18" r="3" fill="white" opacity="0.1" />
    <circle cx="41" cy="25" r="2.5" fill="white" opacity="0.08" />
    {/* Bottom shadow on cloud body */}
    <rect x="6" y="34" width="43" height="6" rx="0 0 6 6" fill="black" opacity="0.1" />
    {/* Inner light spot */}
    <ellipse cx="24" cy="28" rx="8" ry="4" fill="white" opacity="0.08" />
  </svg>
);

// Cloud Icon 2 - Alternative 3D cloud with network/connection theme
export const CloudIcon2: React.FC<IconProps> = ({ color = '#5c9ded', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" style={{ filter: ICON_FILTER }}>
    {/* Ground shadow */}
    <ellipse cx="28" cy="44" rx="16" ry="2.5" fill="black" opacity="0.12" />
    {/* Cloud outline (back depth) */}
    <path d="M40 32 C44 32 47 29 47 25.5 C47 22 44.5 19 41 19 C40.5 19 40 19 39.5 19.1 C38 14 34 10 28.5 10 C22 10 17 14 16 19.5 C12.5 20.5 10 23.5 10 27 C10 31 13 34 17 34 L40 34" fill={color} opacity="0.3" />
    {/* Main cloud body */}
    <path d="M38 30 C42 30 45 27 45 23.5 C45 20 42.5 17 39 17 C38.5 17 38 17 37.5 17.1 C36 12 32 8 26.5 8 C20 8 15 12 14 17.5 C10.5 18.5 8 21.5 8 25 C8 29 11 32 15 32 L38 32" fill={color} />
    {/* Top highlight */}
    <path d="M26.5 8 C22 8 18 10 16 14 Q20 9 26.5 10 Q32 9 35 13 L37.5 17.1 C38 17 38.5 17 39 17 C40 17 41 17.3 42 18 Q40 16 38 17" fill="white" opacity="0.15" />
    {/* Bottom shadow */}
    <path d="M15 28 L38 28 C40 28 42 29 43 30 L45 30 C44 31 42.5 32 38 32 L15 32 C12 32 9 30 9 27 L10 28 C10 28 12 28 15 28Z" fill="black" opacity="0.1" />
    {/* Inner highlights */}
    <circle cx="22" cy="20" r="3.5" fill="white" opacity="0.12" />
    <circle cx="34" cy="18" r="2.5" fill="white" opacity="0.08" />
    {/* Upload/download arrows */}
    <path d="M23 23 L23 28" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
    <path d="M21 25.5 L23 23 L25 25.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
    <path d="M32 28 L32 23" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
    <path d="M30 25.5 L32 28 L34 25.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
  </svg>
);

// Database Icon - 3D cylinder with stacked disk layers and reflections
export const DatabaseIcon: React.FC<IconProps> = ({ color = '#9d5cff', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" style={{ filter: ICON_FILTER }}>
    {/* Cast shadow */}
    <ellipse cx="29" cy="48" rx="14" ry="3" fill="black" opacity="0.15" />
    {/* Cylinder body */}
    <path d="M12 14 V40 C12 44 18 47 28 47 C38 47 44 44 44 40 V14" fill={color} />
    {/* Right edge shadow */}
    <path d="M38 14 Q44 14 44 14 V40 C44 44 38 47 28 47 C34 47 44 44 44 40 V14 Q44 16 40 17" fill="black" opacity="0.1" />
    {/* Left edge highlight */}
    <path d="M12 14 V40 C12 42 14 44 18 45 V13 Q14 14 12 14Z" fill="white" opacity="0.1" />
    {/* Top ellipse */}
    <ellipse cx="28" cy="14" rx="16" ry="6" fill={color} />
    {/* Top ellipse highlight */}
    <ellipse cx="26" cy="12.5" rx="10" ry="3" fill="white" opacity="0.2" />
    <ellipse cx="24" cy="11.5" rx="5" ry="1.5" fill="white" opacity="0.12" />
    {/* Disk layer lines */}
    <path d="M12 22 C12 26 18 28 28 28 C38 28 44 26 44 22" fill="none" stroke="white" strokeWidth="0.8" opacity="0.25" />
    <ellipse cx="28" cy="22" rx="16" ry="5" fill="white" opacity="0.06" />
    <path d="M12 31 C12 35 18 37 28 37 C38 37 44 35 44 31" fill="none" stroke="white" strokeWidth="0.8" opacity="0.2" />
    <ellipse cx="28" cy="31" rx="16" ry="5" fill="white" opacity="0.04" />
    {/* Bottom ellipse rim */}
    <path d="M12 40 C12 44 18 47 28 47 C38 47 44 44 44 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />
    {/* Data indicators on side */}
    <circle cx="18" cy="24" r="1" fill="white" opacity="0.2" />
    <circle cx="18" cy="33" r="1" fill="white" opacity="0.15" />
    <rect x="21" y="23.5" width="6" height="1" rx="0.5" fill="white" opacity="0.12" />
    <rect x="21" y="32.5" width="6" height="1" rx="0.5" fill="white" opacity="0.1" />
  </svg>
);

// Generic Device Icon - 3D box device with screen and status indicators
export const GenericIcon: React.FC<IconProps> = ({ color = '#8892a6', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" style={{ filter: ICON_FILTER }}>
    {/* Cast shadow */}
    <rect x="12" y="14" width="34" height="30" rx="3" fill="black" opacity="0.18" />
    {/* Main body */}
    <rect x="10" y="12" width="34" height="30" rx="3" fill={color} />
    {/* Top highlight */}
    <path d="M13 12 H41 Q44 12 44 15 V18 H10 V15 Q10 12 13 12Z" fill="white" opacity="0.18" />
    {/* Right edge depth */}
    <path d="M40 12 H41 Q44 12 44 15 V39 Q44 42 41 42 H40 V12Z" fill="black" opacity="0.12" />
    {/* Bottom edge */}
    <rect x="10" y="38" width="34" height="4" rx="0 0 3 3" fill="black" opacity="0.08" />
    {/* Screen area */}
    <rect x="13" y="15" width="22" height="14" rx="1.5" fill="black" opacity="0.3" />
    <rect x="13.5" y="15.5" width="21" height="13" rx="1" fill="white" opacity="0.12" />
    {/* Screen content lines */}
    <rect x="15" y="18" width="12" height="1.2" rx="0.5" fill="white" opacity="0.3" />
    <rect x="15" y="20.5" width="16" height="1.2" rx="0.5" fill="white" opacity="0.2" />
    <rect x="15" y="23" width="10" height="1.2" rx="0.5" fill="white" opacity="0.15" />
    {/* Power button */}
    <circle cx="39" cy="17" r="2" fill="black" opacity="0.2" />
    <circle cx="39" cy="17" r="1.5" fill="#4caf50" opacity="0.7" />
    <circle cx="38.5" cy="16.5" r="0.5" fill="white" opacity="0.3" />
    {/* Status indicators */}
    <circle cx="15" cy="35" r="1.5" fill="#4caf50" opacity="0.6" />
    <circle cx="19" cy="35" r="1.5" fill="#ffab40" opacity="0.5" />
    <rect x="23" y="34" width="8" height="2" rx="1" fill="white" opacity="0.12" />
    {/* Ventilation */}
    <rect x="37" y="30" width="4" height="1" rx="0.5" fill="white" opacity="0.1" />
    <rect x="37" y="32.5" width="4" height="1" rx="0.5" fill="white" opacity="0.1" />
    <rect x="37" y="35" width="4" height="1" rx="0.5" fill="white" opacity="0.1" />
  </svg>
);

// Laptop Icon - 3D open laptop with screen content and keyboard
export const LaptopIcon: React.FC<IconProps> = ({ color = '#8892a6', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" style={{ filter: ICON_FILTER }}>
    {/* Screen shadow */}
    <rect x="12" y="8" width="34" height="26" rx="2.5" fill="black" opacity="0.15" />
    {/* Screen body */}
    <rect x="10" y="6" width="34" height="26" rx="2.5" fill={color} />
    {/* Screen top highlight */}
    <path d="M12.5 6 H41.5 Q44 6 44 8.5 V12 H10 V8.5 Q10 6 12.5 6Z" fill="white" opacity="0.18" />
    {/* Screen right edge */}
    <path d="M40 6 H41.5 Q44 6 44 8.5 V29.5 Q44 32 41.5 32 H40 V6Z" fill="black" opacity="0.1" />
    {/* Display bezel */}
    <rect x="13" y="9" width="28" height="20" rx="1.5" fill="black" opacity="0.35" />
    {/* Display screen */}
    <rect x="13.5" y="9.5" width="27" height="19" rx="1" fill="#0a1628" />
    {/* Screen content */}
    <rect x="15" y="11" width="10" height="1.2" rx="0.5" fill={color} opacity="0.3" />
    <rect x="15" y="13.5" width="20" height="1.2" rx="0.5" fill="white" opacity="0.2" />
    <rect x="15" y="16" width="16" height="1.2" rx="0.5" fill="white" opacity="0.15" />
    <rect x="15" y="18.5" width="22" height="1.2" rx="0.5" fill="white" opacity="0.12" />
    <rect x="15" y="21" width="12" height="1.2" rx="0.5" fill={color} opacity="0.2" />
    <rect x="15" y="23.5" width="18" height="1.2" rx="0.5" fill="white" opacity="0.1" />
    {/* Screen reflection */}
    <path d="M13.5 9.5 L22 9.5 L13.5 18 Z" fill="white" opacity="0.04" />
    {/* Webcam dot */}
    <circle cx="27" cy="7.5" r="1" fill="black" opacity="0.3" />
    <circle cx="27" cy="7.5" r="0.5" fill="white" opacity="0.15" />
    {/* Hinge */}
    <rect x="12" y="32" width="30" height="2.5" rx="1" fill={color} />
    <rect x="12" y="32" width="30" height="1" rx="1" fill="white" opacity="0.15" />
    {/* Keyboard base */}
    <path d="M6 34.5 L48 34.5 L46 46.5 Q46 48 44 48 L10 48 Q8 48 8 46.5 L6 34.5Z" fill={color} />
    {/* Keyboard base highlight */}
    <path d="M6 34.5 L48 34.5 L47.5 37 L6.5 37 Z" fill="white" opacity="0.15" />
    {/* Keyboard base right shadow */}
    <path d="M48 34.5 L46 46.5 Q46 48 44 48 L42 48 L44 36 L48 34.5Z" fill="black" opacity="0.08" />
    {/* Keyboard keys (simplified grid) */}
    <rect x="12" y="37.5" width="30" height="1.5" rx="0.5" fill="black" opacity="0.12" />
    <rect x="12" y="40" width="30" height="1.5" rx="0.5" fill="black" opacity="0.12" />
    <rect x="12" y="42.5" width="30" height="1.5" rx="0.5" fill="black" opacity="0.12" />
    {/* Trackpad */}
    <rect x="22" y="45" width="10" height="2" rx="0.8" fill="black" opacity="0.1" />
  </svg>
);

// Attack Icon - 3D menacing shield with skull emblem
export const AttackIcon: React.FC<IconProps> = ({ color = '#ff5c9d', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" style={{ filter: ICON_FILTER }}>
    {/* Cast shadow */}
    <path d="M29 8 L46 16 V30 C46 38 40 44 29 48 C18 44 12 38 12 30 V16 L29 8Z" fill="black" opacity="0.18" />
    {/* Shield body */}
    <path d="M28 6 L44 14 V28 C44 36 38 42 28 46 C18 42 12 36 12 28 V14 L28 6Z" fill={color} />
    {/* Left highlight bevel */}
    <path d="M28 6 L12 14 V28 C12 30 13 32 14 34 L28 9 Z" fill="white" opacity="0.15" />
    {/* Right shadow bevel */}
    <path d="M28 6 L44 14 V28 C44 36 38 42 28 46 L28 43 C36 40 40 35 40 28 V16 L28 9 Z" fill="black" opacity="0.1" />
    {/* Inner shield border */}
    <path d="M28 10 L40 16 V28 C40 34 35 39 28 42 C21 39 16 34 16 28 V16 L28 10Z" fill="white" opacity="0.06" />
    {/* Skull cranium */}
    <circle cx="28" cy="21" r="7.5" fill="white" opacity="0.88" />
    {/* Skull cranium highlight */}
    <circle cx="26" cy="19" r="3.5" fill="white" opacity="0.15" />
    {/* Skull jaw */}
    <path d="M21.5 24 Q21 30 24 31 L25.5 31 L25.5 29 L27 31 L29 31 L30.5 29 L30.5 31 L32 31 Q35 30 34.5 24" fill="white" opacity="0.8" />
    {/* Left eye socket */}
    <ellipse cx="25" cy="21" rx="2.5" ry="2.8" fill={color} />
    <ellipse cx="25.3" cy="21.3" rx="1" ry="1.2" fill="black" opacity="0.3" />
    {/* Right eye socket */}
    <ellipse cx="31" cy="21" rx="2.5" ry="2.8" fill={color} />
    <ellipse cx="31.3" cy="21.3" rx="1" ry="1.2" fill="black" opacity="0.3" />
    {/* Nose cavity */}
    <path d="M27 25 L29 25 L28 27.5 Z" fill={color} opacity="0.65" />
    {/* Crossbones behind */}
    <path d="M18 35 L38 35" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    <circle cx="17" cy="35" r="2" fill="white" opacity="0.4" />
    <circle cx="39" cy="35" r="2" fill="white" opacity="0.4" />
    <path d="M18 39 L38 39" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
    <circle cx="17" cy="39" r="2" fill="white" opacity="0.3" />
    <circle cx="39" cy="39" r="2" fill="white" opacity="0.3" />
  </svg>
);

// Mobile Icon - 3D smartphone with screen, notch, and app grid
export const MobileIcon: React.FC<IconProps> = ({ color = '#3ddc84', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" style={{ filter: ICON_FILTER }}>
    {/* Cast shadow */}
    <rect x="17" y="5" width="24" height="48" rx="5" fill="black" opacity="0.18" />
    {/* Phone body */}
    <rect x="15" y="3" width="24" height="48" rx="5" fill={color} />
    {/* Top highlight */}
    <path d="M20 3 H34 Q39 3 39 8 V10 H15 V8 Q15 3 20 3Z" fill="white" opacity="0.2" />
    {/* Right edge depth */}
    <path d="M35 3 H34 Q39 3 39 8 V46 Q39 51 34 51 H35 V3Z" fill="black" opacity="0.12" />
    {/* Bottom edge */}
    <rect x="15" y="47" width="24" height="4" rx="0 0 5 5" fill="black" opacity="0.08" />
    {/* Screen bezel */}
    <rect x="17" y="9" width="20" height="36" rx="2" fill="black" opacity="0.4" />
    {/* Screen */}
    <rect x="17.5" y="9.5" width="19" height="35" rx="1.5" fill="#0a1628" />
    {/* Notch */}
    <rect x="23" y="9.5" width="8" height="3" rx="1.5" fill={color} opacity="0.8" />
    <circle cx="27" cy="11" r="1" fill="black" opacity="0.4" />
    <circle cx="27" cy="11" r="0.4" fill="white" opacity="0.15" />
    {/* Status bar */}
    <rect x="19" y="10.5" width="3" height="1" rx="0.5" fill="white" opacity="0.25" />
    <rect x="32" y="10.5" width="3" height="1" rx="0.5" fill="white" opacity="0.25" />
    {/* App grid - row 1 */}
    <rect x="19.5" y="16" width="4" height="4" rx="1" fill="#4d7cfe" opacity="0.6" />
    <rect x="25" y="16" width="4" height="4" rx="1" fill="#3dd68c" opacity="0.6" />
    <rect x="30.5" y="16" width="4" height="4" rx="1" fill="#ff5c5c" opacity="0.6" />
    {/* App grid - row 2 */}
    <rect x="19.5" y="22" width="4" height="4" rx="1" fill="#ffab40" opacity="0.6" />
    <rect x="25" y="22" width="4" height="4" rx="1" fill="#9d5cff" opacity="0.6" />
    <rect x="30.5" y="22" width="4" height="4" rx="1" fill="#3dd6d6" opacity="0.6" />
    {/* App grid - row 3 */}
    <rect x="19.5" y="28" width="4" height="4" rx="1" fill="#ff5c9d" opacity="0.5" />
    <rect x="25" y="28" width="4" height="4" rx="1" fill="#6b96ff" opacity="0.5" />
    <rect x="30.5" y="28" width="4" height="4" rx="1" fill="#ffd93d" opacity="0.5" />
    {/* Widget area */}
    <rect x="19.5" y="34" width="15" height="5" rx="1.5" fill="white" opacity="0.08" />
    <rect x="21" y="35.5" width="8" height="1" rx="0.5" fill="white" opacity="0.2" />
    <rect x="21" y="37.5" width="5" height="1" rx="0.5" fill="white" opacity="0.12" />
    {/* Home indicator */}
    <rect x="23" y="42" width="8" height="2" rx="1" fill="white" opacity="0.25" />
    {/* Side buttons */}
    <rect x="15" y="16" width="0.8" height="5" rx="0.4" fill="white" opacity="0.12" />
    <rect x="15" y="23" width="0.8" height="3" rx="0.4" fill="white" opacity="0.12" />
    <rect x="15" y="27" width="0.8" height="3" rx="0.4" fill="white" opacity="0.12" />
  </svg>
);
