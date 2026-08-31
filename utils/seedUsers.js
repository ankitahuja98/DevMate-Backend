const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("../src/config/database");

const bcrypt = require("bcrypt");
const { faker } = require("@faker-js/faker");
const User = require("../src/models/user");
const ConnectionRequest = require("../src/models/connectionRequest");
const { Chat } = require("../src/models/chat");
const Notification = require("../src/models/notification");

const numberOfUsers = 50;
const DEMO_PASSWORD = "test@123";

// Data Arrays
const roles = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Startup Founder",
  "DevOps Engineer",
  "Product Engineer",
  "Mobile Developer",
  "UI/UX Designer",
  "Machine Learning Engineer",
  "Data Engineer",
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
  "Kubernetes",
  "Redis",
  "GraphQL",
  "TailwindCSS",
  "PostgreSQL",
  "Python",
  "Django",
  "Go",
  "Rust",
  "Flutter",
  "Swift",
  "Kafka",
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
  "DevOps engineer obsessed with CI/CD pipelines, observability, and zero-downtime deploys.",
  "Mobile developer crafting delightful cross-platform apps with Flutter and React Native.",
  "ML engineer building recommendation systems and exploring applied AI in production.",
  "Data engineer designing pipelines that turn messy data into reliable insights.",
  "Indie hacker shipping side projects on weekends and writing about what breaks.",
];

const taglines = [
  "Building the future with code",
  "Shipping products, not just features",
  "Turning ideas into scalable apps",
  "Always learning, always building",
  "Engineering solutions that matter",
  "From idea to production",
  "Code. Build. Iterate.",
  "Debugging life one commit at a time",
  "Open source by day, side projects by night",
  "Turning coffee into clean code",
];

const interestsPool = [
  "AI",
  "Startups",
  "SaaS",
  "Open Source",
  "Product Design",
  "Web3",
  "Cloud Architecture",
  "Developer Tools",
  "Hackathons",
  "System Design",
];

const cities = [
  "Bengaluru, India",
  "Delhi, India",
  "Mumbai, India",
  "Pune, India",
  "Hyderabad, India",
  "San Francisco, USA",
  "New York, USA",
  "Austin, USA",
  "London, UK",
  "Berlin, Germany",
  "Toronto, Canada",
  "Singapore",
  "Amsterdam, Netherlands",
  "Dublin, Ireland",
  "Sydney, Australia",
];

const projectTitles = [
  "AI Resume Builder",
  "Startup Collaboration Platform",
  "Real-time Chat Application",
  "Developer Portfolio Builder",
  "Task Management SaaS",
  "Job Matching Platform",
  "Expense Tracker",
  "Code Snippet Sharing Tool",
  "Open Source Issue Tracker",
  "Habit Tracking App",
];

