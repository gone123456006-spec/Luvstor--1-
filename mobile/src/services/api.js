import axios from 'axios';
import { storage } from './storage';

// Backend URL - matches the frontend configuration
import { BACKEND_URL } from '@env';



// Create axios instance
const api = axios.create({
    baseURL: BACKEND_URL.replace(/\/$/, ''),
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    async (config) => {
        const token = await storage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response) {
            // Server responded with error
            const { status, data } = error.response;

            if (status === 401) {
                // Unauthorized - clear auth data
                await storage.removeToken();
                await storage.removeUser();
            }

            return Promise.reject({
                status,
                message: data.message || 'An error occurred',
                data,
            });
        } else if (error.request) {
            // Network error
            return Promise.reject({
                status: 0,
                message: 'Unable to connect to server. Please check your internet connection.',
                isNetworkError: true,
            });
        } else {
            // Other errors
            return Promise.reject({
                status: 0,
                message: error.message || 'An unexpected error occurred',
            });
        }
    }
);

export default api;
