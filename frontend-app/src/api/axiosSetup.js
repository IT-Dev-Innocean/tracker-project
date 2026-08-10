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
  return config;
});

axios.interceptors.response.use(
  (response) => response,
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
    return Promise.reject(error);
  }
);

export default axios;