const projectDescriptions = [
  "Built a production-ready web application focusing on scalability, performance, and clean architecture.",
  "Designed and shipped a full-stack product from scratch, handling both API and UI layers.",
  "Led development of a real-time feature set using WebSockets and optimistic UI updates.",
  "Migrated a legacy monolith into modular services with improved test coverage.",
  "Built and deployed a CI/CD pipeline that cut release time from hours to minutes.",
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRandomTechStack = () =>
  faker.helpers.arrayElements(techStacks, { min: 3, max: 6 });

// Projects Generator
function generateProjects() {
  const projects = [];
  const usedTitles = new Set();
  const totalProjects = faker.number.int({ min: 1, max: 3 });

  for (let i = 0; i < totalProjects; i++) {
    let title = getRandom(projectTitles);
    while (usedTitles.has(title) && usedTitles.size < projectTitles.length) {
      title = getRandom(projectTitles);
    }
    usedTitles.add(title);

    const techUsed = getRandomTechStack();
    const repoOwner = faker.internet.username().toLowerCase().replace(/[^a-z0-9]/g, "");
    const repoName = faker.hacker.noun().toLowerCase().replace(/[^a-z0-9]/g, "") + "-" + faker.hacker.adjective().toLowerCase().replace(/[^a-z0-9]/g, "");

    projects.push({
      title,
      description: getRandom(projectDescriptions),
      techUsed,
      role: getRandom([
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
      ]),
      githubUrl: `https://github.com/${repoOwner}/${repoName}`,
      liveUrl: `https://${repoName}.vercel.app`,
    });
  }

  return projects;
}

// Realistic developer-looking portrait photos (randomuser.me static portrait pool),
// matched to the generated gender so name + photo stay consistent.
function getProfilePhoto(sex, index) {
  const pool = sex === "female" ? "women" : "men";
  const photoIndex = index % 100; // randomuser.me has 0-99 per gender
  return `https://randomuser.me/api/portraits/${pool}/${photoIndex}.jpg`;
}

// Seed function
async function seedUsers() {
  try {
    console.log("Wiping existing users and related data...");
    const { deletedCount } = await User.deleteMany({});
    console.log(`🗑️  Deleted ${deletedCount} existing users`);

    try {
      await ConnectionRequest.collection.drop();
      console.log("🗑️  Dropped ConnectionRequest collection");
    } catch (err) {
      if (err.codeName === "NamespaceNotFound" || err.code === 26) {
        console.log("ℹ️  ConnectionRequest collection did not exist, skipping drop");
      } else {
        throw err;
      }
    }

    const { deletedCount: chatsDeleted } = await Chat.deleteMany({});
    console.log(`🗑️  Deleted ${chatsDeleted} chat documents`);

    const { deletedCount: notificationsDeleted } = await Notification.deleteMany({});
    console.log(`🗑️  Deleted ${notificationsDeleted} notification documents`);

    console.log("Creating demo developer users...");

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    const usedEmails = new Set();
    const menIndex = { count: 0 };
    const womenIndex = { count: 0 };

    const users = [];

    for (let i = 1; i <= numberOfUsers; i++) {
      const sex = Math.random() < 0.5 ? "male" : "female";
      const firstName = faker.person.firstName(sex);
      const lastName = faker.person.lastName();
      const fullName = `${firstName} ${lastName}`;

      let email = faker.internet
        .email({ firstName, lastName, provider: "example.com" })
        .toLowerCase();
      while (usedEmails.has(email)) {
        email = faker.internet
          .email({ firstName, lastName: lastName + faker.number.int({ min: 1, max: 999 }), provider: "example.com" })
          .toLowerCase();
      }
      usedEmails.add(email);

      const role = getRandom(roles);
      const photoIndex = sex === "female" ? womenIndex.count++ : menIndex.count++;
      const isPremium = Math.random() < 0.2;
      const experience = faker.number.int({ min: 1, max: 12 });

      users.push({
        name: fullName,
        email,
        password: hashedPassword,

        age: faker.number.int({ min: 22, max: 45 }),

        profilePhoto: getProfilePhoto(sex, photoIndex),

        tagline: getRandom(taglines),
        bio: getRandom(professionalBios),

        location: getRandom(cities),

        currentRole: role,
        experience,

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

        interests: faker.helpers.arrayElements(interestsPool, { min: 2, max: 4 }),

        projects: generateProjects(),

        socialLinks: {
          github: `https://github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
          linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
          portfolio: `https://${firstName.toLowerCase()}${lastName.toLowerCase()}.dev`,
        },

        isVerified: true,
        isNewUser: false,
        isUserProfileCompleted: true,
        provider: "local",
        isPremium,
        premiumExpiresAt: isPremium
          ? faker.date.future({ years: 1 })
          : null,
        isOnline: Math.random() < 0.3,
        lastSeen: faker.date.recent({ days: 5 }),
      });
    }

    await User.insertMany(users);

    console.log(`🔥 ${numberOfUsers} professional demo users inserted!`);
    console.log(`🔑 All users share the password: ${DEMO_PASSWORD}`);
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
