const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "DevMate - API",
  },
  host: "localhost:8080",
};

const outputFile = "./swagger-output.json";
const routes = ["./src/routes/authRoutes.js", "./src/routes/profileRoutes.js"];

swaggerAutogen(outputFile, routes, doc);
