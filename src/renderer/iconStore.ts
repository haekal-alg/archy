/**
 * Icon store - loads custom PNG icons from disk via IPC
 * Icons are loaded once at startup and cached in memory
 */

export interface LoadedIcon {
  name: string;
  image: string;
  label: string;
  deviceType: string;
}

export interface IconCategory {
  id: string;
  label: string;
  icons: string[];
}

interface IconStoreState {
  loaded: boolean;
  categories: IconCategory[];
  icons: Record<string, LoadedIcon>;
  // Reverse map: deviceType -> icon name (for EnhancedDeviceNode lookups)
  deviceTypeMap: Record<string, string>;
}

const state: IconStoreState = {
  loaded: false,
  categories: [],
  icons: {},
  deviceTypeMap: {},
};

// Listeners notified when icons finish loading
const listeners: Array<() => void> = [];

export function onIconsLoaded(cb: () => void): () => void {
  if (state.loaded) {
    cb();
  } else {
    listeners.push(cb);
  }
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export async function loadIcons(): Promise<void> {
  if (state.loaded) return;

  try {
    const result = await window.electron.loadIcons();
    if (result.success) {
      state.categories = result.categories;
      state.icons = result.icons;

      // Build reverse device type map
      for (const [name, icon] of Object.entries(result.icons)) {
        state.deviceTypeMap[icon.deviceType] = name;
      }

      state.loaded = true;
      listeners.forEach((cb) => cb());
      listeners.length = 0;
    } else {
      console.warn('Failed to load icons:', result.error);
      state.loaded = true; // Mark loaded even on failure so we fall back gracefully
      listeners.forEach((cb) => cb());
      listeners.length = 0;
    }
  } catch (err) {
    console.error('Error loading icons:', err);
    state.loaded = true;
    listeners.forEach((cb) => cb());
    listeners.length = 0;
  }
}

export function isLoaded(): boolean {
  return state.loaded;
}

export function getCategories(): IconCategory[] {
  return state.categories;
}

export function getIcons(): Record<string, LoadedIcon> {
  return state.icons;
}

export function getIconByName(name: string): LoadedIcon | undefined {
  return state.icons[name];
}

export function getIconByDeviceType(deviceType: string): LoadedIcon | undefined {
  const name = state.deviceTypeMap[deviceType];
  return name ? state.icons[name] : undefined;
}
