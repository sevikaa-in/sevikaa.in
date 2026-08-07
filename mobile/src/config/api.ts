/**
 * Sevikaa Mobile Centralized Environment & API Configuration
 * Automatically switches between Ngrok Tunnel (Development) and Live Production Server
 */

declare const __DEV__: boolean;

// Production Live Server Domain
export const PROD_API_BASE_URL = 'https://www.sevikaa.in';

// Development Ngrok Tunnel URL (Points to Localhost Port 3000)
export const DEV_NGROK_URL = 'https://reselect-posh-sixties.ngrok-free.dev';

// Automatically detect build environment (__DEV__ flag in React Native)
export const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
export const API_BASE_URL = IS_DEV ? DEV_NGROK_URL : PROD_API_BASE_URL;

/**
 * Returns full API or Web URL for mobile requests
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
