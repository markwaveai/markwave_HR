import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Shared storage utility for the mobile application.
 * Provides a unified interface for AsyncStorage with fallback mechanisms.
 */
export const storage = {
    /**
     * Retrieves an item from storage.
     * @param key The key of the item to retrieve.
     */
    getItem: async (key: string): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(key);
        } catch (e) {
            console.warn(`AsyncStorage error (getItem ${key}):`, e);
            return (globalThis as any)[`fallback_${key}`] || null;
        }
    },

    /**
     * Saves an item to storage.
     * @param key The key of the item to save.
     * @param value The value to save.
     */
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (e) {
            console.warn(`AsyncStorage error (setItem ${key}):`, e);
            (globalThis as any)[`fallback_${key}`] = value;
        }
    },

    /**
     * Removes an item from storage.
     * @param key The key of the item to remove.
     */
    removeItem: async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (e) {
            console.warn(`AsyncStorage error (removeItem ${key}):`, e);
            delete (globalThis as any)[`fallback_${key}`];
        }
    },

    /**
     * Clears all items from storage (use with caution).
     */
    clear: async (): Promise<void> => {
        try {
            await AsyncStorage.clear();
        } catch (e) {
            console.warn('AsyncStorage error (clear):', e);
        }
    }
};
