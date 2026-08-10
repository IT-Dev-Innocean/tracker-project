/**
 * UI feature toggles.
 * Defaults live here; runtime values come from /api/feature-flags (DB).
 * Admin Dashboard saves via PUT /api/admin/feature-flags for all users.
 */

import { useSyncExternalStore } from 'react';

export const DEFAULT_FEATURE_FLAGS = {
  TIMESHEETS_UI_ENABLED: true,
  MASTER_VIEW_UI_ENABLED: false,
  TODO_LIST_UI_ENABLED: false,
  INSTALL_APP_UI_ENABLED: false,
  MY_CAPACITY_UI_ENABLED: false,

  MY_TICKETS_UI_ENABLED: false,
  SUBMIT_IDEA_UI_ENABLED: false,
  CONTACT_SUPPORT_UI_ENABLED: false,
  REPLAY_TOUR_UI_ENABLED: false,

  WELCOME_TOUR_BUTTONS_ENABLED: false,
  BOARD_HIGHLIGHTS_TOUR_ENABLED: false,
  TASK_FORM_AI_ASSISTANT_ENABLED: false,
  TASK_COMMENT_AI_MENTION_ENABLED: false,

  TASK_SCHEDULE_MEETING_UI_ENABLED: false,
  TASK_ADD_TO_CALENDAR_UI_ENABLED: false,
  TASK_SMART_NUDGE_UI_ENABLED: false,
  TASK_AUTO_NUDGE_UI_ENABLED: false,
  TASK_MEET_NOW_UI_ENABLED: false,
  TASK_QUEUE_LABEL_UI_ENABLED: false,

  TEAM_CHAT_UI_ENABLED: false,
  EXPORT_CSV_UI_ENABLED: false,
  GET_ALL_DATA_UI_ENABLED: false,
};

/** Labels/groups for Admin Feature Flags UI */
export const FEATURE_FLAG_META = [
  {
    group: { en: 'Navigation & Views', id: 'Navigasi & Tampilan' },
    flags: [
      { key: 'TIMESHEETS_UI_ENABLED', en: 'Timesheets', id: 'Timesheets' },
      { key: 'MASTER_VIEW_UI_ENABLED', en: 'Master View', id: 'Master View' },
      { key: 'TODO_LIST_UI_ENABLED', en: 'To-Do List', id: 'To-Do List' },
      { key: 'INSTALL_APP_UI_ENABLED', en: 'Install App', id: 'Install App' },
      { key: 'MY_CAPACITY_UI_ENABLED', en: 'My Capacity', id: 'My Capacity' },
    ],
  },
  {
    group: { en: 'Profile Menu', id: 'Menu Profil' },
    flags: [
      { key: 'MY_TICKETS_UI_ENABLED', en: 'My Tickets', id: 'Tiket Saya' },
      { key: 'SUBMIT_IDEA_UI_ENABLED', en: 'Submit Idea', id: 'Kirim Ide' },
      {
        key: 'CONTACT_SUPPORT_UI_ENABLED',
        en: 'Contact Support',
        id: 'Hubungi Support',
      },
      { key: 'REPLAY_TOUR_UI_ENABLED', en: 'Replay Tour', id: 'Putar Ulang Tour' },
    ],
  },
  {
    group: { en: 'Tours & AI', id: 'Tour & AI' },
    flags: [
      {
        key: 'WELCOME_TOUR_BUTTONS_ENABLED',
        en: 'Welcome Tour Buttons',
        id: 'Tombol Welcome Tour',
      },
      {
        key: 'BOARD_HIGHLIGHTS_TOUR_ENABLED',
        en: 'Board Highlights Tour',
        id: 'Tour Highlight Board',
      },
      {
        key: 'TASK_FORM_AI_ASSISTANT_ENABLED',
        en: 'Task Form AI Assistant',
        id: 'Asisten AI Form Task',
      },
      {
        key: 'TASK_COMMENT_AI_MENTION_ENABLED',
        en: 'Task Comment @AI Mention',
        id: 'Mention @AI di Komentar',
      },
    ],
  },
  {
    group: { en: 'Task Detail Actions', id: 'Aksi Task Detail' },
    flags: [
      {
        key: 'TASK_SCHEDULE_MEETING_UI_ENABLED',
        en: 'Schedule Meeting',
        id: 'Jadwalkan Rapat',
      },
      {
        key: 'TASK_ADD_TO_CALENDAR_UI_ENABLED',
        en: 'Add to Calendar',
        id: 'Tambah ke Kalender',
      },
      {
        key: 'TASK_SMART_NUDGE_UI_ENABLED',
        en: 'Smart Nudge',
        id: 'Smart Nudge',
      },
      {
        key: 'TASK_AUTO_NUDGE_UI_ENABLED',
        en: 'Auto Nudge',
        id: 'Auto Nudge',
      },
      { key: 'TASK_MEET_NOW_UI_ENABLED', en: 'Meet Now', id: 'Meet Now' },
      {
        key: 'TASK_QUEUE_LABEL_UI_ENABLED',
        en: 'Queue Position Label',
        id: 'Label Antrean',
      },
    ],
  },
  {
    group: { en: 'Board Toolbar', id: 'Toolbar Board' },
    flags: [
      { key: 'TEAM_CHAT_UI_ENABLED', en: 'Team Chat', id: 'Chat Tim' },
      { key: 'EXPORT_CSV_UI_ENABLED', en: 'Export CSV', id: 'Export CSV' },
      {
        key: 'GET_ALL_DATA_UI_ENABLED',
        en: 'Get All Data',
        id: 'Ambil Semua Data',
      },
    ],
  },
];

