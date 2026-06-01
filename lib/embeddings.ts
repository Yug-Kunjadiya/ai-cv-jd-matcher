// @ts-ignore
import computeCosineSimilarity from 'compute-cosine-similarity';

const isVercel = process.env.VERCEL === "1";

const COMMON_SKILLS = [
  'react', 'node.js', 'mongodb', 'express', 'typescript', 'javascript', 'python',
  'pytorch', 'tensorflow', 'pandas', 'scikit-learn', 'sql', 'docker', 'aws', 'git',
  'next.js', 'tailwind css', 'tailwind', 'machine learning', 'nlp', 'embeddings',
  'digital marketing', 'seo', 'sem', 'social media', 'google analytics', 'copywriting',
  'content strategy', 'email marketing', 'ppc', 'branding', 'campaign management',
  'recruitment', 'sourcing', 'ats', 'interviews', 'onboarding', 'hris', 'project management',
  'agile', 'scrum', 'product management', 'business development', 'sales', 'customer support',
  'figma', 'ui/ux', 'photoshop', 'illustrator', 'graphic design', 'web design'
];

const matchesWholeWord = (text: string, word: string) => {
  const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(?:^|[^a-zA-Z0-9_+#])(${escaped})(?:$|[^a-zA-Z0-9_+#])`, 'i');
  return regex.test(text);
};

let extractorPromise: any = null;

async function getExtractor() {
  if (isVercel) {
    throw new Error("Local embeddings are disabled in Vercel production.");
  }
  if (!extractorPromise) {
    // We cache inside the workspace to keep the application fully self-contained
    // and load dynamically to avoid loading it on Vercel
    const { pipeline } = await import('@xenova/transformers');
    extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      cache_dir: './.cache/transformers'
    });
  }
  return extractorPromise;
}

/**
 * Generates numerical embedding vector for text using sentence-transformers (all-MiniLM-L6-v2)
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (isVercel) {
    throw new Error("Embeddings disabled in production");
  }

  const provider = process.env.EMBEDDING_PROVIDER || 'local';
  
  if (provider === 'hf' && process.env.HF_API_KEY) {
    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
        {
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({ inputs: text }),
        }
      );
      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result)) {
          return result;
        }
      }
      console.warn("Hugging Face API returned error, falling back to local embeddings");
    } catch (e) {
      console.warn("Failed to fetch Hugging Face embedding, falling back to local:", e);
    }
  }

  // Local extraction using @xenova/transformers (runs completely offline in Node.js)
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Calculates cosine similarity between two vectors using compute-cosine-similarity
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  
  try {
    const similarity = computeCosineSimilarity(vecA, vecB);
    if (similarity === null || isNaN(similarity)) {
      // Manual fallback if library returns invalid result
      let dotProduct = 0.0;
      let normA = 0.0;
      let normB = 0.0;
      for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }
      if (normA === 0 || normB === 0) return 0;
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    return similarity;
  } catch (err) {
    // Manual fallback in case of errors
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export interface SkillMatch {
  skill: string;
  score: number; // 0-100 scale
  evidence: string;
}

/**
 * Lightweight skill matching fallback for production
 */
