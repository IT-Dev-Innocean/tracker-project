/** Canonical default statuses */
export const DEFAULT_STATUS_COLUMNS = ['To Do', 'In Progress', 'Done'];

/** Palette matching the color picker reference (row1: 8, row2: 4) */
export const STATUS_COLOR_PALETTE = [
  { id: 'gray-dark', hex: '#4B5563' },
  { id: 'gray', hex: '#9CA3AF' },
  { id: 'indigo', hex: '#6366F1' },
  { id: 'blue', hex: '#2563EB' },
  { id: 'sky', hex: '#0EA5E9' },
  { id: 'green', hex: '#16A34A' },
  { id: 'yellow', hex: '#EAB308' },
  { id: 'orange', hex: '#F97316' },
  { id: 'red', hex: '#EF4444' },
  { id: 'pink', hex: '#EC4899' },
  { id: 'purple', hex: '#A855F7' },
  { id: 'brown', hex: '#92400E' },
];

const DEFAULT_HEX_BY_KEY = {
  to_do: '#F97316',
  in_progress: '#2563EB',
  done: '#16A34A',
  rejected: '#EF4444',
};

const DEFAULT_KEY_BY_NAME = {
  'to do': 'to_do',
  pending: 'to_do',
  'in progress': 'in_progress',
  done: 'done',
  rejected: 'rejected',
};

/** Color keys that identify protected default workflow columns */
export const PROTECTED_STATUS_COLOR_KEYS = ['to_do', 'in_progress', 'done'];

const COLOR_STORAGE_KEY = 'innocean_status_label_colors';
const ALIAS_STORAGE_KEY = 'innocean_status_color_aliases';

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') || {};
  } catch {
    return {};
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function getStatusColorKey(statusName) {
  if (!statusName) return null;
  const normalized = String(statusName).toLowerCase().trim();
  if (DEFAULT_KEY_BY_NAME[normalized]) return DEFAULT_KEY_BY_NAME[normalized];

  const aliases = readJson(ALIAS_STORAGE_KEY);
  return aliases[statusName] || aliases[normalized] || null;
}

/** Resolve hex label color for a status name */
export function getStatusLabelColor(statusName) {
  if (!statusName) return STATUS_COLOR_PALETTE[0].hex;

  const colors = readJson(COLOR_STORAGE_KEY);
  if (colors[statusName]) return colors[statusName];

  const normalized = String(statusName).toLowerCase().trim();
  if (colors[normalized]) return colors[normalized];

  const key = getStatusColorKey(statusName);
  if (key && DEFAULT_HEX_BY_KEY[key]) return DEFAULT_HEX_BY_KEY[key];

  return '#9CA3AF';
}

export function setStatusLabelColor(statusName, hex) {
  if (!statusName || !hex) return;
  const colors = readJson(COLOR_STORAGE_KEY);
  colors[statusName] = hex;
  writeJson(COLOR_STORAGE_KEY, colors);
}

/**
 * When a status column is renamed, keep color key alias + hex bound to the new title.
 */
export function bindStatusColorAlias(oldName, newName, hex) {
  if (!oldName || !newName) return;

  const colors = readJson(COLOR_STORAGE_KEY);
  const nextHex = hex || colors[oldName] || getStatusLabelColor(oldName);
  delete colors[oldName];
  delete colors[String(oldName).toLowerCase().trim()];
  colors[newName] = nextHex;
  writeJson(COLOR_STORAGE_KEY, colors);

  const key = getStatusColorKey(oldName);
  if (!key || oldName === newName) return;

  const aliases = readJson(ALIAS_STORAGE_KEY);
  delete aliases[oldName];
  delete aliases[String(oldName).toLowerCase().trim()];
  aliases[newName] = key;
  writeJson(ALIAS_STORAGE_KEY, aliases);
}

/** Inline style for Kanban / badge status labels */
export function getStatusLabelStyle(statusName) {
  return {
    backgroundColor: getStatusLabelColor(statusName),
    color: '#ffffff',
  };
}

/** Fallback className (kept for non-inline usages) */
export function getStatusLabelClass() {
  return 'text-white';
}
