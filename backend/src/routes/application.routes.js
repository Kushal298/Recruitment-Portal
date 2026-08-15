const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationDetails,
  previewResume,
} = require("../controllers/application.controller");
const { authenticate, authorize } = require("../middleware/auth");

const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".docx", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only PDF, DOCX, and TXT files are allowed"));
  },
});

const router = express.Router();

router.post(
  "/preview",
  authenticate,
  authorize("CANDIDATE"),
  upload.single("resume"),
  previewResume
);

router.post(
  "/jobs/:jobId/apply",
  authenticate,
  authorize("CANDIDATE"),
  upload.single("resume"),
  applyToJob
);

router.get(
  "/my-applications",
  authenticate,
  authorize("CANDIDATE"),
  getMyApplications
);

router.get(
  "/jobs/:jobId/applicants",
  authenticate,
  authorize("RECRUITER"),
  getJobApplications
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("RECRUITER"),
  updateApplicationStatus
);

router.get("/:id", authenticate, getApplicationDetails);

module.exports = router;
