export interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modifiedTime: string;
  path: string;
}

export interface SSHHost {
  id: string;
  label: string;
  host: string;
  port: number;
  username: string;
  hasSSH: boolean;
}

export type SortColumn = 'name' | 'modified' | 'type' | 'size';

export interface PaneState {
  path: string;
  files: FileItem[];
  loading: boolean;
  selectedFile: string | null;
  selectedFiles: Set<string>;
  showHidden: boolean;
  sortColumn: SortColumn;
  sortDirection: 'asc' | 'desc';
  contextMenuOpen: boolean;
  menuPos: { x: number; y: number } | null;
  menuVisible: boolean;
  menuHover: number | null;
}

export interface TransferProgress {
  pane: 'local' | 'remote';
  fileName: string;
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  startedAt: number;
  speedBps: number;
  currentFileIndex?: number;
  totalFiles?: number;
  totalBytesAllFiles?: number;
  bytesTransferredAllFiles?: number;
}

export interface SFTPState {
  selectedHost: SSHHost | null;
  local: PaneState;
  remote: PaneState;
  transfer: TransferProgress | null;
  error: string | null;
  dragOverPane: 'local' | 'remote' | null;
  hostSearchQuery: string;
  modalVisible: boolean;
}

const defaultPaneState: PaneState = {
  path: '',
  files: [],
  loading: false,
  selectedFile: null,
  selectedFiles: new Set(),
  showHidden: false,
  sortColumn: 'name',
  sortDirection: 'asc',
  contextMenuOpen: false,
  menuPos: null,
  menuVisible: false,
  menuHover: null,
};

export const initialState: SFTPState = {
  selectedHost: null,
  local: { ...defaultPaneState },
  remote: { ...defaultPaneState },
  transfer: null,
  error: null,
  dragOverPane: null,
  hostSearchQuery: '',
  modalVisible: false,
};

export type SFTPAction =
  | { type: 'SET_HOST'; host: SSHHost | null }
  | { type: 'SET_PANE_PATH'; pane: 'local' | 'remote'; path: string }
  | { type: 'SET_PANE_FILES'; pane: 'local' | 'remote'; files: FileItem[] }
  | { type: 'SET_PANE_LOADING'; pane: 'local' | 'remote'; loading: boolean }
  | { type: 'SET_PANE_SELECTED_FILE'; pane: 'local' | 'remote'; file: string | null }
  | { type: 'TOGGLE_FILE_SELECTION'; pane: 'local' | 'remote'; filePath: string }
  | { type: 'SELECT_RANGE'; pane: 'local' | 'remote'; filePaths: string[] }
  | { type: 'SELECT_ALL_FILES'; pane: 'local' | 'remote'; filePaths: string[] }
  | { type: 'DESELECT_ALL_FILES'; pane: 'local' | 'remote' }
  | { type: 'SET_PANE_SHOW_HIDDEN'; pane: 'local' | 'remote'; showHidden: boolean }
  | { type: 'SET_PANE_SORT'; pane: 'local' | 'remote'; column: SortColumn; direction: 'asc' | 'desc' }
  | { type: 'SET_PANE_CONTEXT_MENU'; pane: 'local' | 'remote'; open: boolean; pos?: { x: number; y: number } | null }
  | { type: 'SET_PANE_MENU_VISIBLE'; pane: 'local' | 'remote'; visible: boolean }
  | { type: 'SET_PANE_MENU_HOVER'; pane: 'local' | 'remote'; index: number | null }
  | { type: 'SET_TRANSFER'; transfer: TransferProgress | null }
  | { type: 'UPDATE_TRANSFER_PROGRESS'; bytesTransferred: number; totalBytes: number; speedBps: number }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_DRAG_OVER'; pane: 'local' | 'remote' | null }
  | { type: 'SET_HOST_SEARCH'; query: string }
  | { type: 'SET_MODAL_VISIBLE'; visible: boolean }
  | { type: 'CLOSE_ALL_MENUS' }
  | { type: 'RESET' };

function updatePane(state: SFTPState, pane: 'local' | 'remote', updates: Partial<PaneState>): SFTPState {
  return { ...state, [pane]: { ...state[pane], ...updates } };
}

export function sftpReducer(state: SFTPState, action: SFTPAction): SFTPState {
  switch (action.type) {
    case 'SET_HOST':
      return { ...state, selectedHost: action.host };

    case 'SET_PANE_PATH':
      return updatePane(state, action.pane, { path: action.path });

    case 'SET_PANE_FILES':
      return updatePane(state, action.pane, { files: action.files });

    case 'SET_PANE_LOADING':
      return updatePane(state, action.pane, { loading: action.loading });

    case 'SET_PANE_SELECTED_FILE':
      return updatePane(state, action.pane, { selectedFile: action.file });

    case 'TOGGLE_FILE_SELECTION': {
      const newSet = new Set(state[action.pane].selectedFiles);
      if (newSet.has(action.filePath)) newSet.delete(action.filePath);
      else newSet.add(action.filePath);
      return updatePane(state, action.pane, { selectedFiles: newSet });
    }

    case 'SELECT_RANGE': {
      const newSet = new Set(state[action.pane].selectedFiles);
      for (const fp of action.filePaths) newSet.add(fp);
      return updatePane(state, action.pane, { selectedFiles: newSet });
    }

    case 'SELECT_ALL_FILES':
      return updatePane(state, action.pane, { selectedFiles: new Set(action.filePaths) });

    case 'DESELECT_ALL_FILES':
      return updatePane(state, action.pane, { selectedFiles: new Set() });

    case 'SET_PANE_SHOW_HIDDEN':
      return updatePane(state, action.pane, { showHidden: action.showHidden });

    case 'SET_PANE_SORT':
      return updatePane(state, action.pane, { sortColumn: action.column, sortDirection: action.direction });

    case 'SET_PANE_CONTEXT_MENU':
      return updatePane(state, action.pane, {
        contextMenuOpen: action.open,
        menuPos: action.pos !== undefined ? action.pos : (action.open ? state[action.pane].menuPos : null),
        menuHover: null,
      });

    case 'SET_PANE_MENU_VISIBLE':
      return updatePane(state, action.pane, { menuVisible: action.visible });

    case 'SET_PANE_MENU_HOVER':
      return updatePane(state, action.pane, { menuHover: action.index });

    case 'SET_TRANSFER':
      return { ...state, transfer: action.transfer };

    case 'UPDATE_TRANSFER_PROGRESS': {
      if (!state.transfer) return state;
      const progress = action.totalBytes > 0
        ? Math.round((action.bytesTransferred / action.totalBytes) * 100)
        : 0;
      return {
        ...state,
        transfer: {
          ...state.transfer,
          bytesTransferred: action.bytesTransferred,
          totalBytes: action.totalBytes,
          progress,
          speedBps: action.speedBps,
        },
      };
    }

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'SET_DRAG_OVER':
      return { ...state, dragOverPane: action.pane };

    case 'SET_HOST_SEARCH':
      return { ...state, hostSearchQuery: action.query };

    case 'SET_MODAL_VISIBLE':
      return { ...state, modalVisible: action.visible };

    case 'CLOSE_ALL_MENUS':
      return {
        ...state,
        local: { ...state.local, contextMenuOpen: false, menuVisible: false, menuHover: null, menuPos: null },
        remote: { ...state.remote, contextMenuOpen: false, menuVisible: false, menuHover: null, menuPos: null },
      };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}
