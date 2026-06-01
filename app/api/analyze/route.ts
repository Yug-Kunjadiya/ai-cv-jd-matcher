import { NextResponse } from 'next/server';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { dbService } from '@/lib/db';
import { redactPII } from '@/lib/redaction';
import { matchCVAndJDSkills, calculateSemanticScore } from '@/lib/embeddings';
import { parseJobDescription, analyzeMatchWithGemini } from '@/lib/gemini';
import { connectDB } from '@/lib/mongodb';
import { Match } from '@/models/Match';

export async function POST(request: Request) {
  try {
    // Connect to database
    await connectDB();
    const formData = await request.formData();
    const cvFile = formData.get('cv') as File | null;
    const jdText = formData.get('jd') as string | null;
    const customApiKey = formData.get('apiKey') as string | null;

    if (!cvFile) {
      return NextResponse.json({ error: 'Missing CV file upload' }, { status: 400 });
    }
    if (!jdText || jdText.trim().length === 0) {
      return NextResponse.json({ error: 'Missing Job Description content' }, { status: 400 });
    }

    const apiKey = customApiKey && customApiKey.trim().length > 0 ? customApiKey.trim() : undefined;

    // 1. Extract CV Text
    let rawText = '';
    const arrayBuffer = await cvFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (cvFile.type === 'text/plain' || cvFile.name.endsWith('.txt')) {
      rawText = buffer.toString('utf8');
    } else if (cvFile.type === 'application/pdf' || cvFile.name.endsWith('.pdf')) {
      try {
        const pdfData = await pdfParse(buffer);
        rawText = pdfData.text;
      } catch (pdfError: any) {
        console.error('pdf-parse failed:', pdfError);
        return NextResponse.json({
          error: 'Failed to extract text from PDF. The file structure might be malformed. Try uploading a text file (.txt) instead.'
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a PDF or plain text resume.' }, { status: 400 });
    }

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json({ error: 'The CV text seems too short or empty. Please ensure it is a valid text-based resume.' }, { status: 400 });
    }

    // 2. Redact PII (Emirates ID, Passports, DOBs, emails, phones)
    const redactionResult = redactPII(rawText);

    // 3. Extract Candidate metadata and save CV to database
    const lowercaseText = rawText.toLowerCase();
    let candidateName = 'Unknown Candidate';
    const nameMatch = rawText.match(/^([A-Za-z.\s]{3,25})\r?\n/);
    if (nameMatch && nameMatch[1]) {
      candidateName = nameMatch[1].trim();
    }

    let experienceYears = 0;
    const expMatches = rawText.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/i);
    if (expMatches && expMatches[1]) {
      experienceYears = parseInt(expMatches[1], 10);
    }

    // Heuristics for visa status
    let visaStatus = 'unknown';
    if (lowercaseText.includes('golden visa')) visaStatus = 'golden visa';
    else if (lowercaseText.includes('dependent visa') || lowercaseText.includes('spouse sponsorship')) visaStatus = 'dependent visa';
    else if (lowercaseText.includes('employment visa')) visaStatus = 'employment visa';

    const emiratesIdMentioned = lowercaseText.includes('emirates id') || lowercaseText.includes('784-');

    // Save CV
    const cvDoc = await dbService.saveCV({
      name: candidateName,
      skills: [], // will be updated by matcher
      education: [],
      experienceYears,
      workHistory: [],
      visaStatus,
      emiratesIdMentioned,
      rawTextRedacted: redactionResult.redactedText,
      fileName: cvFile.name
    });

    // Save PII Redaction Audit Log
    await dbService.saveAuditLog({
      action: 'CV_REDACTION',
      fileName: cvFile.name,
      redactedCount: {
        emiratesIds: redactionResult.counts.emiratesIds,
        passportNumbers: redactionResult.counts.passportNumbers,
        dobs: redactionResult.counts.dobs
      },
      originalSnippet: redactionResult.originalSnippet,
      redactedSnippet: redactionResult.redactedSnippet
    });

    // 4. Parse JD Requirements using Gemini
    const jdDetails = await parseJobDescription(jdText, apiKey);

    // Update CV document skills from parsed JD list matching (to build profile)
    cvDoc.skills = jdDetails.requiredSkills.filter(skill => lowercaseText.includes(skill.toLowerCase()));
    if (cvDoc.save) await cvDoc.save();

    // Save JD
    const jdDoc = await dbService.saveJD({
      title: jdDetails.title,
      requiredSkills: jdDetails.requiredSkills,
      preferredSkills: jdDetails.preferredSkills,
      minExperience: jdDetails.minExperience,
      visaPreference: jdDetails.visaPreference,
      seniorityLevel: jdDetails.seniorityLevel,
      rawText: jdText
    });

    // 5. Compute Local Embedding Similarity matches & Citations
    const allJdSkills = [...jdDetails.requiredSkills, ...jdDetails.preferredSkills];
    const embeddingSkillMatches = await matchCVAndJDSkills(redactionResult.redactedText, allJdSkills);

    // Compute overall semantic similarity score and matched vs missing skills using local embeddings
    const semanticData = await calculateSemanticScore(redactionResult.redactedText, jdText);
    const confidence = Math.round((semanticData.semanticScore * 0.7 + (semanticData.matchedSkills.length / Math.max(1, semanticData.matchedSkills.length + semanticData.missingSkills.length)) * 0.3) * 100);

    // 6. Structured Gemini Reasoning
    const matchAnalysis = await analyzeMatchWithGemini(
      redactionResult.redactedText,
      jdDetails,
      embeddingSkillMatches,
      semanticData,
      apiKey
    );

    // 7. Save Analysis
    console.log("Saving analysis...");
    const analysisDoc = await dbService.saveAnalysis({
      cvId: cvDoc._id,
      jdId: jdDoc._id,
      fitScore: matchAnalysis.fit_score,
      recommendation: matchAnalysis.recommendation,
      // actual is intentionally left unset — it is ground-truth set manually by the user via the Evaluation Hub toggle
      perSkillScores: matchAnalysis.per_skill_scores,
      topReasons: matchAnalysis.top_reasons,
      gaps: matchAnalysis.gaps,
      visaAnalysis: matchAnalysis.visa_analysis,
      seniorityAnalysis: matchAnalysis.seniority_analysis,
      summary: matchAnalysis.summary,
      semanticScore: semanticData.semanticScore,
      embeddingMatchConfidence: confidence,
      matchedSkills: semanticData.matchedSkills,
      missingSkills: semanticData.missingSkills
    });

    // Create record in the matches collection
    const matchDoc = await Match.create({
      candidateName: candidateName,
      fitScore: matchAnalysis.fit_score,
      recommendation: matchAnalysis.recommendation,
      jd: jdDetails.title || "Software Engineer",
      semanticScore: semanticData.semanticScore,
      matchedSkills: semanticData.matchedSkills,
      gaps: matchAnalysis.gaps,
      createdAt: new Date()
    });

    console.log("Saved successfully");

    const dbStatus = await dbService.getStatus();

    return NextResponse.json({
      success: true,
      analysis: {
        ...matchAnalysis,
        _id: analysisDoc._id,
        cvName: candidateName,
        jdTitle: jdDetails.title,
        cvFileName: cvFile.name,
        timestamp: new Date(),
        semanticScore: semanticData.semanticScore,
        embeddingMatchConfidence: confidence,
        matchedSkills: semanticData.matchedSkills,
        missingSkills: semanticData.missingSkills
      },
      dbStatus
    });
  } catch (error: any) {
    console.error('API matching process failed:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to complete matching analysis',
      details: error.stack || error
    }, { status: 500 });
  }
}