let runtimeFlags = { ...DEFAULT_FEATURE_FLAGS };
/** Stable snapshot ref for useSyncExternalStore — must not change identity unless flags change. */
let flagsSnapshot = runtimeFlags;
const listeners = new Set();

function emitChange() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* ignore */
    }
  });
}

export function subscribeFeatureFlags(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFeatureFlag(key) {
  if (Object.prototype.hasOwnProperty.call(runtimeFlags, key)) {
    return !!runtimeFlags[key];
  }
  return !!DEFAULT_FEATURE_FLAGS[key];
}

export function getAllFeatureFlags() {
  return flagsSnapshot;
}

function flagsEqual(a, b) {
  const keys = Object.keys(DEFAULT_FEATURE_FLAGS);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (!!a[key] !== !!b[key]) return false;
  }
  return true;
}

/** Apply flags from API/DB for this session. */
export function applyServerFeatureFlags(flags = {}) {
  const next = { ...DEFAULT_FEATURE_FLAGS };
  Object.keys(DEFAULT_FEATURE_FLAGS).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(flags, key)) {
      next[key] = !!flags[key];
    }
  });
  if (flagsEqual(runtimeFlags, next)) {
    return flagsSnapshot;
  }
  runtimeFlags = next;
  flagsSnapshot = next;
  emitChange();
  return flagsSnapshot;
}

export function resetFeatureFlagsToDefault() {
  if (flagsEqual(runtimeFlags, DEFAULT_FEATURE_FLAGS)) {
    return flagsSnapshot;
  }
  runtimeFlags = { ...DEFAULT_FEATURE_FLAGS };
  flagsSnapshot = runtimeFlags;
  emitChange();
  return flagsSnapshot;
}

/** React hook — re-renders when server flags change. */
export function useFeatureFlags() {
  return useSyncExternalStore(
    subscribeFeatureFlags,
    getAllFeatureFlags,
    () => DEFAULT_FEATURE_FLAGS
  );
}

export function useFeatureFlag(key) {
  return useSyncExternalStore(
    subscribeFeatureFlags,
    () => getFeatureFlag(key),
    () => !!DEFAULT_FEATURE_FLAGS[key]
  );
}

