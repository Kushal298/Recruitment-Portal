const prisma = require("../config/db");
const { parseResume } = require("../services/parser.service");
const { matchCandidateToJob } = require("../services/matching.service");
const { extractTextFromFile } = require("../services/file.service");

async function applyToJob(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Resume file is required" });
    }

    const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const existing = await prisma.application.findUnique({
      where: {
        candidateId_jobId: { candidateId: req.user.id, jobId: req.params.jobId },
      },
    });
    if (existing) {
      return res.status(409).json({ error: "You have already applied to this job" });
    }

    const rawText = await extractTextFromFile(req.file.path, req.file.originalname);
    const parsed = parseResume(rawText);
    const matchResult = matchCandidateToJob(parsed, job);

    const application = await prisma.application.create({
      data: {
        candidateId: req.user.id,
        jobId: job.id,
        resumeFileName: req.file.originalname,
        parsedName: parsed.name,
        parsedEmail: parsed.email,
        parsedPhone: parsed.phone,
        parsedSkills: parsed.skills,
        parsedEducation: parsed.education,
        parsedExperience: parsed.experience,
        experienceYears: parsed.experienceYears,
        cosineScore: matchResult.cosineScore,
        finalScore: matchResult.finalScore,
        skillGaps: matchResult.skillGaps,
      },
      include: {
        job: { select: { title: true } },
      },
    });

    res.status(201).json({
      application,
      matchDetails: {
        matchedSkills: matchResult.matchedSkills,
        skillGaps: matchResult.skillGaps,
        breakdown: matchResult.breakdown,
      },
    });
  } catch (err) {
    console.error("Apply error:", err);
    res.status(500).json({ error: err.message || "Failed to submit application" });
  }
}

async function getMyApplications(req, res) {
  try {
    const applications = await prisma.application.findMany({
      where: { candidateId: req.user.id },
      include: {
        job: {
          select: { id: true, title: true, requiredSkills: true, minExperience: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
}

async function getJobApplications(req, res) {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const applications = await prisma.application.findMany({
      where: { jobId: req.params.jobId },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
      },
      orderBy: { finalScore: "desc" },
    });

    res.json({ applications, job: { id: job.id, title: job.title } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
}

async function updateApplicationStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ["PENDING", "REVIEWED", "SHORTLISTED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { job: true },
    });

    if (!application) return res.status(404).json({ error: "Application not found" });
    if (application.job.recruiterId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({ application: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
}

async function getApplicationDetails(req, res) {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        job: true,
        candidate: { select: { id: true, name: true, email: true } },
      },
    });

    if (!application) return res.status(404).json({ error: "Application not found" });

    const isOwner = application.candidateId === req.user.id;
    const isRecruiter = application.job.recruiterId === req.user.id;
    if (!isOwner && !isRecruiter) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const parsed = {
      name: application.parsedName,
      email: application.parsedEmail,
      phone: application.parsedPhone,
      skills: application.parsedSkills,
      experienceYears: application.experienceYears,
    };

    const matchResult = matchCandidateToJob(parsed, application.job);

    res.json({
      application,
      matchDetails: {
        matchedSkills: matchResult.matchedSkills,
        skillGaps: matchResult.skillGaps,
        breakdown: matchResult.breakdown,
        requiredSkills: matchResult.requiredSkills,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch application details" });
  }
}

async function previewResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Resume file is required" });
    }

    const rawText = await extractTextFromFile(req.file.path, req.file.originalname);
    const parsed = parseResume(rawText);

    res.json({ parsed });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to parse resume" });
  }
}

module.exports = {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationDetails,
  previewResume,
};
