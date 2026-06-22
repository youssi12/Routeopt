import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30_000,
});

// Attach token
api.interceptors.request.use((cfg) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Handle 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login:   (body: { email: string; password: string }) => api.post('/auth/login', body),
  profile: () => api.get('/auth/profile'),
};

// ─── Dashboard ────────────────────────────────────────────────
export const analyticsApi = {
  dashboard:   () => api.get('/analytics/dashboard'),
  ordersTrend: () => api.get('/analytics/orders-trend'),
  vehicles:    () => api.get('/analytics/vehicles'),
  routes:      () => api.get('/analytics/routes'),
  costs:       () => api.get('/analytics/costs'),
};

// ─── Warehouses ──────────────────────────────────────────────
export const warehousesApi = {
  list:   () => api.get('/warehouses'),
  create: (body: any) => api.post('/warehouses', body),
  delete: (id: string) => api.delete(`/warehouses/${id}`),
};

// ─── Vehicles ────────────────────────────────────────────────
export const vehiclesApi = {
  list:   () => api.get('/vehicles'),
  create: (body: any) => api.post('/vehicles', body),
  update: (id: string, body: any) => api.patch(`/vehicles/${id}`, body),
};

// ─── Orders ──────────────────────────────────────────────────
export const ordersApi = {
  list:   (params?: any) => api.get('/orders', { params }),
  get:    (id: string) => api.get(`/orders/${id}`),
  create: (body: any) => api.post('/orders', body),
  update: (id: string, body: any) => api.patch(`/orders/${id}`, body),
};

// ─── Routes ──────────────────────────────────────────────────
export const routesApi = {
  list:     () => api.get('/routes'),
  get:      (id: string) => api.get(`/routes/${id}`),
  generate: (body: any) => api.post('/routes/generate', body),
};

// ─── Optimization ────────────────────────────────────────────
export const optimizationApi = {
  dijkstra:  (body: any) => api.post('/optimization/dijkstra', body),
  astar:     (body: any) => api.post('/optimization/astar', body),
  genetic:   (body: any) => api.post('/optimization/genetic', body),
  compare:   (body: any) => api.post('/optimization/compare', body),
  assign:    (body: any) => api.post('/optimization/vehicle-assignment', body),
};
