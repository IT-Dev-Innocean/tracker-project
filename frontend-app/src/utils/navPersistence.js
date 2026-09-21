const NAV_STORAGE_KEY = 'innocean_nav';
const ADMIN_TAB_KEY = 'innocean_admin_tab';

export const DEFAULT_NAV = {
  sidebarNav: 'home',
  showAdmin: false,
  showProjectManage: false,
  showClientManage: false,
  showTeams: false,
  showTimesheets: false,
  showMyTasks: false,
  teamsSubNav: 'people',
};

export const ADMIN_TABS = [
  'users',
  'feature-flags',
  'ai-overview',
  'approvers',
  'projects',
];

function safeParse(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function readPersistedNav(username = '') {
  if (typeof window === 'undefined') return { ...DEFAULT_NAV };
  const parsed = safeParse(localStorage.getItem(NAV_STORAGE_KEY));
  if (!parsed) return { ...DEFAULT_NAV };
  if (username && parsed.username && parsed.username !== username) {
    return { ...DEFAULT_NAV };
  }
  return {
    ...DEFAULT_NAV,
    sidebarNav: parsed.sidebarNav || DEFAULT_NAV.sidebarNav,
    showAdmin: Boolean(parsed.showAdmin),
    showProjectManage: Boolean(parsed.showProjectManage),
    showClientManage: Boolean(parsed.showClientManage),
    showTeams: Boolean(parsed.showTeams),
    showTimesheets: Boolean(parsed.showTimesheets),
    showMyTasks: Boolean(parsed.showMyTasks),
    teamsSubNav: parsed.teamsSubNav === 'leaves' ? 'leaves' : 'people',
  };
}

export function writePersistedNav(partial, username = '') {
  if (typeof window === 'undefined') return;
  const current = readPersistedNav(username);
  localStorage.setItem(
    NAV_STORAGE_KEY,
    JSON.stringify({
      ...current,
      ...partial,
      username: username || current.username || '',
    })
  );
}

export function readPersistedAdminTab() {
  if (typeof window === 'undefined') return 'users';
  const saved = localStorage.getItem(ADMIN_TAB_KEY);
  return ADMIN_TABS.includes(saved) ? saved : 'users';
}

export function writePersistedAdminTab(tab) {
  if (typeof window === 'undefined') return;
  if (ADMIN_TABS.includes(tab)) localStorage.setItem(ADMIN_TAB_KEY, tab);
}

export function clearPersistedNav() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(NAV_STORAGE_KEY);
  localStorage.removeItem(ADMIN_TAB_KEY);
}

export function isMenuOnlyNav(nav) {
  return Boolean(
    nav?.showAdmin ||
      nav?.showProjectManage ||
      nav?.showClientManage ||
      nav?.showTeams ||
      nav?.showTimesheets
  );
}
