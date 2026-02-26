import React, { useState, useRef, useEffect } from 'react';
import theme from '../../../theme';

interface EditablePathBarProps {
  path: string;
  separator: '/' | '\\';
  onNavigate: (path: string) => void;
  disabled?: boolean;
}

const EditablePathBar: React.FC<EditablePathBarProps> = ({ path, separator, onNavigate, disabled }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(path);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setEditValue(path);
  }, [path]);

  const handleSubmit = () => {
    setEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== path) {
      onNavigate(trimmed);
    } else {
      setEditValue(path);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setEditValue(path);
    }
  };

  if (editing) {
    return (
      <div style={{
        padding: '6px 16px',
        background: theme.background.secondary,
        borderBottom: `1px solid ${theme.border.default}`,
      }}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '4px 8px',
            background: theme.background.tertiary,
            border: `1px solid ${theme.accent.blue}`,
            borderRadius: '4px',
            color: theme.text.primary,
            fontSize: '12px',
            fontFamily: 'monospace',
            outline: 'none',
          }}
        />
      </div>
    );
  }

  // Build breadcrumb segments
  const segments = path.split(separator).filter(Boolean);
  const isAbsolute = path.startsWith('/');

  const buildPath = (index: number): string => {
    if (separator === '/') {
      return '/' + segments.slice(0, index + 1).join('/');
    }
    // Windows: first segment is drive like "C:", rebuild as "C:\seg1\seg2"
    return segments.slice(0, index + 1).join('\\') + '\\';
  };

  return (
    <div
      style={{
        padding: '8px 16px',
        background: theme.background.secondary,
        borderBottom: `1px solid ${theme.border.default}`,
        fontSize: '12px',
        color: theme.text.tertiary,
        fontFamily: 'monospace',
        cursor: disabled ? 'default' : 'text',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        overflow: 'hidden',
        minHeight: '32px',
      }}
      onClick={() => {
        if (!disabled) setEditing(true);
      }}
    >
      {isAbsolute && (
        <span
          onClick={(e) => {
            if (disabled) return;
            e.stopPropagation();
            onNavigate('/');
          }}
          style={{
            cursor: disabled ? 'default' : 'pointer',
            padding: '1px 3px',
            borderRadius: '3px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!disabled) e.currentTarget.style.background = theme.background.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          /
        </span>
      )}
      {segments.map((segment, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span style={{ color: theme.text.disabled, margin: '0 1px' }}>
              {separator}
            </span>
          )}
          <span
            onClick={(e) => {
              if (disabled) return;
              e.stopPropagation();
              onNavigate(buildPath(i));
            }}
            style={{
              cursor: disabled ? 'default' : 'pointer',
              padding: '1px 3px',
              borderRadius: '3px',
              color: i === segments.length - 1 ? theme.text.secondary : theme.text.tertiary,
              fontWeight: i === segments.length - 1 ? 600 : 400,
              transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.background = theme.background.hover;
                e.currentTarget.style.color = theme.text.primary;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = i === segments.length - 1 ? theme.text.secondary : theme.text.tertiary;
            }}
          >
            {segment}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

export default EditablePathBar;
