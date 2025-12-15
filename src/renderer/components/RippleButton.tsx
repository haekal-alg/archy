import React, { useState, useRef } from 'react';
import theme from '../../theme';

interface RippleProps {
  x: number;
  y: number;
  color?: string;
}

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  rippleColor?: string;
}

const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  rippleColor = theme.accent.blue,
  style,
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = useState<RippleProps[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple: RippleProps = {
      x,
      y,
      color: rippleColor,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, 600);

    // Call original onClick if provided
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      {...props}
    >
      {children}

      {/* Ripple Effects */}
      {ripples.map((ripple, index) => (
        <span
          key={index}
          style={{
            position: 'absolute',
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: '0',
            height: '0',
            borderRadius: '50%',
            background: `${ripple.color}40`,
            transform: 'translate(-50%, -50%)',
            animation: 'rippleExpand 0.6s ease-out',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* CSS Animation */}
      <style>
        {`
          @keyframes rippleExpand {
            0% {
              width: 0;
              height: 0;
              opacity: 1;
            }
            100% {
              width: 400px;
              height: 400px;
              opacity: 0;
            }
          }
        `}
      </style>
    </button>
  );
};

export default RippleButton;
