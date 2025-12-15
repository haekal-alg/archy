import React from 'react';
import theme from '../../theme';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  style,
}) => {
  const getDefaultDimensions = () => {
    switch (variant) {
      case 'text':
        return { width: '100%', height: '1em' };
      case 'circular':
        return { width: 40, height: 40 };
      case 'rectangular':
        return { width: '100%', height: 100 };
      default:
        return { width: '100%', height: '1em' };
    }
  };

  const defaults = getDefaultDimensions();
  const finalWidth = width ?? defaults.width;
  const finalHeight = height ?? defaults.height;

  const getBorderRadius = () => {
    switch (variant) {
      case 'text':
        return theme.radius.sm;
      case 'circular':
        return '50%';
      case 'rectangular':
        return theme.radius.md;
      default:
        return theme.radius.sm;
    }
  };

  return (
    <>
      <div
        style={{
          width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
          height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
          borderRadius: getBorderRadius(),
          background: `linear-gradient(
            90deg,
            ${theme.background.tertiary} 0%,
            ${theme.background.hover} 50%,
            ${theme.background.tertiary} 100%
          )`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite',
          ...style,
        }}
      />

      {/* CSS Animation */}
      <style>
        {`
          @keyframes shimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `}
      </style>
    </>
  );
};

export default Skeleton;
