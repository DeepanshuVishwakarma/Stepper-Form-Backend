const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { route } = require("./utils/statics/statics");
const errorHandler = require("./middleware/errorHandler");
const {
  userRoutes,
  formTemplateRoutes,
  formSubmissionRoutes,
} = require("./routes");
const cors = require("cors");

dotenv.config();
connectDB();

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "https://stepper-form-frontend-tau.vercel.app/"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

app.get(route.ping, (req, res) => {
  res.send("pong");
});
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});
app.use(route.api.users, userRoutes);
app.use(route.api.formTemplates, formTemplateRoutes);

app.use(`${route.api.users}/:userId/submissions`, formSubmissionRoutes);

app.use(errorHandler);

app.listen(process.env.PORT, () =>
  console.log(`Server running on ${process.env.PORT}`),
);

