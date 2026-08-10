export const DEFAULT_FORM_TEAM_SUBTASKS = [
  { task_name: 'Creative & Production', assignees: [] },
  { task_name: 'Strategic', assignees: [] },
  { task_name: 'Digital SosMed', assignees: [] },
  { task_name: 'Digital CRM', assignees: [] },
  { task_name: 'Media', assignees: [] },
  { task_name: 'BTL', assignees: [] },
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
