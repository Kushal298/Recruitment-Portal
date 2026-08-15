const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const recruiterPass = await bcrypt.hash("recruiter123", 12);
  const candidatePass = await bcrypt.hash("candidate123", 12);

  const recruiter = await prisma.user.upsert({
    where: { email: "hr@company.com" },
    update: {},
    create: {
      email: "hr@company.com",
      password: recruiterPass,
      name: "Sarah Johnson",
      role: "RECRUITER",
    },
  });

  const candidate1 = await prisma.user.upsert({
    where: { email: "john@email.com" },
    update: {},
    create: {
      email: "john@email.com",
      password: candidatePass,
      name: "John Doe",
      role: "CANDIDATE",
    },
  });

  const candidate2 = await prisma.user.upsert({
    where: { email: "jane@email.com" },
    update: {},
    create: {
      email: "jane@email.com",
      password: candidatePass,
      name: "Jane Smith",
      role: "CANDIDATE",
    },
  });

  const jobs = [
    {
      title: "Full Stack Developer",
      description: `We are looking for a Full Stack Developer proficient in JavaScript, TypeScript, React, Next.js, Node.js, and Express. 
      Experience with PostgreSQL, Docker, and Git is required. Knowledge of AWS and CI/CD is a plus.
      Minimum 3 years of professional experience in web development.`,
      requiredSkills: ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "PostgreSQL", "Git"],
      minExperience: 3,
    },
    {
      title: "Data Scientist",
      description: `Join our data team to build ML models using Python, TensorFlow, and PyTorch. 
      Strong skills in Data Analysis, Statistics, Pandas, and SQL required. 
      Experience with Machine Learning and NLP preferred. 2+ years experience.`,
      requiredSkills: ["Python", "Machine Learning", "TensorFlow", "Pandas", "SQL", "Statistics"],
      minExperience: 2,
    },
    {
      title: "DevOps Engineer",
      description: `Seeking a DevOps Engineer with expertise in Docker, Kubernetes, AWS, and CI/CD pipelines.
      Must have Linux administration skills and experience with Terraform and Jenkins.
      4+ years of infrastructure experience required.`,
      requiredSkills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform", "Jenkins"],
      minExperience: 4,
    },
  ];

  for (const jobData of jobs) {
    const existing = await prisma.job.findFirst({
      where: { title: jobData.title, recruiterId: recruiter.id },
    });
    if (!existing) {
      await prisma.job.create({
        data: { ...jobData, recruiterId: recruiter.id },
      });
    }
  }

  console.log("Seed completed:");
  console.log("  Recruiter: hr@company.com / recruiter123");
  console.log("  Candidate: john@email.com / candidate123");
  console.log("  Candidate: jane@email.com / candidate123");
  console.log(`  Created ${jobs.length} sample jobs`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
