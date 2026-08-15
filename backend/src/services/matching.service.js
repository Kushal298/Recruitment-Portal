const { extractSkills } = require("./parser.service");

/**
 * Create binary vectors for cosine similarity.
 * Job vector: all skills from job description marked as 1 if required.
 * Resume vector: 1 if candidate has the skill, 0 otherwise.
 */
function createBinaryVectors(jobSkills, resumeSkills) {
  const allSkills = [...new Set([...jobSkills, ...resumeSkills])].sort();
  const jobSet = new Set(jobSkills.map((s) => s.toLowerCase()));
  const resumeSet = new Set(resumeSkills.map((s) => s.toLowerCase()));

  const jobVector = allSkills.map((s) => (jobSet.has(s.toLowerCase()) ? 1 : 0));
  const resumeVector = allSkills.map((s) => (resumeSet.has(s.toLowerCase()) ? 1 : 0));

  return { allSkills, jobVector, resumeVector };
}

/**
 * Cosine Similarity: Score = (A·B) / (||A|| * ||B||)
 * Returns value between 0 and 1 (as percentage 0-100).
 */
function cosineSimilarity(vectorA, vectorB) {
  if (vectorA.length !== vectorB.length || vectorA.length === 0) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Normalize experience years to 0-1 scale (cap at 10 years for scoring).
 */
function normalizeExperience(years) {
  return Math.min(years / 10, 1);
}

/**
 * Final Score = (Cosine Score * 0.7) + (Normalized Experience * 0.3)
 * Per proposal weighted formula.
 */
function calculateFinalScore(cosineScore, experienceYears) {
  const normalizedExp = normalizeExperience(experienceYears);
  return cosineScore * 0.7 + normalizedExp * 0.3;
}

/**
 * Identify skill gaps — required skills missing from resume.
 */
function findSkillGaps(requiredSkills, resumeSkills) {
  const resumeSet = new Set(resumeSkills.map((s) => s.toLowerCase()));
  return requiredSkills.filter((s) => !resumeSet.has(s.toLowerCase()));
}

/**
 * Matching Module: compare parsed resume with job requirements.
 */
function matchCandidateToJob(parsedResume, job) {
  const jobSkillsFromDesc = extractSkills(job.description);
  const requiredSkills = [...new Set([...job.requiredSkills, ...jobSkillsFromDesc])];

  const { allSkills, jobVector, resumeVector } = createBinaryVectors(
    requiredSkills,
    parsedResume.skills
  );

  const cosine = cosineSimilarity(jobVector, resumeVector);
  const cosinePercent = Math.round(cosine * 10000) / 100;
  const finalScore = calculateFinalScore(cosine, parsedResume.experienceYears);
  const finalPercent = Math.round(finalScore * 10000) / 100;
  const skillGaps = findSkillGaps(requiredSkills, parsedResume.skills);
  const matchedSkills = requiredSkills.filter((s) =>
    parsedResume.skills.some((r) => r.toLowerCase() === s.toLowerCase())
  );

  return {
    cosineScore: cosinePercent,
    finalScore: finalPercent,
    experienceYears: parsedResume.experienceYears,
    requiredSkills,
    matchedSkills,
    skillGaps,
    skillMatchCount: matchedSkills.length,
    totalRequiredSkills: requiredSkills.length,
    breakdown: {
      cosineComponent: Math.round(cosine * 0.7 * 10000) / 100,
      experienceComponent: Math.round(normalizeExperience(parsedResume.experienceYears) * 0.3 * 10000) / 100,
      formula: "Final Score = (Cosine Score × 0.7) + (Normalized Experience × 0.3)",
    },
    vectors: { skills: allSkills, jobVector, resumeVector },
  };
}

module.exports = {
  cosineSimilarity,
  calculateFinalScore,
  matchCandidateToJob,
  findSkillGaps,
  createBinaryVectors,
};
