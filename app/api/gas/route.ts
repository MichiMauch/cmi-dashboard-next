/**
 * Gas Bottles API Route
 * GET: Fetch all gas bottles
 * POST: Add new gas bottle
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import GasBottle from '@/models/gas-bottle';
import { requireAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    const bottles = await GasBottle.find({})
      .sort({ startDate: -1 })
      .lean();

    return NextResponse.json(bottles);
  } catch (error) {
    console.error('[Gas API] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Require authentication for creating bottles
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    await dbConnect();

    const body = await request.json();
    const { type, startDate, notes } = body;

    if (!startDate) {
      return NextResponse.json(
        { error: 'startDate is required' },
        { status: 400 }
      );
    }

    // Check if there's already an active bottle (no endDate)
    const activeBottle = await GasBottle.findOne({ endDate: null });
    if (activeBottle) {
      return NextResponse.json(
        { error: 'Es gibt bereits eine aktive Gasflasche. Bitte zuerst die aktuelle Flasche als leer markieren.' },
        { status: 400 }
      );
    }

    const bottle = await GasBottle.create({
      type: type || '10.5kg',
      startDate: new Date(startDate),
      notes,
    });

    console.log('[Gas API] Created new bottle:', bottle._id);

    return NextResponse.json(bottle, { status: 201 });
  } catch (error) {
    console.error('[Gas API] POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
