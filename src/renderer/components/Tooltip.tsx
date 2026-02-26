import React, { useState, useRef, useEffect } from 'react';
import theme from '../../theme';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: string | React.ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  children: React.ReactElement;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = 'top',
  delay = 300,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const childRef = useRef<HTMLElement | null>(null);

  const calculatePosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 200; // Approximate width
    const tooltipHeight = 40; // Approximate height
    const offset = 8;

    let x = 0;
    let y = 0;

    switch (placement) {
      case 'top':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.top - tooltipHeight - offset;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.bottom + offset;
        break;
      case 'left':
        x = rect.left - tooltipWidth - offset;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        x = rect.right + offset;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
    }

    // Keep tooltip within viewport
    const padding = 8;
    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipWidth - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipHeight - padding));

    setPosition({ x, y });
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const target = e.currentTarget;
      calculatePosition(target);
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getArrowPosition = () => {
    switch (placement) {
      case 'top':
        return {
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        };
      case 'bottom':
        return {
          top: '-4px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        };
      case 'left':
        return {
          right: '-4px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
        };
      case 'right':
        return {
          left: '-4px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
        };
    }
  };

  // Clone child and add event handlers
  const childElement = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      handleMouseEnter(e);
      // Call original onMouseEnter if it exists
      const originalOnMouseEnter = (children.props as any)?.onMouseEnter;
      if (originalOnMouseEnter) {
        originalOnMouseEnter(e);
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      handleMouseLeave();
      // Call original onMouseLeave if it exists
      const originalOnMouseLeave = (children.props as any)?.onMouseLeave;
      if (originalOnMouseLeave) {
        originalOnMouseLeave(e);
      }
    },
    ref: childRef,
  } as any);

  return (
    <>
      {childElement}

      {isVisible && (
        <div
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            background: theme.background.elevated,
            color: theme.text.primary,
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            borderRadius: theme.radius.md,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.medium,
            boxShadow: theme.shadow.lg,
            border: `1px solid ${theme.border.default}`,
            zIndex: theme.zIndex.tooltip,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            maxWidth: '300px',
            animation: 'tooltipFadeIn 0.15s ease-out',
          }}
        >
          {content}

          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              width: '8px',
              height: '8px',
              background: theme.background.elevated,
              border: `1px solid ${theme.border.default}`,
              borderRight: 'none',
              borderBottom: 'none',
              ...getArrowPosition(),
            }}
          />
        </div>
      )}

      {/* CSS Animation */}
      <style>
        {`
          @keyframes tooltipFadeIn {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
  );
};

export default Tooltip;
