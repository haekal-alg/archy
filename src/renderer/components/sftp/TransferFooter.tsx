import React from 'react';
import theme from '../../../theme';
import { TransferProgress } from './sftpReducer';
import { ArrowDownIcon, ArrowUpIcon } from './SFTPIcons';

interface TransferFooterProps {
  pane: 'local' | 'remote';
  transfer: TransferProgress | null;
  formatSize: (bytes: number) => string;
  formatDuration: (ms: number) => string;
}

export const TRANSFER_FOOTER_HEIGHT = 78;

const TransferFooter: React.FC<TransferFooterProps> = ({ pane, transfer, formatSize, formatDuration }) => {
  const active = transfer && transfer.pane === pane;
  const directionLabel = pane === 'local' ? 'Downloading' : 'Uploading';
  const accentColor = pane === 'local' ? theme.accent.blue : theme.accent.greenDark;

  const progressPercent = active ? transfer.progress : 0;
  const sizeLabel = active && transfer.totalBytes ? formatSize(transfer.totalBytes) : null;
  const transferredLabel = active && transfer.bytesTransferred ? formatSize(transfer.bytesTransferred) : null;

  const etaLabel = (() => {
    if (!active) return null;
    if (transfer.speedBps > 0 && transfer.totalBytes > 0) {
      const remaining = transfer.totalBytes - transfer.bytesTransferred;
      const etaMs = (remaining / transfer.speedBps) * 1000;
      return formatDuration(etaMs);
    }
    return 'Estimating...';
  })();

  const multiFileLabel = active && transfer.totalFiles && transfer.totalFiles > 1
    ? `File ${transfer.currentFileIndex} of ${transfer.totalFiles}`
    : null;

  return (
    <div style={{
      height: `${TRANSFER_FOOTER_HEIGHT}px`,
      borderTop: `1px solid ${theme.border.default}`,
      background: `linear-gradient(180deg, rgba(31, 36, 48, 0.92), rgba(26, 31, 46, 0.98))`,
      padding: '10px 14px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '8px',
      opacity: active ? 1 : 0.6,
      transition: 'opacity 0.2s ease',
    }}>
      {active ? (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: 0,
              color: theme.text.secondary,
              fontSize: '12px',
              fontWeight: 600,
            }}>
              <span style={{ color: accentColor, display: 'flex' }}>
                {pane === 'local' ? <ArrowDownIcon /> : <ArrowUpIcon />}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>{directionLabel}</span>
              <span style={{ color: theme.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {transfer.fileName}
              </span>
              {multiFileLabel && (
                <span style={{ color: theme.text.tertiary, fontSize: '11px', whiteSpace: 'nowrap' }}>
                  ({multiFileLabel})
                </span>
              )}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '11px',
              color: theme.text.tertiary,
              flexShrink: 0,
            }}>
              {transferredLabel && sizeLabel && (
                <span>{transferredLabel} / {sizeLabel}</span>
              )}
              {etaLabel && <span>ETA ~{etaLabel}</span>}
              <span style={{ fontWeight: 600, color: theme.text.secondary }}>{progressPercent}%</span>
            </div>
          </div>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '8px',
            borderRadius: '999px',
            background: theme.background.primary,
            border: `1px solid ${theme.border.subtle}`,
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.45)',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${progressPercent}%`,
              height: '100%',
              borderRadius: '999px',
              background: `linear-gradient(90deg, ${accentColor}, ${pane === 'local' ? theme.accent.blueLight : theme.accent.green})`,
              boxShadow: `0 0 12px ${accentColor}80`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </>
      ) : (
        <div style={{
          fontSize: '11px',
          color: theme.text.disabled,
          textAlign: 'center',
          letterSpacing: '0.2px',
        }}>
          No active transfers
        </div>
      )}
    </div>
  );
};

export default TransferFooter;
