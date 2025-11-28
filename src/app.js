const cors = require("cors");
const express = require("express");
require("dotenv").config();
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const app = express();

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger-output.json");

// express.json() is a middleware which "Take incoming JSON and convert it into a JS object so we can read req.body"
app.use(express.json());

// cookieParser is a middleware which helps "reads cookies from the request header and available in req.cookies"
app.use(cookieParser());

app.use("/devmate.api.docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// CORS Handling
app.use(
  cors({
    origin: "http://localhost:5173", // your Devmate frontend URL
    credentials: true, // if sending cookies / tokens
  })
);

const authRouter = require("./routes/authRoutes");
const profileRouter = require("./routes/profileRoutes");
const connectionReqRouter = require("./routes/connectionReqRoutes");
const userRouter = require("./routes/userRoutes");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", connectionReqRouter);
app.use("/", userRouter);

// Connect with DB and start the server
connectDB()
  .then(() => {
    console.log("Database connected sucessfully...");
    app.listen(8080, () => {
      console.log("Server started Successfully in 8080...");
    });
  })
  .catch((err) => console.log(err));