/**
 * Named exports — snapshot of defaults for static imports.
 * Components that need live updates should use useFeatureFlag / useFeatureFlags.
 * After hydrate from API, prefer hooks so UI refreshes for all users.
 */
export const TIMESHEETS_UI_ENABLED = DEFAULT_FEATURE_FLAGS.TIMESHEETS_UI_ENABLED;
export const MASTER_VIEW_UI_ENABLED = DEFAULT_FEATURE_FLAGS.MASTER_VIEW_UI_ENABLED;
export const TODO_LIST_UI_ENABLED = DEFAULT_FEATURE_FLAGS.TODO_LIST_UI_ENABLED;
export const INSTALL_APP_UI_ENABLED = DEFAULT_FEATURE_FLAGS.INSTALL_APP_UI_ENABLED;
export const MY_CAPACITY_UI_ENABLED = DEFAULT_FEATURE_FLAGS.MY_CAPACITY_UI_ENABLED;

export const MY_TICKETS_UI_ENABLED = DEFAULT_FEATURE_FLAGS.MY_TICKETS_UI_ENABLED;
export const SUBMIT_IDEA_UI_ENABLED = DEFAULT_FEATURE_FLAGS.SUBMIT_IDEA_UI_ENABLED;
export const CONTACT_SUPPORT_UI_ENABLED =
  DEFAULT_FEATURE_FLAGS.CONTACT_SUPPORT_UI_ENABLED;
export const REPLAY_TOUR_UI_ENABLED = DEFAULT_FEATURE_FLAGS.REPLAY_TOUR_UI_ENABLED;

export const WELCOME_TOUR_BUTTONS_ENABLED =
  DEFAULT_FEATURE_FLAGS.WELCOME_TOUR_BUTTONS_ENABLED;
export const BOARD_HIGHLIGHTS_TOUR_ENABLED =
  DEFAULT_FEATURE_FLAGS.BOARD_HIGHLIGHTS_TOUR_ENABLED;
export const TASK_FORM_AI_ASSISTANT_ENABLED =
  DEFAULT_FEATURE_FLAGS.TASK_FORM_AI_ASSISTANT_ENABLED;
export const TASK_COMMENT_AI_MENTION_ENABLED =
  DEFAULT_FEATURE_FLAGS.TASK_COMMENT_AI_MENTION_ENABLED;

export const TASK_SCHEDULE_MEETING_UI_ENABLED =
  DEFAULT_FEATURE_FLAGS.TASK_SCHEDULE_MEETING_UI_ENABLED;
export const TASK_ADD_TO_CALENDAR_UI_ENABLED =
  DEFAULT_FEATURE_FLAGS.TASK_ADD_TO_CALENDAR_UI_ENABLED;
export const TASK_SMART_NUDGE_UI_ENABLED =
  DEFAULT_FEATURE_FLAGS.TASK_SMART_NUDGE_UI_ENABLED;
export const TASK_AUTO_NUDGE_UI_ENABLED =
  DEFAULT_FEATURE_FLAGS.TASK_AUTO_NUDGE_UI_ENABLED;
export const TASK_MEET_NOW_UI_ENABLED =
  DEFAULT_FEATURE_FLAGS.TASK_MEET_NOW_UI_ENABLED;
export const TASK_QUEUE_LABEL_UI_ENABLED =
  DEFAULT_FEATURE_FLAGS.TASK_QUEUE_LABEL_UI_ENABLED;

export const TEAM_CHAT_UI_ENABLED = DEFAULT_FEATURE_FLAGS.TEAM_CHAT_UI_ENABLED;
export const EXPORT_CSV_UI_ENABLED = DEFAULT_FEATURE_FLAGS.EXPORT_CSV_UI_ENABLED;
export const GET_ALL_DATA_UI_ENABLED = DEFAULT_FEATURE_FLAGS.GET_ALL_DATA_UI_ENABLED;
