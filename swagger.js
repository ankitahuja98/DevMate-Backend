const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "DevMate - API",
  },
  host: "localhost:8080",
};

const outputFile = "./swagger-output.json";
const routes = [
  "./src/routes/authRoutes.js",
  "./src/routes/profileRoutes.js",
  "./src/routes/connectionReqRoutes.js",
  "./src/routes/userRoutes.js",
];

swaggerAutogen(outputFile, routes, doc);
