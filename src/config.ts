// Configuration file for Archy - Network Diagramming Tool
// This file contains configurable options that can be adjusted for customization

export const CONFIG = {
  // Node Connection Handle Settings
  handles: {
    size: 10, // Size in pixels for connection handles (width and height)
    borderWidth: 2, // Border width for handles in pixels
    borderColor: 'white', // Border color for handles
  },

  // Edge/Connection Settings
  edges: {
    defaultColor: '#000000', // Default color for new edges (black)
    selectedStrokeWidth: 3, // Stroke width when edge is selected
    normalStrokeWidth: 2, // Stroke width for normal edges
    animatedGlow: {
      outerBlur: 8, // Blur amount for outer glow layer in pixels
      innerBlur: 4, // Blur amount for inner glow layer in pixels
      outerStrokeWidth: 8, // Stroke width for outer glow
      innerStrokeWidth: 4, // Stroke width for inner glow
      pulseSpeed: 1.5, // Animation speed in seconds
    },
  },

  // Panel Settings
  panels: {
    shapeLibraryWidth: 240, // Width of the left shape library panel in pixels
    stylePanelWidth: 320, // Width of the right style panel in pixels
  },

  // Node Settings
  nodes: {
    snapToGrid: true, // Enable snap to grid
    snapGridSize: [15, 15], // Grid size for snapping [x, y]
    minZoom: 0.01, // Minimum zoom level
    maxZoom: 10, // Maximum zoom level
  },

  // Network Zone (Group) Settings
  groups: {
    minWidth: 200, // Minimum width for network zones
    minHeight: 150, // Minimum height for network zones
    defaultBorderWidth: 3, // Default border width
    borderRadius: 16, // Border radius in pixels
  },

  // Text Node Settings
  textNodes: {
    minFontSize: 8, // Minimum font size
    maxFontSize: 72, // Maximum font size
    defaultFontSize: 14, // Default font size
    minBorderWidth: 1, // Minimum border width
    maxBorderWidth: 10, // Maximum border width
  },
};

export default CONFIG;
