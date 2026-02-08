import api from './api';

export const chatService = {
    // Join matchmaking queue
    async joinQueue(preference = 'both') {
        try {
            const response = await api.post('/api/chat/queue/join', { preference });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Check match status
    async checkMatchStatus() {
        try {
            const response = await api.get('/api/chat/queue/status');
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Send message
    async sendMessage(roomId, message) {
        try {
            const response = await api.post('/api/chat/messages', {
                roomId,
                message,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Poll for updates
    async pollUpdates(roomId, since) {
        try {
            const response = await api.get(`/api/chat/updates?roomId=${roomId}&since=${since}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Set typing status
    async setTyping() {
        try {
            await api.post('/api/chat/typing');
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    },

    // Leave chat
    async leaveChat() {
        try {
            await api.post('/api/chat/leave');
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },
};
