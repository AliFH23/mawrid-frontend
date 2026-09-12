import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// attaches the JWT to every request automatically, if one is stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mawrid_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// if the backend ever responds 401 (expired/invalid token) or 403 (disabled account),
// clear the stale session so the app doesn't keep sending a dead token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mawrid_token');
      localStorage.removeItem('mawrid_user');
    }
    return Promise.reject(error);
  }
);

export default api;