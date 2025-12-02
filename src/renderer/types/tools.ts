/**
 * Tool types for canvas interaction
 */
export type ToolType = 'selection' | 'hand';

/**
 * Tool configuration
 */
export interface Tool {
  type: ToolType;
  name: string;
  icon: string;
  cursor: string;
  shortcut: string;
  description: string;
}

/**
 * Available tools configuration
 */
export const TOOLS: Record<ToolType, Tool> = {
  selection: {
    type: 'selection',
    name: 'Selection Tool',
    icon: '⬆️', // Will be replaced with proper cursor icon
    cursor: 'default',
    shortcut: 'V',
    description: 'Select and move assets',
  },
  hand: {
    type: 'hand',
    name: 'Hand Tool',
    icon: '✋',
    cursor: 'grab',
    shortcut: 'H',
    description: 'Pan the canvas',
  },
};
