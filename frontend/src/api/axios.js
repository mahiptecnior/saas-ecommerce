import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001/api/v1',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Optional: Add tenant context from local storage if needed
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
        config.headers['X-Tenant-Id'] = tenantId;
    }

    return config;
});

export default api;
