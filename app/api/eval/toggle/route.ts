import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { analysisId, actual } = body;

    if (!analysisId) {
      return NextResponse.json({ error: 'Missing analysisId parameter' }, { status: 400 });
    }
    if (actual !== 'hire' && actual !== 'reject') {
      return NextResponse.json({ error: 'Invalid actual value (must be "hire" or "reject")' }, { status: 400 });
    }

    const updated = await dbService.updateAnalysisActual(analysisId, actual);

    if (!updated) {
      return NextResponse.json({ error: 'Analysis not found in datastore' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      analysis: updated
    });
  } catch (error: any) {
    console.error('Failed to toggle actual status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
