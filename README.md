# Resume Analysis & Recruitment Portal

A full-stack **Transparent Resume Analysis and Recruitment Portal** built per the BSc.CSIT project proposal. The system uses rule-based regex parsing and cosine similarity scoring - no black-box AI.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Recharts |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| File Parsing | pdf-parse, mammoth (DOCX) |

## Features

- **Dual-user portal** — Candidates and HR/Recruiters with role-based access
- **Resume parsing** — Regex extraction of name, email, phone, skills, education, experience
- **Skill dictionary matching** — Configurable skill categories
- **Cosine similarity scoring** — Transparent mathematical job-resume matching
- **Weighted final score** — `(Cosine × 0.7) + (Normalized Experience × 0.3)`
- **Skill gap analysis** — Shows missing required skills
- **Ranked applicant list** — Recruiters see candidates sorted best → worst match
- **Score breakdown charts** — Visual explanation of every score

## Project Structure

```
├── backend/          # Express API + Parser + Matching engine
├── frontend/         # Next.js web application
├── sample-data/      # Sample resumes for testing
├── docker-compose.yml
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- npm

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Setup Backend

```bash
cd backend
npm install
npm run db:setup
npm run dev
```

Backend runs at **http://localhost:5000**

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Recruiter (HR) | hr@company.com | recruiter123 |
| Candidate | john@email.com | candidate123 |
| Candidate | jane@email.com | candidate123 |

## How to Test

1. Login as **hr@company.com** → view posted jobs and ranked applicants
2. Login as **john@email.com** → browse jobs → click **Apply** → upload `sample-data/sample-resume-john.txt`
3. View your match score breakdown and skill gaps
4. Switch to recruiter account → open job → see John ranked in the applicant list

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register candidate or recruiter |
| POST | `/api/auth/login` | Login |
| GET | `/api/jobs` | List all jobs |
| POST | `/api/jobs` | Create job (recruiter) |
| POST | `/api/applications/jobs/:id/apply` | Apply with resume (candidate) |
| GET | `/api/applications/my-applications` | Candidate's applications |
| GET | `/api/applications/jobs/:id/applicants` | Ranked applicants (recruiter) |

## Scoring Algorithm

```
Final Score = (Cosine Similarity × 0.7) + (Normalized Experience × 0.3)
```

Where:
- **Cosine Similarity** compares binary skill vectors (resume vs job requirements)
- **Normalized Experience** = min(years / 10, 1)

## Authors

- Rojan Aryal (79010966)
- Kushal Bhatta (79010959)
- Dipesh Paudel (79010953)

**Supervisor:** Er. Prabin Silwal  
**Institution:** Asian School of Management and Technology, Tribhuvan University
