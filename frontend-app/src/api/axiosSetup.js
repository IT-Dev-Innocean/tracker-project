import axios from 'axios';

const rawBaseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://innocean-tracker.onrender.com' : 'http://localhost:8000');

axios.defaults.baseURL = rawBaseURL.replace(/\/$/, '');

// Setup Axios Interceptor untuk JWT Token
axios.interceptors.request.clear();
axios.interceptors.response.clear();

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('innocean_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const url = String(config.url || '');
  if (url.includes('/api/ai/generate') && config.data && typeof config.data === 'object') {
    if (!config.data.language) {
      config.data.language = localStorage.getItem('innocean_lang') === 'id' ? 'id' : 'en';
    }
    const headers = config.headers || {};
    if (!headers['X-Idempotency-Key'] && !headers['x-idempotency-key']) {
      const key =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      headers['X-Idempotency-Key'] = key;
      config.headers = headers;
    }
  }
  return config;
});

axios.interceptors.response.use(
  (response) => {
    const url = String(response?.config?.url || '');
    if (url.includes('/api/ai/generate') && response?.data?.usage) {
      window.dispatchEvent(
        new CustomEvent('ai_usage_updated', { detail: response.data.usage })
      );
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const detail = (error.response.data?.detail || '').toLowerCase();
      // Hanya logout jika token benar-benar invalid/expired atau user tidak ditemukan
      if (
        detail.includes('token') ||
        detail.includes('signature') ||
        detail.includes('credentials') ||
        detail.includes('no longer exists') ||
        detail.includes('not authenticated')
      ) {
        localStorage.removeItem('innocean_auth');
        localStorage.removeItem('innocean_token');
        localStorage.removeItem('innocean_username');
        localStorage.removeItem('innocean_selected_board');
        window.dispatchEvent(new Event('auth_error'));
      }
    }
    if (
      error.response &&
      error.response.status === 429 &&
      String(error.config?.url || '').includes('/api/ai/')
    ) {
      window.dispatchEvent(new Event('ai_usage_updated'));
    }
    return Promise.reject(error);
  }
);

export default axios;
