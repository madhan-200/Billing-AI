import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    verify: () => api.get('/auth/verify'),
    logout: () => api.post('/auth/logout')
};

// Invoices API
export const invoicesAPI = {
    getAll: (params) => api.get('/invoices', { params }),
    getById: (id) => api.get(`/invoices/${id}`),
    getByStatus: (status) => api.get(`/invoices/status/${status}`),
    getOverdue: () => api.get('/invoices/overdue/list'),
    create: (data) => api.post('/invoices', data),
    updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
    generatePDF: (id) => api.post(`/invoices/${id}/generate-pdf`),
    validate: (id) => api.post(`/invoices/${id}/validate`),
    send: (id) => api.post(`/invoices/${id}/send`),
    downloadPDF: (id) => api.get(`/invoices/${id}/pdf`)
};

// Customers API
export const customersAPI = {
    getAll: () => api.get('/customers'),
    getById: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`)
};

// Payments API
export const paymentsAPI = {
    getAll: () => api.get('/payments'),
    getByInvoice: (invoiceId) => api.get(`/payments/invoice/${invoiceId}`),
    create: (data) => api.post('/payments', data)
};

// AI Insights API
export const insightsAPI = {
    getValidation: () => api.get('/insights/validation'),
    getTrends: () => api.get('/insights/trends'),
    handleQuery: (data) => api.post('/insights/query', data),
    getQueryStats: () => api.get('/insights/query-stats'),
    getSuggestions: () => api.get('/insights/suggestions')
};

// Audit API
export const auditAPI = {
    getLogs: (params) => api.get('/audit/logs', { params }),
    getAIDecisions: () => api.get('/audit/ai-decisions'),
    generateReport: (data) => api.post('/audit/compliance-report', data)
};

export default api;
