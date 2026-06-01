import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize the Gemini client helper
function getGeminiClient(customKey?: string) {
  const key = customKey || process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

export interface ParsedJD {
  title: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minExperience: number;
  visaPreference: string;
  seniorityLevel: string;
}

export interface MatchAnalysis {
  fit_score: number;
  recommendation: 'hire' | 'borderline' | 'reject';
  per_skill_scores: {
    skill: string;
    score: number;
    evidence: string;
  }[];
  top_reasons: string[];
  gaps: string[];
  visa_analysis: string;
  seniority_analysis: string;
  summary: string;
}

/**
 * Parses JD text into structured JSON fields using Gemini
 */
export async function parseJobDescription(
  jdText: string,
  customApiKey?: string
): Promise<ParsedJD> {
  const genAI = getGeminiClient(customApiKey);

  if (!genAI) {
    console.warn("Gemini API key not found. Using local heuristic parser for JD.");
    return simulateJDParse(jdText);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            requiredSkills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            preferredSkills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            minExperience: { type: SchemaType.INTEGER },
            visaPreference: { type: SchemaType.STRING },
            seniorityLevel: { type: SchemaType.STRING },
          },
          required: ['title', 'requiredSkills', 'preferredSkills', 'minExperience', 'visaPreference', 'seniorityLevel']
        }
      }
    });

    const prompt = `
      You are an expert HR recruiter. Analyze the following Job Description (JD) text and extract details as structured JSON:
      
      JOB DESCRIPTION:
      """
      ${jdText}
      """
      
      Extract:
      1. Job Title.
      2. List of 5-8 Required core technical/hard skills.
      3. List of 3-5 Preferred or nice-to-have skills.
      4. Minimum experience years required (default to 0 if not specified).
      5. Visa preference (e.g. golden visa, local residency, open, employment sponsorship, etc.).
      6. Seniority level (junior, mid, senior, lead).
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as ParsedJD;
  } catch (error) {
    console.error("Gemini JD parsing failed, using simulator fallback:", error);
    return simulateJDParse(jdText);
  }
}

/**
 * Computes match analysis comparing CV text and JD using Gemini
 */
export async function analyzeMatchWithGemini(
  cvTextRedacted: string,
  jdDetails: ParsedJD,
  embeddingMatches: { skill: string; score: number; evidence: string }[],
  semanticData?: { semanticScore: number; matchedSkills: string[]; missingSkills: string[] },
  customApiKey?: string
): Promise<MatchAnalysis> {
  const genAI = getGeminiClient(customApiKey);

  if (!genAI) {
    console.warn("Gemini API key not found. Simulating CV matching analysis.");
    return simulateMatchAnalysis(cvTextRedacted, jdDetails, embeddingMatches);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            fit_score: { type: SchemaType.INTEGER },
            recommendation: { type: SchemaType.STRING },
            per_skill_scores: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  skill: { type: SchemaType.STRING },
                  score: { type: SchemaType.INTEGER },
                  evidence: { type: SchemaType.STRING }
                },
                required: ['skill', 'score', 'evidence']
              }
            },
            top_reasons: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            gaps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            visa_analysis: { type: SchemaType.STRING },
            seniority_analysis: { type: SchemaType.STRING },
            summary: { type: SchemaType.STRING }
          },
          required: [
            'fit_score',
            'recommendation',
            'per_skill_scores',
            'top_reasons',
            'gaps',
            'visa_analysis',
            'seniority_analysis',
            'summary'
          ]
        }
      }
    });

    const prompt = `
      You are an expert HR-tech match analyzer. Evaluate this Candidate's redacted CV against the Job Description (JD) criteria.
      We have pre-calculated embedding similarity matches for some key skills. Use those as guidance, but adjust based on overall semantic context and candidate experience.

      JOB DESCRIPTION DETAILS:
      - Title: ${jdDetails.title}
      - Required Skills: ${jdDetails.requiredSkills.join(', ')}
      - Preferred Skills: ${jdDetails.preferredSkills.join(', ')}
      - Min Experience: ${jdDetails.minExperience} years
      - Seniority level: ${jdDetails.seniorityLevel}
      - Visa preference: ${jdDetails.visaPreference}

      PRE-CALCULATED EMBEDDING SKILLS & CITATIONS:
      ${JSON.stringify(embeddingMatches, null, 2)}

      ${semanticData ? `LOCAL EMBEDDING SEMANTIC MATCH PROFILE:
      - Overall Semantic Score: ${Math.round(semanticData.semanticScore * 100)}%
      - Semantically Matched Skills: ${semanticData.matchedSkills.join(', ')}
      - Semantically Missing Skills: ${semanticData.missingSkills.join(', ')}
      ` : ''}

      CANDIDATE REDACTED CV:
      """
      ${cvTextRedacted}
      """

      Evaluate and output a strict JSON containing:
      1. "fit_score": A total fit score from 0 to 100 based on skill overlap, experience level match, education, and visa compatibility.
      2. "recommendation": "hire" (if fit_score >= 80), "borderline" (if fit_score is 55-79), or "reject" (if fit_score < 55).
      3. "per_skill_scores": Array containing scores (0-100) and specific evidence quotes/citations from the CV for each required and preferred skill.
      4. "top_reasons": Top 5 concrete reasons why this candidate matches the JD.
      5. "gaps": Top 3 skill gaps or mismatches.
      6. "visa_analysis": Analysis of UAE visa status mentions (Employment, Dependent, Golden Visa) and work permission.
      7. "seniority_analysis": Match of candidate's experience years and background to the required seniority level (${jdDetails.seniorityLevel}).
      8. "summary": A brief 3-sentence recruiter summary of the candidate's alignment.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as MatchAnalysis;
  } catch (error) {
    console.error("Gemini matching analysis failed, falling back to simulator:", error);
    return simulateMatchAnalysis(cvTextRedacted, jdDetails, embeddingMatches);
  }
}

