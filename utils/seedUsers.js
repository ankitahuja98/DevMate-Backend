const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("../src/config/database");

const bcrypt = require("bcrypt");
const { faker } = require("@faker-js/faker");
const User = require("../src/models/user");

const numberOfUsers = 500;

// Data Arrays
const roles = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Startup Founder",
  "Team Member",
  "Product Engineer",
  "Mobile Developer",
  "UI/UX Designer",
];

const techStacks = [
  "React",
  "Node.js",
  "MongoDB",
  "TypeScript",
  "Next.js",
  "Express",
  "AWS",
  "Docker",
  "Redis",
  "GraphQL",
  "TailwindCSS",
  "PostgreSQL",
];

const professionalBios = [
  "Full-stack developer passionate about building scalable web applications and collaborating with early-stage startups.",
  "Frontend engineer focused on React, performance optimization, and creating intuitive user experiences.",
  "Backend developer specializing in Node.js APIs, database design, and scalable architecture.",
  "Startup founder building SaaS products and looking for strong technical collaborators.",
  "Product-minded developer who enjoys turning ideas into production-ready MVPs.",
  "Software engineer experienced in MERN stack, cloud deployment, and performance optimization.",
  "Tech enthusiast exploring AI-powered tools and developer productivity products.",
  "Collaborative engineer who enjoys working with cross-functional teams to ship impactful features.",
  "Engineer passionate about clean architecture, reusable components, and scalable backend systems.",
  "Building digital products that solve real-world problems through thoughtful engineering.",
];

const taglines = [
  "Building the future with code",
  "Shipping products, not just features",
  "Turning ideas into scalable apps",
  "Always learning, always building",
  "Engineering solutions that matter",
  "From idea to production",
  "Code. Build. Iterate.",
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRandomTechStack = () =>
  faker.helpers.arrayElements(techStacks, {
    min: 3,
    max: 6,
  });

// Projects Generator
function generateProjects() {
  const projectTitles = [
    "AI Resume Builder",
    "Startup Collaboration Platform",
    "Real-time Chat Application",
    "Developer Portfolio Builder",
    "Task Management SaaS",
    "Job Matching Platform",
  ];

  const projects = [];

  const totalProjects = faker.number.int({ min: 1, max: 3 });

  for (let i = 0; i < totalProjects; i++) {
    const techUsed = getRandomTechStack();

    projects.push({
      title: getRandom(projectTitles),
      description:
        "Built a production-ready web application focusing on scalability, performance, and clean architecture.",
      techUsed,
      role: getRandom([
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
      ]),
      githubUrl: `https://github.com/${faker.internet.username()}/${faker.internet.domainWord()}`,
      liveUrl: faker.internet.url(),
    });
  }

  return projects;
}

// Seed function
async function seedUsers() {
  try {
    console.log("Creating demo users...");
    // await User.deleteMany({}); // delete all users (optional)

    const users = [];

    for (let i = 1; i <= numberOfUsers; i++) {
      const role = getRandom(roles);
      const hashedPassword = await bcrypt.hash("demo123", 10);

      users.push({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword,

        age: faker.number.int({ min: 22, max: 40 }),

        profilePhoto: `https://i.pravatar.cc/300?img=${(i % 70) + 1}`,

        tagline: getRandom(taglines),
        bio: getRandom(professionalBios),

        location: faker.location.city(),

        currentRole: role,
        experience: faker.number.int({ min: 1, max: 10 }),

        lookingForTitle: getRandom([
          "cofounder",
          "collaborator",
          "mentor",
          "team-member",
          "freelance-partner",
        ]),

        lookingForDesc:
          "Looking to collaborate with ambitious builders and ship meaningful products.",

        availability: getRandom([
          "full-time",
          "part-time",
          "weekends",
          "flexible",
        ]),

        techStack: getRandomTechStack(),

        interests: faker.helpers.arrayElements(
          ["AI", "Startups", "SaaS", "Open Source", "Product Design"],
          { min: 2, max: 4 },
        ),

        projects: generateProjects(),

        socialLinks: {
          github: `https://github.com/${faker.internet.username()}`,
          linkedin: `https://linkedin.com/in/${faker.internet.username()}`,
          portfolio: faker.internet.url(),
        },

        isVerified: true,
        isNewUser: false,
        isUserProfileCompleted: true,
        provider: "local",
      });
    }

    await User.insertMany(users);

    console.log(`🔥${numberOfUsers} professional demo users inserted!`);
    process.exit();
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

async function startSeed() {
  try {
    await connectDB();
    console.log("MongoDB connected for seeding");
    await seedUsers();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

startSeed();
