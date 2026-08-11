import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  SecureStore = require('expo-secure-store');
} catch (e) {
  SecureStore = null;
}

const ACCESS_TOKEN_KEY = 'sevikaa_token';
const REFRESH_TOKEN_KEY = 'sevikaa_refresh_token';
const USER_SESSION_KEY = 'sevikaa_user_session';

export const secureTokenStorage = {
  async saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      return;
    }

    // Native iOS/Android: Expo SecureStore is MANDATORY. Fail closed if missing.
    if (!SecureStore) {
      throw new Error('CRITICAL: expo-secure-store is not available on native platform.');
    }

    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (err: any) {
      console.error('[secureTokenStorage] Native SecureStore write failure:', err?.message);
      throw new Error('Secure storage failed on native device. Access denied.');
    }
  },

  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    }

    if (!SecureStore) return null;
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (e) {
      console.error('[secureTokenStorage] Native SecureStore read error:', e);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    }

    if (!SecureStore) return null;
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (e) {
      console.error('[secureTokenStorage] Native SecureStore read error:', e);
      return null;
    }
  },

  async clearTokens(): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_SESSION_KEY);
      return;
    }

    if (SecureStore) {
      try {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      } catch (e) {}
    }
    await AsyncStorage.removeItem(USER_SESSION_KEY).catch(() => {});
  }
};
