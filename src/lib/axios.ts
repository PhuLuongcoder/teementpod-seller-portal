import axios from 'axios';
const api = axios.create({
  baseURL: 'http://localhost:9000',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'x-publishable-api-key': 'pk_0f4c80eca1fa8b96c06300ed9da9286bcbdd4f67df4f4bd4241b175d64a87b1a',
  },
});

export default api;