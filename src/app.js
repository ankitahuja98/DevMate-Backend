const cors = require("cors");
const express = require("express");
require("dotenv").config();
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const app = express();
const http = require("http");
const server = http.createServer(app);
const initializeSocket = require("../utils/socket");
initializeSocket(server);

/* ---------------- ROUTERS ---------------- */
const authRouter = require("./routes/authRoutes");
const profileRouter = require("./routes/profileRoutes");
const connectionReqRouter = require("./routes/connectionReqRoutes");
const userRouter = require("./routes/userRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const chatRouter = require("./routes/chatRoutes");
const forgetPasswordRouter = require("./routes/forgetPasswordRoutes");

/* ---------------- SWAGGER ---------------- */
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger-output.json");

// WEBHOOK ROUTE FIRST (RAW BODY MUST NOT BE PARSED)
app.use("/payment/webhook", paymentRouter);

/* ---------------- GLOBAL MIDDLEWARES ---------------- */
// express.json() is a middleware which "Take incoming JSON and convert it into a JS object so we can read req.body"
app.use(express.json());

// cookieParser is a middleware which helps "reads cookies from the request header and available in req.cookies"
app.use(cookieParser());

// CORS Handling
app.use(
  cors({
    origin: true, // allow same-origin
    credentials: true, // if sending cookies / tokens
  }),
);

// mask sensitive fields (optional logging safety)
app.use((req, res, next) => {
  const safeBody = { ...req.body };

  const sensitiveKeys = ["password", "confirmPassword", "newPassword"];
  sensitiveKeys.forEach((key) => {
    if (safeBody[key]) safeBody[key] = "***";
  });
  next();
});

/* ---------------- SWAGGER ROUTES ---------------- */
app.use("/devmate.api.docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/* ---------------- APPLICATION ROUTES ---------------- */
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", connectionReqRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);
app.use("/", chatRouter);
app.use("/", forgetPasswordRouter);

/* ---------------- START SERVER ---------------- */
// Connect with DB and start the server
connectDB()
  .then(() => {
    console.log("Database connected sucessfully...");
    server.listen(8080, () => {
      console.log("Server started Successfully in 8080...");
    });
  })
  .catch((err) => console.log(err));
