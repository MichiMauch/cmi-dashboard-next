/**
 * Victron Token Management with Vercel KV
 * Handles token storage, retrieval, and automatic refresh
 */

import { kv } from '@vercel/kv';
import { loginToVictron } from './victron';

const TOKEN_KEY = 'victron_access_token';
const TOKEN_TTL = 3600; // 1 hour

/**
 * Get valid Victron access token
 * First tries KV, then falls back to login
 */
export async function getVictronToken(): Promise<string> {
  try {
    // Try to get token from KV
    const storedToken = await kv.get<string>(TOKEN_KEY);

    if (storedToken) {
      console.log('Using stored Victron token from KV');
      return storedToken;
    }
  } catch (error) {
    console.warn('KV not available, will generate new token:', error);
  }

  // No stored token or KV not available, login and get new token
  return await refreshVictronToken();
}

/**
 * Refresh Victron token by logging in again
 * Stores new token in KV
 */
export async function refreshVictronToken(): Promise<string> {
  const username = process.env.VICTRON_USERNAME;
  const password = process.env.VICTRON_PASSWORD;

  if (!username || !password) {
    throw new Error('VICTRON_USERNAME and VICTRON_PASSWORD must be set');
  }

  console.log('Refreshing Victron token via login...');
  const newToken = await loginToVictron(username, password);

  // Try to store in KV (don't fail if KV not available)
  try {
    await kv.set(TOKEN_KEY, newToken, { ex: TOKEN_TTL });
    console.log('New Victron token stored in KV');
  } catch (error) {
    console.warn('Could not store token in KV:', error);
  }

  return newToken;
}

/**
 * Fetch Victron data with automatic token refresh on 401
 */
export async function fetchWithTokenRefresh<T>(
  fetchFn: (token: string) => Promise<T>
): Promise<T> {
  let token = await getVictronToken();

  try {
    return await fetchFn(token);
  } catch (error) {
    // If token invalid, refresh and retry once
    if (error instanceof Error && error.message === 'INVALID_TOKEN') {
      console.log('Token invalid, refreshing...');
      token = await refreshVictronToken();
      return await fetchFn(token);
    }
    throw error;
  }
}
