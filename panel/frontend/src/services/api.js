import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const automationApi = axios.create({
  baseURL: '/automation/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshRequest = null;

const clearSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('Refresh token unavailable');
  }

  if (!refreshRequest) {
    refreshRequest = axios.post('/api/auth/refresh', { refreshToken })
      .then(({ data }) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

const addAuthentication = (client) => {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        clearSession();
        return Promise.reject(refreshError);
      }
    }
  );
};

addAuthentication(api);
addAuthentication(automationApi);

export default api;
