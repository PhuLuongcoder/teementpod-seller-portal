import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'x-publishable-api-key': 'pk_0f4c80eca1fa8b96c06300ed9da9286bcbdd4f67df4f4bd4241b175d64a87b1a',
  },
});

// THÊM INTERCEPTOR NÀY: Tự động gắn Token vào mọi API gọi đi
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('seller_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
