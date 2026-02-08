import api from './api';
import { storage } from './storage';

export const authService = {
    // Anonymous login
    async anonymousLogin(username, country, gender) {
        try {
            const response = await api.post('/api/auth/anonymous', {
                username,
                country,
                gender,
            });

            if (response.data.success) {
                await storage.saveToken(response.data.token);
                await storage.saveUser(response.data.user);
                return { success: true, user: response.data.user };
            }

            return { success: false, message: response.data.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Login
    async login(identifier, password) {
        try {
            const response = await api.post('/api/auth/login', {
                identifier,
                password,
            });

            if (response.data.token) {
                await storage.saveToken(response.data.token);
                await storage.saveUser(response.data.user);
                return { success: true, user: response.data.user };
            }

            return { success: false, message: response.data.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Signup
    async signup(userData) {
        try {
            const response = await api.post('/api/auth/signup', userData);

            if (response.data.token) {
                await storage.saveToken(response.data.token);
                await storage.saveUser(response.data.user);
                return { success: true, user: response.data.user };
            }

            return { success: false, message: response.data.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Get current user
    async getMe() {
        try {
            const response = await api.get('/api/auth/me');

            if (response.data.user) {
                await storage.saveUser(response.data.user);
                return { success: true, user: response.data.user };
            }

            return { success: false };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Logout
    async logout() {
        try {
            await storage.clearAll();
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Check if user is authenticated
    async isAuthenticated() {
        const token = await storage.getToken();
        return !!token;
    },

    // Get stored user
    async getStoredUser() {
        return await storage.getUser();
    },
};
