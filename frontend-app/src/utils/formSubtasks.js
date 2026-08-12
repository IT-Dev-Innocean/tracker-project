export const SUBTASK_DEPARTMENT_OPTIONS = [
  'Account',
  'BTL',
  'Creative',
  'CRM',
  'Digital & Technology',
  'Media',
  'Planning',
  'Resources & Coordination',
  'RSD',
];

export const DEFAULT_FORM_TEAM_SUBTASKS = [
  { task_name: 'Creative', assignees: [] },
  { task_name: 'Planning', assignees: [] },
  { task_name: 'Digital & Technology', assignees: [] },
  { task_name: 'Media', assignees: [] },
  { task_name: 'BTL', assignees: [] },
  { task_name: 'Account', assignees: [] },
];

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
