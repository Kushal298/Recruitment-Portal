const { ALL_SKILLS } = require("../data/skills-dictionary");

const PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
  experienceYears: /(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi,
  dateRange: /(\d{4})\s*[-–—]\s*(?:\d{4}|present|current)/gi,
};

const SECTION_HEADERS = [
  { key: "experience", patterns: [/work\s*experience/i, /professional\s*experience/i, /employment\s*history/i, /experience/i] },
  { key: "education", patterns: [/education/i, /academic\s*background/i, /qualifications/i] },
  { key: "skills", patterns: [/skills/i, /technical\s*skills/i, /core\s*competencies/i, /expertise/i] },
  { key: "summary", patterns: [/summary/i, /objective/i, /profile/i, /about\s*me/i] },
];

function extractEmail(text) {
  const matches = text.match(PATTERNS.email);
  return matches ? matches[0] : null;
}

function extractPhone(text) {
  const matches = text.match(PATTERNS.phone);
  if (!matches) return null;
  const valid = matches.find((m) => m.replace(/\D/g, "").length >= 10);
  return valid || matches[0];
}

function extractName(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (line.length > 3 && line.length < 60 && !PATTERNS.email.test(line) && !/\d{3,}/.test(line)) {
      if (/^[A-Za-z\s.'-]+$/.test(line)) return line;
    }
  }
  return null;
}

function extractSections(text) {
  const sections = { experience: "", education: "", skills: "", summary: "" };
  const lines = text.split("\n");
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let matched = false;
    for (const header of SECTION_HEADERS) {
      if (header.patterns.some((p) => p.test(trimmed)) && trimmed.length < 50) {
        currentSection = header.key;
        matched = true;
        break;
      }
    }

    if (!matched && currentSection) {
      sections[currentSection] += trimmed + "\n";
    }
  }

  return sections;
}

function extractSkills(text) {
  const found = new Set();
  const lowerText = text.toLowerCase();

  for (const skill of ALL_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(lowerText)) {
      found.add(skill);
    }
  }

  return Array.from(found);
}

function extractExperienceYears(text) {
  let totalYears = 0;

  const explicitMatches = [...text.matchAll(PATTERNS.experienceYears)];
  if (explicitMatches.length > 0) {
    totalYears = Math.max(...explicitMatches.map((m) => parseFloat(m[1])));
    return Math.min(totalYears, 40);
  }

  const dateRanges = [...text.matchAll(PATTERNS.dateRange)];
  if (dateRanges.length > 0) {
    const currentYear = new Date().getFullYear();
    let earliest = currentYear;
    let latest = 0;

    for (const match of dateRanges) {
      const start = parseInt(match[1], 10);
      if (start >= 1970 && start <= currentYear) {
        earliest = Math.min(earliest, start);
        latest = Math.max(latest, currentYear);
      }
    }

    if (earliest < currentYear) {
      totalYears = latest - earliest;
    }
  }

  return Math.min(Math.max(totalYears, 0), 40);
}

/**
 * Parse raw resume text into structured JSON (Extractor Module).
 */
function parseResume(rawText) {
  const text = rawText.replace(/\r\n/g, "\n").replace(/\s+/g, " ").replace(/ \n/g, "\n");
  const sections = extractSections(text);
  const skillsFromDict = extractSkills(text);
  const skillsFromSection = extractSkills(sections.skills);
  const allSkills = [...new Set([...skillsFromDict, ...skillsFromSection])];

  return {
    name: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    skills: allSkills,
    education: sections.education.trim() || null,
    experience: sections.experience.trim() || null,
    experienceYears: extractExperienceYears(text + " " + sections.experience),
    rawTextLength: text.length,
  };
}

module.exports = { parseResume, extractSkills, extractEmail, extractPhone };
