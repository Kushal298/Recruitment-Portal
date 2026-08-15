/**
 * Skill dictionary for dictionary-based skill extraction.
 * Easily updatable per proposal operational feasibility.
 */
const SKILL_CATEGORIES = {
  programming: [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust",
    "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Perl", "Dart",
    "HTML", "CSS", "SQL", "NoSQL",
  ],
  frameworks: [
    "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express", "Django",
    "Flask", "Spring Boot", "Spring", "Laravel", "Ruby on Rails", "FastAPI",
    "ASP.NET", ".NET", "TensorFlow", "PyTorch", "Pandas", "NumPy",
  ],
  databases: [
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle", "MariaDB",
    "Firebase", "DynamoDB", "Elasticsearch", "Cassandra",
  ],
  devops: [
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Jenkins",
    "GitHub Actions", "Terraform", "Ansible", "Linux", "Nginx", "Apache",
  ],
  tools: [
    "Git", "GitHub", "GitLab", "Jira", "Confluence", "Figma", "Postman",
    "VS Code", "Visual Studio", "Eclipse", "IntelliJ", "Slack", "Trello",
  ],
  softSkills: [
    "Project Management", "Leadership", "Communication", "Teamwork",
    "Problem Solving", "Agile", "Scrum", "Kanban", "Time Management",
    "Critical Thinking", "Analytical Skills", "Presentation Skills",
  ],
  data: [
    "Machine Learning", "Deep Learning", "Data Analysis", "Data Science",
    "Big Data", "Hadoop", "Spark", "Tableau", "Power BI", "Statistics",
    "NLP", "Computer Vision",
  ],
};

const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

function getAllSkills() {
  return ALL_SKILLS;
}

function getSkillsByCategory() {
  return SKILL_CATEGORIES;
}

module.exports = { ALL_SKILLS, SKILL_CATEGORIES, getAllSkills, getSkillsByCategory };
