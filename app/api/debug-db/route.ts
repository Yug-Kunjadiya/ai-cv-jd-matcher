import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Match } from '@/models/Match';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    
    const testMatch = await Match.create({
      candidateName: "Test Candidate",
      fitScore: 85,
      recommendation: "hire",
      jd: "Test Software Engineer",
      semanticScore: 0.85,
      matchedSkills: ["React", "Node.js"],
      gaps: ["Docker"],
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: "Database debug connection and write succeeded!",
      insertedDocument: testMatch
    });
  } catch (error: any) {
    console.error("Debug DB connection/write failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to write to database",
      details: error.stack || error
    }, { status: 500 });
  }
}
