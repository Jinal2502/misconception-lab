import "./config/loadEnv.js";
import cors from "cors";
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import helmet from "helmet";
import { enforceTrustedOrigin } from "./middleware/csrf.js";
import authRoutes from "./routes/authRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import sageRoutes from "./routes/sageRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import { errorHandler, HttpError } from "./lib/httpErrors.js";

const app = express();
const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET is required and must contain at least 32 characters. Set it in the root .env file.");
}

let sessionStore;
if (process.env.MONGODB_URI) {
  try {
    sessionStore = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * 8,
      autoRemove: "native",
    });
    sessionStore.collectionP.catch((error) => {
      console.error(`Persistent session store unavailable (${error.name}); the API health endpoint remains available.`);
    });
  } catch (error) {
    console.error(`Persistent session store unavailable (${error.name}); using in-memory sessions.`);
  }
} else {
  console.warn("MongoDB URI is not configured; using in-memory sessions until a database is available.");
}

app.disable("x-powered-by");
app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: [allowedOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "32kb" }));
app.use(
  session({
    name: "misconception.sid",
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    },
  }),
);
app.use(enforceTrustedOrigin);
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/sage", sageRoutes);
app.use("/api/teacher", teacherRoutes);
app.use((_request, _response, next) => next(new HttpError(404, "API endpoint not found.")));
app.use(errorHandler);

export default app;
