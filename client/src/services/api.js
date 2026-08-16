import axios from 'axios';

// Centralized axios instance. All future API calls (auth, posts, etc.)
// should import this instead of creating new axios instances.
const api = axios.create({
  baseURL: '/api', // proxied to http://localhost:5000/api by vite.config.js in dev
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically once auth (Phase 3) is implemented.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
