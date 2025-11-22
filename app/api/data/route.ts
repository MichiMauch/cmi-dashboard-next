/**
 * API Route to fetch dashboard data
 * Can be used for client-side fetching if needed
 */

import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every 60 minutes

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
