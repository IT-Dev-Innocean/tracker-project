export const DEFAULT_JOB_TYPES = [
  'Strategy & Planning',
  'Research & Insights',
  'Concept & Ideation',
  'Client & Stakeholder Management',
  'Project Management & Coordination',
  'Content Development',
  'Design & Creative Development',
  'Production & Execution',
  'Media Management',
  'Technology Development',
  'UX/UI & Experience Design',
  'Data & Analytics',
  'CRM & Customer Management',
  'Activation & Experiential',
  'Retail / Space Development',
  'Vendor & Partner Management',
  'Resource & Traffic Management',
  'Administration & Documentation',
  'Costing, Commercial & Financial Management',
  'People & HR Management',
  'Internal / Corporate Support',
  'Training & Development',
  'Business Development',
];

export const LEGACY_JOB_TYPES = [
  'Development',
  'Design',
  'Marketing',
  'Research',
  'Maintenance',
  'Consulting',
  'Other',
];

export function mergeJobTypes(categories = []) {
  const extras = (categories || []).filter((c) => {
    const name = String(c || '').trim();
    if (!name) return false;
    const isDefault = DEFAULT_JOB_TYPES.some(
      (job) => job.toLowerCase() === name.toLowerCase()
    );
    const isLegacy = LEGACY_JOB_TYPES.some(
      (job) => job.toLowerCase() === name.toLowerCase()
    );
    return !isDefault && !isLegacy;
  });
  return [...DEFAULT_JOB_TYPES, ...extras];
}
