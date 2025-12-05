/**
 * Auth Utility Functions
 * Helper functions for protecting API routes
 */

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';

/**
 * Check if the current request is authenticated
 * Returns the session if authenticated, null otherwise
 */
export async function getAuthSession() {
  return await getServerSession(authOptions);
}

/**
 * Require authentication for an API route
 * Returns a 401 response if not authenticated
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Nicht autorisiert. Bitte einloggen.' },
      { status: 401 }
    );
  }

  return null;
}
