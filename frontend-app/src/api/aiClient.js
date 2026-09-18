import axios from 'axios';

export const AI_TASK_TYPES = {
  REWRITE: 'REWRITE',
  TRANSLATE: 'TRANSLATE',
  SUMMARIZE_TASK: 'SUMMARIZE_TASK',
  GENERATE_DESCRIPTION: 'GENERATE_DESCRIPTION',
  SIMPLE_QA: 'SIMPLE_QA',
  BASIC_TRANSFORM: 'BASIC_TRANSFORM',
  FORMAT: 'FORMAT',
  SIMPLE_SUMMARY: 'SIMPLE_SUMMARY',
  PROJECT_ANALYSIS: 'PROJECT_ANALYSIS',
  COMPLEX_TASK_ANALYSIS: 'COMPLEX_TASK_ANALYSIS',
  MULTI_TASK_REASONING: 'MULTI_TASK_REASONING',
  PROJECT_RECOMMENDATION: 'PROJECT_RECOMMENDATION',
  AI_AGENT: 'AI_AGENT',
  DEPENDENCY_ANALYSIS: 'DEPENDENCY_ANALYSIS',
  CROSS_PROJECT: 'CROSS_PROJECT',
};

export function generateAI(prompt, taskType, extra = {}) {
  return axios.post('/api/ai/generate', {
    prompt,
    task_type: taskType || AI_TASK_TYPES.SIMPLE_QA,
    ...extra,
  });
}

export function fetchAIUsage(language) {
  return axios.get('/api/ai/usage', {
    params: language ? { language } : undefined,
  });
}