function getLightweightSkillMatch(cvText: string, jdSkills: string[]): SkillMatch[] {
  console.log("Running lightweight semantic scoring on Vercel");
  console.error("Embeddings disabled in production");

  if (!jdSkills || jdSkills.length === 0) return [];

  const lowercaseCV = cvText.toLowerCase();
  
  // Split CV text into lines/sentences to find evidence
  const cvSentences = cvText
    .split(/[\n;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  return jdSkills.map(skill => {
    const isMatched = matchesWholeWord(lowercaseCV, skill);
    
    if (isMatched) {
      // Look for a sentence containing the skill as evidence
      const lowerSkill = skill.toLowerCase();
      let evidence = `Found match for "${skill}" in CV.`;
      
      for (const sentence of cvSentences) {
        if (sentence.toLowerCase().includes(lowerSkill)) {
          evidence = sentence;
          // Clean up multiple spaces
          evidence = evidence.replace(/\s+/g, ' ');
          if (evidence.length > 150) {
            evidence = evidence.substring(0, 147) + '...';
          }
          break;
        }
      }
      
      return {
        skill,
        score: 90, // Match score for keyword match
        evidence
      };
    } else {
      return {
        skill,
        score: 15, // Low match score
        evidence: `No direct mention of "${skill}" found in CV.`
      };
    }
  });
}

/**
 * Compares CV text blocks (chunks) against a list of JD requirements using semantic embeddings
 */
export async function matchCVAndJDSkills(
  cvText: string,
  jdSkills: string[]
): Promise<SkillMatch[]> {
  if (isVercel) {
    return getLightweightSkillMatch(cvText, jdSkills);
  }

  try {
    if (!jdSkills || jdSkills.length === 0) return [];

    // Split CV text into meaningful semantic chunks (paragraphs, experience bullet points, or education items)
    const cvChunks = cvText
      .split(/\n+/)
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 15); // filter out tiny headers or empty lines

    if (cvChunks.length === 0) {
      return jdSkills.map(skill => ({ skill, score: 0, evidence: 'No CV content extracted' }));
    }

    // Pre-calculate embeddings for CV chunks to avoid recalculating
    const chunkEmbeddings: { text: string; vector: number[] }[] = [];
    for (const chunk of cvChunks) {
      try {
        const vector = await getEmbedding(chunk);
        chunkEmbeddings.push({ text: chunk, vector });
      } catch (err) {
        console.error(`Error calculating embedding for chunk: ${chunk.substring(0, 20)}`, err);
      }
    }

    const results: SkillMatch[] = [];

    for (const skill of jdSkills) {
      try {
        const skillVector = await getEmbedding(skill);
        let bestScore = 0;
        let bestEvidence = 'No strong match found in CV';

        for (const chunk of chunkEmbeddings) {
          const similarity = cosineSimilarity(skillVector, chunk.vector);
          if (similarity > bestScore) {
            bestScore = similarity;
            bestEvidence = chunk.text;
          }
        }

        // Convert cosine similarity (typically 0.1 to 0.8 for matched text) to a 0-100 scale.
        // Scaling: anything above 0.75 is an absolute 100% match. Below 0.1 is 0%.
        const minSim = 0.15;
        const maxSim = 0.65;
        let scaledScore = 0;
        if (bestScore > minSim) {
          scaledScore = Math.min(100, Math.round(((bestScore - minSim) / (maxSim - minSim)) * 100));
        }
        // If score is low, reset evidence
        if (scaledScore < 30) {
          bestEvidence = `No direct mention of "${skill}" found in CV.`;
        }

        results.push({
          skill,
          score: scaledScore,
          evidence: bestEvidence
        });
      } catch (err) {
        console.error(`Error matching skill: ${skill}`, err);
        results.push({
          skill,
          score: 0,
          evidence: `Evaluation failed for "${skill}".`
        });
      }
    }

    return results;
  } catch (err) {
    console.error("Local matchCVAndJDSkills failed, falling back to lightweight match:", err);
    return getLightweightSkillMatch(cvText, jdSkills);
  }
}

/**
 * Interface for the return value of calculateSemanticScore
 */
export interface SemanticScoreResult {
  semanticScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

/**
 * Lightweight semantic similarity score fallback for production
 */
function getLightweightSemanticScore(cvText: string, jdText: string): SemanticScoreResult {
  console.log("Running lightweight semantic scoring on Vercel");
  console.error("Embeddings disabled in production");

  const lowercaseCV = cvText.toLowerCase();
  const lowercaseJD = jdText.toLowerCase();

  // Find JD skills that are mentioned in the JD
  const jdSkills = COMMON_SKILLS.filter(skill => matchesWholeWord(lowercaseJD, skill));
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of jdSkills) {
    const skillName = skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (matchesWholeWord(lowercaseCV, skill)) {
      matchedSkills.push(skillName);
    } else {
      missingSkills.push(skillName);
    }
  }

  // Token overlap calculation
  const stopWords = new Set(['and', 'the', 'for', 'with', 'a', 'of', 'in', 'to', 'is', 'that', 'on', 'at', 'by', 'an', 'or', 'as', 'are', 'be', 'this', 'from']);
  const getTokens = (text: string) => {
    return text.toLowerCase()
      .replace(/[^\w\s+#.-]/g, ' ') // Keep # for C#, . for Node.js/React, - for Scikit-learn
      .split(/\s+/)
      .filter(t => t.length > 2 && !stopWords.has(t));
  };

  const cvTokens = new Set(getTokens(cvText));
  const jdTokens = getTokens(jdText);
  
  let overlapCount = 0;
  const uniqueJDTokens = Array.from(new Set(jdTokens));
  for (const token of uniqueJDTokens) {
    if (cvTokens.has(token)) {
      overlapCount++;
    }
  }

  const tokenOverlapRatio = uniqueJDTokens.length > 0 ? overlapCount / uniqueJDTokens.length : 0;
  
  // Also calculate skill overlap ratio
  const skillOverlapRatio = jdSkills.length > 0 ? matchedSkills.length / jdSkills.length : 0.5;

  // Let's compute a semanticScore as a combination
  // If we have skills, rely heavily on them (e.g. 70% skills, 30% general tokens)
  // If no skills, 100% tokens
  let score = 0;
  if (jdSkills.length > 0) {
    score = skillOverlapRatio * 0.7 + tokenOverlapRatio * 0.3;
  } else {
    score = tokenOverlapRatio;
  }

  // Clamp and round score to 2 decimal places (between 0.0 and 1.0)
  const semanticScore = Math.round(Math.min(1.0, Math.max(0.0, score)) * 100) / 100;

  return {
    semanticScore,
    matchedSkills,
    missingSkills
  };
}

/**
 * Calculates overall semantic similarity score and maps matched vs missing skills
 */
export async function calculateSemanticScore(
  cvText: string,
  jdText: string
): Promise<SemanticScoreResult> {
  if (isVercel) {
    return getLightweightSemanticScore(cvText, jdText);
  }

  try {
    // 1. Split CV text into chunks
    const cvChunks = cvText
      .split(/\n+/)
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 20);

    if (cvChunks.length === 0) {
      return {
        semanticScore: 0,
        matchedSkills: [],
        missingSkills: []
      };
    }

    // 2. Generate embeddings for CV chunks (limit to top 30 chunks to optimize memory/speed)
    const chunkEmbeddings: number[][] = [];
    for (const chunk of cvChunks.slice(0, 30)) {
      try {
        const vec = await getEmbedding(chunk);
        chunkEmbeddings.push(vec);
      } catch (e) {
        console.warn("Failed to get embedding for chunk:", e);
      }
    }

    if (chunkEmbeddings.length === 0) {
      return {
        semanticScore: 0,
        matchedSkills: [],
        missingSkills: []
      };
    }

    // 3. Split JD text into chunks and generate embeddings (limit to top 15 chunks)
    const jdChunks = jdText
      .split(/\n+/)
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 20);
    
    const jdEmbeddings: number[][] = [];
    for (const chunk of jdChunks.slice(0, 15)) {
      try {
        const vec = await getEmbedding(chunk);
        jdEmbeddings.push(vec);
      } catch (e) {
        console.warn("Failed to get embedding for JD chunk:", e);
      }
    }

    if (jdEmbeddings.length === 0) {
      return {
        semanticScore: 0,
        matchedSkills: [],
        missingSkills: []
      };
    }

    // 4. Compute overall semantic similarity score
    let totalSim = 0;
    let matchesCount = 0;

    for (const jdVec of jdEmbeddings) {
      let bestSim = 0;
      for (const cvVec of chunkEmbeddings) {
        const sim = cosineSimilarity(jdVec, cvVec);
        if (sim > bestSim) {
          bestSim = sim;
        }
      }
      totalSim += bestSim;
      matchesCount++;
    }

    const rawScore = matchesCount > 0 ? totalSim / matchesCount : 0.0;

    // Scale score from typical MiniLM cosine ranges (0.15 - 0.60) to a clear 0.0 - 1.0 scale
    const minSim = 0.15;
    const maxSim = 0.60;
    let semanticScore = 0.0;
    if (rawScore > minSim) {
      semanticScore = Math.min(1.0, (rawScore - minSim) / (maxSim - minSim));
    }
    semanticScore = Math.round(semanticScore * 100) / 100;

    // 5. Detect skills in JD and classify them as matched vs missing
    const lowercaseJD = jdText.toLowerCase();
    const lowercaseCV = cvText.toLowerCase();

    const jdSkills = COMMON_SKILLS.filter(skill => matchesWholeWord(lowercaseJD, skill));
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const skill of jdSkills) {
      try {
        const skillVec = await getEmbedding(skill);
        let bestSkillSim = 0;
        for (const cvVec of chunkEmbeddings) {
          const sim = cosineSimilarity(skillVec, cvVec);
          if (sim > bestSkillSim) {
            bestSkillSim = sim;
          }
        }

        const skillName = skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        // Threshold 0.38 indicates semantic match, or fall back to strict word checks
        if (bestSkillSim > 0.38 || matchesWholeWord(lowercaseCV, skill)) {
          matchedSkills.push(skillName);
        } else {
          missingSkills.push(skillName);
        }
      } catch (e) {
        const skillName = skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (matchesWholeWord(lowercaseCV, skill)) {
          matchedSkills.push(skillName);
        } else {
          missingSkills.push(skillName);
        }
      }
    }

    return {
      semanticScore,
      matchedSkills,
      missingSkills
    };
  } catch (err) {
    console.error("Local calculateSemanticScore failed, falling back to lightweight score:", err);
    return getLightweightSemanticScore(cvText, jdText);
  }
}
