import axios from 'axios';

// Setup Axios Base URL (should only be done once)
axios.defaults.baseURL = import.meta.env.PROD ? 'https://innocean-tracker.onrender.com' : 'http://localhost:8000';

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
      localStorage.removeItem('innocean_auth');
      localStorage.removeItem('innocean_token');
      localStorage.removeItem('innocean_username');
      localStorage.removeItem('innocean_selected_board');
      window.dispatchEvent(new Event('auth_error')); // Mencegah infinite reload loop
    }
    return Promise.reject(error);
  }
);

export default axios;
