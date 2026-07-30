export const SYSTEM_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
};

export function getEffectiveSystemRole(profile) {
  if (!profile) return SYSTEM_ROLES.MEMBER;
  if (profile.is_superadmin) return SYSTEM_ROLES.ADMIN;
  return String(profile.system_role || SYSTEM_ROLES.MEMBER).toLowerCase();
}

export function isAdmin(profile) {
  return getEffectiveSystemRole(profile) === SYSTEM_ROLES.ADMIN;
}

export function isManager(profile) {
  return getEffectiveSystemRole(profile) === SYSTEM_ROLES.MANAGER;
}

export function canManageTeams(profile) {
  return isAdmin(profile) || isManager(profile);
}

export function getRoleBadgeVariant(role) {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'admin' || normalized === 'owner') return 'purple';
  if (normalized === 'manager' || normalized === 'lead') return 'blue';
  return 'default';
}
