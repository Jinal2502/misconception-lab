import "../config/loadEnv.js";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

const configuredEmail = process.env.TEACHER_EMAIL?.trim().toLowerCase();
const providedPassword = process.env.TEACHER_PASSWORD;

if (configuredEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail)) {
  throw new Error("TEACHER_EMAIL must be a valid email address if provided.");
}
if (
  providedPassword &&
  (providedPassword.length < 12 || providedPassword.length > 128 ||
    !/[A-Za-z]/.test(providedPassword) || !/\d/.test(providedPassword))
) {
  throw new Error("TEACHER_PASSWORD must be 12–128 characters and include a letter and a number.");
}
if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI must be set in the root .env file before teacher provisioning.");
}

const generatedPassword = providedPassword
  ? null
  : `Lab-${randomBytes(24).toString("base64url")}9`;
const email = configuredEmail ?? `teacher-${randomBytes(8).toString("hex")}@misconceptionlab.local`;
const password = providedPassword ?? generatedPassword;

try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  if (await User.exists({ role: "teacher" })) {
    throw new Error("A teacher account already exists; refusing to overwrite or create another.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    name: "Teacher",
    email,
    passwordHash,
    role: "teacher",
  });

  console.log(`Initial teacher account provisioned for ${email}.`);
  if (generatedPassword) {
    console.log(`One-time password (save it now): ${generatedPassword}`);
  } else {
    console.log("The teacher password was read from TEACHER_PASSWORD and was not printed.");
  }
} finally {
  await mongoose.disconnect();
}
