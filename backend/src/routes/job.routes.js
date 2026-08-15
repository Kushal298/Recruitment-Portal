const express = require("express");
const {
  createJob,
  getJobs,
  getJobById,
  getRecruiterJobs,
  deleteJob,
} = require("../controllers/job.controller");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", getJobs);
router.get("/recruiter/mine", authenticate, authorize("RECRUITER"), getRecruiterJobs);
router.get("/:id", getJobById);
router.post("/", authenticate, authorize("RECRUITER"), createJob);
router.delete("/:id", authenticate, authorize("RECRUITER"), deleteJob);

module.exports = router;
