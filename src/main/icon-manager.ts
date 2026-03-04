/**
 * Icon manager - loads SVG icons from the icons/ directory
 * Users can customize icons by editing the SVG files directly
 */

import { ipcMain, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';

interface IconMeta {
  label: string;
  deviceType: string;
}

interface CategoryDef {
  id: string;
  label: string;
  icons: string[];
}

interface CategoriesFile {
  categories: CategoryDef[];
  icons: Record<string, IconMeta>;
}

interface LoadedIcon {
  name: string;
  svg: string;
  label: string;
  deviceType: string;
}

interface LoadIconsResult {
  success: boolean;
  categories: CategoryDef[];
  icons: Record<string, LoadedIcon>;
  error?: string;
}

function getIconsDir(): string {
  if (app.isPackaged) {
    // In production, icons are next to the app resources
    return path.join(process.resourcesPath, 'icons');
  }
  // In development, icons are at project root
  return path.join(app.getAppPath(), 'icons');
}

async function loadAllIcons(): Promise<LoadIconsResult> {
  const iconsDir = getIconsDir();

  try {
    // Read categories.json
    const catPath = path.join(iconsDir, 'categories.json');
    const catContent = await fsPromises.readFile(catPath, 'utf-8');
    const catData: CategoriesFile = JSON.parse(catContent);

    // Load each SVG file referenced in the icon definitions
    const icons: Record<string, LoadedIcon> = {};

    for (const [name, meta] of Object.entries(catData.icons)) {
      const svgPath = path.join(iconsDir, `${name}.svg`);
      try {
        const svg = await fsPromises.readFile(svgPath, 'utf-8');
        icons[name] = {
          name,
          svg,
          label: meta.label,
          deviceType: meta.deviceType,
        };
      } catch {
        console.warn(`Icon file not found: ${svgPath}`);
      }
    }

    return {
      success: true,
      categories: catData.categories,
      icons,
    };
  } catch (err: any) {
    console.error('Failed to load icons:', err);
    return {
      success: false,
      categories: [],
      icons: {},
      error: err.message,
    };
  }
}

/**
 * Register IPC handlers for icon loading
 */
export function registerIconIPCHandlers(): void {
  ipcMain.handle('load-icons', async () => {
    return loadAllIcons();
  });
}
