const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const prisma = require("../config/db");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
let passportConfigured = false;

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function register(req, res) {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    if (role && !["CANDIDATE", "RECRUITER"].includes(role)) {
      return res.status(400).json({ error: "Role must be CANDIDATE or RECRUITER" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: role || "CANDIDATE",
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };

    const token = generateToken(safeUser);
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
}

async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}

function ensureGoogleConfig() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth client ID and secret must be configured in environment variables.");
  }
}

function encodeState(state) {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

function decodeState(rawState) {
  if (!rawState || typeof rawState !== "string") return {};
  try {
    return JSON.parse(Buffer.from(rawState, "base64url").toString("utf8"));
  } catch (error) {
    return {};
  }
}

function getBackendUrl(req) {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, "");
  }
  if (!req) {
    throw new Error("BACKEND_URL is not configured and request is unavailable to derive the callback URL.");
  }
  const forwardedProto = req.get("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "http";
  const host = req.get("host") || req.headers.host;
  if (!host) {
    throw new Error("Unable to determine backend host for Google OAuth callback URL.");
  }
  return `${protocol}://${host}`;
}

function setupPassport(req) {
  if (passportConfigured) return;

  ensureGoogleConfig();
  const backendUrl = getBackendUrl(req);

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${backendUrl}/api/auth/google/callback`,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.name?.givenName || profile.name?.familyName;
          const rawState = req.query.state;
          const state = decodeState(typeof rawState === "string" ? rawState : "");
          const requestedRole = state?.role === "RECRUITER" ? "RECRUITER" : "CANDIDATE";

          if (!email || !name) {
            return done(new Error("Google profile is missing email or name"));
          }

          let user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            const hashed = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 12);
            user = await prisma.user.create({
              data: {
                email,
                name,
                password: hashed,
                role: requestedRole,
              },
              select: { id: true, email: true, name: true, role: true, createdAt: true },
            });
          }

          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );

  passportConfigured = true;
}

function googleAuth(req, res, next) {
  try {
    setupPassport(req);
    const state = encodeState({ role: req.query.role || "CANDIDATE" });
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
      state,
      session: false,
    })(req, res, next);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Google authentication setup failed" });
  }
}

function googleAuthCallback(req, res, next) {
  setupPassport(req);
  passport.authenticate("google", { session: false }, (err, user) => {
    if (err || !user) {
      console.error("Google callback error", err);
      return res.redirect(`${FRONTEND_URL}/login?error=Google%20authentication%20failed`);
    }

    const token = generateToken(user);
    const callbackUrl = new URL(`${FRONTEND_URL}/auth/callback`);
    callbackUrl.searchParams.set("token", token);
    callbackUrl.searchParams.set("role", user.role);
    return res.redirect(callbackUrl.toString());
  })(req, res, next);
}

module.exports = { register, login, getProfile, googleAuth, googleAuthCallback };
