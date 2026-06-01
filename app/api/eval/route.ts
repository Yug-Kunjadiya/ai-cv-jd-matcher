import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { calculateMetrics } from '@/lib/evaluator';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const analyses = await dbService.getAnalyses();
    const cvs = await dbService.getCVs();
    const jds = await dbService.getJDs();

    const pairs = analyses.map((analysis: any) => {
      const cv = cvs.find((c: any) => c._id.toString() === analysis.cvId.toString());
      const jd = jds.find((j: any) => j._id?.toString() === analysis.jdId?.toString());
      
      return {
        _id: analysis._id.toString(),
        cv_id: cv ? cv.fileName : 'unknown',
        cv_name: cv ? cv.name : 'Unknown Candidate',
        jd_id: jd ? jd._id.toString() : 'unknown',
        jd_title: jd ? jd.title : 'Unknown Job',
        // actual is ground-truth (human label). If not set yet, leave it empty so it shows as 'PENDING'.
        actual: analysis.actual || null,
        predicted: analysis.recommendation === 'hire' ? 'hire' : 'reject',
        fitScore: analysis.fitScore,
        semanticScore: analysis.semanticScore,
        embeddingMatchConfidence: analysis.embeddingMatchConfidence,
        matchedSkills: analysis.matchedSkills,
        missingSkills: analysis.missingSkills
      };
    });

    const labelledPairs = pairs.filter(p => p.actual !== null && p.actual !== undefined);
    const metrics = labelledPairs.length > 0 ? calculateMetrics(pairs as any) : null;

    return NextResponse.json({
      success: true,
      metrics,
      pairs
    });
  } catch (error: any) {
    console.error('Failed to get evaluation metrics:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch metrics' }, { status: 500 });
  }
}
