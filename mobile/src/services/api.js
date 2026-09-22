import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from './storage';

// Backend URL from .env (for native) or same host when on web so backend is reachable
import { BACKEND_URL as ENV_BACKEND_URL } from '@env';

const getBaseURL = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        return `http://${window.location.hostname}:5001`;
    }
    const fromEnv = typeof ENV_BACKEND_URL !== 'undefined' && ENV_BACKEND_URL ? ENV_BACKEND_URL : 'http://localhost:5001';
    return fromEnv.replace(/\/$/, '');
};

const baseURL = getBaseURL();

// Create axios instance
const api = axios.create({
    baseURL,
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
            // Network error (backend not running, wrong URL, or on device: set BACKEND_URL in .env to your PC IP)
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
