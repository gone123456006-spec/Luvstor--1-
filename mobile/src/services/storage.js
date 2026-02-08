import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    TOKEN: '@luvstor_token',
    USER: '@luvstor_user',
    CHAT_SESSION: '@luvstor_chat_session',
};

export const storage = {
    // Token management
    async saveToken(token) {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
        } catch (error) {
            console.error('Error saving token:', error);
        }
    },

    async getToken() {
        try {
            return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },

    async removeToken() {
        try {
            await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
        } catch (error) {
            console.error('Error removing token:', error);
        }
    },

    // User management
    async saveUser(user) {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        } catch (error) {
            console.error('Error saving user:', error);
        }
    },

    async getUser() {
        try {
            const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    async removeUser() {
        try {
            await AsyncStorage.removeItem(STORAGE_KEYS.USER);
        } catch (error) {
            console.error('Error removing user:', error);
        }
    },

    // Chat session management
    async saveChatSession(session) {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.CHAT_SESSION, JSON.stringify(session));
        } catch (error) {
            console.error('Error saving chat session:', error);
        }
    },

    async getChatSession() {
        try {
            const sessionStr = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_SESSION);
            return sessionStr ? JSON.parse(sessionStr) : null;
        } catch (error) {
            console.error('Error getting chat session:', error);
            return null;
        }
    },

    async clearChatSession() {
        try {
            await AsyncStorage.removeItem(STORAGE_KEYS.CHAT_SESSION);
        } catch (error) {
            console.error('Error clearing chat session:', error);
        }
    },

    // Clear all data
    async clearAll() {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.TOKEN,
                STORAGE_KEYS.USER,
                STORAGE_KEYS.CHAT_SESSION,
            ]);
        } catch (error) {
            console.error('Error clearing all data:', error);
        }
    },
};
