import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
}

export const FolderIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M1.5 4.5C1.5 3.67 2.17 3 3 3h3l1.2 1.4h5.8c.83 0 1.5.67 1.5 1.5v6.6c0 .83-.67 1.5-1.5 1.5H3c-.83 0-1.5-.67-1.5-1.5V4.5Z" stroke={color} strokeWidth="1.2" />
    <path d="M1.5 6h13" stroke={color} strokeWidth="1.2" />
  </svg>
);

export const FileIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 1.5h5.2L12.5 4.8V14c0 .83-.67 1.5-1.5 1.5H4c-.83 0-1.5-.67-1.5-1.5V3c0-.83.67-1.5 1.5-1.5Z" stroke={color} strokeWidth="1.2" />
    <path d="M9 1.5V5h3.5" stroke={color} strokeWidth="1.2" />
  </svg>
);

export const ArchiveIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" stroke={color} strokeWidth="1.2" />
    <path d="M5.5 2.5v11M8 5h3M8 8h3M8 11h3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M4.8 4.2h1.4M4.8 7.2h1.4M4.8 10.2h1.4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const SFTPCheckIcon: React.FC<IconProps & { visible: boolean }> = ({ size = 14, color = 'currentColor', visible }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ opacity: visible ? 1 : 0 }}>
    <path d="M3 7.5l2.2 2.2L11 4.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 2.2v8.2M3.8 7.8 7 11.2l3.2-3.4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowUpIcon: React.FC<IconProps> = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 11.8V3.6M10.2 6.2 7 2.8 3.8 6.2" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const GearIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="8" r="2.2" />
    <path d="M8 1.6v1.4M8 13v1.4M1.6 8h1.4M13 8h1.4M3.2 3.2l1 1M11.8 11.8l1 1M12.8 3.2l-1 1M4.2 11.8l-1 1" />
    <circle cx="8" cy="8" r="5.4" strokeOpacity="0.55" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2.5 4h9M5.5 4V2.5h3V4M4 4v7.5h6V4" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 6.5v3M8 6.5v3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const RenameIcon: React.FC<IconProps> = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M8.5 2.5l3 3-7 7H1.5v-3l7-7z" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 4l3 3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const NewFolderIcon: React.FC<IconProps> = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M1.5 4C1.5 3.17 2.17 2.5 3 2.5h2.5l1 1.2h4.5c.83 0 1.5.67 1.5 1.5v5.3c0 .83-.67 1.5-1.5 1.5H3c-.83 0-1.5-.67-1.5-1.5V4Z" stroke={color} strokeWidth="1.2" />
    <path d="M7 7v3M5.5 8.5h3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
