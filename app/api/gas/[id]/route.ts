/**
 * Gas Bottle API Route (Individual)
 * PUT: Mark bottle as empty (set endDate)
 * DELETE: Remove bottle
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import GasBottle from '@/models/gas-bottle';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const { endDate } = body;

    if (!endDate) {
      return NextResponse.json(
        { error: 'endDate is required' },
        { status: 400 }
      );
    }

    const bottle = await GasBottle.findByIdAndUpdate(
      id,
      { endDate: new Date(endDate) },
      { new: true }
    );

    if (!bottle) {
      return NextResponse.json(
        { error: 'Gasflasche nicht gefunden' },
        { status: 404 }
      );
    }

    console.log('[Gas API] Updated bottle:', id);

    return NextResponse.json(bottle);
  } catch (error) {
    console.error('[Gas API] PUT Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await dbConnect();

    const { id } = await params;

    const bottle = await GasBottle.findByIdAndDelete(id);

    if (!bottle) {
      return NextResponse.json(
        { error: 'Gasflasche nicht gefunden' },
        { status: 404 }
      );
    }

    console.log('[Gas API] Deleted bottle:', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Gas API] DELETE Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
