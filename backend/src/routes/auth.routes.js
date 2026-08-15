const express = require("express");
const { register, login, getProfile, googleAuth, googleAuthCallback } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticate, getProfile);
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);

module.exports = router;
