/**
 * API Utility for handling requests with Authorization headers
 * Replaces raw fetch calls to ensure token is always sent
 */

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001').replace(/\/$/, '');

const getAuthToken = () => localStorage.getItem('token');

const handleResponse = async (response) => {
    // Handle 401 Unauthorized globally
    if (response.status === 401) {
        // Try to get error details from response
        let errorCode = 'NO_TOKEN';
        let errorMessage = 'Unauthorized';
        
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errorData = await response.json();
                errorCode = errorData.code || errorCode;
                errorMessage = errorData.message || errorMessage;
            }
        } catch (e) {
            // If we can't parse the error, use defaults
        }

        // Check user info BEFORE clearing (to know where to redirect)
        const userStr = localStorage.getItem('user');
        const isAnonymous = userStr ? (JSON.parse(userStr).isAnonymous || false) : false;
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect based on user type and error code
        if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN' || errorCode === 'NO_TOKEN') {
            window.location.href = '/gender';
        } else {
            window.location.href = '/gender';
        }
        
        throw new Error(errorMessage);
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'API Request Failed');
        }
        return data;
    } else {
        if (!response.ok) {
            throw new Error('API Request Failed');
        }
        return response.text();
    }
};

const api = {
    get: async (endpoint) => {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'GET',
            headers
        });

        return handleResponse(response);
    },

    post: async (endpoint, body) => {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        return handleResponse(response);
    },

    put: async (endpoint, body) => {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body)
        });

        return handleResponse(response);
    },

    delete: async (endpoint) => {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'DELETE',
            headers
        });

        return handleResponse(response);
    }
};

export default api;
