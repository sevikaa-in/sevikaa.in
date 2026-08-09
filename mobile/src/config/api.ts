/**
 * Sevikaa Mobile Centralized Environment & API Configuration
 * Dynamically loads environment variables via EXPO_PUBLIC_ prefix
 */

declare const __DEV__: boolean;

export const PROD_API_BASE_URL = 
  process.env.EXPO_PUBLIC_PROD_API_URL || 
  'https://www.sevikaa.in';

export const DEV_NGROK_URL = 
  process.env.EXPO_PUBLIC_API_BASE_URL || 
  'https://reselect-posh-sixties.ngrok-free.dev';

export const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
export const API_BASE_URL = IS_DEV ? DEV_NGROK_URL : PROD_API_BASE_URL;

/**
 * Returns full API or Web URL for mobile requests
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
