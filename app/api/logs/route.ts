import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await dbService.getAuditLogs();
    const dbStatus = await dbService.getStatus();

    return NextResponse.json({
      success: true,
      logs,
      dbStatus
    });
  } catch (error: any) {
    console.error('Failed to retrieve logs:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}
