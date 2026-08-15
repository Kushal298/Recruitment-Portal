const prisma = require("../config/db");
const { extractSkills } = require("../services/parser.service");

async function createJob(req, res) {
  try {
    const { title, description, requiredSkills, minExperience } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const skillsFromDesc = extractSkills(description);
    const skills = requiredSkills?.length
      ? [...new Set([...requiredSkills, ...skillsFromDesc])]
      : skillsFromDesc;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        requiredSkills: skills,
        minExperience: minExperience || 0,
        recruiterId: req.user.id,
      },
    });

    res.status(201).json({ job });
  } catch (err) {
    console.error("Create job error:", err);
    res.status(500).json({ error: "Failed to create job" });
  }
}

async function getJobs(req, res) {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        recruiter: { select: { name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
}

async function getJobById(req, res) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        recruiter: { select: { name: true, email: true } },
        applications: {
          include: {
            candidate: { select: { id: true, name: true, email: true } },
          },
          orderBy: { finalScore: "desc" },
        },
      },
    });

    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch job" });
  }
}

async function getRecruiterJobs(req, res) {
  try {
    const jobs = await prisma.job.findMany({
      where: { recruiterId: req.user.id },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch your jobs" });
  }
}

async function deleteJob(req, res) {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this job" });
    }

    await prisma.job.delete({ where: { id: req.params.id } });
    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete job" });
  }
}

module.exports = { createJob, getJobs, getJobById, getRecruiterJobs, deleteJob };
