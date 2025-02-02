const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const db = require("./models/index.js");
const port = process.env.PORT || 5000;
const app = express();

app.use(express.json({ limit: "1000mb" }));
app.use(cookieParser());
app.use(
  cors({
    allowedOrigins: ["http://10.0.2.2:5000", "http://localhost:3000"],
  })
);

app.disable("x-powered-by");

const analyticsRoutes = require("./routes/analyticRoutes.js")
app.use(express.json());
app.use("/api/analytics", analyticsRoutes)

dotenv.config();


app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cookieParser());
app.use(express.json());

app.listen(port, () => {
  console.log("Starting the listing process.");
  console.log(
    `${process.env.NODE_ENV} Server is running on port: http://localhost:${port}`
  );
});

module.exports = app;
