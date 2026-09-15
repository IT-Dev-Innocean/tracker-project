export const SUBTASK_DEPARTMENT_OPTIONS = [
  'Account',
  'Planning',
  'Digital & Technology',
  'Creative',
  'Media',
  'BTL',
  'Resources & Coordination',
  'RSD',
  'HMS',
  'HR & GA',
  'Finance',
];

export const DEFAULT_FORM_TEAM_SUBTASKS = [
  { task_name: 'Planning', assignees: [] },
  { task_name: 'Digital & Technology', assignees: [] },
  { task_name: 'Creative', assignees: [] },
  { task_name: 'Media', assignees: [] },
  { task_name: 'BTL', assignees: [] },
  { task_name: 'Account', assignees: [] },
];

export const isEmployeeInDepartment = (employeeDivision, targetDepartment) => {
  if (!targetDepartment) return true;
  const cleanTarget = String(targetDepartment || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const cleanEmp = String(employeeDivision || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (!cleanEmp) return false;
  if (cleanTarget === cleanEmp) return true;

  // Exact 1-to-1 aliases only (e.g. R&C = Resources & Coordination)
  if (
    (cleanTarget === 'rc' || cleanTarget === 'resourcescoordination') &&
    (cleanEmp === 'rc' || cleanEmp === 'resourcescoordination')
  ) {
    return true;
  }
  if (
    (cleanTarget === 'btl' || cleanTarget === 'btlactivation') &&
    (cleanEmp === 'btl' || cleanEmp === 'btlactivation')
  ) {
    return true;
  }
  if (
    (cleanTarget === 'digitaltechnology' || cleanTarget === 'digitaltechnology') &&
    (cleanEmp === 'digitaltechnology' || cleanEmp === 'digitaltechnology')
  ) {
    return true;
  }
  if (
    (cleanTarget === 'strategic' || cleanTarget === 'planning') &&
    (cleanEmp === 'strategic' || cleanEmp === 'planning')
  ) {
    return true;
  }
  if (cleanTarget === 'hrga' && cleanEmp === 'hrga') {
    return true;
  }

  return cleanTarget === cleanEmp;
};

export const filterEmployeesByDepartment = (employees = [], department = '') => {
  if (!department) return employees;
  const filtered = employees.filter((emp) =>
    isEmployeeInDepartment(emp.division_name || emp.department, department)
  );
  return filtered.length > 0 ? filtered : [];
};

export const flattenFormSubtasksForApi = (teams = []) => {
  const result = [];
  teams.forEach((team) => {
    const name = String(team?.task_name || '').trim();
    if (!name) return;
    const assignees = Array.isArray(team?.assignees)
      ? team.assignees.filter(Boolean)
      : team?.assignee
        ? [team.assignee]
        : [];
    if (assignees.length === 0) return;
    assignees.forEach((username) => {
      result.push({ task_name: name, assignee: username });
    });
  });
  return result;
};
