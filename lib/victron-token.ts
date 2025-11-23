/**
 * Victron Token Management with MongoDB
 * Handles token storage, retrieval, and automatic refresh
 */

import dbConnect from './dbConnect';
import Token from '@/models/token';
import { loginToVictron } from './victron';

const TOKEN_TTL = 3600; // 1 hour in seconds

/**
 * Get valid Victron access token
 * First tries MongoDB, then falls back to login
 */
export async function getVictronToken(): Promise<string> {
  console.log('[Token] Getting Victron token...');
  try {
    await dbConnect();
    console.log('[Token] MongoDB connected');

    // Try to get token from MongoDB
    const tokenDoc = await Token.findOne();

    if (tokenDoc && tokenDoc.expiresAt > new Date()) {
      console.log('[Token] Using stored token from MongoDB, expires at:', tokenDoc.expiresAt);
      return tokenDoc.accessToken;
    }

    // Token expired or doesn't exist
    if (tokenDoc) {
      console.log('[Token] Token expired, refreshing...');
    } else {
      console.log('[Token] No token found in MongoDB, generating new one...');
    }
  } catch (error) {
    console.error('[Token] MongoDB error:', error);
  }

  // No valid stored token, login and get new token
  return await refreshVictronToken();
}

/**
 * Refresh Victron token by logging in again
 * Stores new token in MongoDB
 */
export async function refreshVictronToken(): Promise<string> {
  const username = process.env.VICTRON_USERNAME;
  const password = process.env.VICTRON_PASSWORD;

  console.log('[Token] Refresh - Username:', username ? 'SET' : 'NOT SET');
  console.log('[Token] Refresh - Password:', password ? 'SET' : 'NOT SET');

  if (!username || !password) {
    throw new Error('VICTRON_USERNAME and VICTRON_PASSWORD must be set');
  }

  console.log('[Token] Refreshing Victron token via login...');
  const newToken = await loginToVictron(username, password);

  // Calculate expiration time
  const expiresAt = new Date(Date.now() + TOKEN_TTL * 1000);

  // Store in MongoDB (upsert)
  try {
    await dbConnect();
    await Token.updateOne(
      {},
      { accessToken: newToken, expiresAt },
      { upsert: true }
    );
    console.log('[Token] New token stored in MongoDB, expires at:', expiresAt);
  } catch (error) {
    console.error('[Token] Could not store token in MongoDB:', error);
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
