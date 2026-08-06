export const ROLE_ADMIN = 'admin';
export const ROLE_PROJECT_OWNER = 'project_owner';
export const ROLE_MANAGER = 'manager';
export const ROLE_STAFF = 'staff';

export const ROLE_LABELS = {
  [ROLE_ADMIN]: { en: 'Admin', id: 'Admin' },
  [ROLE_PROJECT_OWNER]: { en: 'Project Owner', id: 'Project Owner' },
  [ROLE_MANAGER]: { en: 'Manager', id: 'Manager' },
  [ROLE_STAFF]: { en: 'Staff', id: 'Staff' },
};

export function normalizeRole(role, isSuperAdmin = false) {
  if (role === ROLE_ADMIN || role === ROLE_PROJECT_OWNER || role === ROLE_MANAGER || role === ROLE_STAFF) {
    return role;
  }
  return isSuperAdmin ? ROLE_ADMIN : ROLE_PROJECT_OWNER;
}

export function canAccessAdmin(role) {
  return role === ROLE_ADMIN;
}

export function canCreateProject(role) {
  return role === ROLE_ADMIN || role === ROLE_PROJECT_OWNER;
}

export function canManageProjects(role) {
  return role === ROLE_ADMIN || role === ROLE_PROJECT_OWNER;
}

export function canManageClients(role) {
  return role === ROLE_ADMIN || role === ROLE_PROJECT_OWNER;
}

export function canCreateTask(role) {
  return role === ROLE_ADMIN || role === ROLE_PROJECT_OWNER || role === ROLE_MANAGER;
}

export function canModifyTasks(role) {
  return role !== ROLE_STAFF;
}

export function canWriteComments(role) {
  return role !== ROLE_STAFF;
}

export function roleLabel(role, language = 'en') {
  const entry = ROLE_LABELS[role] || ROLE_LABELS[ROLE_PROJECT_OWNER];
  return language === 'id' ? entry.id : entry.en;
}
