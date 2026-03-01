const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Devmate - API",
  },
  host: "devmate.co.in",
  schemes: ["https"],
};

const outputFile = "./swagger-output.json";
const routes = [
  "./src/routes/authRoutes.js",
  "./src/routes/chatRoutes.js",
  "./src/routes/connectionReqRoutes.js",
  "./src/routes/paymentRoutes.js",
  "./src/routes/profileRoutes.js",
  "./src/routes/userRoutes.js",
  "./src/routes/forgetPasswordRoutes.js",
];

swaggerAutogen(outputFile, routes, doc);