// --- LOCAL HEURISTIC SIMULATORS (For offline/error-free execution) ---

function matchesWholeWord(text: string, word: string): boolean {
  const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(?:^|[^a-zA-Z0-9_+#])(${escaped})(?:$|[^a-zA-Z0-9_+#])`, 'i');
  return regex.test(text);
}

function simulateJDParse(jdText: string): ParsedJD {
  const lowercase = jdText.toLowerCase().trim();
  
  // Heuristic job title extraction
  let title = '';
  const jdLines = jdText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // If the JD is very short (under 50 chars), it's probably the title/role itself
  if (jdText.trim().length > 0 && jdText.trim().length < 50) {
    title = jdText.trim();
  } else {
    // Try to find a line matching role/title
    const titleMatches = jdText.match(/(?:role|position|title|job title|looking for a|hiring for a):\s*([A-Za-z0-9\s#+\-./]+)/i);
    if (titleMatches && titleMatches[1]) {
      title = titleMatches[1].trim().split('\n')[0];
    } else if (jdLines.length > 0) {
      if (jdLines[0].length < 60) {
        title = jdLines[0];
      }
    }
  }
  if (!title) {
    title = 'Software Engineer';
  }

  // Capitalize title words cleanly
  title = title.split(' ').filter(w => w.length > 0).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  // Heuristic skills extraction dictionary covering multiple business and technical sectors
  const commonSkills = [
    // Tech & Engineering
    'react', 'node.js', 'mongodb', 'express', 'typescript', 'javascript', 'python',
    'pytorch', 'tensorflow', 'pandas', 'scikit-learn', 'sql', 'docker', 'aws', 'git',
    'next.js', 'tailwind css', 'tailwind', 'machine learning', 'nlp', 'embeddings',
    // Marketing & Commerce
    'digital marketing', 'seo', 'sem', 'social media', 'google analytics', 'copywriting',
    'content strategy', 'email marketing', 'ppc', 'branding', 'campaign management',
    // Management, HR & Admin
    'recruitment', 'sourcing', 'ats', 'interviews', 'onboarding', 'hris', 'project management',
    'agile', 'scrum', 'product management', 'business development', 'sales', 'customer support',
    // Creative & Design
    'figma', 'ui/ux', 'photoshop', 'illustrator', 'graphic design', 'web design'
  ];

  let foundSkills = commonSkills.filter(skill => matchesWholeWord(lowercase, skill));

  // If no predefined skills are found in the text, extract dynamically
  if (foundSkills.length === 0) {
    if (jdText.trim().length > 0 && jdText.trim().length < 60) {
      foundSkills.push(jdText.trim());
    } else {
      // Split by commas, newlines, and other separators to extract potential skills
      const dynamicSkills = jdText
        .split(/[,\n;\u2022\u00b7]/)
        .map(s => s.trim())
        .filter(s => s.length > 2 && s.length < 30 && !/^(required|preferred|skills|experience|job|description|looking|for|role|position|we|are|our|candidate)$/i.test(s));
      
      if (dynamicSkills.length > 0) {
        foundSkills = dynamicSkills.slice(0, 5);
      }
    }
  }

  // Absolute fallback
  if (foundSkills.length === 0) {
    foundSkills.push('General Professional Competence');
  }

  // Split required vs preferred
  const requiredSkills = foundSkills.slice(0, Math.max(1, Math.min(5, foundSkills.length))).map(s => s.split(' ').filter(w => w.length > 0).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '));
  const preferredSkills = foundSkills.slice(requiredSkills.length, requiredSkills.length + 3).map(s => s.split(' ').filter(w => w.length > 0).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '));

  // Experience parsing
  let minExperience = 2;
  const expMatch = jdText.match(/(\d+)\+?\s*(?:year|yr)s?\s*(?:of\s*)?experience/i);
  if (expMatch && expMatch[1]) {
    minExperience = parseInt(expMatch[1], 10);
  }

  // Seniority
  let seniorityLevel = 'mid';
  if (lowercase.includes('senior') || lowercase.includes('sr.') || minExperience >= 5) {
    seniorityLevel = 'senior';
  } else if (lowercase.includes('lead') || lowercase.includes('principal') || minExperience >= 8) {
    seniorityLevel = 'lead';
  } else if (lowercase.includes('junior') || lowercase.includes('jr.') || minExperience <= 1) {
    seniorityLevel = 'junior';
  }

  // Visa preference
  let visaPreference = 'UAE Resident preferred';
  if (lowercase.includes('golden visa')) {
    visaPreference = 'Golden Visa holder preferred';
  } else if (lowercase.includes('sponsorship') || lowercase.includes('sponsor')) {
    visaPreference = 'Employment Visa sponsorship available';
  }

  return {
    title,
    requiredSkills,
    preferredSkills,
    minExperience,
    visaPreference,
    seniorityLevel
  };
}

function simulateMatchAnalysis(
  cvText: string,
  jdDetails: ParsedJD,
  embeddingMatches: { skill: string; score: number; evidence: string }[]
): MatchAnalysis {
  const lowercaseCV = cvText.toLowerCase();

  // Separate required and preferred skill scores
  const reqSkillsLower = jdDetails.requiredSkills.map(s => s.toLowerCase());
  
  const reqMatches = embeddingMatches.filter(m => reqSkillsLower.includes(m.skill.toLowerCase()));
  const prefMatches = embeddingMatches.filter(m => !reqSkillsLower.includes(m.skill.toLowerCase()));

  const avgReqScore = reqMatches.length > 0
    ? reqMatches.reduce((acc, curr) => acc + curr.score, 0) / reqMatches.length
    : 0;

  const avgPrefScore = prefMatches.length > 0
    ? prefMatches.reduce((acc, curr) => acc + curr.score, 0) / prefMatches.length
    : 0;

  // Extract experience years
  let candidateExp = 3;
  const expMatches = cvText.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/i);
  if (expMatches && expMatches[1]) {
    candidateExp = parseInt(expMatches[1], 10);
  }

  // Calculate fit score (weighted: 70% required skills, 10% preferred skills, 20% experience)
  const skillsContribution = (avgReqScore * 0.7) + (avgPrefScore * 0.1);
  
  let expScore = 10;
  if (candidateExp >= jdDetails.minExperience) {
    expScore = 20;
  } else if (candidateExp > 0 && jdDetails.minExperience > 0) {
    expScore = Math.round((candidateExp / jdDetails.minExperience) * 20);
  }

  let fit_score = Math.round(skillsContribution + expScore);
  
  // Baseline education/visa adjustment (up to +10) if there's any skill compatibility
  if (avgReqScore >= 30) {
    fit_score += 10;
  }

  fit_score = Math.max(0, Math.min(100, fit_score));

  // GATING LOGIC: If required skills match is poor, cap the overall fit score.
  if (avgReqScore < 60) {
    fit_score = Math.min(70, fit_score);
  }
  if (avgReqScore < 45) {
    fit_score = Math.min(50, fit_score);
  }
  if (avgReqScore < 30) {
    fit_score = Math.min(30, fit_score);
  }
  if (avgReqScore < 15) {
    fit_score = Math.min(10, fit_score);
  }

  // Determine recommendation
  let recommendation: 'hire' | 'borderline' | 'reject' = 'borderline';
  if (fit_score >= 80) recommendation = 'hire';
  else if (fit_score < 50) recommendation = 'reject';

  // Extract top reasons and gaps
  const top_reasons: string[] = [];
  const gaps: string[] = [];

  // Match reasons
  const strongMatches = embeddingMatches.filter(m => m.score >= 60);
  strongMatches.slice(0, 3).forEach(m => {
    top_reasons.push(`Demonstrated familiarity and project application of ${m.skill} (${m.score}% match).`);
  });

  if (candidateExp >= jdDetails.minExperience) {
    top_reasons.push(`Meets or exceeds minimum required experience (${candidateExp} years vs ${jdDetails.minExperience} required).`);
  } else {
    gaps.push(`Candidate has ${candidateExp} years of experience, which is below the required ${jdDetails.minExperience} years.`);
  }

  const weakMatches = embeddingMatches.filter(m => m.score < 50);
  weakMatches.slice(0, 3).forEach(m => {
    gaps.push(`Missing core competency or context for key skill: "${m.skill}" (${m.score}% match).`);
  });

  // Default filler reasons & gaps if needed
  if (top_reasons.length === 0) {
    top_reasons.push("Candidate profile holds experience timelines matching professional standards.");
  }
  while (top_reasons.length < 5) {
    if (avgReqScore >= 50) {
      top_reasons.push("Skills alignment matches core job description requirements.");
    } else {
      top_reasons.push("General educational qualifications align with structured engineering background.");
    }
    top_reasons.push("Has demonstrated history in related functional areas.");
  }
  // Trim/slice to exactly 5 elements
  top_reasons.splice(5);

  if (gaps.length === 0) {
    gaps.push("Lack of advanced cloud-deployment mentions (Docker, Kubernetes).");
  }
  while (gaps.length < 3) {
    gaps.push("No explicit technical certification details provided in CV.");
  }
  gaps.splice(3);

  // UAE Visa analysis
  let visa_analysis = 'No specific UAE visa details were detected in the CV. Standard employment visa sponsorship may be required.';
  if (lowercaseCV.includes('golden visa')) {
    visa_analysis = 'Candidate explicitly mentions holding a UAE Golden Visa, meaning they require no employment sponsorship and can start immediately.';
  } else if (lowercaseCV.includes('dependent visa') || lowercaseCV.includes('spouse visa') || lowercaseCV.includes('father\'s sponsorship')) {
    visa_analysis = 'Candidate is on a UAE Dependent Visa. They require work permit authorization but do not require direct residency sponsorship.';
  } else if (lowercaseCV.includes('employment visa') || lowercaseCV.includes('residence visa')) {
    visa_analysis = 'Candidate currently holds a UAE Employment Visa. Standard visa transfer or new sponsorship is required upon hire.';
  }

  // Seniority analysis
  let seniority_analysis = `The candidate has ${candidateExp} years of experience. This aligns well with the ${jdDetails.seniorityLevel} seniority level requested.`;
  if (candidateExp < jdDetails.minExperience - 2) {
    seniority_analysis = `The candidate possesses ${candidateExp} years of experience. This is slightly junior for the requested ${jdDetails.seniorityLevel} role (${jdDetails.minExperience} years required).`;
  } else if (candidateExp > jdDetails.minExperience + 5) {
    seniority_analysis = `The candidate is highly experienced (${candidateExp} years). This exceeds the ${jdDetails.seniorityLevel} requirements and they may be overqualified.`;
  }

  // Summary
  const matchedList = strongMatches.map(m => m.skill).join(', ');
  const missingList = weakMatches.map(m => m.skill).join(', ');
  
  let summary = '';
  if (fit_score >= 80) {
    summary = `Candidate shows an excellent ${fit_score}% overall alignment for the ${jdDetails.title} position. They demonstrate solid experience in core skills like ${matchedList || 'required areas'}. They currently require ${visa_analysis.toLowerCase().includes('golden') ? 'no visa sponsorship' : 'normal visa processing'}.`;
  } else if (fit_score >= 50) {
    summary = `Candidate shows a borderline ${fit_score}% overall alignment for the ${jdDetails.title} position. They demonstrate familiarity with some key elements, but have noticeable gaps in ${missingList || 'essential skills'}.`;
  } else {
    summary = `Candidate is not a fit (${fit_score}% match) for the ${jdDetails.title} position due to a mismatch in core required skills (${missingList || 'required skills'}). Recommendation is to reject.`;
  }

  return {
    fit_score,
    recommendation,
    per_skill_scores: embeddingMatches,
    top_reasons,
    gaps,
    visa_analysis,
    seniority_analysis,
    summary
  };
}
