import React, { useState, useCallback, useEffect, useRef } from 'react';
import theme from '../../theme';

interface PromptOptions {
  title: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface PromptState extends PromptOptions {
  resolve: (value: string | null) => void;
}

export const usePrompt = () => {
  const [state, setState] = useState<PromptState | null>(null);

  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const PromptContainer = useCallback(() => {
    if (!state) return null;
    return (
      <PromptDialog
        {...state}
        onSubmit={(value) => {
          state.resolve(value);
          setState(null);
        }}
        onCancel={() => {
          state.resolve(null);
          setState(null);
        }}
      />
    );
  }, [state]);

  return { prompt, PromptContainer };
};

interface PromptDialogProps {
  title: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

const PromptDialog: React.FC<PromptDialogProps> = ({
  title,
  defaultValue = '',
  placeholder,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
    if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, [onCancel]);

  return (
    <div
      className="confirm-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-title"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className="confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="prompt-title" className="confirm-dialog__title">
          {title}
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = value.trim();
            if (trimmed) onSubmit(trimmed);
          }}
          style={{ marginTop: theme.spacing.lg }}
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: `10px ${theme.spacing.lg}`,
              background: theme.background.tertiary,
              border: `1px solid ${theme.border.default}`,
              borderRadius: theme.radius.sm,
              color: theme.text.primary,
              fontSize: theme.fontSize.base,
              marginBottom: theme.spacing.xl,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = theme.accent.blue; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = theme.border.default; }}
          />
          <div className="confirm-dialog__actions">
            <button
              type="button"
              className="btn-confirm-cancel"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="btn-confirm-primary"
              disabled={!value.trim()}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
